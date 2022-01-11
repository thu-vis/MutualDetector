MutualDetector
======================
Codes for the interactive analysis tool, MutualDetector, described in our paper "Towards Better Caption Supervision for Object Detection."

Note: this repository contains the codes for the frontend now. 
Nevertheless, you can run this repository by following the instructions below. 
We will clean and release the codes for the backend and the semi-supervised object detection method after April 1, 2022 (VIS 2022 deadline).

Introduction
--
DataLinker is a visual analysis tool for improving object detectors trained on image captions and a small number of annotated bounding boxes.
It supports users to 1) explore labels extracted from captions, detected objects detected from images, and their relationships; 2) provide missing labels and validate uncertain bounding boxes to improve the model performance.
A video demo is available at: https://youtu.be/_Ksp9stN6bw.

https://user-images.githubusercontent.com/23191514/148881923-c81fc7b7-2b8d-47ab-b410-3091740a565f.mp4


Quick Start with Demo Data
-----------------
You can run this repository with a online data support run on our server by following the instructions below. This code is tested on Windows 10.

Step 1: install [node.js](https://nodejs.org/en/download/) (version >= 12.0. You can run ```node --version``` to check the version of node.js.)

Step 2: download the source code with git (```git clone git@github.com:thu-vis/MutualDetector.git``` or ```git clone https://github.com/thu-vis/MutualDetector.git```) or download the code with "download ZIP"

Step 3: ```cd MutualDetector/``` (or ```cd MutualDetector-main/``` if you download the code with "download ZIP")

Step 4: ```npm install``` (install packages)

Step 5: ```npm run serve``` (compile and run the front-end code)

Step 6: visit http://localhost:20212/ in a browser.


## TODO
We have accumulated the following to-do list, which we hope to complete in the near future.
  * [ ] Release cleaned codes for the backend. 
  * [ ] Release cleaned codes for the semi-supervied object detection method.

## Citation
If you use this code for your research, please consider citing:
```
@article{chen2022towards,
  title={Towards Better Caption Supervision for Object Detection},
  author={Chen, Changjian and Wu, Jing and Wang, Xiaohan and Xiang, Shouxing and Zhang, Song-Hai and Tang, Qifeng and Liu, Shixia},
  journal={IEEE Transactions on Visualization and Computer Graphics},
  year={2022},
  note={to be published, \href{https://doi.org/10.1109/TVCG.2021.3138933}{doi: \textcolor{black}{10.1109/TVCG.2021.3138933}}}
}
```

## Contact
If you have any problem about this code, feel free to contact
- ccj17@mails.tsinghua.edu.cn

or describe your problem in Issues.
