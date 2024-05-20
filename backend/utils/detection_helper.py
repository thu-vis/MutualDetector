import os
import pickle
from tqdm import tqdm

from data import *
from .logger import logger

def evaluate_detections(all_boxes, output_dir, dataset):
    labelmap = dataset.get_label_map()
    set_type = dataset.get_set_type()
    if not os.path.isdir(output_dir):
        os.mkdir(output_dir)
    groundtruth_rects = get_all_groundtruth(dataset)
    aps = []
    use_07_metric = True
    if dataset.name == "COCO":
        use_07_metric = False
    for i, cls in enumerate(labelmap):
        box_by_class = get_box_by_class(all_boxes, i)
        rec, prec, ap, fp, tp, image_ids, conf, gt = eval_by_class(box_by_class, groundtruth_rects, \
            dataset, cls, use_07_metric=use_07_metric)
        aps += [ap]
        print('AP for {} = {:.4f}'.format(cls, ap))
        with open(os.path.join(output_dir, cls + '_pr.pkl'), 'wb') as f:
            pickle.dump({'rec': rec, 'prec': prec, 'ap': ap, \
                "fp": fp, "tp": tp, "image_ids": image_ids, "conf": conf, "gt": gt}, f)
    map_file = open(os.path.join(output_dir, "final_map.txt"), "w")
    print('Mean AP = {:.4f}'.format(np.mean(aps)))
    map_file.writelines('Mean AP = {:.4f}\n'.format(np.mean(aps)))
    print('~~~~~~~~')
    print('Results:')
    for ap in aps:
        # print('{:.3f}'.format(ap))
        map_file.writelines('{:.3f}\n'.format(ap))
    print('{:.3f}'.format(np.mean(aps)))
    print('~~~~~~~~')
    print('')
    print('--------------------------------------------------------------')
    print('Results computed with the **unofficial** Python eval code.')
    print('Results should be very close to the official MATLAB eval code.')
    print('--------------------------------------------------------------')
    map_file.close()

def eval_by_class(box_by_class, groundtruth_rects, dataset, classname,
        ovthresh=0.5, use_07_metric=True):
    # get all detections in this class
    image_ids = []
    confidence = []
    BB = []
    for im_ind, index in enumerate(dataset.ids):
        dets = box_by_class[im_ind]
        if dets == []:
            continue
        for k in range(dets.shape[0]):
            if dataset.name == "VOC":
                image_ids.append(index[1])
            elif dataset.name == "COCO":
                image_ids.append(index)
            confidence.append(float("{:.3f}".format(dets[k, -1])))
            BB.append([float("{:.1f}".format(dets[k, 0] + 1)),
                       float("{:.1f}".format(dets[k, 1] + 1)),
                       float("{:.1f}".format(dets[k, 2] + 1)),
                       float("{:.1f}".format(dets[k, 3] + 1))])
    # sort by confidence
    confidence = np.array(confidence)
    BB = np.array(BB)
    sorted_ind = np.argsort(-confidence)
    sorted_scores = np.sort(-confidence)    
    try:
        BB = BB[sorted_ind, :]
        image_ids = [image_ids[x] for x in sorted_ind]
    except:
        return 0,0,0

    #extract groundtruth objects for this class
    class_gt_recs = {}
    npos = 0
    for imagename in groundtruth_rects.keys():
        R = [obj for obj in groundtruth_rects[imagename] if obj['name'] == classname]
        
        bbox = np.array([x['bbox'] for x in R])
        difficult = np.array([x['difficult'] for x in R]).astype(np.bool)
        det = [False] * len(R)
        npos = npos + sum(~difficult)
        class_gt_recs[imagename] = {'bbox': bbox,
                                 'difficult': difficult,
                                 'det': det}

    # go down dets and mark TPs and FPs
    nd = len(image_ids)
    tp = np.zeros(nd)
    fp = np.zeros(nd)
    for d in range(nd):
        R = class_gt_recs[image_ids[d]]
        bb = BB[d, :].astype(float)
        ovmax = -np.inf
        BBGT = R['bbox'].astype(float)
        if BBGT.size > 0:
            # compute overlaps
            # intersection
            ixmin = np.maximum(BBGT[:, 0], bb[0])
            iymin = np.maximum(BBGT[:, 1], bb[1])
            ixmax = np.minimum(BBGT[:, 2], bb[2])
            iymax = np.minimum(BBGT[:, 3], bb[3])
            iw = np.maximum(ixmax - ixmin, 0.)
            ih = np.maximum(iymax - iymin, 0.)
            inters = iw * ih
            uni = ((bb[2] - bb[0]) * (bb[3] - bb[1]) +
                    (BBGT[:, 2] - BBGT[:, 0]) *
                    (BBGT[:, 3] - BBGT[:, 1]) - inters)
            overlaps = inters / uni
            ovmax = np.max(overlaps)
            jmax = np.argmax(overlaps)

        if ovmax > ovthresh:
            if not R['difficult'][jmax]:
                if not R['det'][jmax]:
                    tp[d] = 1.
                    R['det'][jmax] = 1
                else:
                    fp[d] = 1.
        else:
            fp[d] = 1.

    # compute precision recall
    real_fp = fp.copy()
    real_tp = tp.copy()
    fp = np.cumsum(fp)
    tp = np.cumsum(tp)
    # import IPython; IPython.embed()
    rec = tp / float(npos)
    # avoid divide by zero in case the first detection matches a difficult
    # ground truth
    prec = tp / np.maximum(tp + fp, np.finfo(np.float64).eps)
    ap = cal_ap(rec, prec, use_07_metric)

    # import IPython; IPython.embed(); exit()

    return rec, prec, ap, real_fp, real_tp, image_ids, confidence, class_gt_recs


####################################################
#########  model agnoistic  $$$$$$$$$$$$$$$$$$$$$$$$
####################################################
def cal_ap(rec, prec, use_07_metric=True):
    """ ap = cal_ap(rec, prec, [use_07_metric])
    Compute VOC AP given precision and recall.
    If use_07_metric is true, uses the
    VOC 07 11 point method (default:True).
    """
    if use_07_metric:
        # 11 point metric
        ap = 0.
        for t in np.arange(0., 1.1, 0.1):
            if np.sum(rec >= t) == 0:
                p = 0
            else:
                p = np.max(prec[rec >= t])
            ap = ap + p / 11.
    else:
        # correct AP calculation
        # first append sentinel values at the end
        mrec = np.concatenate(([0.], rec, [1.]))
        mpre = np.concatenate(([0.], prec, [0.]))

        # compute the precision envelope
        for i in range(mpre.size - 1, 0, -1):
            mpre[i - 1] = np.maximum(mpre[i - 1], mpre[i])

        # to calculate area under PR curve, look for points
        # where X axis (recall) changes value
        i = np.where(mrec[1:] != mrec[:-1])[0]

        # and sum (\Delta recall) * prec
        ap = np.sum((mrec[i + 1] - mrec[i]) * mpre[i + 1])
    return ap

def get_box_by_class(all_boxes, idx):
    # "+ 1" for skip background
    return all_boxes[idx + 1]

def get_all_groundtruth(dataset):
    logger.info("get all groundtruth")
    recs = {}
    img_num = len(dataset)
    for idx in tqdm(range(img_num)):
        img_id, target = dataset.pull_anno(idx)
        recs[img_id] = target
    return recs

