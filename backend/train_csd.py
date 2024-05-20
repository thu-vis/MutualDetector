from data import *
from utils.augmentations import SSDAugmentation
from utils.logger import logger
from utils.helper import check_dir, resume_checkpoint, save_checkpoint
from layers.modules import MultiBoxLoss, ImageLevelLoss
from ssd import build_ssd
# from ssd_consistency import build_ssd_con
from csd import build_ssd_con
import os
import sys
import time
import torch
from torch.autograd import Variable
from torch.utils.data import RandomSampler
import torch.nn.functional as F
import torch.nn as nn
import torch.optim as optim
import torch.backends.cudnn as cudnn
import torch.nn.init as init
import torch.utils.data as data
import numpy as np
import argparse
import math
import copy
import shutil
from tensorboardX import SummaryWriter


def str2bool(v):
    return v.lower() in ("yes", "true", "t", "1")


parser = argparse.ArgumentParser(
    description='Single Shot MultiBox Detector Training With Pytorch')
train_set = parser.add_mutually_exclusive_group()
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
parser.add_argument('--resume', default=True, type=str2bool,  # None  'weights/ssd300_COCO_80000.pth'
                    help='Checkpoint state_dict file to resume training from')
parser.add_argument('--start_iter', default=0, type=int,
                    help='Resume training at this iter')
parser.add_argument('--image_level_supervision', default=1, type=float,
                    help='whether use image level supervision')
parser.add_argument('--num_workers', default=4, type=int,
                    help='Number of workers used in dataloading')
parser.add_argument('--cuda', default=True, type=str2bool,
                    help='Use CUDA to train model')
parser.add_argument('--lr', '--learning-rate', default=1e-3, type=float,
                    help='initial learning rate')
parser.add_argument('--momentum', default=0.9, type=float,
                    help='Momentum value for optim')
parser.add_argument('--weight_decay', default=5e-4, type=float,
                    help='Weight decay for SGD')
parser.add_argument('--gamma', default=0.1, type=float,
                    help='Gamma update for SGD')
parser.add_argument('--visdom', default=False, type=str2bool,
                    help='Use visdom for loss visualization')
parser.add_argument('--save_folder', default='weights/',
                    help='Directory for saving checkpoint models')
parser.add_argument('--supervise_percent', default=0.5, type=float,
                    help='supervise_percent')
parser.add_argument('--supervise_num', default=0, type=int,
                    help='supervise_num, superior than supervise_percent')
parser.add_argument('--semi', default=True, type=str2bool,
                    help='semi')
parser.add_argument('--label', default=False, type=str2bool,
                    help='label')
parser.add_argument('--super_iter', default=1, type=int,
                    help='super_iter')
parser.add_argument('--batch_super_times', default=1, type=int,
                    help='batch_super_times')
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

if not os.path.exists(args.save_folder):
    os.mkdir(args.save_folder)

image_level_loss_weight = args.image_level_supervision
image_level_str = str(image_level_loss_weight)
if image_level_loss_weight == 1.0:
    image_level_str = "1"
if image_level_loss_weight == 0.0:
    image_level_str = "0"
semi_loss_weight = float(int(args.semi))
supervised = str(args.supervise_percent)
if args.supervise_num:
    supervised = str(args.supervise_num)
suffix = ""
suffix ="_conf" if args.semi is True else ""
label_name = ""
if args.label:
    label_name = "_label"
# checkpoint file
checkpoint_file = os.path.join(args.save_folder, "DET/data_{}_model_{}_imagelevel_{}_superpercent_{}_super_time_{}_batch_{}{}{}" \
    .format(args.dataset, args.model, image_level_str, supervised, args.batch_super_times, args.batch_size, suffix, label_name))
check_dir(checkpoint_file)
tb_log = os.path.join(checkpoint_file, "log")
if os.path.exists(tb_log) and args.resume is False:
    continue_flag = "n"
    logger.info("tb_log exists, but resume is set as false, you want to remove tb_log? y/[n]")
    continue_flag = input()
    if continue_flag == "y":
        shutil.rmtree(tb_log)
    else:
        logger.info("exit")
        exit()
tb_writer = SummaryWriter(tb_log)


def train():
    if args.dataset == 'COCO':
        args.dataset_root = COCO17_ROOT
        if args.model == 512:
            cfg = coco512
        elif args.model == 300:
            cfg = coco300
        else:
            raise ValueError("unsupported model")
        supervised_dataset = COCO17Detection(root=args.dataset_root, 
            supervise_percent=args.supervise_percent,
            supervise_num = args.supervise_num,
            only_supervise=True,
            extracting_label=args.label,
            transform=SSDAugmentation(cfg['min_dim'], MEANS))
    elif args.dataset == 'VOC07':
        args.dataset_root = VOC_ROOT
        if args.model == 300:
            cfg = voc300
        elif args.model == 512:
            cfg = voc512
        else:
            raise ValueError("unsupport model")
        supervised_dataset = VOCDetection(root=args.dataset_root,
            image_sets=[("2007", "trainval")],
            supervise_percent=args.supervise_percent,
            only_supervise=True,
            transform=SSDAugmentation(cfg['min_dim'], MEANS))
    elif args.dataset == 'VOC12':
        args.dataset_root = VOC_ROOT
        if args.model == 300:
            cfg = voc300
        elif args.model == 512:
            cfg = voc512
        else:
            raise ValueError("unsupport model")
        supervised_dataset = VOCDetection(root=args.dataset_root, 
            image_sets=[("2012", "trainval")],
            supervise_percent=args.supervise_percent,
            only_supervise=True,
            transform=SSDAugmentation(cfg['min_dim'], MEANS))

    if args.supervise_percent == 0:
        supervised_dataset.set_only_supervise(False)
    supervised_batch =  args.batch_size
    batch_sampler = VOCBatchSampler(RandomSampler(supervised_dataset), 
        batch_size=supervised_batch, drop_last=True, 
        super_threshold=supervised_dataset.supervise_num, 
        supervise_percent=supervised_dataset.supervise_percent,
        only_supervise=True, batch_super_times=args.batch_super_times)

    finish_flag = True


    while(finish_flag):
        ssd_net = build_ssd_con('train', cfg['min_dim'], cfg['num_classes'])
        net = ssd_net

        if args.cuda:
            net = torch.nn.DataParallel(ssd_net)
            cudnn.benchmark = True

        # if args.resume:
        #     # logger.info('Resuming training, loading {}...'.format(args.resume))
        #     # ssd_net.load_weights(args.resume)
        iteration, model_state_dict, optimizer_state_dict = resume_checkpoint(args.resume, checkpoint_file)
        if iteration > 0:
            args.start_iter = iteration
            net.load_state_dict(model_state_dict)

        else:
            vgg_weights = torch.load(args.save_folder + args.basenet)
            logger.info('Loading base network (vgg) ...')
            ssd_net.vgg.load_state_dict(vgg_weights)

        if args.cuda:
            net = net.cuda()

        if iteration == 0:
            logger.info('Initializing weights...')
            # initialize newly added layers' weights with xavier method
            ssd_net.extras.apply(weights_init)
            ssd_net.loc.apply(weights_init)
            ssd_net.conf.apply(weights_init)
            optimizer = optim.SGD(net.parameters(), lr=args.lr, momentum=args.momentum,
                              weight_decay=args.weight_decay)
        else:
            optimizer = optim.SGD(net.parameters(), lr=args.lr, momentum=args.momentum,
                              weight_decay=args.weight_decay)
            optimizer.load_state_dict(optimizer_state_dict)

        criterion = MultiBoxLoss(cfg['num_classes'], 0.5, True, 0, True, 3, 0.5,
                                 False, args.cuda)
        image_level_criterion = ImageLevelLoss(cfg['num_classes'], args.cuda)
        conf_consistency_criterion = torch.nn.KLDivLoss(size_average=False, reduce=False).cuda()


        net.train()
        # loss counters
        loc_loss = 0
        conf_loss = 0
        epoch = 0
        supervised_flag = args.super_iter
        logger.info('Loading the dataset...')
        logger.info('Training SSD on: {}'.format(args.dataset))
        logger.info('Using the specified args:')
        logger.info(args)

        step_index = 0

        total_un_iter_num = 0


        #unsupervised_batch = args.batch_size - supervised_batch
        #data_shuffle = 0

        if(args.start_iter==0):
            supervised_dataset.set_only_supervise(True)
            batch_sampler.set_only_supervise(True)
        else:
            supervised_dataset.set_only_supervise((not args.semi))
            batch_sampler.set_only_supervise((not args.semi))
        supervised_data_loader = data.DataLoader(supervised_dataset, 
                                batch_sampler=batch_sampler,
                                num_workers=4,
                                collate_fn=detection_collate,
                                pin_memory=True)


        batch_iterator = iter(supervised_data_loader)

        scale = args.batch_size / 32
        for iteration in range(args.start_iter, int(cfg['max_iter'] / scale)):
            # modify learning rate
            if iteration in cfg['lr_steps']:
                # step_index += 1
                step_index = cfg["lr_steps"].index(int(iteration * scale)) + 1
                adjust_learning_rate(optimizer, args.gamma, step_index) 
            
            # get data
            try:
                images, targets, semis, image_level_target = next(batch_iterator)
            except StopIteration:
                supervised_flag -= 1
                if supervised_flag == 0:
                    supervised_dataset.set_only_supervise((not args.semi))
                    batch_sampler.set_only_supervise((not args.semi))
                else:
                    logger.info("still supervise mode")
                batch_iterator = iter(supervised_data_loader)
                images, targets, semis, image_level_target = next(batch_iterator)
                print("$$$$$$$$$$$$$$$$$$change data")
            # import IPython; IPython.embed(); exit()
            dd = np.array(semis)
            print("sup,unsup", (dd==1).sum(), (dd==0).sum())
            if args.cuda:
                images = Variable(images.cuda())
                targets = [Variable(ann.cuda(), volatile=True) for ann in targets]
                image_level_target = Variable(image_level_target.cuda())
            else:
                images = Variable(images)
                targets = [Variable(ann, volatile=True) for ann in targets]
                image_level_target = Variable(image_level_target)
            # forward
            t0 = time.time()

            out, conf, conf_flip, loc, loc_flip = net(images)
            loss_image_level, margin, average_num = image_level_criterion(out[1], image_level_target)
            

            sup_image_binary_index = np.zeros([len(semis),1])

            for super_image in range(len(semis)):
                if(int(semis[super_image])==1):
                    sup_image_binary_index[super_image] = 1
                else:
                    sup_image_binary_index[super_image] = 0

                if(int(semis[len(semis)-1-super_image])==0):
                    del targets[len(semis)-1-super_image]

            sup_image_index = np.where(sup_image_binary_index == 1)[0]
            unsup_image_index = np.where(sup_image_binary_index == 0)[0]

            loc_data, conf_data, priors = out

            if (len(sup_image_index) != 0):
                loc_data = loc_data[sup_image_index,:,:]
                conf_data = conf_data[sup_image_index,:,:]
                output = (
                    loc_data,
                    conf_data,
                    priors
                )

            # backprop
            # loss = Variable(torch.cuda.FloatTensor([0]))
            loss_l = Variable(torch.cuda.FloatTensor([0]))
            loss_c = Variable(torch.cuda.FloatTensor([0]))



            if(len(sup_image_index)!=0):
                # try:
                # import IPython; IPython.embed(); exit()
                loss_l, loss_c = criterion(output, targets)
                # except:
                #     break
                #     logger.info('get loss wrong--------------')


            # sampling = True
            if(args.semi is True):
                logger.info("semi")
                conf_class = conf[:,:,1:].clone()
                background_score = conf[:, :, 0].clone()
                each_val, each_index = torch.max(conf_class, dim=2)
                mask_val = each_val > background_score
                mask_val = mask_val.data

                mask_conf_index = mask_val.unsqueeze(2).expand_as(conf)
                mask_loc_index = mask_val.unsqueeze(2).expand_as(loc)

                conf_mask_sample = conf.clone()
                loc_mask_sample = loc.clone()
                conf_sampled = conf_mask_sample[mask_conf_index].view(-1, cfg["num_classes"])
                loc_sampled = loc_mask_sample[mask_loc_index].view(-1, 4)

                conf_mask_sample_flip = conf_flip.clone()
                loc_mask_sample_flip = loc_flip.clone()
                conf_sampled_flip = conf_mask_sample_flip[mask_conf_index].view(-1, cfg["num_classes"])
                loc_sampled_flip = loc_mask_sample_flip[mask_loc_index].view(-1, 4)

            # print("mask_val.sum: ", mask_val.sum())
            if(args.semi and mask_val.sum()>0):
                ## JSD !!!!!1
                conf_sampled_flip = conf_sampled_flip + 1e-7
                conf_sampled = conf_sampled + 1e-7
                consistency_conf_loss_a = conf_consistency_criterion(conf_sampled.log(), conf_sampled_flip.detach()).sum(-1).mean()
                consistency_conf_loss_b = conf_consistency_criterion(conf_sampled_flip.log(), conf_sampled.detach()).sum(-1).mean()
                consistency_conf_loss = consistency_conf_loss_a + consistency_conf_loss_b

                ## LOC LOSS
                consistency_loc_loss_x = torch.mean(torch.pow(loc_sampled[:, 0] + loc_sampled_flip[:, 0], exponent=2))
                consistency_loc_loss_y = torch.mean(torch.pow(loc_sampled[:, 1] - loc_sampled_flip[:, 1], exponent=2))
                consistency_loc_loss_w = torch.mean(torch.pow(loc_sampled[:, 2] - loc_sampled_flip[:, 2], exponent=2))
                consistency_loc_loss_h = torch.mean(torch.pow(loc_sampled[:, 3] - loc_sampled_flip[:, 3], exponent=2))

                consistency_loc_loss = torch.div(
                    consistency_loc_loss_x + consistency_loc_loss_y + consistency_loc_loss_w + consistency_loc_loss_h,
                    4)

            else:
                # logger.info("not semi@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
                consistency_conf_loss = Variable(torch.cuda.FloatTensor([0]))
                consistency_loc_loss = Variable(torch.cuda.FloatTensor([0]))

            consistency_loss = torch.div(consistency_conf_loss,2) + consistency_loc_loss

            ramp_weight = rampweight(iteration)
            consistency_loss = torch.mul(consistency_loss, ramp_weight)


            # print("sup_image_index", len(sup_image_index))
            if(supervised_flag >= 1):
                loss = loss_l + loss_c + consistency_loss + image_level_loss_weight * loss_image_level
            else:
                if(len(sup_image_index)==0):
                    loss = consistency_loss + image_level_loss_weight * loss_image_level
                    # continue
                else:
                    loss = loss_l + loss_c + consistency_loss + image_level_loss_weight * loss_image_level


            if(loss.data>0):
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            t1 = time.time()
            if(len(sup_image_index)==0):
                loss_l.data = Variable(torch.cuda.FloatTensor([0]))
                loss_c.data = Variable(torch.cuda.FloatTensor([0]))
                loss_image_level.data = Variable(torch.cuda.FloatTensor([0]))
                logger.info("len(sup_image_index)==0")
            else:
                loc_loss += loss_l.data  # [0]
                conf_loss += loss_c.data  # [0]


            if iteration % 10 == 0:
                logger.info('timer: %.4f sec.' % (t1 - t0))
                logger.info('iter ' + repr(iteration) + ' || Loss: %.4f || consistency_loss : %.4f ||' % (loss.data, consistency_loss.data))
                logger.info('loss: %.4f , loss_c: %.4f , loss_l: %.4f , loss_con: %.4f, lr : %.4f, super_len : %d\n' % (loss.data, loss_c.data, loss_l.data, consistency_loss.data,float(optimizer.param_groups[0]['lr']),len(sup_image_index)))
            
            if iteration % 100 == 0:
                tb_writer.add_scalar("Train/loss", loss.data, iteration)
                tb_writer.add_scalar("Train/loss_c", loss_c.data, iteration)
                tb_writer.add_scalar("Train/loss_l", loss_l.data, iteration)
                tb_writer.add_scalar("Train/loss_image_level", loss_image_level.data, iteration)
                tb_writer.add_scalar("Train/loss_con", consistency_loss.data, iteration)
                tb_writer.add_scalar("Train/lr", float(optimizer.param_groups[0]['lr']), iteration)
                tb_writer.add_scalar("Train/ramp_weight", float(ramp_weight), iteration)
                tb_writer.add_scalar("Train/sup_len", float(len(sup_image_index)), iteration)
                tb_writer.add_scalar("Train/margin", float(margin), iteration)
                tb_writer.add_scalar("Train/average_num", float(average_num), iteration)

            if(float(loss)>10000):
                print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
                # import IPython; IPython.embed(); exit()
                break

            if iteration != 0 and (iteration+1) % 1000 == 0:
                # logger.info('Saving state, iter:', iteration)
                # torch.save(ssd_net.state_dict(), 'weights/ssd300_COCO_' +
                #            repr(iteration+1) + '.pth')
                save_checkpoint((iteration+1), net, optimizer, checkpoint_file)
        # torch.save(ssd_net.state_dict(), args.save_folder + '' + args.dataset + '.pth')
        logger.info('-------------------------------\n')
        logger.info(loss.data)
        logger.info('-------------------------------')

        if((iteration +1) ==cfg['max_iter']):
            finish_flag = False


def rampweight(iteration):
    scale = args.batch_size / 32
    if args.dataset == "COCO":
        scale = scale / 4 * 1.2
    ramp_up_end = 32000 / scale
    ramp_down_start = 100000 / scale
    ramp_end = 120000 / scale
    step = 20000 / scale

    if(iteration<ramp_up_end):
        ramp_weight = math.exp(-5 * math.pow((1 - iteration / ramp_up_end),2))
    elif(iteration>ramp_down_start):
        ramp_weight = math.exp(-12.5 * math.pow((1 - (ramp_end - iteration) / step),2)) 
    else:
        ramp_weight = 1 


    if(iteration==0):
        ramp_weight = 0

    return ramp_weight




def adjust_learning_rate(optimizer, gamma, step):
    """Sets the learning rate to the initial LR decayed by 10 at every
        specified step
    # Adapted from PyTorch Imagenet example:
    # https://github.com/pytorch/examples/blob/master/imagenet/main.py
    """
    lr = args.lr * (gamma ** (step))
    for param_group in optimizer.param_groups:
        param_group['lr'] = lr


def xavier(param):
    init.xavier_uniform(param)


def weights_init(m):
    if isinstance(m, nn.Conv2d):
        xavier(m.weight.data)
        m.bias.data.zero_()


if __name__ == '__main__':
    train()
