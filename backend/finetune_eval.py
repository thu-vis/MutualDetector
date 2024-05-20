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
from torch.autograd import Variable
from utils.augmentations import SSDAugmentation
from data import VOC_ROOT, VOCAnnotationTransform, BaseTransform
from data import VOC_CLASSES
from data import *
from layers.modules import MultiBoxLoss, ImageLevelLoss
import torch.utils.data as data
from tqdm import tqdm

from utils.helper import check_dir, resume_checkpoint, save_checkpoint
from utils.helper import Timer, pickle_load_data, pickle_save_data
from utils.logger import logger
from utils.detection_helper import evaluate_detections
from ssd import build_ssd
from csd import build_ssd_con

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


parser = argparse.ArgumentParser(
    description='Single Shot MultiBox Detector Evaluation')
parser.add_argument('--trained_model', default='',
                    type=str, help='Trained state_dict file path to open')
parser.add_argument('--dataset', default='VOC300', choices=['VOC07', 'VOC12', "COCO"],
                    type=str, help='VOC07 or VOC12')
parser.add_argument('--model', default=300, choices=[300, 512],
                    type=int, help='300 or 512')
parser.add_argument('--batch_size', default=32, type=int,
                    help='Batch size for training')
parser.add_argument('--iteration', default=120000, type=int,
                    help='iteration')
parser.add_argument('--lr', '--learning-rate', default=1e-5, type=float,
                    help='initial learning rate')
parser.add_argument('--image_level_supervision', default=1, type=float,
                    help='whether use image level supervision')
parser.add_argument('--save_folder', default='weights/', type=str,
                    help='File path to save results')
parser.add_argument('--confidence_threshold', default=0.01, type=float,
                    help='Detection confidence threshold')
parser.add_argument('--top_k', default=5, type=int,
                    help='Further restrict the number of predictions to parse')
parser.add_argument('--cuda', default=True, type=str2bool,
                    help='Use cuda to train model')
parser.add_argument('--voc_root', default='/home/changjian/WSL/Data/VOCdevkit/',
                    help='Location of VOC root directory')
parser.add_argument('--cleanup', default=True, type=str2bool,
                    help='Cleanup and remove results files following eval')
parser.add_argument('--debug', default=False, type=str2bool,
                    help='if debug')
parser.add_argument('--supervise_percent', default=1, type=float,
                    help='supervise_percent')
parser.add_argument('--supervise_num', default=0, type=int,
                    help='supervise_num, superior than supervise_percent')
parser.add_argument('--label', default=False, type=str2bool,
                    help='label')
parser.add_argument('--semi', default=True, type=str2bool,
                    help='semi')
parser.add_argument('--use_output_buffer', default=True, type=str2bool,
                    help='use_output_buffer')
parser.add_argument('--phase', default='val', choices=['train', 'val'],
                    type=str, help='train or val')
parser.add_argument('--batch_super_times', default=1, type=int,
                    help='batch_super_times')
parser.add_argument('--ramp_num', default=2, type=float,
                    help='ramp_num')
parser.add_argument('--half_weight', default=1, type=float,
                    help='half_weight')
parser.add_argument('--add_anno', default="", type=str,
                    help='')

args = parser.parse_args()

set_type = 'test'

if args.debug:
    set_type = "debug_test"


image_level_loss_weight = args.image_level_supervision
image_level_str = str(image_level_loss_weight)
if image_level_loss_weight == 1.0:
    image_level_str = "1"
if image_level_loss_weight == 0.0:
    image_level_str = "0"
supervised = str(args.supervise_percent)
if args.supervise_num:
    supervised = str(args.supervise_num)
suffix = ""
suffix = "_conf" if args.semi is True else ""
label_name = ""
if args.label:
    label_name = "_label"
half_weight = args.half_weight
# checkpoint file
checkpoint_file = os.path.join(args.save_folder, "FINETUNE/data_{}_imagelevel_{}_lr_{}_ramp_{}_halfw_{}_superpercent_{}_super_time_{}_batch_{}{}{}{}" \
    .format(args.dataset, image_level_str, args.lr, args.ramp_num, half_weight, supervised, args.batch_super_times, args.batch_size, suffix, label_name, args.add_anno))

if not os.path.exists(checkpoint_file):
    raise ValueError("checkpoint file not exists", checkpoint_file)

result_output = os.path.join(checkpoint_file, set_type + "_" + str(args.iteration))

if args.phase == "train":
    result_output = os.path.join(checkpoint_file, "train" + "_" + str(args.iteration))
    
if len(args.trained_model) == 0:
    args.trained_model = os.path.join(checkpoint_file, "ckpt_{}.pth".format(args.iteration))
    check_dir(result_output)
    tb_writer = SummaryWriter(os.path.join(checkpoint_file, "log"))
else:
    # TODO:
    checkpoint_file = "./weights"

if torch.cuda.is_available():
    if args.cuda:
        torch.set_default_tensor_type('torch.cuda.FloatTensor')
    if not args.cuda:
        print("WARNING: It looks like you have a CUDA device, but aren't using \
              CUDA.  Run with --cuda for optimal eval speed.")
        torch.set_default_tensor_type('torch.FloatTensor')
else:
    torch.set_default_tensor_type('torch.FloatTensor')

# get dataset
if args.dataset == "COCO":
    if args.model == 300:
        cfg = coco300
    elif args.model == 512:
        cfg = coco512
    else:
        raise ValueError("unsupport model")
    # load data
    if args.phase == "val":
        dataset = COCO17Detection(COCO17_ROOT, "val2017",
                            BaseTransform(args.model, MEANS),
                            COCO17AnnotationTransform(), 
                            supervise_num = args.supervise_num,
                            eval=False)
    else:
        dataset = COCO17Detection(COCO17_ROOT, "train2017",
                            BaseTransform(args.model, MEANS),
                            COCO17AnnotationTransform(), 
                            supervise_num = args.supervise_num,
                            eval=False)
    labelmap = COCO_CLASSES
elif args.dataset in ["VOC07", "VOC12"]:
    if args.model == 300:
        cfg = voc300
    elif args.model == 512:
        cfg = voc512
    else:
        raise ValueError("unsupport model")
    # load data
    dataset = VOCDetection(VOC_ROOT, [('2007', "test")],
                           BaseTransform(args.model, MEANS),
                           VOCAnnotationTransform(), eval=False)
    labelmap = VOC_CLASSES
else:
    raise ValueError("unsupported dataset")


#build model
net = build_ssd(set_type, args.model, cfg["num_classes"])
# net.load_state_dict(torch.load(args.trained_model))
print("model", args.trained_model)
weights = torch.load(args.trained_model)["model_state_dict"]
weights_def = {}
for key in weights.keys():
    new_key = key[7:]
    weights_def[new_key] = weights[key]
net.load_state_dict(weights_def)
net.eval()
print('Finished loading model!')
if args.cuda:
    net = net.cuda()
    cudnn.benchmark = True


def debug_test_net(net, cuda, dataset, transform, top_k,
             im_size=300, thresh=0.05):

    image_level_criterion = ImageLevelLoss(cfg['num_classes'], args.cuda)

    num_images = len(dataset)
    # all detections are collected into:
    #    all_boxes[cls][image] = N x 5 array of detections in
    #    (x1, y1, x2, y2, score)
    all_boxes = [[[] for _ in range(num_images)]
                 for _ in range(len(labelmap)+1)]

    # timers
    _t = {'im_detect': Timer(), 'misc': Timer()}
    output_dir = result_output
    det_file = os.path.join(output_dir, 'error_margin.txt')
    det_output = open(det_file, "w")
    img_loss = []
    img_margin = []

    for i in tqdm(range(num_images)):
        # im, numpy_gt, h, w, _ = dataset.pull_item(i)
        x, target, _ = dataset[i]
        x = Variable(x.unsqueeze(0))
        target = Variable(torch.from_numpy(target).unsqueeze(0))
        if args.cuda:
            x = x.cuda()
        _t['im_detect'].tic()
        _, detections = net(x)
        out = detections
        loss_image_level, margin, average_num = image_level_criterion(out[1], target)
        # import IPython; IPython.embed(); exit()
        img_loss.append(loss_image_level.data)
        img_margin.append(margin.data * 2)
        log = "error: {}, margin: {}, average error: {}, average margin: {}".format(
            loss_image_level.data, margin.data*2, sum(img_loss)/len(img_loss), 
            sum(img_margin)/len(img_margin) 
        )
        # print(log)
        det_output.writelines(log + "\n")
    det_output.close()
    print(log)

def test_net(save_folder, net, cuda, dataset, transform, top_k,
             im_size=300, thresh=0.05):
    output_dir = result_output
    suffix = ""
    if args.phase == "train":
        suffix = "_train"
    det_file = os.path.join(output_dir, 'detections{}.pkl'.format(suffix))

    if args.use_output_buffer:
        if os.path.exists(det_file):
            all_boxes = pickle_load_data(det_file)["all_boxes"]
            print('Evaluating detections based on buffer')
            dataset.set_eval(True)
            # evaluate_detections(all_boxes, output_dir, dataset, labelmap, set_type)
            evaluate_detections(all_boxes, output_dir, dataset)
            return 0
    num_images = len(dataset)
    # all detections are collected into:
    #    all_boxes[cls][image] = N x 5 array of detections in
    #    (x1, y1, x2, y2, score)
    all_boxes = [[[] for _ in range(num_images)]
                 for _ in range(len(labelmap)+1)]

    # timers
    _t = {'im_detect': Timer(), 'misc': Timer()}

    for i in range(num_images):
        im, gt, h, w, _ = dataset.pull_item(i)
        x = Variable(im.unsqueeze(0))
        if args.cuda:
            x = x.cuda()
        _t['im_detect'].tic()
        detections = net(x).data
        detect_time = _t['im_detect'].toc(average=False)

        # skip j = 0, because it's the background class
        for j in range(1, detections.size(1)):
            dets = detections[0, j, :]
            mask = dets[:, 0].gt(0.).expand(5, dets.size(0)).t()
            dets = torch.masked_select(dets, mask).view(-1, 5)
            if dets.dim() == 0:
                continue
            boxes = dets[:, 1:]
            boxes[:, 0] *= w
            boxes[:, 2] *= w
            boxes[:, 1] *= h
            boxes[:, 3] *= h
            scores = dets[:, 0].cpu().numpy()
            cls_dets = np.hstack((boxes.cpu().numpy(),
                                  scores[:, np.newaxis])).astype(np.float32,
                                                                 copy=False)
            all_boxes[j][i] = cls_dets

        print('im_detect: {:d}/{:d} {:.3f}s'.format(i + 1,
                                                    num_images, detect_time))

    with open(det_file, 'wb') as f:
        pickle.dump({"img_id": dataset.ids, "all_boxes": all_boxes}, f, pickle.HIGHEST_PROTOCOL)

    print('Evaluating detections')
    dataset.set_eval(True)
    evaluate_detections(all_boxes, output_dir, dataset)


if __name__ == '__main__':
    # evaluation
    if args.debug: # +1 for background
        debug_test_net(net, args.cuda, dataset,
            BaseTransform(net.size, MEANS), args.top_k, args.model,
            thresh=args.confidence_threshold)
        print("finish debug")
    else:
        test_net(args.save_folder, net, args.cuda, dataset,
                BaseTransform(net.size, MEANS), args.top_k, args.model,
                thresh=args.confidence_threshold)
