<template>
  <v-col cols="9" class="main-view fill-height">
    <info-tooltip
      :left="tooltip.left"
      :top="tooltip.top"
      :width="tooltip.width"
      :show="tooltip.show"
      :content="tooltip.content"
    >
    </info-tooltip>
    <v-dialog v-model="dialog" width="900" height="900" :eager="true">
      <div id="popup-word-tsne" style="width:900px; background-color: white">
        <ul id="tsne-title-row">
          <!-- <div>
                    <span
                    class=""
                    v-text="'Projection of category labels'"
                ></span>
                </div>
                <div>
                    <v-btn
                    text
                    @click="dialog = false"
                >Close
                </v-btn>
                </div> -->

          <li id="tsne-title">Projection of labels</li>
          <li>
            <v-btn text @click="dialog = false" style="font-size: 30px"
              >×
            </v-btn>
          </li>
        </ul>
      </div>
    </v-dialog>
    <v-col cols="12" class="topname fill-width">
      Sample
      <div class="control-panel" style="width: 90%">
        <div class="treecut-control" style="width: 50%">
          <span
            class=""
            v-text="'Treecut: '"
            style="width: 65px; float: left"
          ></span>
          <!-- <input
            class="treecut-radio"
            type="radio"
            id="one"
            value="None"
            v-model="treecut_type"
          /> -->
          <!-- <label class="treecut-option" for="one">None</label> -->
          <input
            class="treecut-radio"
            type="radio"
            id="two"
            value="F1Score"
            v-model="treecut_type"
          />
          <label class="treecut-option" for="two">Correctness</label>
          <input
            class="treecut-radio"
            type="radio"
            id="three"
            value="Mismatch"
            v-model="treecut_type"
          />
          <label class="treecut-option" for="three">Mismatch</label>
        </div>
        <div
          class="consistency-slider"
          id="label-consistency-slider"
          style="width: 45%; display: flex; align-items: center;"
        >
          <span
            class=""
            v-text="'Label consistency weight: ' + label_consistency.toFixed(1)"
            style="width: 65%; float: left; overflow: hidden; text-overflow: ellipsis;"
          ></span>
          <v-slider
            v-model="label_consistency"
            max="100"
            step="1.0"
            :color="'grey'"
            :track-color="'grey lighten-2'"
            :thumb-color="'grey darken-1'"
            style="
                            height: 24px;
                        "
          ></v-slider>
        </div>
        <div
          class="consistency-slider"
          id="symmetrical-consistency-slider"
          style="width: 53%; display: flex; align-items: center;"
        >
          <span
            class=""
            v-text="
              'Symmetrical consistency weight: ' +
                symmetrical_consistency.toFixed(1)
            "
            style="width: 65%; float: left; overflow: hidden; text-overflow: ellipsis;"
          ></span>
          <v-slider
            v-model="symmetrical_consistency"
            max="100"
            :color="'grey'"
            :track-color="'grey lighten-2'"
            :thumb-color="'grey darken-1'"
            style="
                            height: 24px;
                        "
          ></v-slider>
        </div>
        <!-- <div id="label-tsne" @click="onShowLabelTSNECLick()">
          <svg
            t="1625582438485"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2069"
            width="17"
            height="17"
            style="display: block; margin: 3px"
          >
            <circle
              cx="512"
              cy="512"
              r="450"
              style="fill: none; stroke: rgb(114, 114, 114); stroke-width: 95;"
            ></circle>
            <path
              d="M768 256m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2070"
            ></path>
            <path
              d="M640 384m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2071"
            ></path>
            <path
              d="M352 448m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2072"
            ></path>
            <path
              d="M448 288m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2073"
            ></path>
            <path
              d="M480 576m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2074"
            ></path>
            <path
              d="M288 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2075"
            ></path>
            <path
              d="M224 608m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2076"
            ></path>
            <path
              d="M672 608m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2077"
            ></path>
            <path
              d="M544 768m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2078"
            ></path>
            <path
              d="M832 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2079"
            ></path>
            <path
              d="M800 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2080"
            ></path>
            <path
              d="M192 256m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
              fill="#727272"
              p-id="2081"
            ></path>
          </svg>
        </div> -->
        <div id="add-image" @click="onAddImageClick()">
          <svg
            t="1626854048312"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="1466"
            width="20"
            height="20"
            style="display: block"
          >
            <path
              style="fill: rgb(114, 114, 114)"
              d="M160 128A96 96 0 0 0 64 224v576A96 96 0 0 0 160 896h262.72a374.464 374.464 0 0 1-25.216-64H160a31.872 31.872 0 0 1-32-32v-59.264l227.52-256.512L430.016 562.56c10.752-19.008 23.232-36.992 37.248-53.504L353.92 389.76 128 644.224V224c0-17.728 14.272-32 32-32h704c17.728 0 32 14.272 32 32v198.72c22.72 11.776 44.48 25.536 64 41.792V224A96 96 0 0 0 864 128zM704 256c-35.2 0-64 28.8-64 64s28.8 64 64 64 64-28.8 64-64-28.8-64-64-64z m32 192C577.28 448 448 577.28 448 736S577.28 1024 736 1024s288-129.28 288-288S894.72 448 736 448z m0 64c124.032 0 224 100.032 224 224 0 124.032-100.032 224-224 224A223.616 223.616 0 0 1 512 736C512 611.968 612.032 512 736 512zM704 576v128H576v64h128v128h64v-128h128v-64h-128V576z"
              fill=""
              p-id="1467"
            ></path>
          </svg>
        </div>
        <div id="update-icon" @click="onUpdateIconCLick()">
          <svg
            t="1625551916203"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2406"
            width="20"
            height="20"
            style="display: block"
          >
            <path
              style="fill: rgb(114, 114, 114)"
              d="M896 432H606.506667l117.12-120.32c-116.48-115.413333-305.066667-119.68-421.546667-4.266667a293.333333 293.333333 0 0 0 0 417.706667c116.48 115.413333 305.066667 115.413333 421.546667 0 58.026667-57.6 87.04-124.373333 86.826666-208.853333H896c0 84.48-37.546667 194.133333-112.64 268.586666-149.76 148.266667-392.96 148.266667-542.72 0s-150.826667-388.693333-1.066667-536.96c149.546667-148.266667 390.186667-148.266667 539.733334 0L896 128v304zM533.333333 341.333333v181.333334l149.333334 88.746666-30.72 51.626667L469.333333 554.666667V341.333333h64z"
              p-id="2407"
            ></path>
          </svg>
        </div>
        <div class="help" id="help-icon" @click="onHelpIconCLick()">
          <div class="question">?</div>
        </div>
      </div>
    </v-col>
    <v-col cols="12" class="main-content pa-0" id="wrapper">
      <div
        id="grid-control"
        style="
                    position: absolute;
                    padding-left: 600px;
                    padding-top: 10px;
                    display: none;
                "
      >
        <div
          id="cropping"
          class="waves-effect waves-light btn-floating grey"
          title="Zoom in"
        >
          <svg
            class="icon"
            width="24px"
            height="24px"
            transform="translate(2.6, 2.6)"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="white"
              d="M136 384h56c4.4 0 8-3.6 8-8V200h176c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H196c-37.6 0-68 30.4-68 68v180c0 4.4 3.6 8 8 8zM648 200h176v176c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V196c0-37.6-30.4-68-68-68H648c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zM376 824H200V648c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v180c0 37.6 30.4 68 68 68h180c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM888 640h-56c-4.4 0-8 3.6-8 8v176H648c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h180c37.6 0 68-30.4 68-68V648c0-4.4-3.6-8-8-8zM904 476H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"
            />
          </svg>
        </div>
        <!-- <div
          id="selecting"
          style="margin-left: 3px"
          class="waves-effect waves-light btn-floating grey"
          title="Select"
        >
          <svg
            class="icon"
            width="24px"
            height="24px"
            transform="translate(2.6, 2.6)"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="white"
              d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h360c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H184V184h656v320c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V144c0-17.7-14.3-32-32-32zM653.3 599.4l52.2-52.2c4.7-4.7 1.9-12.8-4.7-13.6l-179.4-21c-5.1-0.6-9.5 3.7-8.9 8.9l21 179.4c0.8 6.6 8.9 9.4 13.6 4.7l52.4-52.4 256.2 256.2c3.1 3.1 8.2 3.1 11.3 0l42.4-42.4c3.1-3.1 3.1-8.2 0-11.3L653.3 599.4z"
            />
          </svg>
        </div> -->
        <div
          id="home"
          style="margin-left: 3px"
          class="waves-effect waves-light btn-floating grey"
          title="Home"
        >
          <svg
            class="icon"
            width="24px"
            height="24px"
            transform="translate(2.6, 2.6)"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="white"
              d="M1057.756543 566.281052a44.505707 44.505707 0 0 1-62.953323 0L535.326296 108.094795 150.99726 491.311188h27.927332a89.011415 89.011415 0 0 1 89.011414 89.011415v47.287314l0.244782 268.057876c3.004135 28.817446 13.173689 36.828473 44.950764 39.076011 39.276287-2.892871 43.571088-14.976171 43.971639-64.17723l-0.15577-113.06675a89.011415 89.011415 0 0 1 89.011415-88.165806h44.505707v-1.09039l89.011415-0.133517v1.223907h44.505708a89.011415 89.011415 0 0 1 89.011414 89.011415v47.287314h0.15577v56.010432l0.133517-14.953917c0 69.718191-0.445057 84.560844 44.105156 87.921025 37.451553-2.981882 43.660099-14.442102 44.639225-57.85742l-0.400551 58.346982h0.667585v-73.92398c0 5.629972 0 10.770381-0.178023 15.576998l0.178023-26.102597-0.289287-272.352677a44.505707 44.505707 0 0 1 89.011415 0l0.31154 309.314667h-0.31154V934.988585a89.011415 89.011415 0 0 1-89.011415 89.011415h-89.011415a88.833392 88.833392 0 0 1-88.655369-85.450958L624.159688 823.724317l-0.378298-17.668766c0.15577 2.358802 0.267034 5.029145 0.378298 7.610476L623.981666 756.965756h-24.47814l23.120715 0.15577 1.068137 48.956278c-2.737101-39.165023-13.551988-47.287314-53.896411-48.956278h-73.634693c-37.362541 1.891493-47.376326 10.169554-50.002162 44.928511l0.979125-44.8395h-1.179401v46.441706c0-0.556321 0-1.068137 0.133517-1.602206l-0.133517 5.741236 0.133517 79.798734h-0.133517V934.988585a89.011415 89.011415 0 0 1-89.011415 89.011415h-89.011415a88.833392 88.833392 0 0 1-88.633116-85.183924l-0.378298-359.761886h-18.848168 17.535249l0.400552 59.504131c-1.045884-47.665613-7.855257-57.523627-50.714254-59.548636l-80.288296 0.200275a43.59334 43.59334 0 0 1-11.126427-0.845608l-1.045884-0.200276A40.055137 40.055137 0 0 1 0.901762 544.228474c0-0.289287-0.111264-0.600827-0.15577-0.890114a43.103778 43.103778 0 0 1-0.289287-14.241826 48.956278 48.956278 0 0 1 3.315675-12.305828 44.260926 44.260926 0 0 1 7.944269-11.949783c0.244781-0.244781 0.289287-0.556321 0.534068-0.801103L500.411569 17.258646a47.376326 47.376326 0 0 1 2.781607-4.20579 44.505707 44.505707 0 0 1 62.953323 0l0.645333 0.645333 490.897952 489.562782a44.505707 44.505707 0 0 1 0.066759 63.020081zM713.349126 935.300125h21.140211l-21.140211-0.133517v0.178023z m-445.057074 0h21.117958l-21.117958-0.133517v0.178023zM178.034477 638.714091c0.178023 9.145923 0.200276 19.560258 0.200276 31.710317z"
            />
          </svg>
        </div>
      </div>
    </v-col>
  </v-col>
</template>

<script>
/*
 * this components calls all computation components (treecut, set_managers, etc.)
 * to get elements positions and other attributions,
 * and call all rendering components (text_tree, image_card, etc.)
 * to render all elements.
 */

// import Vue from "vue"
import { mapActions, mapState, mapMutations } from "vuex";
import * as d3 from "d3";
import * as Global from "../plugins/global";
import "../assets/font.css";
import introJs from "intro.js";
import "intro.js/introjs.css";

// computation components
import { mini_tree_layout, TreeCut, tree_layout } from "../plugins/layout_text";
import { image_cluster_list_layout } from "../plugins/layout_image";
import { ConnectionLayout } from "../plugins/layout_connection";
// import { svgDropDown } from "../plugins/svg_drop_down.js";

// import { SetManager } from "../plugins/set_manager";

// render components
import TextTree from "../plugins/render_text_tree";
import TextImageConnection from "../plugins/render_connection";
import ImageCards from "../plugins/render_image_card";

import InfoTooltip from "../components/infotooltip";
export default {
  name: "Detection",
  components: {
    InfoTooltip: InfoTooltip,
  },
  data: () => ({
    dialog: false,
    popup_width: 900,
    // treecut_type: "F1Score",
    treecut_type: "Mismatch",
    items: ["Foo", "Bar", "Fizz", "Buzz"],
    bbox_width: null,
    bbox_height: null,
    layout_width: null,
    layout_height: null,
    top_padding: null,
    nodes: null,
    links: null,
  }),
  computed: {
    ...mapState([
      "word_tsne",
      "classNames",
      "step",
      "name_edit_history",
      "tree",
      "use_treecut",
      "f1_score_selected",
      "image_cluster_list",
      "vis_image_per_cluster",
      "cluster_association_mat",
      "mismatch",
      "all_sets",
      "focus_node",
      "selected_node",
      "expand_tree",
      "expand_set_id",
      "grid_data",
      "grid_image_info",
      "nav_id",
      "tooltip",
      "server_url",
      "selected_flag",
    ]),
    // ...MapGetters({
    //     LabelConsistency: "label_consistency",
    //     SymmetricalSconsistency: "symmetrical_consistency"
    // }),
    label_consistency: {
      get() {
        return this.$store.state.label_consistency;
      },
      set(value) {
        this.$store.state.label_consistency = value;
      },
    },
    symmetrical_consistency: {
      get() {
        return this.$store.state.symmetrical_consistency;
      },
      set(value) {
        this.$store.state.symmetrical_consistency = value;
      },
    },
    // selected_flag(){
    //     return this.tree.all_descendants.map(d => !! d.selected_flag);
    // }
  },
  methods: {
    ...mapActions([
      "fetch_hypergraph",
      "fetch_word",
      "fetch_image",
      "fetch_grid_layout",
      "fetch_single_image_detection_for_focus_text",
    ]),
    ...mapMutations([
      "set_selected_flag",
      "set_focus_node",
      "set_name_edit_history",
      "set_selected_node",
      "set_focus_image",
      "set_expand_tree",
      "set_expand_set_id",
      "showTooltip",
      "hideTooltip",
      "set_words",
      "set_grid_layout_data",
      "set_use_treecut",
      "set_f1_score_selected",
    ]),
    onAddImageClick() {
      console.log("add image");
    },
    onShowLabelTSNECLick() {
      console.log("label-tsne");
      this.dialog = !this.dialog;
    },
    onHelpIconCLick(){
      this.setGuide();
    },
    async onUpdateIconCLick() {
      // console.log("click update icon");
      this.clean();
      window.text.clean();
      window.image.clean();
      Global.begin_loading();
      await this.$store.dispatch("fetch_manifest", {
        step: this.step,
        dataset: "COCO17",
        label_consistency: this.label_consistency,
        symmetrical_consistency: this.symmetrical_consistency,
      });
      await this.$store.dispatch("fetch_hypergraph", 1);
      Global.end_loading();
    },
    clean() {
      this.image_view.clean();
      this.text_tree_view.clean();
      this.connection_view.clean();
    },
    async reproduce(){
      let that = this;
      d3.select("html").attr("style", "overflow-y:hidden");
      await that.set_selected_node({"full_name": "truck", "id": 7});
      await that.fetch_word();
      await that.fetch_single_image_detection_for_focus_text({
          image_id: 100724
        });
      await window.text.set_focus_word({"text": "truck"});
      await window.image.change_confidence();
    },
    async setGuide() {
      let that = this;
      d3.select("html").attr("style", "overflow-y:hidden");
      this.set_selected_node({"full_name": "person", "id": 0});
      this.fetch_word();
      this.fetch_single_image_detection_for_focus_text({
          image_id: 28188
        });
      introJs()
        .onbeforeexit(function() {
          d3.select("html").attr("style", null);
          that.set_selected_node({"full_name": "person", "id": 0});
          window.image.clean();
          window.text.clean(); 
        })
        .setOptions({
          disableInteraction: true,
          steps: [
            {
              element: document.querySelector("#not-to-select"),
              intro:
                "Welcome to MutualDetector. The best experience with a resolution of 1920x1080!",
            },
            {
              element: document.querySelector("#main-svg"),
              intro:
                "This is the set visualization that consists of a tree of labels,  \
                links, and a matrix.",
            },
            {
              element: document.querySelector("#tree-node-group"),
              intro:
                "The tree layout on the left shows labels extracted from captions. \
                The tree can be modified by dragging and dropping if it is not satisfactory.",
            },
            {
              element: document.querySelector("#set-group"),
              intro:
                "The matrix on the right shows objects detected from images.",
            },
            {
              element: document.querySelector("#set-link-group"),
              intro:
                "The links between the tree layout and matrix show the relationships \
                between the labels and image clusters. A link of red dashed line indicates \
                the number of mismatches between an image cluster and a label cluster",
            },
            {
              element: document.querySelector("#id-0"),
              intro:
                "Each rectangle in the tree layout represents one node in the hierarchy. \
                You can click one node to show words with high contributions in the information panel.",
            },
            {
              element: document.querySelector("#set-0"),
              intro:
                "Each row of the matrix represents an image cluster. \
                Several representative images are placed in each row.",
            },
            {
              element: document.querySelector(".expand-rect"),
              intro:
                "Each row of the matrix can be expanded as a grid layout for further exploration of images.\
                You can select images in the grid layout to replace the representative images by the dragging and dropping.",
            },
            {
              element: document.querySelector(".other-view"),
              intro:
                "This is the information panel to show important words, captions, and selected images.",
            },
            {
              element: document.querySelector(".wordcloud-col"),
              intro:
                "Words with high contributions are displayed as a word cloud. \
                You can click one to show captions containing it below.",
            },
            {
              element: document.querySelector("#image-svg"),
              intro:
                "The selected image is displayed here. \
                The green rectangles over the image indicate the positions of detected objects. \
                The rectangle can be modified by dragging the corners.",
            },
            {
              element: document.querySelector(".confidence-slider"),
              intro: "You can change the confidence threshold with the slider.",
            },
            {
              element: document.querySelector(".image-edit"),
              intro: "You can validate, add or remove detected objects.",
            },
          ],
        })
        .start();
    },
    async setGridGuide(){
      let that = this;
      
      introJs()
        .onbeforeexit(function() {
          d3.select("html").attr("style", null);
          that.set_selected_node({"full_name": "person", "id": 0});
          window.image.clean();
          window.text.clean(); 
        })
        .setOptions({
          disableInteraction: true,
          steps: [
            {
              element: document.querySelector("#grid-group"),
              intro:
                "This is the grid layout",
            },
            {
              element: document.querySelector("#cropping"),
              intro:
                "Click this icon and select one region in the grid layout to zoom in",
            },
            {
              element: document.querySelector("#home"),
              intro:
                "Click this icon to to back top level.",
            },
            {
              element: document.querySelector("#no-to-select"),
              intro:
                "Drag one grid to the top to replace the representative images",
            },
          ],
        })
        .start();

    },
    treecut() {
      console.log("detection treecut");
      console.log("before treecut", this.tree);
      if (this.use_treecut) {
        // tree position backup
        this.tree.all_descendants.forEach((d) => {
          d.prev_x = d.x;
          d.prev_y = d.y;
          d.prev_vis = false;
        });
        this.tree.descendants().forEach((d) => (d.prev_vis = true));
        this.offset = this.treecut_class.treeCut(
          this.focus_node,
          this.tree,
          this.tree_layout.layout_with_rest_node
        );
        this.tree.all_descendants.map((d) => (d.api = 0));
        this.offset = 0;
        this.tree.sort(function(a, b) {
          return a.siblings_id - b.siblings_id;
        });
        console.log("after treecut", this.tree);
      } else {
        if (!this.focus_node) {
          this.tree.all_descendants.forEach((d) => (d.children = []));
          this.tree.children = this.tree.all_children;
        } else if (this.focus_node[0].type == 0) {
          this.focus_node[0].children = this.focus_node[0].all_children;
        } else if (this.focus_node[0].type == 1) {
          this.focus_node[0].children = [];
        }
        this.tree.descendants().forEach((d) => {
          d.beforeList = [];
          d.afterList = [];
        });
      }
    },
    update_data() {
      console.log("detection update data");
      console.log(this.tree, this.image_cluster_list);

      // tree layout
      if (!this.use_treecut) {
        this.tree_layout.update_layout_by_num(
          this.tree.descendants().length - 1
        );
      } else {
        this.tree_layout.reset_layout();
      }
      this.nodes = this.tree_layout.layout_with_rest_node(
        this.tree,
        this.expand_tree
      );
      this.rest_nodes = this.nodes.filter((d) => d.is_rest_node);
      this.nodes = this.nodes.filter((d) => !d.is_rest_node);
      this.tree_node_group_x = this.expand_tree ? this.layer_height / 2 : 0;
      this.tree_node_group_y = this.text_height + this.layer_height / 2;
      this.leaf_nodes = this.nodes.filter((d) => d.children.length === 0);
      // this.leaf_nodes.forEach(d => {
      //     if (d.selected_flag===undefined) d.selected_flag = true;
      // });
      // this.selected_nodes = this.nodes.filter(d => d.selected_flag);

      // minitree layout
      let mat = this.mini_tree_layout.layout(this.tree);
      this.mini_nodes = mat.nodes;
      this.mini_links = mat.links;

      // update cut cluster association matrix
      this.connection_layout.update(this.leaf_nodes, this.image_cluster_list);

      // set layout
      console.log("selected_nodes", this.selected_nodes);
      // this.sets = this.connection_layout.reorder(this.image_cluster_list);
      [this.sets, this.grids, this.grid_pos] = this.image_layout.layout(
        this.image_cluster_list
      );

      this.set_links = this.connection_layout.get_links(this.sets);
    },
    update_view() {
      console.log("detection update view");
      let max_height =
        Math.max(...this.nodes.map((d) => d.y)) + this.tree_node_group_y + 20;
      max_height = Math.max(this.bbox_height, max_height);
      if (!this.use_treecut) this.svg.attr("height", max_height);
      else this.svg.attr("height", this.bbox_height);

      this.word_tsne_create();

      this.text_tree_view.sub_component_update(this.nodes, this.rest_nodes);
      this.image_view.sub_component_update(
        this.sets,
        this.vis_image_per_cluster,
        this.grids,
        this.grid_pos
      );
      this.connection_view.sub_component_update(this.set_links);

      this.e_mini_nodes = this.mini_tree_node_group
        .selectAll(".mini-tree-node")
        .data(this.mini_nodes, (d) => d.id);
      this.e_mini_links = this.mini_tree_link_group
        .selectAll(".mini-tree-link")
        .data(this.mini_links);
      this.e_shadow_links = this.mini_shadow_link_group
        .selectAll(".mini-highlight")
        .data(this.mini_links);

      this.remove();
      this.update();
      this.create();
    },
    create() {
      console.log("Global", Global.GrayColor, Global.Animation);
      this.expand_icon_create();
      // this.mini_create();
    },

    mini_create() {
      this.e_mini_nodes
        .enter()
        .append("circle")
        .attr("class", "mini-tree-node")
        .attr("id", (d) => "mini-id-" + d.id)
        .attr("r", 0.5)
        .attr("cx", (d) => d.mini_y)
        .attr("cy", (d) => d.mini_x)
        .style("fill-opacity", 0)
        .transition()
        .duration(this.create_ani)
        .delay(this.remove_ani + this.update_ani)
        .style("fill-opacity", 1);
      this.e_mini_links
        .enter()
        .append("path")
        .attr("class", "mini-tree-link")
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.mini_y)
            .y((d) => d.mini_x)
        )
        .style("opacity", 0)
        .transition()
        .duration(this.create_ani)
        .delay(this.remove_ani + this.update_ani)
        .style("opacity", 1);
      this.e_shadow_links
        .enter()
        .append("path")
        .attr("class", "mini-highlight")
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.mini_y)
            .y((d) => d.mini_x)
        )
        .style("opacity", 0)
        .transition()
        .duration(this.create_ani)
        .delay(this.remove_ani + this.update_ani)
        .style("opacity", (d) => (d.target.mini_selected ? 1 : 0));
    },
    word_tsne_create() {
      d3.select("#popup-word-tsne")
        .select("svg")
        .remove();
      let word_tsne_svg = d3
        .select("#popup-word-tsne")
        .append("svg")
        .style("width", this.popup_width)
        .style("height", this.popup_width);
      // word_tsne_svg.append("rect")
      //     .style("width", this.popup_width)
      //     .style("height", this.popup_width)
      //     .style("fill", "white");
      this.e_word_tsne = word_tsne_svg
        .selectAll("circle.word-point")
        .data(() => {
          let res = [];
          for (let i = 0; i < this.word_tsne.length; i++) {
            let p = {};
            p.name = this.classNames[i];
            p.x =
              this.word_tsne[i][0] * this.popup_width * 0.9 +
              this.popup_width * 0.05;
            p.y =
              this.word_tsne[i][1] * this.popup_width * 0.9 +
              this.popup_width * 0.05;
            if (i === 9) {
              p.x = p.x * 1.05;
              p.y = p.y * 1.1;
            }
            if (i === 40) {
              p.y = p.y * 0.9;
            }
            if (i === 30) {
              p.y = p.y * 0.95;
            }
            res.push(p);
          }
          return res;
        });
      this.e_word_tsne
        .enter()
        .append("circle")
        .attr("class", "word-point")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 5)
        .style("fill", "#727272");
      this.e_word_tsne
        .enter()
        .append("text")
        .attr("x", (d) => d.x + 10)
        .attr("y", (d) => d.y + 5)
        .style("fill", "#727272")
        .text((d) => d.name);
    },
    legend_create() {
      let that = this;

      let title1_x = 20;
      let title2_x = 350;
      let title2_len = 100;

      let top_y = 0;

      // titles
      that.svg
        .append("text")
        .attr("class", "title-text")
        .attr("x", title1_x)
        .attr("y", that.text_height * 0.6 + "px")
        .text("Label hierarchy");
      //   let label_tsne_svg = that.svg
      //     .append("svg")
      //     .attr("id", "label-tsne")
      //     .attr("viewBox", "0 0 1024 1024")
      //     .attr("x", title1_x + 130)
      //     .attr("y", that.text_height * 0.2 + "px")
      //     .attr("width", "20px")
      //     .attr("height", "20px");
      //   let paths = [
      //     "M640 384m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M352 448m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M448 288m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M480 576m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M288 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M224 608m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M672 608m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M544 768m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M832 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M800 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //     "M192 256m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z",
      //   ];
      //   label_tsne_svg
      //     .append("rect")
      //     .attr("width", 1024)
      //     .attr("height", 1024)
      //     .style("fill", "white");
      //   label_tsne_svg
      //     .append("circle")
      //     .attr("cx", 512)
      //     .attr("cy", 512)
      //     .attr("r", 450)
      //     .style("fill", "none")
      //     .style("stroke", "#727272")
      //     .style("stroke-width", 95);
      //   label_tsne_svg
      //     .selectAll("path.tsne-point")
      //     .data(paths)
      //     .enter()
      //     .append("path")
      //     .attr("class", "tsne-point")
      //     .attr("d", (d) => d)
      //     .style("fill", "#727272");
      //   label_tsne_svg
      //     .on("mouseover", () => {
      //       d3.select("#label-tsne")
      //         .select("rect")
      //         .style("fill", "#ddd");
      //     })
      //     .on("mouseout", () => {
      //       d3.select("#label-tsne")
      //         .select("rect")
      //         .style("fill", "white");
      //     })
      //     .on("click", () => {
      //       console.log("label-tsne");
      //       this.dialog = !this.dialog;
      //     });

      that.svg
        .append("text")
        .attr("class", "title-text")
        .attr("x", title2_x)
        .attr("y", that.text_height * 0.6 + "px")
        .text("Image cluster");

      // precision & recall legend
      let precision_color = "rgb(201, 130, 206)";
      let recall_color = "rgb(79, 167, 255)";
      let rect_size = 0.166 * that.text_height;
      let step = 0.55 * that.text_height;
      let precision_recall_legend_startx = title2_x + title2_len + 100;
      let pc_group = that.svg
        .append("g")
        .attr("class", "precision-recall-legend")
        .attr(
          "transform",
          "translate(" +
            precision_recall_legend_startx +
            "," +
            top_y +
            ")" +
            "scale(" +
            1 +
            "," +
            1 +
            ")"
        );
      pc_group
        .append("rect")
        .attr("x", 0)
        .attr("y", rect_size)
        // .attr("y", rect_size+10)
        .attr("rx", 1.5)
        .attr("ry", 1.5)
        .attr("width", rect_size)
        .attr("height", rect_size)
        .attr("stroke-width", 1)
        .attr("stroke", precision_color)
        .attr("fill", precision_color);
      pc_group
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        // .attr("y", 10)
        .attr("rx", 1.5)
        .attr("ry", 1.5)
        .attr("width", rect_size)
        .attr("height", rect_size * 2)
        .attr("stroke-width", 1)
        .attr("stroke", precision_color)
        .attr("fill", "none");

      pc_group
        .append("rect")
        // .attr("x", rect_size+93)
        .attr("x", 0)
        .attr("y", rect_size + step)
        // .attr("y", rect_size+10)
        .attr("rx", 1.5)
        .attr("ry", 1.5)
        .attr("width", rect_size)
        .attr("height", rect_size)
        .attr("stroke-width", 1)
        .attr("stroke", recall_color)
        .attr("fill", recall_color);
      pc_group
        .append("rect")
        // .attr("x", rect_size+93)
        .attr("x", 0)
        .attr("y", step)
        // .attr("y", 10)
        .attr("rx", 1.5)
        .attr("ry", 1.5)
        .attr("width", rect_size)
        .attr("height", rect_size * 2)
        .attr("stroke-width", 1)
        .attr("stroke", recall_color)
        .attr("fill", "none");

      pc_group
        .append("text")
        .attr("text-anchor", "start")
        .attr("x", rect_size + 5)
        .attr("y", 0)
        .style("dominant-baseline", "hanging")
        .text("Precision");

      pc_group
        .append("text")
        .attr("text-anchor", "start")
        .attr("x", rect_size + 5)
        .attr("y", step)
        .style("dominant-baseline", "hanging")
        .text("Recall");

      // match & mismatch line legend
      let match_color = "#D3D3E5";
      let mismatch_color = "#ED2939";
      let line_stroke = 1;
      let line_length = 30;
      let match_mismatch_legend_startx =
        precision_recall_legend_startx + 60 + 50;
      let match_group = that.svg
        .append("g")
        .attr("id", "match-mismatch-legend-group")
        .attr(
          "transform",
          "translate(" +
            match_mismatch_legend_startx +
            "," +
            top_y +
            ")" +
            "scale(" +
            1 +
            "," +
            1 +
            ")"
        );
      match_group
        .selectAll(".match-mismatch-legend")
        .data(["Mismatched cluster pair", "Matched cluster pair"])
        .enter()
        .append("g")
        .attr("class", "match-mismatch-legend")
        .each(function(d, i) {
          let group = d3.select(this);
          group
            .append("line")
            .attr("x1", 0)
            .attr("y1", step * i + 7.5)
            .attr("x2", line_length)
            .attr("y2", step * i + 7.5)
            .attr("stroke-dasharray", i === 0 ? "5,5" : "5,0")
            .style("stroke-width", line_stroke)
            .style("stroke", i === 0 ? mismatch_color : match_color);
          group
            .append("text")
            .attr("x", 40)
            .attr("y", step * i)
            .text(d)
            .style("dominant-baseline", "hanging");
        });
      // match_group.append("line")
      //     .attr("x1", 0)
      //     .attr("y1", 15)
      //     .attr("x2", line_length)
      //     .attr("y2", 15)
      //     .attr("stroke-width", line_stroke)
      //     .attr("stroke", match_color);

      // match_group.append("line")
      //     .attr("x1", 220)
      //     .attr("y1", 15)
      //     .attr("x2", line_length+220)
      //     .attr("y2", 15)
      //     .attr("stroke-dasharray", "5,5")
      //     .attr("stroke-width", line_stroke)
      //     .attr("stroke", mismatch_color);

      // match_group.append("text")
      //     .attr("text-anchor", "start")
      //     .attr("x", 3+line_length)
      //     .attr("y", 22)
      //     .attr("font-size", "18px")
      //     .text("Matched cluster pair");

      // match_group.append("text")
      //     .attr("text-anchor", "start")
      //     .attr("x", line_length+220)
      //     .attr("y", 22)
      //     .attr("font-size", "18px")
      //     .text("Mismatched cluster pair");

      // 4. Grid_layout legend and buttons
      let grid_legend_startx = match_mismatch_legend_startx + 200 + 50;
      let grid_legend_group = this.svg
        .append("g")
        .attr("id", "grid-legend-group")
        .attr(
          "transform",
          "translate(" +
            grid_legend_startx +
            "," +
            top_y +
            ")" +
            "scale(" +
            1 +
            "," +
            1 +
            ")"
        )
        .style("visibility", "hidden");
      grid_legend_group
        .selectAll(".grid-legend")
        .data(["Mismatched Samples", "Matched Samples"])
        .enter()
        .append("g")
        .attr("class", "grid-legend")
        .each(function(d, i) {
          let group = d3.select(this);
          group
            .append("rect")
            .attr("x", 0)
            .attr("y", 20 * i)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", i === 0 ? "#E05246" : "#EEEDF3");
          group
            .append("text")
            .attr("x", 20)
            .attr("y", 20 * i)
            .text(d)
            .style("dominant-baseline", "hanging");
        });
      d3.select("#grid-control").style(
        "padding-left",
        grid_legend_startx + 200 + "px"
      );
    },
    expand_icon_create() {
      // this.expanded_icon_group.on("click", () => {
      //     console.log("click expanded icon", this.expand_tree);
      //     this.set_expand_tree(!this.expand_tree);
      // });
      // this.expanded_icon_group
      //     .selectAll("rect")
      //     .data([this.expand_tree])
      //     .enter()
      //     .append("rect")
      //     .attr("width", 10)
      //     .attr("height", 10)
      //     .style("rx", 3)
      //     .style("ry", 3)
      //     .style("fill", "white")
      //     .style("stroke", "gray")
      //     .style("stroke-width", 1);
      // this.expanded_icon_group
      //     .selectAll("path")
      //     .data([this.expand_tree])
      //     .enter()
      //     .append("path")
      //     .style("stroke", "none")
      //     .style("fill", "gray")
      //     .attr("d", () => {
      //         if (this.expand_tree) {
      //             return Global.minus_path_d(0, 0, 10, 10, 2);
      //         } else {
      //             return Global.plus_path_d(0, 0, 10, 10, 2);
      //         }
      //     });
    },
    update() {
      this.expand_icon_update();
      // this.mini_update();
    },
    mini_update() {
      this.e_mini_nodes
        .transition()
        .duration(this.update_ani)
        .delay(this.remove_ani)
        .attr("cx", (d) => d.mini_y)
        .attr("cy", (d) => d.mini_x);
      this.e_mini_links
        .transition()
        .duration(this.update_ani)
        .delay(this.remove_ani)
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.mini_y)
            .y((d) => d.mini_x)
        );
      this.e_shadow_links
        .transition()
        .duration((d) =>
          d.target.mini_selected ? this.create_ani : this.update_ani
        )
        .delay((d) =>
          d.target.mini_selected
            ? this.update_ani + this.remove_ani
            : this.remove_ani
        )
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.mini_y)
            .y((d) => d.mini_x)
        )
        .style("opacity", (d) => (d.target.mini_selected ? 1 : 0));
    },
    expand_icon_update() {
      // this.expanded_icon_group
      //     .selectAll("path")
      //     .data([this.expand_tree])
      //     .attr("d", () => {
      //         if (this.expand_tree) {
      //             return Global.minus_path_d(0, 0, 10, 10, 2);
      //         } else {
      //             return Global.plus_path_d(0, 0, 10, 10, 2);
      //         }
      //     });
    },
    remove() {
      // this.mini_remove();
    },
    mini_remove() {},
  },
  watch: {
    treecut_type() {
      // console.log("checkbox", this.picked);
      if (this.treecut_type === "None") {
        console.log("click tree cut", this.use_treecut);
        this.set_use_treecut(false);
      } else if (this.treecut_type === "F1Score") {
        console.log("click prec-rec-checkbox", this.f1_score_selected);
        if (!this.f1_score_selected) {
          this.set_use_treecut(true);
          // this.use_treecut = true;
          console.log(
            "use_treecut, f1 score",
            this.use_treecut,
            this.f1_score_selected
          );
          this.set_f1_score_selected(true);
        }
      } else if (this.treecut_type === "Mismatch") {
        console.log("click prec-rec-checkbox", this.f1_score_selected);
        if (this.f1_score_selected) {
          this.set_use_treecut(true);
          // this.use_treecut = true;
          this.set_f1_score_selected(false);
        }
      } else {
        console.log("ERROR: no option named", this.treecut_type);
      }
    },
    f1_score_selected() {
      console.log("f1_score_selected", this.f1_score_selected);
      this.tree.all_descendants.forEach((d) => {
        d.api = this.f1_score_selected ? d.f1_api : d.mm_api;
      });
      console.log("api", this.tree.all_descendants.map(d => d.api));
      this.treecut();
      console.log("offset", this.offset);
      this.update_data();
      this.update_view();
    },
    // name_edit_history: {
    //     handler (_, oldValue) {
    //         if (oldValue === 0) return;
    //         console.log("name_edit_history update");
    //         this.treecut();
    //         console.log("offset", this.offset);
    //         this.update_data();
    //         this.update_view();
    //     },
    //     deep: true
    // },
    tree() {
      console.log("tree update");
      this.treecut();
      console.log("offset", this.offset);
      this.update_data();
      this.update_view();
    },
    use_treecut() {
      console.log("use_treecut");
      this.treecut();
      console.log("offset", this.offset);
      this.update_data();
      this.update_view();
    },
    selected_flag() {
      console.log("selected flag update");
      this.update_data();
      this.update_view();
    },
    focus_node() {
      console.log("focus_node change", this.focus_node);
      this.treecut();
      console.log("offset", this.offset);
      this.update_data();
      this.update_view();
    },
    expand_tree() {
      console.log("expand tree change", this.expand_tree);
      // this.treecut(); // TODO:
      this.update_data();
      this.update_view();
    },
    async expand_set_id() {
      console.log("watch expand set id");
      if (this.expand_set_id < 0) {
        this.update_data();
        this.update_view();
      } else {
        let selected_ids = this.selected_node.node_ids;
        let image_cluster_id = this.expand_set_id;
        this.update_data();
        this.grids = [];
        this.grid_pos = {};
        this.image_view.create_ani = 0;
        this.update_view();
        this.image_view.set_animation_time();
        Global.disable_global_interaction();
        d3.select(".loading-svg").style("display", "block");
        setTimeout(() => {
          this.fetch_grid_layout({
            cat_ids: selected_ids,
            image_cluster_id: image_cluster_id,
          });
        }, 1000);
      }
    },
    grid_data() {
      console.log("watch grid_data");
      this.update_data();
      this.update_view();
      d3.select(".loading")
        .transition()
        .duration(1)
        .delay(1)
        .style("display", "none")
        .style("opacity", 1);
      d3.select(".loading-svg")
        .transition()
        .duration(1)
        .delay(1)
        .style("display", "none");
    },
  },
  async mounted() {
    console.log("detection mounted");
    window.detection = this;
    window.d3 = d3;
    let container = d3.select(".main-content");
    let bbox = container.node().getBoundingClientRect();
    this.bbox_width = bbox.width;
    this.bbox_height = bbox.height;

    // text position
    this.text_height = this.bbox_height * 0.04;

    // node width
    this.max_text_width = 120; // fixed max_text_width

    // mini tree
    this.mini_tree_width = 35;
    this.mini_tree_height = 80;
    this.mini_tree_x = 120;
    this.mini_tree_y = 5;

    // detection result layout
    this.layout_width = this.bbox_width;
    this.layout_height = this.bbox_height - this.text_height;
    this.node_width = 20; // TODO
    this.layer_height = 40; // TODO

    // bar size
    this.bar_width = 6;
    this.bar_height = this.layer_height * 0.45;
    this.rounded_r = 1.5;

    // set
    this.set_num = 0;
    this.set_height = 0;
    this.image_height = 0;
    this.set_left = this.layer_height * 3 + 230;
    this.set_width = this.layout_width - this.set_left - 12;
    this.set_margin = 3;
    this.image_margin = 5;

    // animation
    this.create_ani = Global.Animation;
    this.update_ani = Global.Animation;
    this.remove_ani = Global.Animation / 2;

    this.svg = container
      .append("svg")
      .attr("id", "main-svg")
      .attr("width", this.bbox_width)
      .attr("height", this.bbox_height)
      .style("padding-top", "5px");

      
    this.expanded_icon_group = this.svg
      .append("g")
      .attr("id", "expanded-icon-group")
      .attr(
        "transform",
        "translate(" + 5 + ", " + this.text_height * 0.8 + ")"
      );
    this.rest_node_group = this.svg
      .append("g")
      .attr("id", "rest-node-group")
      .attr(
        "transform",
        "translate(" + 2 + ", " + this.layout_height / 2 + ")"
      );
    this.tree_node_group = this.svg
      .append("g")
      .attr("id", "tree-node-group")
      .attr(
        "transform",
        "translate(" + 2 + ", " + this.layout_height / 2 + ")"
      );
    this.mini_tree_node_group = this.svg
      .append("g")
      .attr("id", "mini-tree-node-group")
      .attr(
        "transform",
        "translate(" + this.mini_tree_x + ", " + this.mini_tree_y + ")"
      );
    this.mini_tree_link_group = this.svg
      .append("g")
      .attr("id", "mini-tree-link-group")
      .attr(
        "transform",
        "translate(" + this.mini_tree_x + ", " + this.mini_tree_y + ")"
      );
    this.mini_shadow_link_group = this.svg
      .append("g")
      .attr("id", "mini-shadow-link-group")
      .attr(
        "transform",
        "translate(" + this.mini_tree_x + ", " + this.mini_tree_y + ")"
      );
    this.set_group = this.svg
      .append("g")
      .attr("id", "set-group")
      .attr("transform", "translate(" + 0 + ", " + this.text_height + ")");
    this.grid_group = this.svg
      .append("g")
      .attr("id", "grid-group")
      .attr("transform", "translate(" + 0 + ", " + this.text_height + ")");
    this.label_group = this.svg
      .append("g")
      .attr("id", "label-group")
      .attr("transform", "translate(" + 0 + ", " + this.text_height + ")");
    this.nav_group = this.svg
      .append("g")
      .attr("id", "nav-group")
      .attr("transform", "translate(" + 0 + ", " + 0 + ")");
    this.nav_group.style("visibility", "hidden");
    this.set_link_group = this.svg
      .append("g")
      .attr("id", "set-link-group")
      .attr("transform", "translate(" + 0 + ", " + this.text_height + ")");
    this.legend_create();
    this.drag_grid_group = this.svg
      .append("g")
      .attr("id", "drag-grid-group")
      .attr("transform", "translate(" + 0 + ", " + this.text_height + ")");
    this.tree_layout = new tree_layout(
      [this.node_width, this.layer_height],
      this.layout_height
    );

    this.mini_tree_layout = new mini_tree_layout([
      this.mini_tree_width,
      this.mini_tree_height,
    ]);

    this.treecut_class = new TreeCut(
      this.layer_height * 5,
      this.layout_height,
      this.layer_height
    );

    this.image_layout = new image_cluster_list_layout(this);
    this.connection_layout = new ConnectionLayout(this);
    // this.set_manager = new SetManager(this);

    this.text_tree_view = new TextTree(this);
    this.connection_view = new TextImageConnection(this);
    this.image_view = new ImageCards(this);
  },
};
</script>

<style>
/* .tree-node{
} */
html {
  font-size: 0.835vw;
}

html::-webkit-scrollbar {
  display: none;
}

.icon-bg-0 {
  cursor: pointer;
}

.node-name {
  pointer-events: none;
}

.rest-tree-node {
  cursor: pointer;
}

.tree-link {
  fill: none;
}

.set-link {
  fill: none;
}

.mini-tree-node {
  fill: #dfdfdf;
}

.bar-background {
  fill: white;
  stroke: rgb(127, 127, 127);
}

.bar-line {
  fill: rgb(127, 127, 127);
}

.bar-precision {
  fill: rgb(201, 130, 206);
}

.bar-recall {
  fill: rgb(79, 167, 255);
}

.mini-tree-link {
  stroke: #dfdfdf;
  fill: none;
}

#overlay {
  position: absolute;
  display: flex;
  flex-direction: column;
  /* padding: 0.7em; */
  max-width: 200px;
  min-width: 100px;
  /* background: rgb(255, 255, 255);
    color:rgb(114, 114, 114);
    border-radius: 3px; */
  text-align: center;
  background-color: rgba(255, 255, 255, 0);
  /* box-shadow: 0 4px 8px 0 rgb(0 0 0 / 40%), 0 6px 20px 0 rgb(0 0 0 / 29%); */
}

#edit-title {
  font-size: 18px;
  font-weight: 600;
}

#edit-input {
  /* text-align: center; */
  color: rgb(114, 114, 114);
  font-size: 18px;
  height: 24px;
  background: white;
  border-style: solid;
  border: 1px solid #e0e0e0;
  /* margin-top: 0.7em; */
  /* margin-bottom: 0.7em; */
}

#edit-input:focus {
  /* border-bottom:1px solid #4286bd; */
  outline: none;
  border-bottom: 1px solid #4286bd;
}

/* .mini-shadow-link{
    stroke:
} */

.mini-highlight {
  stroke: #5f5f5f;
  fill: none;
}

.title-text {
  font-size: 18px;
  stroke: rgb(114, 114, 114);
  fill: rgb(114, 114, 114);
}

.control-panel {
  /* justify-content: flex-end; */
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  /* font-size: 16px; */
  font-size: 0.835vw;
  font-weight: 400;
}

.treecut-control {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.treecut-option {
  margin-right: 10px;
}

.treecut-radio {
  margin-right: 2px;
  margin-bottom: 3px;
}

.help .question {
  height: 20px;
  width: 20px;
  background: #ccc;
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  cursor: pointer;
}

#help-icon:hover {
  background: #ddd;
}

.v-slider--horizontal {
  min-height: 22px;
}

.main-content {
  /* background: rgb(248, 249, 254); */
  background: rgb(255, 255, 255);
  border: 1px solid #c1c1c1;
  border-radius: 5px;
  height: calc(100% - 24px);
}

.precision-recall-legend {
  fill: rgb(114, 114, 114);
}

#match-mismatch-legend-group {
  fill: rgb(114, 114, 114);
}

#grid-legend-group {
  fill: rgb(114, 114, 114);
}

#update-icon:hover {
  background: #ddd;
}

#label-tsne:hover {
  background: #ddd;
}

#add-image:hover {
  background: #ddd;
}

#popup-word-tsne {
  display: flex;
  flex-direction: column;
  /* justify-content: flex-end; */
  /* align-items: center; */
}

#tsne-title {
  font-size: 20px;
  font-weight: 600;
  color: rgb(114, 114, 114);
}

ul::before {
  content: "D";
  margin: 1px auto 1px 1px;
  visibility: hidden;
}
li:last-child {
  margin-left: auto;
}
ul {
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
li {
  display: flex;
  margin: 1px;
}
p {
  text-align: center;
  margin-top: 0;
}

input[type="radio"] {
  /* remove standard background appearance */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  /* create custom radiobutton appearance */
  display: inline-block;
  width: 14px;
  height: 14px;
  padding: 2.4px;
  /* background-color only for content */
  background-clip: content-box;
  border: 1px solid #494949;
  /* background-color: #ffffff; */
  border-radius: 50%;
}

/* appearance for checked radiobutton */
input[type="radio"]:checked {
  background-color: #050505;
}

.topname {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-weight: 600;
  background: rgb(238, 240, 240);
  border-radius: 5px;
  padding-left: 10px;
  color: rgb(114, 114, 114);
  height: 22px;
  justify-content: space-between;
}

#main-topname {
  display: flex;
  justify-content: space-between;
}

.matched-link {
  stroke: #d3d3e5;
}

.mismatched-link {
  stroke: #ed2939;
  stroke-dasharray: 5, 5;
}

.current-label-checkbox {
  cursor: pointer;
}
.prec-rec-checkbox {
  cursor: pointer;
}
.mismatch-checkbox {
  cursor: pointer;
}

.expand-path {
  pointer-events: none;
}

.waves-effect {
  position: relative;
  cursor: pointer;
  display: inline-block;
  overflow: hidden;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  vertical-align: middle;
  z-index: 1;
  -webkit-transition: 0.3s ease-out;
  transition: 0.3s ease-out;
}

.waves-effect .waves-ripple {
  position: absolute;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  margin-top: -10px;
  margin-left: -10px;
  opacity: 0;
  background: rgba(0, 0, 0, 0.2);
  -webkit-transition: all 0.7s ease-out;
  transition: all 0.7s ease-out;
  -webkit-transition-property: opacity, -webkit-transform;
  transition-property: opacity, -webkit-transform;
  transition-property: transform, opacity;
  transition-property: transform, opacity, -webkit-transform;
  -webkit-transform: scale(0);
  transform: scale(0);
  pointer-events: none;
}

.waves-effect.waves-light .waves-ripple {
  background-color: rgba(255, 255, 255, 0.45);
}

.waves-effect.waves-red .waves-ripple {
  background-color: rgba(244, 67, 54, 0.7);
}

.waves-effect.waves-yellow .waves-ripple {
  background-color: rgba(255, 235, 59, 0.7);
}

.waves-effect.waves-orange .waves-ripple {
  background-color: rgba(255, 152, 0, 0.7);
}

.waves-effect.waves-purple .waves-ripple {
  background-color: rgba(156, 39, 176, 0.7);
}

.waves-effect.waves-green .waves-ripple {
  background-color: rgba(76, 175, 80, 0.7);
}

.waves-effect.waves-teal .waves-ripple {
  background-color: rgba(0, 150, 136, 0.7);
}

.waves-effect input[type="button"],
.waves-effect input[type="reset"],
.waves-effect input[type="submit"] {
  border: 0;
  font-style: normal;
  font-size: inherit;
  text-transform: inherit;
  background: none;
}

.waves-effect img {
  position: relative;
  z-index: -1;
}

.waves-notransition {
  -webkit-transition: none !important;
  transition: none !important;
}

.waves-circle {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-mask-image: -webkit-radial-gradient(circle, white 100%, black 100%);
}

.waves-input-wrapper {
  border-radius: 0.2em;
  vertical-align: bottom;
}

.waves-input-wrapper .waves-button-input {
  position: relative;
  top: 0;
  left: 0;
  z-index: 1;
}

.waves-circle {
  text-align: center;
  width: 2.5em;
  height: 2.5em;
  line-height: 2.5em;
  border-radius: 50%;
  -webkit-mask-image: none;
}

.waves-block {
  display: block;
}

.waves-effect .waves-ripple {
  z-index: -1;
}

.btn-floating {
  display: inline-block;
  color: #fff;
  position: relative;
  overflow: hidden;
  z-index: 1;
  width: 30px;
  height: 30px;
  line-height: 30px;
  padding: 0;
  background-color: #26a69a;
  border-radius: 50%;
  -webkit-transition: background-color 0.3s;
  transition: background-color 0.3s;
  cursor: pointer;
  vertical-align: middle;
}

.btn-floating:hover {
  background-color: #26a69a;
}

.btn-floating:before {
  border-radius: 0;
}

.grey {
  background-color: #9e9e9e !important;
}

.glyphicon {
  position: relative;
  top: 1px;
  display: inline-block;
  font-family: "Glyphicons Halflings";
  font-style: normal;
  font-weight: normal;
  line-height: 1;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.glyphicon-zoom-in:before {
  content: "\e015";
}
</style>
