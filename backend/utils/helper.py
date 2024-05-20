import pickle
import numpy as np
import os
import threading
import sys
import json
import time
import torch
from utils.logger import logger

# directory
def check_dir(dirname):
    if not os.path.exists(dirname):
        os.makedirs(dirname)
    return True

def get_output_dir(name, phase):
    """Return the directory where experimental artifacts are placed.
    If the directory does not exist, it is created.
    A canonical path is built using the name from an imdb and a network
    (if not None).
    """
    filedir = os.path.join(name, phase)
    if not os.path.exists(filedir):
        os.makedirs(filedir)
    return filedir


# Pickle loading and saving
def pickle_save_data(filename, data):
    try:
        pickle.dump(data, open(filename, "wb"))
    except Exception as e:
        logger.info(e, end=" ")
        logger.info("So we use the highest protocol.")
        pickle.dump(data, open(filename, "wb"), protocol=4)
    return True


def pickle_load_data(filename):
    try:
        mat = pickle.load(open(filename, "rb"))
    except Exception as e:
        mat = pickle.load(open(filename, "rb"))
    return mat


# json loading and saving
def json_save_data(filename, data):
    open(filename, "w").write(json.dumps(data, separators=(',', ':')))
    return True


def json_load_data(filename, encoding=None):
    return json.load(open(filename, "r", encoding=encoding))


def save_checkpoint(iteration, net, optimizer, checkpoint_file, is_best=False):
    check_dir(checkpoint_file)
    checkpoint_log = os.path.join(checkpoint_file, "checkpoint")
    if os.path.exists(checkpoint_log):
        d = json_load_data(checkpoint_log)
    else:
        d = {}
    checkpoint = {
        "iteration": iteration,
        "model_state_dict": net.state_dict(),
        "optimizer_state_dict": optimizer.state_dict()
    }
    torch.save(checkpoint, os.path.join(checkpoint_file, "ckpt_{}.pth".format(iteration)))
    logger.info("save models in {}".format(os.path.join(checkpoint_file, "ckpt_{}.pth".format(iteration))))
    d = {
        "last_model": "ckpt_{}.pth".format(iteration)
    }
    if is_best:
        d["best_model"] = d["last_model"]
    json_save_data(checkpoint_log, d)

def resume_checkpoint(resmue, checkpoint_file):
    if isinstance(resmue, bool):
        if resmue:
            checkpoint_log = os.path.join(checkpoint_file, "checkpoint")
            if not os.path.exists(checkpoint_log):
                return 0, False, False
            d = json_load_data(checkpoint_log)
            last_model = d["last_model"]
            checkpoint = torch.load(os.path.join(checkpoint_file, last_model))
            logger.info("*******************************************************************************")
            logger.info("*******************************************************************************")
            logger.info("load model from {}".format(os.path.join(checkpoint_file, last_model)))
            logger.info("*******************************************************************************")
            logger.info("*******************************************************************************")
            return checkpoint["iteration"], checkpoint["model_state_dict"], checkpoint["optimizer_state_dict"]
        else:
            return 0, False, False

    elif isinstance(resume, str):
        checkpoint = torch.load(resmue)
        return checkpoint["iteration"], checkpoint["model_state_dict"], checkpoint["optimizer_state_dict"]


class Timer(object):
    """A simple timer."""
    def __init__(self):
        self.total_time = 0.
        self.calls = 0
        self.start_time = 0.
        self.diff = 0.
        self.average_time = 0.

    def tic(self):
        # using time.time instead of time.clock because time time.clock
        # does not normalize for multithreading
        self.start_time = time.time()

    def toc(self, average=True):
        self.diff = time.time() - self.start_time
        self.total_time += self.diff
        self.calls += 1
        self.average_time = self.total_time / self.calls
        if average:
            return self.average_time
        else:
            return self.diff
