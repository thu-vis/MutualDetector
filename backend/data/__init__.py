# from .voc0712 import VOCDetection, VOCAnnotationTransform, VOC_CLASSES, VOC_ROOT
# from .voc07_consistency_init import  VOCDetection_con_init, VOCAnnotationTransform_con_init, VOC_CLASSES, VOC_ROOT
# from .voc07_consistency import  VOCDetection_con, VOCAnnotationTransform_con, VOC_CLASSES, VOC_ROOT

from .coco import COCODetection, COCOAnnotationTransform, COCO_CLASSES, COCO_ROOT, get_label_map
from .coco17 import COCO17Detection, COCO17_ROOT, COCO17AnnotationTransform
from .voc import VOCDetection, VOCAnnotationTransform, VOC_ROOT, VOC_CLASSES
from .config import *
import torch
import cv2
import numpy as np
from torch.utils.data import Sampler
from torch.nn.utils.rnn import pad_sequence

def detection_collate(batch):
    """Custom collate fn for dealing with batches of images that have a different
    number of associated object annotations (bounding boxes).

    Arguments:
        batch: (tuple) A tuple of tensor images and lists of annotations

    Return:
        A tuple containing:
            1) (tensor) batch of images stacked on their 0 dim
            2) (list of tensors) annotations for a given image are stacked on
                                 0 dim
    """
    ### changed when semi-supervised
    targets = []
    imgs = []
    semis = []
    image_level_target = []
    for sample in batch:
        imgs.append(sample[0])
        targets.append(torch.FloatTensor(sample[1]))
        image_level_target.append(torch.FloatTensor(sample[3]))
        if(len(sample)==4):
            semis.append(torch.FloatTensor(sample[2]))
    if(len(sample)==3):
        return torch.stack(imgs, 0), targets
    else:
        return torch.stack(imgs, 0), targets, semis, torch.stack(image_level_target, 0)
    # return torch.stack(imgs, 0), targets

def finetune_detection_collate(batch):
    ### changed when semi-supervised
    targets = []
    imgs = []
    semis = []
    image_level_target = []
    det = []
    for sample in batch:
        imgs.append(sample[0])
        targets.append(torch.FloatTensor(sample[1]))
        image_level_target.append(torch.FloatTensor(sample[3]))
        semis.append(torch.FloatTensor(sample[2]))
        det.append(torch.FloatTensor(sample[4]))
    return torch.stack(imgs, 0), targets, semis, \
        torch.stack(image_level_target, 0), det
    # return torch.stack(imgs, 0), targets

def text_collate(batch):
    text_features = []
    image_features = []
    targets = []
    masks = []
    for sample in batch:
        text_features.append(sample[0])
        image_features.append(sample[1])
        masks.append(sample[2])
        targets.append(torch.FloatTensor(sample[3]))
    return pad_sequence(text_features, batch_first=True), torch.stack(image_features), \
        pad_sequence(masks, batch_first=True), torch.stack(targets, 0)


class VOCBatchSampler(Sampler):
    def __init__(self, sampler, batch_size, drop_last, super_threshold, 
        supervise_percent, only_supervise, batch_super_times=1):
        if not isinstance(sampler, Sampler):
            raise ValueError("sampler should be an instance of "
                             "torch.utils.data.Sampler, but got sampler={}"
                             .format(sampler))
        if isinstance(batch_size, bool) or \
                batch_size <= 0:
            raise ValueError("batch_size should be a positive integeral value, "
                             "but got batch_size={}".format(batch_size))
        if not isinstance(drop_last, bool):
            raise ValueError("drop_last should be a boolean value, but got "
                             "drop_last={}".format(drop_last))
        self.sampler = sampler
        self.batch_size = batch_size
        self.drop_last = drop_last
        self.super_threshold = super_threshold
        self.supervise_percent = supervise_percent
        self.supervise_num = int(supervise_percent * batch_super_times * self.batch_size)
        self.unsupervise_num = self.batch_size - self.supervise_num
        self.only_supervise = only_supervise

    def set_only_supervise(self, only_supervise):
        self.only_supervise = only_supervise
    # def __iter__(self):
    #     batch = []
    #     for idx in self.sampler:
    #         batch.append(idx)
    #         if len(batch) == self.batch_size:
    #             yield batch
    #             batch = []
    #     if len(batch) > 0 and not self.drop_last:
    #         yield batch
    def __iter__(self):
        if self.only_supervise:
            batch = []
            for idx in self.sampler:
                batch.append(idx)
                if len(batch) == self.batch_size:
                    yield batch
                    batch = []
            if len(batch) > 0 and not self.drop_last:
                yield batch
        else:
            super_batch = []
            unsuper_batch = []
            for idx in self.sampler:
                if idx > self.super_threshold and len(unsuper_batch) < self.unsupervise_num:
                    unsuper_batch.append(idx)
                elif idx <= self.super_threshold and len(super_batch) < self.supervise_num:
                    super_batch.append(idx)
                # print("len",idx, len(unsuper_batch), len(super_batch))
                if len(super_batch) == self.supervise_num and len(unsuper_batch) == self.unsupervise_num:
                    # import IPython; IPython.embed()
                    yield super_batch + unsuper_batch
                    # print(super_batch + unsuper_batch)
                    super_batch = []
                    unsuper_batch = []
            if len(super_batch + unsuper_batch) > 0 and not self.drop_last:
                yield super_batch + unsuper_batch

    def __len__(self):
        if self.drop_last:
            return len(self.sampler) // self.batch_size
        else:
            return (len(self.sampler) + self.batch_size - 1) // self.batch_size


def base_transform(image, size, mean):
    x = cv2.resize(image, (size, size)).astype(np.float32)
    x -= mean
    x = x.astype(np.float32)
    return x


class BaseTransform:
    def __init__(self, size, mean):
        self.size = size
        self.mean = np.array(mean, dtype=np.float32)

    def __call__(self, image, boxes=None, labels=None):
        return base_transform(image, self.size, self.mean), boxes, labels
