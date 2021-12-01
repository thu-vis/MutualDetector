<template>
  <v-row class="text-view fill-width mr-0">

    <v-col cols="12" class="text-content pa-0">
      <!-- <v-col id="selected-title" class="label-text pa-0 pl-2"> Selected: 
        <span id="selected-class-name">{{selected_node.curr_full_name}} </span>
        </v-col> -->
      <v-row style="margin-left: 1px; align-items: center;">
          <v-col class="label-text pa-0 pl-2" id="wordcloud-name"> 
            <span style="margin-top: 5px">
              Word cloud:
            </span> 
              <svg version="1.1" width="35px" height="35px" 
            style="enable-background:new 0 0 512 512; opacity: 0;" 
            xml:space="preserve"
              class="loading-wordcloud-svg">
              <symbol id="animate-wordcloud-icon" viewBox="0 0 60 60">
                <g transform="translate(30,30)">
                  <path class="circle-path"
                    d="M1.2246467991473533e-15,-20A20,20,0,1,1,-20,2.4492935982947065e-15L-16,1.959434878635765e-15A16,16,0,1,0,9.797174393178826e-16,-16Z">
                  </path>
                </g>
            
              </symbol>
              <use xlink:href="#animate-wordcloud-icon" x="0" y="0" width="40px" height="40px"></use>
            </svg>
          </v-col>
          <svg :style="'opacity:' + (focus_word===null?0:1)+';'" v-on:click="remove_word()" class="wordcloud-recyclebin" height="20" viewBox="0 0 74 74" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m51.512 71.833h-28.723a4.661 4.661 0 0 1 -4.631-4.3l-2.858-39.146a1 1 0 1 1 1.995-.146l2.854 39.142a2.652 2.652 0 0 0 2.636 2.45h28.727a2.651 2.651 0 0 0 2.635-2.45l2.853-39.142a1 1 0 0 1 2 .146l-2.857 39.142a4.661 4.661 0 0 1 -4.631 4.304z"/><path d="m58.741 29.314h-43.184a3.072 3.072 0 0 1 -3.069-3.068v-4.468a3.072 3.072 0 0 1 3.069-3.068h43.184a3.071 3.071 0 0 1 3.068 3.068v4.468a3.071 3.071 0 0 1 -3.068 3.068zm-43.184-8.6a1.07 1.07 0 0 0 -1.069 1.068v4.468a1.071 1.071 0 0 0 1.069 1.068h43.184a1.07 1.07 0 0 0 1.068-1.068v-4.472a1.069 1.069 0 0 0 -1.068-1.068z"/><path d="m58 20.71h-41.7a1 1 0 0 1 -.944-1.329l5.035-14.464a4.6 4.6 0 0 1 4.338-3.084h24.839a4.6 4.6 0 0 1 4.339 3.084l5.034 14.464a1 1 0 0 1 -.941 1.329zm-40.289-2h38.879l-4.572-13.136a2.6 2.6 0 0 0 -2.45-1.741h-24.839a2.6 2.6 0 0 0 -2.449 1.741z"/><path d="m51.5 20.71h-28.7a1 1 0 0 1 -.944-1.329l3.314-9.515a2.294 2.294 0 0 1 2.165-1.538h19.627a2.293 2.293 0 0 1 2.165 1.538l3.312 9.515a1 1 0 0 1 -.939 1.329zm-27.285-2h25.873l-2.85-8.187a.292.292 0 0 0 -.276-.2h-19.627a.292.292 0 0 0 -.276.2z"/><path d="m27.345 52.7a1 1 0 0 1 -.977-.79 11.029 11.029 0 0 1 18.814-9.887 1 1 0 1 1 -1.457 1.37 8.943 8.943 0 0 0 -6.576-2.842 9.038 9.038 0 0 0 -9.028 9.028 9.133 9.133 0 0 0 .2 1.911 1 1 0 0 1 -.767 1.187.953.953 0 0 1 -.209.023z"/><path d="m37.149 60.6a11.072 11.072 0 0 1 -8.033-3.473 1 1 0 1 1 1.457-1.37 8.944 8.944 0 0 0 6.576 2.843 9.038 9.038 0 0 0 9.028-9.028 9.157 9.157 0 0 0 -.119-1.47 1 1 0 0 1 1.974-.321 11.19 11.19 0 0 1 .145 1.791 11.042 11.042 0 0 1 -11.028 11.028z"/><path d="m40.083 44.563a1 1 0 0 1 -.192-1.98l3.388-.668-.667-3.388a1 1 0 0 1 1.962-.387l.861 4.369a1 1 0 0 1 -.788 1.175l-4.37.86a.918.918 0 0 1 -.194.019z"/><path d="m30.7 61.814a1 1 0 0 1 -.98-.807l-.861-4.369a1 1 0 0 1 .787-1.175l4.37-.86a1 1 0 1 1 .387 1.961l-3.389.668.668 3.389a1 1 0 0 1 -.782 1.179.989.989 0 0 1 -.2.014z"/></svg>
      </v-row>

      <v-col class="wordcloud-col pa-0"> </v-col>
      <v-col class="label-text pa-0 pl-2" id="caption-name"> Captions: </v-col>
      <v-col class="text-col pa-0">
        <template>
          <DynamicScroller :items="text_list" 
          :min-item-size="54"
          class="scroller text-col-scroller" style="overflow-y: auto;">
            <template v-slot="{ item, index, active }">
              <DynamicScrollerItem
                :item="item"
                :active="active"
                :size-dependencies="[item.message,]"
                :data-index="index"
              >
                <div class="label-div" :id="item.id">
                  <svg :width="30+label.length*8.1" height="32" v-for="label in item.c" :key="label" style="margin: 3px; margin-top: 10px">
                    <rect class="background" rx="3.3333333333333335" ry="3.3333333333333335" x="0" y="0" height="32" :width="30+label.length*8.1" style="fill: rgb(235, 235, 243); fill-opacity: 1;"></rect>
                    <text class="node-name" text-anchor="start" x="15" y="16" font-size="18px" dy=".3em" style="opacity: 1;">{{ label }}</text>
                  </svg>
                </div>
              <div
                class="text-div" 
                :id="item.id"
                :style="{ 'background' : item.id == current_selected_id ? '#ddd' : '#fff'}"
                @click="onTextItemClick(item.id)"
              >
                <span v-for="(text, index) in item.message.split(' ')" :key="`${item.id}_${index}`"
                  :style="{ 'text-decoration' : focus_word && text == focus_word.text ? 'underline' : 'none' }"
                >
                  {{ text }}
                </span>
              </div>
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>
        </template>
      </v-col>
    </v-col>
  </v-row>
</template>


<script>
import { mapState, mapActions, mapMutations } from "vuex";
import * as d3 from "d3";
import * as Global from "../plugins/global";
import { wordcloud } from "../plugins/wordcloud.js";
//import TextItem from "../components/text_item"
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
// import Text_item from './text_item.vue';

export default {
  name: "CapText",
  data: () => ({
    current_selected_id: null,
    clean_flag: false
  }),
  components: {
    ///"text-item": TextItem,
    DynamicScroller: DynamicScroller,
    DynamicScrollerItem: DynamicScrollerItem
  },
  computed: {
    ...mapState(["selected_node", "words", "focus_word", "text_list"])
  },
  watch: {
    words() {
      d3.select(".loading-wordcloud-svg")
          .transition()
          .duration(1)
          .style("opacity", 0);
      Global.enable_global_interaction();
      console.log("triger words", this.focus_node);
      this.update_data();
      this.update_view();
    },
    focus_word() {
      console.log("triger focus word");
      this.$store.dispatch("fetch_text_by_word_and_cat_ids", {
        "text": this.focus_word.text,
        "cat_id": this.selected_node["node_ids"],
        "rules": this.$store.state.word_cloud_recycled
      });
    },
    text_list() {
      console.log("triger text list", this.text_list);
      // this.update_data();
      // this.update_view();
      this.adapt_wordcloud_height();
    },
  },
  methods: {
    ...mapActions(["fetch_text_by_word_and_cat_ids", 
      "fetch_single_image_detection_for_focus_text",
      "fetch_text_by_ids"]),
    ...mapMutations(["set_focus_word", "set_text_list", "set_words"]),
    onTextItemClick(id) {
      console.log("onTextItemClick", id);
      this.current_selected_id = id;
      this.fetch_single_image_detection_for_focus_text({
        image_id: id,
      });
    },
    clean(){
      this.clean_flag = true;
      this.set_text_list([]);
      this.set_words([]);
      d3.selectAll(".wordcloud-col").attr("style", null);

      this.wordcloud_svg
        .attr("height", this.fix_height);
    },
    update_data() {
      let words = Global.deepCopy(this.words);
      let removed_words = this.$store.state.word_cloud_recycled[this.selected_node.curr_full_name];
      if(removed_words!==undefined) {
        for(let word of removed_words) {
          let idx = words.findIndex(d => d.text===word);
          if(idx !== -1) words.splice(idx, 1);
        }
      }
      this.min_value = Math.min(...words.map((d) => d.value));
      this.max_value = Math.max(...words.map((d) => d.value));
      
      this.sizeScale = d3.scaleSqrt([this.min_value, this.max_value], 
        [0.0275 * this.wordcloud_width, 0.124 * this.wordcloud_width]);
      this.wordclouds = wordcloud()
        .size([this.wordcloud_width, this.wordcloud_height])
        .data(words)
        .padding(4)
        .font(this.fontFamily)
        .fontSize((d) => this.sizeScale(d.value))
        .start();
      // this.wordclouds.then(d => this.wordclouds = d);
    },
    update_view() {
      this.wordcloud_group
        .selectAll(".wordcloud")
        .transition()
        .duration(this.remove_ani)
        // .style("opacity", 0)
        .remove();
      this.e_words = this.wordcloud_group
        .selectAll(".wordcloud")
        .data(this.wordclouds, d=> d.text);
      // this.e_texts = this.text_group.selectAll("cap-text")
      //   .data(this.wordclouds); // for debug
      this.create();
      this.update();
      this.remove();
      this.adapt_wordcloud_height();
    },
    remove_word() {
        let that = this;
        let node = that.selected_node.curr_full_name;
        let removed_word = that.focus_word.text;
        console.log("click removed word", node, removed_word);
        if(that.$store.state.word_cloud_recycled[node]===undefined) {
          that.$store.state.word_cloud_recycled[node] = []
        }
        that.$store.state.word_cloud_recycled[node].push(removed_word);
        that.set_focus_word({text:that.focus_word.text});
        // re render
      that.update_data();
      that.update_view();
    },
    adapt_wordcloud_height() {
      if (this.clean_flag) {this.clean_flag=false; return;} 
      console.log("adapt_wordcloud_height");
      let bbox = this.wordcloud_group.node().getBBox();
      this.wordcloud_group
        .transition()
        .duration(this.update_ani)
        .attr('transform', `translate(${this.wordcloud_left_margin}, ${-bbox.y})`);
      this.wordcloud_svg
        .transition()
        .duration(this.update_ani)
        .attr('height', bbox.height);
      d3.selectAll('.wordcloud-col')
        .transition()
        .duration(this.update_ani)
        .style('height', `${bbox.height}px`);
      d3.selectAll('.text-col')
        .transition()
        .duration(this.update_ani)
        .style('height', `calc(100% - ${bbox.height + 120}px)`);
      bbox = this.text_container.node().getBoundingClientRect();
      d3.selectAll('.text-col-scroller')
        .transition()
        .duration(this.update_ani)
        .style('height', `${bbox.height}px`);
      // setTimeout(() => {
      //   // console.log("top", this.wordcloud_group.node().getBoundingClientRect().top, 
      //   //   this.wordcloud_group.node().getBoundingClientRect().height);
      //   d3.selectAll(".loading-wordcloud-svg")
      //     .style("top", (this.wordcloud_group.node().getBoundingClientRect().top + 
      //       this.wordcloud_group.node().getBoundingClientRect().height / 2) + "px");
      // }, that.create_ani + that.update_ani + that.remove_ani);
    },

    create() {
      this.wordcloud_create();
      this.text_create();
    },
    wordcloud_create() {
      let word_groups = this.e_words
        .enter()
        .append("g")
        .attr("class", "wordcloud")
        .attr("id", (d) => "id-" + d.text)
        .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")")
        .on("click", (ev, d) => {
          console.log("click word", ev, d);
          d3.selectAll(".wordcloud").style("text-decoration", "none");
          d3.select("#id-" + d.text).style("text-decoration", "underline");
          this.set_focus_word(d);
        });
      word_groups
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dx", (d) => d.dx)
        .attr("dy", (d) => d.dy)
        .attr("font-size", (d) => d.size)
        .style("font-family", (d) => d.font)
        .text((d) => d.text);
      word_groups
        .attr("opacity", 1)
        .transition()
        .duration(this.create_ani)
        .delay(this.remove_ani + this.update_ani)
        .attr("opacity", 1);

    },
    text_create() {},
    update() {
      this.wordcloud_update();
      this.text_update();
    },
    wordcloud_update() {
      this.e_words
        .transition()
        .duration(this.update_ani)
        .delay(this.remove_ani)
        .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");
      this.e_words
        .select("text")
        .transition()
        .duration(this.update_ani)
        .delay(this.remove_ani)
        .attr("dx", (d) => d.dx)
        .attr("dy", (d) => d.dy)
        .attr("font-size", (d) => d.size)
        .style("font-family", (d) => d.font)
        // .style("text-decoration", d => {
        //   console.log(this.focus_word, d.text, d.text === this.focus_word.text)
        //   return (this.focus_word) && d.text === this.focus_word.text ? 
        //   "underline": "none"
        // })
        .text((d) => d.text);
    },
    text_update() {},
    remove() {
      this.wordcloud_remove();
      this.text_remove();
    },
    wordcloud_remove() {
      // console.log("wordcloud remove");
      // this.wordcloud_group
      //   .selectAll(".wordcloud")
      //   .transition()
      //   .duration(this.remove_ani)
      //   .style("opacity", 0)
      //   .remove();
    },
    text_remove() {},
  },
  async mounted() {
    window.text = this;
    let wordcloud_container = d3.select(".wordcloud-col");
    let text_container = d3.select(".text-col");
    this.text_container = text_container;
    // console.log("container", container);
    // let bbox = container.node().getBoundingClientRect();
    // this.bbox_width = bbox.width;
    // this.bbox_height = bbox.height;
    // this.layout_width = this.bbox_width;
    // this.layout_height = this.bbox_height * 0.98;
    this.create_ani = Global.Animation / 4;
    this.update_ani = Global.Animation / 4;
    this.remove_ani = Global.Animation / 4;

    // wordcloud
    this.wordcloud_height = wordcloud_container
      .node()
      .getBoundingClientRect().height;
    this.wordcloud_box_width = wordcloud_container
      .node()
      .getBoundingClientRect().width;
    this.wordcloud_width = this.wordcloud_box_width * 0.8;
    this.wordcloud_left_margin = this.wordcloud_box_width * 0.1;
    this.fontFamily = "Arial";

    // text
    this.text_height = text_container.node().getBoundingClientRect().height;
    this.text_width = text_container.node().getBoundingClientRect().width;

    this.fix_height = this.wordcloud_height;

    // this.svg = container
    //   .append("svg")
    //   .attr("id", "text-svg")
    //   .attr("width", this.bbox_width)
    //   .attr("height", this.layout_height);
    this.wordcloud_svg = d3
      .select(".wordcloud-col")
      .append("svg")
      .attr("width", this.wordcloud_box_width)
      .attr("height", this.wordcloud_height);
    this.wordcloud_group = this.wordcloud_svg.append("g")
      .attr("id", "wordcloud-group")
      .attr("transform", "translate(" + 0 + ", " + 0 + ")");
    // this.text_group = this.svg.append("g")
    //   .attr("id", "text-group")
    //   .attr("transform", "translate(" + (0) + ", " + (this.wordcloud_height) + ")");
  },
};
</script>

<style>
.text-view {
  height: 57%;
}

.wordcloud-recyclebin {
  margin: 0px 50px 0 0;
  cursor: pointer;
}

.text-content {
  border: 0;
  height: calc(100% - 16px);
  margin: 10px;
    border-bottom: 1px solid #c1c1c1;

}

.label-div-btn {
  margin-left: 5px;
}

.wordcloud{
  cursor: default;
}

.wordcloud-col {
  height: 30%;
  /* border-bottom: 1px solid #888; */
}

.text-col {
  height: calc(70% - 120px);
}

.scroller {
  height: 100%;
}

.label-text {
  font-size: 20px;
  font-weight: 600;
}

#wordcloud-name{
  /* margin-top: 15px; */
    font-size: 18px;
    color: rgb(114, 114, 114);
    display: flex;
    align-items: center;
}

#selected-title{
  /* margin-top: 15px; */
    font-size: 18px;
    color: rgb(114, 114, 114);
}

#caption-name{
  margin-top: 15px;
    font-size: 18px;
    color: rgb(114, 114, 114);
}
.text-div{
  cursor: pointer;
  font-size: 16px;
  margin-left: 8px;
  margin-right: 8px;
  /*padding-top: 8px;*/
  padding-bottom: 8px;
  padding-left: 3px;
  border-bottom: 1px solid #ddd;
  word-break: break-all;

}
.text-div:hover {
  background: #ddd;
}

#selected-class-name{
  color: #428BCA;
  font-weight: 400;

}

.loading-wordcloud-svg{
  /* position: absolute;
    left: 85%;
    top: 15%; */
}
</style>