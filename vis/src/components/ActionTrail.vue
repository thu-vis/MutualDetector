<template>
  <v-row class="action-trail-view fill-width mr-0">
    <v-col cols="12" class="topname fill-width">
      Action Trail
    </v-col>
    <v-col cols="12" class="action-trail-content pa-0" id="action-trail">

    </v-col>
  </v-row>
</template>

<script>
  import Vue from 'vue'
  import {mapActions} from "vuex"
  import * as d3 from 'd3'
  export default {
    name: 'ActionTrail',
    data: () => ({
      key_data: {history: []},
      bbox_width: null,
      bbox_height: null,
      layout_width: null,
      layout_height: null,
      margin_horizonal: 5,
      max_height: null,
    }),
    computed:{
      get_history(){
        return this.$store.state.history;
      }
    },
    watch:{
      get_history(curval, oldval){
        // this.history = curval;
        Vue.set(this.key_data, "history", curval);
        console.log("history", this.key_data.history, oldval);
      }
    },
    methods:{
      ...mapActions([
        "fetch_history"
      ]),
      update_view(){
        let data = this.$store.state.history;
        console.log("mounted data in updated", data);
        self.svg.selectAll("svg")
        .data([1,1,2])
        .enter()
        .append("svg");
      }
    },
    async mounted() {
      window.action_trail = this;
      let container = d3.select(".action-trail-content");
      // console.log("container", container);
      let bbox = container.node().getBoundingClientRect();
      self.bbox_width = bbox.width;
      self.bbox_height = bbox.height;
      self.layout_width = self.bbox_width - self.margin_horizonal * 2;
      self.layout_height = self.bbox_height * 0.98;
      self.svg = container.append("svg")
        .attr("id", "action-trail-svg")
        .attr("width", self.bbox_width)
        .attr("height", self.layout_height);
      
      // await this.$store.dispatch("fetch_history", 1);
      // this.update_view();
    },
    // async updated() {
    //   // let data = this.$store.state.history;
    //   console.log("mounted data in updated");
    // }
  }
</script>

<style scoped>
  .action-trail-content {
      border: 1px solid #c1c1c1;
      border-radius: 5px;
      height: calc(100% - 32px);
      margin-bottom: 10px;
  }
</style>