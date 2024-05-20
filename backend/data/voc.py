"""VOC Dataset Classes

Original author: Francisco Massa
https://github.com/fmassa/vision/blob/voc_dataset/torchvision/datasets/voc.py

Updated by: Ellis Brown, Max deGroot
"""
from .config import HOME
import os.path as osp
import sys
import torch
import torch.utils.data as data
import cv2
import numpy as np
import random
from utils.logger import logger
if sys.version_info[0] == 2:
    import xml.etree.cElementTree as ET
else:
    import xml.etree.ElementTree as ET

VOC_CLASSES = (  # always index 0
    'aeroplane', 'bicycle', 'bird', 'boat',
    'bottle', 'bus', 'car', 'cat', 'chair',
    'cow', 'diningtable', 'dog', 'horse',
    'motorbike', 'person', 'pottedplant',
    'sheep', 'sofa', 'train', 'tvmonitor')

# note: if you used our download scripts, this should be right
VOC_ROOT = osp.join(HOME, "WSL/Data/VOCdevkit/")
# VOC_ROOT = osp.join(HOME, "data/VOCdevkit/")

class VOCEvalAnnotationTransform(object):
    """Transforms a VOC annotation into a Tensor of bbox coords and label index
    Initilized with a dictionary lookup of classnames to indexes

    Arguments:
        class_to_ind (dict, optional): dictionary lookup of classnames -> indexes
            (default: alphabetic indexing of VOC's 20 classes)
        keep_difficult (bool, optional): keep difficult instances or not
            (default: False)
        height (int): height
        width (int): width
    """

    def __init__(self, class_to_ind=None, keep_difficult=False):
        self.class_to_ind = class_to_ind or dict(
            zip(VOC_CLASSES, range(len(VOC_CLASSES))))
        self.keep_difficult = keep_difficult

    def __call__(self, target, width, height):
        """
        Arguments:
            target (annotation) : the target annotation to be made usable
                will be an ET.Element
        Returns:
            a list containing lists of bounding boxes  [bbox coords, class name]
        """
        objects = []
        for obj in target.findall('object'):
            obj_struct = {}
            obj_struct['name'] = obj.find('name').text
            obj_struct['pose'] = obj.find('pose').text
            obj_struct['truncated'] = int(obj.find('truncated').text)
            obj_struct['difficult'] = int(obj.find('difficult').text)
            bbox = obj.find('bndbox')
            obj_struct['bbox'] = [int(bbox.find('xmin').text) - 1,
                                int(bbox.find('ymin').text) - 1,
                                int(bbox.find('xmax').text) - 1,
                                int(bbox.find('ymax').text) - 1]
            objects.append(obj_struct)
        return objects

class VOCAnnotationTransform(object):
    """Transforms a VOC annotation into a Tensor of bbox coords and label index
    Initilized with a dictionary lookup of classnames to indexes

    Arguments:
        class_to_ind (dict, optional): dictionary lookup of classnames -> indexes
            (default: alphabetic indexing of VOC's 20 classes)
        keep_difficult (bool, optional): keep difficult instances or not
            (default: False)
        height (int): height
        width (int): width
    """

    def __init__(self, class_to_ind=None, keep_difficult=False):
        self.class_to_ind = class_to_ind or dict(
            zip(VOC_CLASSES, range(len(VOC_CLASSES))))
        self.keep_difficult = keep_difficult

    def __call__(self, target, width, height):
        """
        Arguments:
            target (annotation) : the target annotation to be made usable
                will be an ET.Element
        Returns:
            a list containing lists of bounding boxes  [bbox coords, class name]
        """
        res = []
        for obj in target.iter('object'):
            difficult = int(obj.find('difficult').text) == 1
            if not self.keep_difficult and difficult:
                continue
            name = obj.find('name').text.lower().strip()
            bbox = obj.find('bndbox')

            pts = ['xmin', 'ymin', 'xmax', 'ymax']
            bndbox = []
            for i, pt in enumerate(pts):
                cur_pt = int(bbox.find(pt).text) - 1
                # scale height or width
                cur_pt = cur_pt / width if i % 2 == 0 else cur_pt / height
                bndbox.append(cur_pt)
            label_idx = self.class_to_ind[name]
            bndbox.append(label_idx)
            res += [bndbox]  # [xmin, ymin, xmax, ymax, label_ind]
            # img_id = target.find('filename').text[:-4]

        return res  # [[xmin, ymin, xmax, ymax, label_ind], ... ]


class VOCDetection(data.Dataset):
    """VOC Detection Dataset Object

    input is image, target is annotation

    Arguments:
        root (string): filepath to VOCdevkit folder.
        image_set (string): imageset to use (eg. 'train', 'val', 'test')
        transform (callable, optional): transformation to perform on the
            input image
        target_transform (callable, optional): transformation to perform on the
            target `annotation`
            (eg: take in caption string, return tensor of word indices)
        dataset_name (string, optional): which dataset to load
            (default: 'VOC2007')
    """
    # image_sets=[('2007', 'trainval'), ('2012', 'trainval')],
    # image_sets = [('2007', 'trainval')],

    def __init__(self, root=VOC_ROOT,
                 image_sets=[('2007', 'trainval')],
                 transform=None, target_transform=VOCAnnotationTransform(),
                 dataset_name='VOC', supervise_percent=1.0, only_supervise=False,
                 eval=False):
        self.root = root
        self.image_set = image_sets
        self.transform = transform
        self.target_transform = target_transform
        if eval:
            self.target_transform = VOCEvalAnnotationTransform()
        self.classes = VOC_CLASSES
        self.name = dataset_name
        self._annopath = osp.join('%s', 'Annotations', '%s.xml')
        self._imgpath = osp.join('%s', 'JPEGImages', '%s.jpg')
        year, name = image_sets[0]
        idlist_file = osp.join(self.root, 'VOC' + year, name + "_random_list.txt")
        if name == "trainval":
            if osp.exists(idlist_file):
                print("reading from random_list", idlist_file)
                self._ids = list()
                with open(idlist_file, "r") as f:
                    lists = f.read().strip("\n").split("\n")
                    for l in lists:
                        a,b = l.split("\t")
                        self._ids.append((a, b))
            else:
                raise ValueError("you should have randomlist.txt file")
                # self._ids = list()
                # for (year, name) in image_sets:
                #     rootpath = osp.join(self.root, 'VOC' + year)
                #     for line in open(osp.join(rootpath, 'ImageSets', 'Main', name + '.txt')):
                #         self._ids.append((rootpath, line.strip()))
                # random.shuffle(self._ids)
                # with open(idlist_file, "w") as f:
                #     for id in self._ids:
                #         f.writelines("{}\t{}\n".format(id[0], id[1]))
            
        else:
            print("reading ids from origin data")
            self._ids = list()
            for (year, name) in image_sets:
                rootpath = osp.join(self.root, 'VOC' + year)
                for line in open(osp.join(rootpath, 'ImageSets', 'Main', name + '.txt')):
                    self._ids.append((rootpath, line.strip()))
            # random.shuffle(self.ids)
            # with open(idlist_file, "w") as f:
            #     for id in self.ids:
            #         f.writelines("{}\t{}\n".format(id[0], id[1]))
            
        self.supervise_num = int(len(self._ids) * supervise_percent)
        self.supervise_percent = supervise_percent
        self.set_only_supervise(only_supervise)

    def set_only_supervise(self, only_supervise):
        self.only_supervise = only_supervise
        if only_supervise:
            logger.info("using supervised only")
            self.ids = self._ids[:self.supervise_num].copy()
        else:
            logger.info("using both supervised and unsupervised")
            self.ids = self._ids.copy()
    
    def get_label_map(self):
        return self.classes

    def get_set_type(self):
        # TODO: what if there are two elements in image_set?
        return self.image_set[0][1]

    def set_eval(self, eval):
        if eval:
            self.target_transform = VOCEvalAnnotationTransform()

    def __getitem__(self, index):
        im, gt, h, w, semi = self.pull_item(index)

        return im, gt, semi, self.pull_image_level_anno(index)

    def __len__(self):
        return len(self.ids)

    def pull_item(self, index):

        img_id = self.ids[index]

        target = ET.parse(self._annopath % img_id).getroot()
        img = cv2.imread(self._imgpath % img_id)
        height, width, channels = img.shape

        if self.target_transform is not None:
            target = self.target_transform(target, width, height)

        if self.transform is not None:
            target = np.array(target)
            img, boxes, labels = self.transform(img, target[:, :4], target[:, 4])
            # to rgb
            img = img[:, :, (2, 1, 0)]
            # img = img.transpose(2, 0, 1)
            target = np.hstack((boxes, np.expand_dims(labels, axis=1)))
        if index < self.supervise_num:
            semi = np.array([1])
        else:
            semi = np.array([0])

        return torch.from_numpy(img).permute(2, 0, 1), target, height, width, semi
        # return torch.from_numpy(img), target, height, width

    def pull_image(self, index):
        '''Returns the original image object at index in PIL form

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to show
        Return:
            PIL img
        '''
        img_id = self.ids[index]
        return cv2.imread(self._imgpath % img_id, cv2.IMREAD_COLOR)

    def pull_anno(self, index):
        '''Returns the original annotation of image at index

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to get annotation of
        Return:
            list:  [img_id, [(label, bbox coords),...]]
                eg: ('001718', [('dog', (96, 13, 438, 332))])
        '''
        img_id = self.ids[index]
        anno = ET.parse(self._annopath % img_id).getroot()
        gt = self.target_transform(anno, 1, 1)
        return img_id[1], gt
    
    def pull_image_level_anno(self, index):
        img_id, gt = self.pull_anno(index)        
        cat_num = 20 # TODO
        labels = np.zeros(cat_num)
        for g in gt:
            labels[g[-1]] = 1
        return labels


    def pull_tensor(self, index):
        '''Returns the original image at an index in tensor form

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to show
        Return:
            tensorized version of img, squeezed
        '''
        return torch.Tensor(self.pull_image(index)).unsqueeze_(0)


class VOC0712Detection(data.Dataset):
    """VOC Detection Dataset Object

    input is image, target is annotation

    Arguments:
        root (string): filepath to VOCdevkit folder.
        image_set (string): imageset to use (eg. 'train', 'val', 'test')
        transform (callable, optional): transformation to perform on the
            input image
        target_transform (callable, optional): transformation to perform on the
            target `annotation`
            (eg: take in caption string, return tensor of word indices)
        dataset_name (string, optional): which dataset to load
            (default: 'VOC2007')
    """
    # image_sets=[('2007', 'trainval'), ('2012', 'trainval')],
    # image_sets = [('2007', 'trainval')],

    def __init__(self, root,
                 image_sets=[('2007', 'trainval')],
                 transform=None, target_transform=VOCAnnotationTransform(),
                 dataset_name='VOC0712'):
        self.root = root
        self.image_set = image_sets
        self.transform = transform
        self.target_transform = target_transform
        self.name = dataset_name
        self._annopath = osp.join('%s', 'Annotations', '%s.xml')
        self._imgpath = osp.join('%s', 'JPEGImages', '%s.jpg')
        self.ids = list()
        for (year, name) in image_sets:
            rootpath = osp.join(self.root, 'VOC' + year)
            for line in open(osp.join(rootpath, 'ImageSets', 'Main', name + '.txt')):
                self.ids.append((rootpath, line.strip()))

    def __getitem__(self, index):
        im, gt, h, w = self.pull_item(index)

        return im, gt

    def __len__(self):
        return len(self.ids)

    def pull_item(self, index):
        img_id = self.ids[index]

        target = ET.parse(self._annopath % img_id).getroot()
        img = cv2.imread(self._imgpath % img_id)
        height, width, channels = img.shape

        if self.target_transform is not None:
            target = self.target_transform(target, width, height)

        if self.transform is not None:
            target = np.array(target)
            img, boxes, labels = self.transform(img, target[:, :4], target[:, 4])
            # to rgb
            img = img[:, :, (2, 1, 0)]
            # img = img.transpose(2, 0, 1)
            target = np.hstack((boxes, np.expand_dims(labels, axis=1)))
        return torch.from_numpy(img).permute(2, 0, 1), target, height, width
        # return torch.from_numpy(img), target, height, width

    def pull_image(self, index):
        '''Returns the original image object at index in PIL form

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to show
        Return:
            PIL img
        '''
        img_id = self.ids[index]
        return cv2.imread(self._imgpath % img_id, cv2.IMREAD_COLOR)

    def pull_anno(self, index):
        '''Returns the original annotation of image at index

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to get annotation of
        Return:
            list:  [img_id, [(label, bbox coords),...]]
                eg: ('001718', [('dog', (96, 13, 438, 332))])
        '''
        img_id = self.ids[index]
        anno = ET.parse(self._annopath % img_id).getroot()
        gt = self.target_transform(anno, 1, 1)
        return img_id[1], gt


    def pull_tensor(self, index):
        '''Returns the original image at an index in tensor form

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to show
        Return:
            tensorized version of img, squeezed
        '''
        return torch.Tensor(self.pull_image(index)).unsqueeze_(0)
