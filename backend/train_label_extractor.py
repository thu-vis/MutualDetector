"""Adapted from:
    @longcw faster_rcnn_pytorch: https://github.com/longcw/faster_rcnn_pytorch
    @rbgirshick py-faster-rcnn https://github.com/rbgirshick/py-faster-rcnn
    Licensed under The MIT License [see LICENSE for details]
"""

from __future__ import print_function
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.backends.cudnn as cudnn
import torch.nn.init as init
import torch.optim as optim
from torch.autograd import Variable
from torch.utils.data import RandomSampler
from utils.augmentations import SSDAugmentation
from data import VOC_ROOT, VOCAnnotationTransform, BaseTransform
from data import VOC_CLASSES
from data import *
from layers.modules import MultiBoxLoss, ImageLevelLoss, TextLoss
import torch.utils.data as data
from tqdm import tqdm
from sklearn.metrics import precision_score, recall_score, accuracy_score
import shutil

from utils.helper import check_dir, resume_checkpoint, save_checkpoint
from utils.helper import Timer, pickle_load_data, pickle_save_data
from utils.logger import logger
from utils.detection_helper import evaluate_detections
from ssd import build_ssd
from csd import build_ssd_con
from label_extractor_model import build_label_extractor

import sys
import os
import time
import argparse
import numpy as np
import pickle
import cv2
from tensorboardX import SummaryWriter

if sys.version_info[0] == 2:
    import xml.etree.cElementTree as ET
else:
    import xml.etree.ElementTree as ET

np.set_printoptions(suppress=True)


def str2bool(v):
    return v.lower() in ("yes", "true", "t", "1")

def sigmoid(x):
    s = 1 / (1 + np.exp(-x))
    return s


parser = argparse.ArgumentParser(
    description='Single Shot MultiBox Detector Training With Pytorch')
train_set = parser.add_mutually_exclusive_group()
parser.add_argument('--phase', default='train', choices=['train', 'test', "debug_test"],
                    type=str, help='train or test')
parser.add_argument('--dataset', default='VOC07', choices=['VOC07', 'VOC12', "COCO"],
                    type=str, help='VOC07, VOC12 or COCO')
parser.add_argument('--model', default=300, choices=[300, 512],
                    type=int, help='300 or 512')
parser.add_argument('--dataset_root', default=VOC_ROOT,
                    help='Dataset root directory path')
parser.add_argument('--basenet', default='vgg16_reducedfc.pth',
                    help='Pretrained base model')
parser.add_argument('--batch_size', default=32, type=int,
                    help='Batch size for training')
parser.add_argument('--resume', default=False, type=str2bool,  # None  'weights/ssd300_COCO_80000.pth'
                    help='Checkpoint state_dict file to resume training from')
parser.add_argument('--start_iter', default=0, type=int,
                    help='Resume training at this iter')
parser.add_argument('--image_level_supervision', default=False, type=str2bool,
                    help='whether use image level supervision')
parser.add_argument('--num_workers', default=4, type=int,
                    help='Number of workers used in dataloading')
parser.add_argument('--cuda', default=True, type=str2bool,
                    help='Use CUDA to train model')
parser.add_argument('--lr', '--learning-rate', default=1e-1, type=float,
                    help='initial learning rate')
parser.add_argument('--momentum', default=0.9, type=float,
                    help='Momentum value for optim')
parser.add_argument('--weight_decay', default=1e-5, type=float,
                    help='Weight decay')
parser.add_argument('--hidden_units', default=600, type=int,
                    help='hidden_units')
parser.add_argument('--gamma', default=0.1, type=float,
                    help='Gamma update for SGD')
parser.add_argument('--save_folder', default='weights/',
                    help='Directory for saving checkpoint models')
parser.add_argument('--supervise_percent', default=0.5, type=float,
                    help='supervise_percent')
parser.add_argument('--supervise_num', default=0, type=int,
                    help='supervise_num, superior than supervise_percent')
parser.add_argument('--semi', default=True, type=str2bool,
                    help='supervise_percent')


args = parser.parse_args()

if torch.cuda.is_available():
    if args.cuda:
        torch.set_default_tensor_type('torch.cuda.FloatTensor')
    if not args.cuda:
        logger.info("WARNING: It looks like you have a CUDA device, but aren't " +
              "using CUDA.\nRun with --cuda for optimal training speed.")
        torch.set_default_tensor_type('torch.FloatTensor')
else:
    torch.set_default_tensor_type('torch.FloatTensor')

# TODO: parse path
if not os.path.exists(args.save_folder):
    os.mkdir(args.save_folder)

image_level_loss_weight = float(int(args.image_level_supervision))
semi_loss_weight = float(int(args.semi))
supervised = str(args.supervise_percent)
if args.supervise_num:
    supervised = str(args.supervise_num)
# checkpoint file
checkpoint_file = os.path.join(args.save_folder, "CLS", "data_{}_weight_decay_{}_hidden_units_{}_superpercent_{}_batch_{}_uniform" \
    .format(args.dataset, args.weight_decay, args.hidden_units, supervised, args.batch_size))
check_dir(checkpoint_file)
tb_log = os.path.join(checkpoint_file, "log")
if os.path.exists(tb_log) and args.resume is False:
    continue_flag = "n"
    logger.info("tb_log exists, but resume is set as false, you want to remove tb_log? y/[n]")
    # continue_flag = input()
    # if continue_flag == "y":
    shutil.rmtree(tb_log)
    # else:
    #     logger.info("exit")
    #     exit()
tb_writer = SummaryWriter(tb_log)

def xavier(param):
    init.xavier_uniform(param)

def weights_init(m):
    classname = m.__class__.__name__
    if classname.find('Conv2d') != -1:
        init.xavier_normal_(m.weight.data)
        init.constant_(m.bias.data, 0.0)
    elif classname.find('Linear') != -1:
        print("classname", classname)
        # init.xavier_normal_(m.weight.data)
        # init.constant_(m.bias.data, 0.0)
        init.xavier_uniform_(m.weight.data)
        init.zeros_(m.bias.data)

def train():
    if args.dataset == 'COCO':
        args.dataset_root = COCO17_ROOT
        supervised_dataset = COCO17Detection(root=args.dataset_root, 
            supervise_percent=args.supervise_percent,
            supervise_num = args.supervise_num,
            only_supervise=True,
            transform=None, text=True)
    else:
        raise ValueError("unsupported dataset for label extraction model")

    if args.supervise_percent == 0:
        supervised_dataset.set_only_supervise(False)
    supervised_batch =  args.batch_size
    batch_sampler = VOCBatchSampler(RandomSampler(supervised_dataset), 
        batch_size=supervised_batch, drop_last=True, 
        super_threshold=supervised_dataset.supervise_num, 
        supervise_percent=supervised_dataset.supervise_percent,
        only_supervise=True)
    
    net = build_label_extractor("train", number_class=65,
        hidden_units=args.hidden_units) # TODO: 
    
    if args.cuda:
        net = torch.nn.DataParallel(net)
        cudnn.benchmark = True
        net = net.cuda()
    
    # import IPython; IPython.embed(); exit()

    # net.apply(weights_init)
    init_weight = torch.load("../Data/coco17/init_600_model/model_600.pth")["model_state_dict"]
    weights_def = {}
    for key in init_weight.keys():
        new_key = "module." + key.replace("module.", "")
        weights_def[new_key] = init_weight[key]
    net.load_state_dict(weights_def)

    optimizer = optim.Adagrad(net.parameters(), lr=args.lr, \
        weight_decay=args.weight_decay)

    criterion = TextLoss(args.cuda)

    net.train()

    supervised_data_loader = data.DataLoader(supervised_dataset,
        batch_sampler=batch_sampler,
        num_workers = int(supervised_batch / 2), 
        collate_fn=text_collate,
        pin_memory=True)
    
    batch_iterator = iter(supervised_data_loader)

    for iteration in range(100000):
        t0 = time.time()
        try:
            text_feature, image_feature, masks, target = next(batch_iterator)
        except StopIteration:
            batch_iterator = iter(supervised_data_loader)
            text_feature, image_feature, masks, target = next(batch_iterator)
        

        t1 = time.time()
        if args.cuda:
            text_feature = Variable(text_feature.cuda())
            image_feature = Variable(image_feature.cuda())
            target = Variable(target.cuda())
            masks = Variable(masks.cuda())
        else:
            text_feature = Variable(text_feature)
            image_feature = Variable(image_feature)
            target = Variable(target)

        # print("masks shape", masks.shape)
        # print("text_feature", text_feature.shape)
        # print("image_feature", image_feature.shape)
        # print("target", target.shape)

        # forward

        t2 = time.time()
        logit = net(text_feature, image_feature, masks)
        loss, margin = criterion(logit, target)

        if (loss.data > 0):
            optimizer.zero_grad()
            loss.backward()
            optimizer.step() 
        
        t3 = time.time()

        if iteration % 10 == 0:
            logger.info('timer: %.4f , %.4f, %.4f sec.' % (t1 - t0, t2-t1, t3-t2))
            logger.info('iter ' + repr(iteration) + ' loss: %.4f\n' %(loss))
        
        if iteration % 100 == 0:
            tb_writer.add_scalar("Train/loss", loss.data, iteration)
            tb_writer.add_scalar("Train/margin", margin.data, iteration)
            tb_writer.add_scalar("Train/lr", float(optimizer.param_groups[0]['lr']), iteration)

        if args.phase == "test":
            dataset = COCO17Detection(COCO17_ROOT, "val2017",
                        BaseTransform(300, MEANS),
                        COCO17AnnotationTransform(), text=True)
            p, r, acc = test_net(net, dataset, args.cuda)


        if iteration != 0 and (iteration+1) % 10000 == 0:
            save_checkpoint((iteration+1), net, optimizer, checkpoint_file)
            dataset = COCO17Detection(COCO17_ROOT, "val2017",
                        BaseTransform(300, MEANS),
                        COCO17AnnotationTransform(), text=True)
            p, r, acc = test_net(net, dataset, args.cuda)
            tb_writer.add_scalar("Train/precision", p, iteration)
            tb_writer.add_scalar("Train/recall", r, iteration)
            tb_writer.add_scalar("Train/acc", acc, iteration)

def test():
    # TODO: load data
    dataset = COCO17Detection(COCO17_ROOT, "train2017",
                            BaseTransform(300, MEANS),
                            COCO17AnnotationTransform(), 
                            only_supervise=False,
                            supervise_num=10000,
                            text=False)

    # build model
    net = build_label_extractor("test", 65) # TODO: 65
    model_dir = "../Data/coco17/init_600_model/model_600.pth"
    # model_dir = "weights/data_COCO_model_300_imagelevel_1_superpercent_5000_batch_32_conf/labels/ckpt_100000.pth"
    # weights = torch.load(model_dir)["model_state_dict"]

    # weights_def = {}
    # for key in weights.keys():
    #     new_key = key.replace("module.", "")
    #     weights_def[new_key] = weights[key]

    # net.load_state_dict(weights_def)
    # logger.info("Finished loading model!")
    # if args.cuda:
    #     net = net.cuda()
    #     cudnn.benchmark = True
    debug_test(net, dataset, args.cuda)

def debug_test(net, dataset, cuda):
    net.eval()
    labels = []
    predictions = []
    losses = [] 
    criterion = TextLoss(args.cuda)
    for i in tqdm(range(len(dataset))):
        label = dataset.pull_image_level_annos(i)
        meta = dataset.pull_metadata(i)
        extracted_label = dataset.pull_extracted_labels(i)
        import IPython; IPython.embed(); exit()
        
        # logit = net(text_feature, image_feature)
        # import IPython; IPython.embed(); exit()

        logit = meta["logits"]
        # import IPython; IPython.embed(); exit()
        # losses.append(loss.data)
        prediction = sigmoid(logit) > 0.5
        
        labels.append(label)
        predictions.append(prediction)
    labels = np.array(labels).reshape(-1)
    predictions = np.array(predictions).reshape(-1)
    p = precision_score(labels, predictions)
    r = recall_score(labels, predictions)
    acc = accuracy_score(labels, predictions)
    # loss_mean = sum(losses)/len(losses)
    # print("loss mean", loss_mean)
    print("precision:{}, recall: {}, acc: {}".format(p, r, acc))
    return p, r, acc


def test_net(net, dataset, cuda):
    net.eval()
    labels = []
    predictions = []
    losses = [] 
    criterion = TextLoss(args.cuda)
    for i in tqdm(range(len(dataset))):
        # label = dataset.pull_image_level_annos(i)
        # meta = dataset.pull_metadata(i)
        # text_feature = dataset.pull_text_feature(i)
        # image_feature = dataset.pull_image_feature(i)
        text_feature, image_feature, masks, label = dataset[i]
        text_feature = Variable(text_feature.unsqueeze(0))
        image_feature = Variable(image_feature.unsqueeze(0))
        masks = Variable(masks.unsqueeze(0))
        label_cuda = Variable(torch.from_numpy(np.array(label)).unsqueeze(0))
        if cuda:
            text_feature = text_feature.cuda()
            image_feature = image_feature.cuda()
            masks = masks.cuda()
            label_cuda = label_cuda.cuda()
        else:
            None
        
        # logit = net(text_feature, image_feature)
        # import IPython; IPython.embed(); exit()

        logit = net(text_feature, image_feature, masks)
        # import IPython; IPython.embed(); exit()
        loss, _ = criterion(logit, label_cuda)
        losses.append(loss.data)
        logit = logit.data.cpu().numpy()
        prediction = sigmoid(logit) > 0.5
        
        labels.append(label)
        predictions.append(prediction)
    labels = np.array(labels).reshape(-1)
    predictions = np.array(predictions).reshape(-1)
    p = precision_score(labels, predictions)
    r = recall_score(labels, predictions)
    acc = accuracy_score(labels, predictions)
    loss_mean = sum(losses)/len(losses)
    print("loss mean", loss_mean)
    print("precision:{}, recall: {}, acc: {}".format(p, r, acc))
    return p, r, acc
    

if __name__ == "__main__":
    # test()
    if args.phase == "train" or args.phase == "test":
        train()
    elif args.phase == "debug_test":
        test()
    else:
        raise ValueError("unsupported phase")