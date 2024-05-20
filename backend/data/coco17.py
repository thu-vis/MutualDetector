'''
Author: Changjian Chen
Date: 2020-11-27 10:23:23
LastEditTime: 2021-03-21 23:00:41
LastEditors: Changjian Chen
Description: 
FilePath: /WSL/CSD-SSD/data/coco17.py

'''
from .config import HOME
import os
import os.path as osp
import sys
import torch
import torch.utils.data as data
import torchvision.transforms as transforms
import cv2
import numpy as np
import random
from utils.logger import logger
import pickle
import lmdb
import base64
import copy

COCO17_ROOT = osp.join(HOME, 'WSL/Data/coco17/')
IMAGES = 'images'
ANNOTATIONS = 'annotations'
COCO_API = 'cocoapi/PythonAPI'
INSTANCES_SET = 'shrink_instances_{}.json'
CAPTIONS_SET = "captions_{}.json"
LABEL_SET = "label_extraction_{}.pkl"
LABEL_MAP = 'shrink_coco_labels.txt'
# TODO: quick and dirty
selected_cat = np.array([ True, True, True, True, True, True, True, True, True, True, False, False,
False, True, True, True, True, True, True, True, True, False, True, True,
True, True, True, True, True, False, True, False, False, True, True, False,
True, True, True, True, True, True, True, True, True, True, True, True,
True, True, True, True, True, True, True, True, True, True, True, True,
True, True, True, True, False, False, True, True, False, True, False, True,
True, True, True, True, False, True, False, False])
# selected_cat = np.ones(80).astype(bool)
# COCO_CLASSES = ('person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
#                 'train', 'truck', 'boat', 'traffic light', 'fire', 'hydrant',
#                 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
#                 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
#                 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie',
#                 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
#                 'kite', 'baseball bat', 'baseball glove', 'skateboard',
#                 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
#                 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
#                 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
#                 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
#                 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
#                 'keyboard', 'cell phone', 'microwave oven', 'toaster', 'sink',
#                 'refrigerator', 'book', 'clock', 'vase', 'scissors',
#                 'teddy bear', 'hair drier', 'toothbrush')


# def get_label_map(label_file):
#     label_map = {}
#     labels = open(label_file, 'r')
#     for line in labels:
#         ids = line.split(',')
#         label_map[int(ids[0])] = int(ids[1])
#     return label_map

def get_label_map(label_file):
    label_map = {}
    labels = open(label_file, 'r')
    class_names = []
    for idx, line in enumerate(labels):
        ids = line.split(',')
        label_map[int(ids[0])] = int(idx)
        class_names.append(ids[2].strip("\n"))
    return label_map, class_names

class COCO17EvalAnnotationTransform(object):
    """Transforms a COCO annotation into a Tensor of bbox coords and label index
    Initilized with a dictionary lookup of classnames to indexes
    """
    def __init__(self):
        self.label_map, self.classes = get_label_map(osp.join(COCO17_ROOT, ANNOTATIONS, LABEL_MAP))

    def __call__(self, target, width, height):
        """
        Args:
            target (dict): COCO target json annotation as a python dict
            height (int): height
            width (int): width
        Returns:
            a list containing lists of bounding boxes  [bbox coords, class idx]
        """
        scale = np.array([width, height, width, height])
        objects = []
        for obj in target:
            if 'bbox' in obj:
                bbox = obj['bbox']
            #     bbox[2] += bbox[0]
            #     bbox[3] += bbox[1]
            #     label_idx = self.label_map[obj['category_id']] - 1
            #     final_box = list(np.array(bbox)/scale)
            #     final_box.append(label_idx)
            #     res += [final_box]  # [xmin, ymin, xmax, ymax, label_idx]
                obj_struct = {}
                label_idx = self.label_map[obj['category_id']]
                obj_struct["name"] = self.classes[label_idx]
                obj_struct["difficult"] = 0
                obj_struct['bbox'] = [int(bbox[0]) - 1,
                                int(bbox[1]) - 1,
                                int(bbox[2] + bbox[0]) - 1,
                                int(bbox[3] + bbox[1]) - 1]
                objects.append(obj_struct)
            else:
                print("no bbox problem!")

        return objects  # [[xmin, ymin, xmax, ymax, label_idx], ... ]

class COCO17AnnotationTransform(object):
    """Transforms a COCO annotation into a Tensor of bbox coords and label index
    Initilized with a dictionary lookup of classnames to indexes
    """
    def __init__(self):
        self.label_map, _ = get_label_map(osp.join(COCO17_ROOT, ANNOTATIONS, LABEL_MAP))

    def __call__(self, target, width, height):
        """
        Args:
            target (dict): COCO target json annotation as a python dict
            height (int): height
            width (int): width
        Returns:
            a list containing lists of bounding boxes  [bbox coords, class idx]
        """
        scale = np.array([width, height, width, height])
        res = []
        for obj in target:
            if 'bbox' in obj:
                bbox = obj['bbox']
                bbox[2] += bbox[0]
                bbox[3] += bbox[1]
                label_idx = self.label_map[obj['category_id']]
                final_box = list(np.array(bbox)/scale)
                final_box[0] = max(final_box[0], 0.0)
                final_box[1] = max(final_box[1], 0.0)
                final_box[2] = min(final_box[2], 1.0)
                final_box[3] = min(final_box[3], 1.0)
                final_box.append(label_idx)
                res += [final_box]  # [xmin, ymin, xmax, ymax, label_idx]
            else:
                print("no bbox problem!")

        return res  # [[xmin, ymin, xmax, ymax, label_idx], ... ]



class COCO17Detection(data.Dataset):
    """`MS Coco Detection <http://mscoco.org/dataset/#detections-challenge2016>`_ Dataset.
    Args:
        root (string): Root directory where images are downloaded to.
        set_name (string): Name of the specific set of COCO images.
        transform (callable, optional): A function/transform that augments the
                                        raw images`
        target_transform (callable, optional): A function/transform that takes
        in the target (bbox) and transforms it.
    """

    def __init__(self, root=COCO17_ROOT, image_set='train2017', transform=None,
                 target_transform=COCO17AnnotationTransform(), dataset_name='COCO', 
                 supervise_percent=1.0, supervise_num=None, extracting_label=True,
                 only_supervise=False, eval=False, text=False, finetune=False,
                 add_anno=""):
        sys.path.append(osp.join(root, COCO_API))
        from pycocotools.coco import COCO
        self.label_map, self.classes = get_label_map(osp.join(COCO17_ROOT,ANNOTATIONS, LABEL_MAP))
        self.image_set = image_set
        self.add_annos = pickle.loads(open(osp.join(root, ANNOTATIONS, 
            "add_annos{}.pkl".format(add_anno)), "rb").read())
        self.finetune = finetune
        self.root = osp.join(root, IMAGES, image_set)
        self.coco = COCO(osp.join(root, ANNOTATIONS,
            INSTANCES_SET.format(image_set)))
        self.coco_caps = COCO(osp.join(root, ANNOTATIONS,
            CAPTIONS_SET.format(image_set)))
        random_list_file = os.path.join(root, ANNOTATIONS, "shrink_" + image_set + "_random_list.txt")
        if image_set.count("train") > 0:
            if osp.exists(random_list_file):
                print("reading from random_list")
                random_list = open(random_list_file, "r")
                ids = random_list.read().strip("\n").split("\n")
                self._ids = [int(i) for i in ids]
            else:
                raise ValueError("you should have randomlist.txt file")
                # self.ids = list(self.coco.imgToAnns.keys())
                # random.shuffle(self.ids)
                # print("len ids", len(self.ids))
                # with open(random_list_file, "w") as f:
                #     for id in self.ids:
                #         f.writelines("{}\n".format(id))
                # exit()
        else:
            print("reading ids from origin data")
            self._ids = list(self.coco.imgToAnns.keys())


        self.text = text
        self.extracting_label = extracting_label

        self.transform = transform
        self.target_transform = target_transform
        self.name = dataset_name
        if supervise_num:
            self.supervise_num = supervise_num
            self.supervise_percent = supervise_num / len(self._ids)
        else:
            self.supervise_num = int(len(self._ids) * supervise_percent)
            self.supervise_percent = supervise_percent
        self.set_only_supervise(only_supervise)
        

        if image_set.count("train") > 0:
            trained_data_len = self.supervise_num
        else:
            trained_data_len = supervise_num

        if self.extracting_label:
            self.extracted_file = osp.join(root, "aggre_last/coco17_text_shrink_aggre_last_1_1e-5_{}/{}_result.pkl" \
                    .format(trained_data_len, image_set.replace("2017", "")))
            self._results = pickle.loads(open(self.extracted_file, "rb").read())
            results = {}
            for r in self._results:
                results[int(r["image_id"][0].decode())] = r
            self.results = results

        if self.text:    
            # bua feature
            bua_feature_file = osp.join(root, "bottom_up_attention",
                "coco17_resnet101_faster_rcnn_genome.lmdb")
            self.env_bua = lmdb.open(bua_feature_file, max_readers=1, readonly=True, \
                lock=False, readahead=False, meminit=False)
            self.txn_bua = self.env_bua.begin(write=False)            

            # Glove feature
            with open(os.path.join(root, "coco_open_vocab.txt"), "r") as f:
                self._open_vocabulary_list = []
                self.verb_2_idx = {}
                for idx, line in enumerate(f):
                    self._open_vocabulary_list = line.strip("\n")
                    self.verb_2_idx[line.strip("\n")] = idx

            with open(os.path.join(root, "coco_open_vocab_300d.npy"), "rb") as f:
                self._open_vocabulary_word_embedding = np.load(f)

            init_width = 0.03
            # oov: out of verb
            oov_emb = init_width * (
                np.random.rand(1, self._open_vocabulary_word_embedding.shape[-1]) * 2 - 1)
            self.embedding_array_data = np.concatenate([self._open_vocabulary_word_embedding, oov_emb],
                                                axis=0)
            self.embedding_array_data = self.embedding_array_data

        if self.finetune:
            self.detection_file = osp.join(root, "detections/processed_detections_train_{}.pkl" \
                    .format(trained_data_len))
            self.detections = pickle.loads(open(self.detection_file, "rb").read())
            self.inverse_label_map = {self.label_map[k]:k for k in self.label_map}

           
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
        return self.image_set

    def set_eval(self, eval):
        if eval:
            self.target_transform = COCO17EvalAnnotationTransform()

    def __getitem__(self, index):
        """
        Args:
            index (int): Index
        Returns:
            tuple: Tuple (image, target).
                   target is the object returned by ``coco.loadAnns``.
        """
        if self.text:
            label = self.pull_image_level_annos(index)
            text_feature = self.pull_text_feature(index)
            image_feature = self.pull_image_feature(index)
            masks = np.ones((text_feature.shape[0] + image_feature.shape[0], \
                len(label))).astype(np.float32)
            return text_feature, image_feature, torch.from_numpy(masks), label
        elif self.finetune:
            im, gt, det, h, w, semi = self.pull_det(index)
            if self.extracting_label:
                image_level_target = self.pull_extracted_labels(index)
            else:
                image_level_target = self.pull_image_level_annos(index)
            # text_add_anno, img_add_anno = self.pull_add_annos(index)
            gt_target = self.pull_image_level_annos(index)
            # image_level_target[text_add_anno.astype(bool)] = gt_target[text_add_anno.astype(bool)]
            # new_gt = []
            # if semi[0] > 0:
            #     new_gt = gt
            # else:
            #     for d in gt:
            #         if img_add_anno[int(d[-1])] > 0:
            #             new_gt.append(d)
            #     if len(new_gt) > 0:
            #         det = np.vstack((np.array(new_gt), det))
            return im, gt, semi, image_level_target, det
        else:
            im, gt, h, w, semi = self.pull_item(index)
            if self.extracting_label:
                image_level_target = self.pull_extracted_labels(index)
            else:
                image_level_target = self.pull_image_level_annos(index)
            return im, gt, semi, image_level_target

    def __len__(self):
        return len(self.ids)

    def pull_det(self, index):
        img_id = self.ids[index]
        if index < self.supervise_num:
            semi = np.array([1])
        else:
            semi = np.array([0])
        target = self.coco.imgToAnns[img_id]
        ann_ids = self.coco.getAnnIds(imgIds=img_id)
        target = self.coco.loadAnns(ann_ids)
        add_det = self.add_annos.get(img_id, {"image": [], "text": []})
        add_det = add_det["image"]
        if len(add_det) == 0:
            list_det = []
        else:
            add_det = np.array(add_det)
            add_det[:, 2] = add_det[:, 2] - add_det[:, 0]
            add_det[:, 3] = add_det[:, 3] - add_det[:, 1]
            list_det = [{"bbox": d[:4].tolist(), "category_id": self.inverse_label_map[int(d[-1])]}\
                for d in add_det]
        if index > self.supervise_num:
            target = list_det
        det = np.array(self.detections[img_id])
        np_det = det[det[:, -2] > 0.4]
        det = [{"bbox": d[:4].tolist(), "category_id": self.inverse_label_map[int(d[-1])]}\
            for d in np_det]
        if semi[0] > 0:
            det = []
        if len(det) == 0 and len(list_det) == 0:
            target = self.coco.loadAnns(ann_ids)
        target_num = len(target)
        det_num = len(det)
        origin_combined = target + det
        path = osp.join(self.root, self.coco.loadImgs(img_id)[0]['file_name'])
        assert osp.exists(path), 'Image path does not exist: {}'.format(path)
        img = cv2.imread(osp.join(self.root, path))
        height, width, _ = img.shape
        if self.target_transform is not None:
            combined = self.target_transform(origin_combined, width, height)
        if self.transform is not None:
            combined = np.array(combined)
            img, boxes, labels, mask = self.transform(img, combined[:, :4],
                                                combined[:, 4], True)
            # to rgb
            img = img[:, :, (2, 1, 0)]
            combined = np.hstack((boxes, np.expand_dims(labels, axis=1)))
            
        if mask is None:
            mask = np.ones(target_num + det_num).astype(bool)
        target = combined[:mask[:target_num].sum()]
        det = combined[mask[:target_num].sum():]
        return torch.from_numpy(img).permute(2, 0, 1), target, combined, height, width, semi
        

    def pull_item(self, index):
        """
        Args:
            index (int): Index
        Returns:
            tuple: Tuple (image, target, height, width).
                   target is the object returned by ``coco.loadAnns``.
        """
        img_id = self.ids[index]
        target = self.coco.imgToAnns[img_id]
        ann_ids = self.coco.getAnnIds(imgIds=img_id)

        target = self.coco.loadAnns(ann_ids)
        path = osp.join(self.root, self.coco.loadImgs(img_id)[0]['file_name'])
        assert osp.exists(path), 'Image path does not exist: {}'.format(path)
        img = cv2.imread(osp.join(self.root, path))
        height, width, _ = img.shape
        if self.target_transform is not None:
            target = self.target_transform(target, width, height)
        if self.transform is not None:
            target = np.array(target)
            img, boxes, labels = self.transform(img, target[:, :4],
                                                target[:, 4])
            # to rgb
            img = img[:, :, (2, 1, 0)]
            target = np.hstack((boxes, np.expand_dims(labels, axis=1)))

        
        if index < self.supervise_num:
            semi = np.array([1])
        else:
            semi = np.array([0])
        return torch.from_numpy(img).permute(2, 0, 1), target, height, width, semi

    def pull_image(self, index):
        '''Returns the original image object at index in PIL form

        Note: not using self.__getitem__(), as any transformations passed in
        could mess up this functionality.

        Argument:
            index (int): index of img to show
        Return:
            cv2 img
        '''
        img_id = self.ids[index]
        path = self.coco.loadImgs(img_id)[0]['file_name']
        return cv2.imread(osp.join(self.root, path), cv2.IMREAD_COLOR)

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
        ann_ids = self.coco.getAnnIds(imgIds=img_id)
        anno = self.coco.loadAnns(ann_ids)
        gt = self.target_transform(anno, 1, 1)
        return img_id, gt

    def pull_add_annos(self, index):
        img_id = self.ids[index]
        add_anno = self.add_annos.get(img_id, {"image": [], "text": []})
        img_add_anno = add_anno["image"]
        text_add_anno = add_anno["text"]
        img_oh = np.zeros(len(self.classes))
        if len(img_add_anno) > 0:
            img_oh[np.array(img_add_anno)] = 1
        text_oh = np.zeros(len(self.classes))
        if len(text_add_anno) > 0:
            text_oh[np.array(text_add_anno)] = 1
        return text_oh, img_oh

    def pull_text(self, index):
        img_id = self.ids[index]
        ann_ids = self.coco_caps.getAnnIds(imgIds=img_id)
        annos = self.coco_caps.loadAnns(ann_ids)
        text = [] 
        for anno in annos:
            cap = anno["caption"].strip(".").split(" ")
            cap = [a.lower() for a in cap]
            text.extend(cap)
        return text

    def pull_text_feature(self, index):
        text = self.pull_text(index)
        
        # word embedding process
        token_ids = [self.verb_2_idx.get(t, "oov") for t in text]
        token_ids = np.array([t for t in token_ids if t != "oov"])
        token_emb = self.embedding_array_data[token_ids]

        return torch.from_numpy(token_emb.astype(np.float32))
        

    def pull_extracted_labels(self, index):
        # TODO: fake
        img_id = self.ids[index]
        res = self.results[img_id]
        pred = sigmoid(res["logits"]) > 0.5
        return pred[0].astype(float)  

    def pull_metadata(self, index):
        img_id = self.ids[index]
        res = self.results[img_id]
        return res

    def pull_image_feature(self, index):
        img_id = self.ids[index]
        bua_metadata = pickle.loads(self.txn_bua.get(str(img_id).encode()))  
        num_boxes = int(bua_metadata['num_boxes'])
        bua_feature = np.frombuffer(base64.b64decode(bua_metadata["features"]),\
          dtype=np.float32).reshape(num_boxes, 2048)
        assert(num_boxes==36)
        return torch.from_numpy(bua_feature.astype(np.float32))

    def pull_image_level_annos(self, index):
        img_id, gt = self.pull_anno(index)

    # for debug
        # res = self.results[img_id]
        # a = np.array(res["label"])[0][selected_cat]
        
        cat_num = 65 # TODO: 65
        labels = np.zeros(cat_num) #[selected_cat]
        for g in gt:
            labels[g[-1]] = 1
        # try:
        #     assert (a!=labels).sum() == 0
        # except:
        #     print("acc")
        #     import IPython; IPython.embed(); exit()

        return labels

    def __repr__(self):
        # introduction of this class
        fmt_str = 'Dataset ' + self.__class__.__name__ + '\n'
        fmt_str += '    Number of datapoints: {}\n'.format(self.__len__())
        fmt_str += '    Root Location: {}\n'.format(self.root)
        tmp = '    Transforms (if any): '
        fmt_str += '{0}{1}\n'.format(tmp, self.transform.__repr__().replace('\n', '\n' + ' ' * len(tmp)))
        tmp = '    Target Transforms (if any): '
        fmt_str += '{0}{1}'.format(tmp, self.target_transform.__repr__().replace('\n', '\n' + ' ' * len(tmp)))
        return fmt_str


def sigmoid(x):
    s = 1 / (1 + np.exp(-x))
    return s