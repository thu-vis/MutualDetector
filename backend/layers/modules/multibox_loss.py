# -*- coding: utf-8 -*-
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.autograd import Variable
from data import voc512 as cfg
from ..box_utils import match, log_sum_exp

class TextLoss(nn.Module):
    def __init__(self, use_gpu=True):
        super(TextLoss, self).__init__()
        self.use_gpu = use_gpu

    def forward(self, pred, targets):
        loss = F.binary_cross_entropy_with_logits(pred, targets)        
        margin = torch.abs(pred - 0.5).mean()
        return loss, margin

class ImageLevelLoss(nn.Module):
    def __init__(self, num_classes, use_gpu=True):
        super(ImageLevelLoss, self).__init__()
        self.num_classes = num_classes
        self.use_gpu = True
    
    def forward(self, conf_data, targets):
        num = conf_data.size(0)
        num_classes = self.num_classes

        # image_level_labels = torch.zeros(num, num_classes)
        # for idx in range(num):
        #     labels = targets[idx][:, -1].data
        #     for label in labels:
        #         image_level_labels[idx, int(label)+1] = 1
        # image_level_labels = image_level_labels[1:]
        image_level_labels = targets
        
        image_level_pred = F.softmax(conf_data, dim=2).max(dim=1)[0]
        image_level_pred[image_level_pred<0]=0.0
        image_level_pred[image_level_pred>1]=1.0
        image_level_loss = F.binary_cross_entropy(image_level_pred[:, 1:], image_level_labels)

        margin = torch.abs(image_level_pred - 0.5).mean()
        # import IPython; IPython.embed(); exit()
        return image_level_loss, margin, num


class MultiBoxLoss(nn.Module):
    """SSD Weighted Loss Function
    Compute Targets:
        1) Produce Confidence Target Indices by matching  ground truth boxes
           with (default) 'priorboxes' that have jaccard index > threshold parameter
           (default threshold: 0.5).
        2) Produce localization target by 'encoding' variance into offsets of ground
           truth boxes and their matched  'priorboxes'.
        3) Hard negative mining to filter the excessive number of negative examples
           that comes with using a large number of default bounding boxes.
           (default negative:positive ratio 3:1)
    Objective Loss:
        L(x,c,l,g) = (Lconf(x, c) + αLloc(x,l,g)) / N
        Where, Lconf is the CrossEntropy Loss and Lloc is the SmoothL1 Loss
        weighted by α which is set to 1 by cross val.
        Args:
            c: class confidences,
            l: predicted boxes,
            g: ground truth boxes
            N: number of matched default boxes
        See: https://arxiv.org/pdf/1512.02325.pdf for more details.
    """

    def __init__(self, num_classes, overlap_thresh, prior_for_matching,
                 bkg_label, neg_mining, neg_pos, neg_overlap, encode_target,
                 use_gpu=True, image_level_supervision=False):
        super(MultiBoxLoss, self).__init__()
        self.use_gpu = use_gpu
        self.num_classes = num_classes
        self.threshold = overlap_thresh
        self.background_label = bkg_label
        self.encode_target = encode_target
        self.use_prior_for_matching = prior_for_matching
        self.do_neg_mining = neg_mining
        self.negpos_ratio = neg_pos
        self.neg_overlap = neg_overlap
        self.image_level_supervision = image_level_supervision
        self.variance = cfg['variance']

    def forward(self, predictions, targets):
        """Multibox Loss
        Args:
            predictions (tuple): A tuple containing loc preds, conf preds,
            and prior boxes from SSD net.
                conf shape: torch.size(batch_size,num_priors,num_classes)
                loc shape: torch.size(batch_size,num_priors,4)
                priors shape: torch.size(num_priors,4)

            targets (tensor): Ground truth boxes and labels for a batch,
                shape: [batch_size,num_objs,5] (last idx is the label).
        """
        loc_data, conf_data, priors = predictions
        num = loc_data.size(0)
        priors = priors[:loc_data.size(1), :]
        num_priors = (priors.size(0))
        num_classes = self.num_classes

        # match priors (default boxes) and ground truth boxes
        loc_t = torch.Tensor(num, num_priors, 4)
        conf_t = torch.LongTensor(num, num_priors)
        # image_level_labels = torch.zeros(num, num_classes)
        for idx in range(num):
            truths = targets[idx][:, :-1].data
            labels = targets[idx][:, -1].data
            # for label in labels:
            #     image_level_labels[idx, int(label)+1] = 1
            defaults = priors.data
            match(self.threshold, truths, defaults, self.variance, labels,
                  loc_t, conf_t, idx)
        if self.use_gpu:
            loc_t = loc_t.cuda()
            conf_t = conf_t.cuda()
        
        # if self.image_level_supervision:
        #     image_level_pred = F.softmax(conf_data, dim=2).max(dim=1)[0]
        #     image_level_pred[image_level_pred<0]=0.0
        #     image_level_pred[image_level_pred>1]=1.0
        #     image_level_loss = F.binary_cross_entropy(image_level_pred[:, 1:], image_level_labels[:, 1:])

        # wrap targets
        loc_t = Variable(loc_t, requires_grad=False)
        conf_t = Variable(conf_t, requires_grad=False)


        pos = conf_t > 0
        num_pos = pos.sum(dim=1, keepdim=True)

        # Localization Loss (Smooth L1)
        # Shape: [batch,num_priors,4]
        pos_idx = pos.unsqueeze(pos.dim()).expand_as(loc_data)
        loc_p = loc_data[pos_idx].view(-1, 4)
        loc_t = loc_t[pos_idx].view(-1, 4)
        loss_l = F.smooth_l1_loss(loc_p, loc_t, size_average=False)

        # Compute max conf across batch for hard negative mining
        batch_conf = conf_data.view(-1, self.num_classes)
        loss_c = log_sum_exp(batch_conf) - batch_conf.gather(1, conf_t.view(-1, 1))

        # Hard Negative Mining
        loss_c = loss_c.view(pos.size()[0], pos.size()[1])
        loss_c[pos] = 0  # filter out pos boxes for now
        loss_c = loss_c.view(num, -1)
        _, loss_idx = loss_c.sort(1, descending=True)
        _, idx_rank = loss_idx.sort(1)
        num_pos = pos.long().sum(1, keepdim=True)
        num_neg = torch.clamp(self.negpos_ratio*num_pos, max=pos.size(1)-1)
        neg = idx_rank < num_neg.expand_as(idx_rank)

        # Confidence Loss Including Positive and Negative Examples
        pos_idx = pos.unsqueeze(2).expand_as(conf_data)
        neg_idx = neg.unsqueeze(2).expand_as(conf_data)
        conf_p = conf_data[(pos_idx+neg_idx).gt(0)].view(-1, self.num_classes)
        targets_weighted = conf_t[(pos+neg).gt(0)]
        loss_c = F.cross_entropy(conf_p, targets_weighted, size_average=False)

        # Sum of losses: L(x,c,l,g) = (Lconf(x, c) + αLloc(x,l,g)) / N

        N = num_pos.data.sum()
        loss_l /= N
        loss_c /= N
        if self.image_level_supervision:
            return loss_l, loss_c #, image_level_loss
        return loss_l, loss_c

class HalfMultiBoxLoss(nn.Module):
    """SSD Weighted Loss Function
    Compute Targets:
        1) Produce Confidence Target Indices by matching  ground truth boxes
           with (default) 'priorboxes' that have jaccard index > threshold parameter
           (default threshold: 0.5).
        2) Produce localization target by 'encoding' variance into offsets of ground
           truth boxes and their matched  'priorboxes'.
        3) Hard negative mining to filter the excessive number of negative examples
           that comes with using a large number of default bounding boxes.
           (default negative:positive ratio 3:1)
    Objective Loss:
        L(x,c,l,g) = (Lconf(x, c) + αLloc(x,l,g)) / N
        Where, Lconf is the CrossEntropy Loss and Lloc is the SmoothL1 Loss
        weighted by α which is set to 1 by cross val.
        Args:
            c: class confidences,
            l: predicted boxes,
            g: ground truth boxes
            N: number of matched default boxes
        See: https://arxiv.org/pdf/1512.02325.pdf for more details.
    """

    def __init__(self, num_classes, overlap_thresh, prior_for_matching,
                 bkg_label, neg_mining, neg_pos, neg_overlap, encode_target,
                 use_gpu=True, image_level_supervision=False):
        super(HalfMultiBoxLoss, self).__init__()
        self.use_gpu = use_gpu
        self.num_classes = num_classes
        self.threshold = overlap_thresh
        self.background_label = bkg_label
        self.encode_target = encode_target
        self.use_prior_for_matching = prior_for_matching
        self.do_neg_mining = neg_mining
        self.negpos_ratio = neg_pos
        self.neg_overlap = neg_overlap
        self.image_level_supervision = image_level_supervision
        self.variance = cfg['variance']

    def forward(self, predictions, targets, det):
        """Multibox Loss
        Args:
            predictions (tuple): A tuple containing loc preds, conf preds,
            and prior boxes from SSD net.
                conf shape: torch.size(batch_size,num_priors,num_classes)
                loc shape: torch.size(batch_size,num_priors,4)
                priors shape: torch.size(num_priors,4)

            targets (tensor): Ground truth boxes and labels for a batch,
                shape: [batch_size,num_objs,5] (last idx is the label).
        """
        loc_data, conf_data, priors = predictions
        num = loc_data.size(0)
        priors = priors[:loc_data.size(1), :]
        num_priors = (priors.size(0))
        num_classes = self.num_classes

        # match priors (default boxes) and ground truth boxes
        loc_t = torch.Tensor(num, num_priors, 4)
        conf_t = torch.LongTensor(num, num_priors)
        for idx in range(num):
            truths = targets[idx][:, :-1].data
            labels = targets[idx][:, -1].data
            defaults = priors.data
            match(self.threshold, truths, defaults, self.variance, labels,
                  loc_t, conf_t, idx)
        if self.use_gpu:
            loc_t = loc_t.cuda()
            conf_t = conf_t.cuda()
        # wrap targets
        loc_t = Variable(loc_t, requires_grad=False)
        conf_t = Variable(conf_t, requires_grad=False)

        # match prior and detection
        det_loc_t = torch.Tensor(num, num_priors, 4)
        det_conf_t = torch.LongTensor(num, num_priors)
        for idx in range(num):
            det_truths = det[idx][:, :-1].data
            det_labels = det[idx][:, -1].data
            defaults = priors.data
            match(self.threshold, det_truths, defaults, self.variance, det_labels,
                  det_loc_t, det_conf_t, idx)
        if self.use_gpu:
            det_loc_t = det_loc_t.cuda()
            det_conf_t = det_conf_t.cuda()
        # wrap targets
        det_loc_t = Variable(det_loc_t, requires_grad=False)
        det_conf_t = Variable(det_conf_t, requires_grad=False)
        
        pos = conf_t > 0
        num_pos = pos.sum(dim=1, keepdim=True)
        # Localization Loss (Smooth L1)
        # Shape: [batch,num_priors,4]
        pos_idx = pos.unsqueeze(pos.dim()).expand_as(loc_data)
        loc_p = loc_data[pos_idx].view(-1, 4)
        loc_t = loc_t[pos_idx].view(-1, 4)
        loss_l = F.smooth_l1_loss(loc_p, loc_t, size_average=False)

        # classification loss
        # Compute max conf across batch for hard negative mining
        batch_conf = conf_data.view(-1, self.num_classes)
        det_loss_c = log_sum_exp(batch_conf) - batch_conf.gather(1, det_conf_t.view(-1, 1))

        det_pos = det_conf_t > 0
        # Hard Negative Mining
        det_loss_c = det_loss_c.view(det_pos.size()[0], det_pos.size()[1])
        det_loss_c[det_pos] = 0  # filter out pos boxes for now
        det_loss_c = det_loss_c.view(num, -1)
        _, det_loss_idx = det_loss_c.sort(1, descending=True)
        _, det_idx_rank = det_loss_idx.sort(1)
        det_num_pos = det_pos.long().sum(1, keepdim=True)
        det_num_neg = torch.clamp(self.negpos_ratio*det_num_pos, max=det_pos.size(1)-1)
        det_neg = det_idx_rank < det_num_neg.expand_as(det_idx_rank)

        # Confidence Loss Including Positive and Negative Examples
        det_pos_idx = det_pos.unsqueeze(2).expand_as(conf_data)
        det_neg_idx = det_neg.unsqueeze(2).expand_as(conf_data)
        det_conf_p = conf_data[(det_pos_idx + det_neg_idx).gt(0)].view(-1, self.num_classes)
        det_targets_weighted = det_conf_t[(det_pos+det_neg).gt(0)]
        det_loss_c = F.cross_entropy(det_conf_p, det_targets_weighted, size_average=False)

        # Sum of losses: L(x,c,l,g) = (Lconf(x, c) + αLloc(x,l,g)) / N

        N = det_num_pos.data.sum()
        loss_l /= N
        det_loss_c /= N
        return loss_l, det_loss_c
