import * as d3 from "d3";
import * as Global from "./global";
import { exit_type } from "./layout_text";
import {tree_process} from "../plugins/tree_data_helper"

const TextTree = function(parent) {
  let that = this;
  that.parent = parent;

  that.tree_node_group = that.parent.tree_node_group;
  that.rest_node_group = that.parent.rest_node_group;

  // text position
  that.text_height = that.parent.text_height;

  // node width
  that.max_text_width = that.parent.max_text_width;

  // detection result layout
  that.layout_width = that.parent.layout_width;
  that.layout_height = that.parent.layout_height;
  that.node_width = that.parent.node_width;
  that.layer_height = that.parent.layer_height;

  // bar size
  that.bar_width = that.parent.bar_width;
  that.bar_height = that.parent.bar_height;
  that.rounded_r = that.parent.rounded_r;

  that.editing_state = false;
  that.merge_action = null;
  that.target_node = null;
  that.focus_node_for_edit = null;
  that.highlight_fixed = false;

  that.parent.svg.select("defs").remove();
  that.defs = that.parent.svg
    .append("defs");
  that.defs
    .append("pattern")
    .attr("id", "edit-svg-icon")
    .attr("viewBox", "0 0 20 20")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("svg")
    .attr("viewBox", "0 0 1024 1024")
    .attr("width", "20px")
    .attr("height", "20px")
    .append("path")
    .attr(
      "d",
      "M800 128.992c-24.512 0-48.512 9.504-67.008 28L416 472.992l-7.008 7.008-1.984 10.016-22.016 112-9.984 46.976 47.008-9.984 112-22.016 9.984-1.984 7.008-7.008 316-316.992A94.976 94.976 0 0 0 800 128.96z m0 62.016c7.488 0 14.88 3.84 22.016 10.976 14.24 14.272 14.24 29.76 0 44L512 556.032l-55.008 11.008 11.008-55.008 310.016-310.016c7.104-7.104 14.496-10.976 21.984-10.976zM128 256v640h640V473.984l-64 64V832H192V320h294.016l64-64z"
    )
    .style("fill", "rgb(114,114,114)");

    that.radialGradient = that.defs
        .append("radialGradient")
        .attr("id", "button-gradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "40%")
        .attr("fx", "50%")
        .attr("fy", "50%");
    that.radialGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-opacity", 0.5)
        .style("stop-color", "lightgrey");
    that.radialGradient.append("stop")
        .attr("offset", "100%")
        .style("stop-opacity", 1)
        .style("stop-color", "darkgrey");

  that.panel_info = [
    { x: -1, y: -1, name: "absorb" },
    { x: 0, y: -1, name: "join" },
    { x: -1, y: 0, name: "collapse" },
    { x: 0, y: 0, name: "cancel" },
  ];

  that.textClickHandler = function(evt) {
    that.highlight_fixed = true;
    window.d3 = d3;
    // if (document.querySelector("#overlay") !== null) return; // kludgy singleton approach
    that.text_element = d3.select(evt.target.parentElement).select("text");
    that.selected_input_data = that.text_element.data()[0];
    let bbox = that.text_element.node().getBoundingClientRect();
    const value = that.selected_input_data.full_name;
    let wrapper = d3
      .select("#wrapper")
      .append("div")
      .attr("id", "overlay")
      // .style("top", (that.parent.tree_node_group_y + that.selected_input_data.y + 6) + "px")
      // .style("left", (that.parent.tree_node_group_x + that.selected_input_data.x + that.layer_height / 2 + 12) + "px")
      .style("top", bbox.top + "px")
      .style("left", bbox.left + "px")
      .append("div")
      .attr("id", "obg")
      .style("display", "flex");
    // wrapper.append("span")
    //     .attr("id", "edit-title")
    //     .text("Edit node name");
    that.input = wrapper
      .append("input")
      .attr("id", "edit-input")
      .attr("type", "text")
      .attr("text-align", "middle")
      // .attr("data-src", data.id)
      // .attr("data-maxtextwidth", value.length)
      .style("max-width", that.get_text_length(value) + 20 + "px")
      .attr("value", value);
  };

  that.parent.svg.on("click", () => {
    that.highlight_fixed = false;
    that.dehighlight();
    if (that.input === undefined) return;
    that.selected_input_data.name = that.input.node().value;
    that.selected_input_data.full_name = that.selected_input_data.name;
    let text = that.wrap(that.selected_input_data.name);
    if (text.length !== that.selected_input_data.name.length) {
      that.selected_input_data.name = text + "...";
    }
    console.log(
      "edited name",
      that.selected_input_data.full_name,
      that.selected_input_data.id
    );
    that.parent.set_name_edit_history({
      id: that.selected_input_data.id,
      name: that.selected_input_data.full_name,
    });
    d3.select(".tree-node#id-" + that.selected_input_data.id)
      .select("text")
      .text(that.selected_input_data.name);
    d3.select(".tree-node#id-" + that.selected_input_data.id)
      .select("title")
      .text(that.selected_input_data.full_name);
    d3.select("#overlay").remove();
    that.input = undefined;
  });

  that.change_selected_flag = function(d, flag) {
    console.log("change selected flag", d.selected_flag, flag);
    that.create_ani = 0;
    that.remove_ani = 0;
    that.update_ani /= 2;
    d.selected_flag = flag;
    that.parent.set_selected_flag(that.parent.tree);
    console.log("change selected flag after", d.selected_flag, flag);
  };

  that.set_animation_time = function() {
    // animation
    that.create_ani = that.parent.create_ani;
    that.update_ani = that.parent.update_ani;
    that.remove_ani = that.parent.remove_ani;
  };
  that.set_animation_time();

  that.set_focus_node = function(nodes) {
    that.parent.set_focus_node(nodes);
  };

  that.fetch_word = function() {
    that.parent.$store.dispatch("fetch_word");
  };

  that.fetch_image = function() {
    that.parent.$store.dispatch("fetch_image");
  };

  that.set_selected_node = function(node) {
    that.parent.set_selected_node(node);
  };

  that.sub_component_update = function(nodes, rest_nodes) {
    // update state
    that.tree_node_group_x = that.parent.tree_node_group_x;
    that.tree_node_group_y = that.parent.tree_node_group_y;
    that.expand_tree = that.parent.expand_tree;

    that.get_text_length = function(text) {
      let self = that.tree_node_group
        .append("text")
        .attr("id", "temp")
        .attr("class", "node-name")
        .attr("text-anchor", "start")
        .attr("font-size", "18px");
      self.text(text);
      let textLength = self.node().getComputedTextLength();
      that.tree_node_group.select("#temp").remove();
      return textLength;
    };

    (that.wrap = function(text) {
      let self = that.tree_node_group
        .append("text")
        .attr("id", "temp")
        .attr("class", "node-name")
        .attr("text-anchor", "start")
        .attr("font-size", "18px");
      self.text(text);
      let textLength = self.node().getComputedTextLength();
      if (textLength < that.max_text_width - 30 - 5) {
        that.tree_node_group.select("#temp").remove();
        return text;
      }
      self.text(text + "...");
      textLength = self.node().getComputedTextLength();
      // console.log("wrap text", text);
      while (textLength > that.max_text_width - 30 - 2 * 5 && text.length > 0) {
        text = text.slice(0, -1);
        self.text(text + "...");
        textLength = self.node().getComputedTextLength();
      }
      that.tree_node_group.select("#temp").remove();
      return text;
    }),
      (that.node_wrap = function(node) {
        let text = node.full_name;
        text = that.wrap(text);
        if (text.length === node.full_name.length) {
          node.name = text;
        } else {
          node.name = text + "...";
        }
      });
    nodes.forEach(that.node_wrap);

    // update view
    that.e_nodes = that.tree_node_group
      .selectAll(".tree-node")
      .data(nodes, (d) => d.id);

    that.e_rest_nodes = that.rest_node_group
      .selectAll(".rest-tree-node")
      .data(rest_nodes, (d) => d.id);

    that.create();
    that.update();
    that.remove();

    // that.tree_node_group
    //     .selectAll(".tree-node").select("text").each(that.wrap); // dirty manner

    that.set_animation_time();
  };

  that.create = function() {
    that.node_create();
    that.rest_node_create();
  };

  that.node_create = function() {
    let dragstarted = function() {
      that.highlight_fixed = true;
      let tag = d3.select(this).node().parentElement;
      tag = d3.select(tag);
      console.log("drag start", tag);
      that.timer = setTimeout(function(){
        that.focus_node_for_edit = tag.data()[0];
        that.tree_node_group
          .append("rect")
          .attr("id", "dragnode")
          .attr("rx", that.layer_height / 12)
          .attr("ry", that.layer_height / 12)
          .attr("x", tag.data()[0].x + that.layer_height / 4)
          .attr("y", tag.data()[0].y + (-that.layer_height * 0.8) / 2)
          .attr("height", that.layer_height * 0.8)
          .attr("width", () => {
            return that.max_text_width;
          })
          .style("pointer-events", "none")
          .style("stroke", "black")
          .style("fill", "white")
          .style("opacity", 0.5);
      }, 1)
    };

    let dragged = function(event) {
      that.editing_state = true;
      // d3.select(this)
      //     .attr("transform",
      //     "translate(" + event.x + ", " + event.y + ")");
      that.tree_node_group
        .select("#dragnode")
        .attr("x", event.x + that.layer_height / 4)
        .attr("y", event.y - that.layer_height * 0.4);
     that.tree_node_group
        .select("#merge-panel-g")
        .attr("transform",  "translate(" + (event.x + that.layer_height / 4 + that.max_text_width  + 5) 
        + ", " + (event.y - that.layer_height * 0.4 + that.layer_height * 0.8) + ")");
    };

    let dragended = function() {
      console.log("drag end");
      that.highlight_fixed = false;
      that.dehighlight();

      if (that.merge_action){
        if (that.merge_action === "join"){
          console.log("join");
        }
        else if (that.merge_action === "absorb"){
          console.log("absorb");
          let focus_node_parent = that.focus_node_for_edit.parent;
          that.focus_node_parent = focus_node_parent;
          let children_ids = focus_node_parent.all_children.map(d => d.id);
          let idx = children_ids.indexOf(that.focus_node_for_edit.id);
          focus_node_parent.all_children.splice(idx, 1);
          that.target_node.all_children.push(that.focus_node_for_edit);
          that.focus_node_for_edit.parent = that.target_node;
          that.focus_node_for_edit.depth = that.focus_node_for_edit.parent.depth + 1;
          console.log(that.focus_node_for_edit.name);
          console.log(that.target_node.name, that.target_node.all_children.map(d => d.name));
          console.log(focus_node_parent.name, focus_node_parent.all_children.map(d => d.name));
          tree_process(that.parent.tree);
          that.set_focus_node([that.focus_node_for_edit]);
        }
        else if (that.merge_action === "collapse"){
          console.log("collapse");
        }
    }

      that.editing_state = false;
      that.tree_node_group.select("#dragnode").remove();
      that.tree_node_group.selectAll("#merge-panel-g").remove();
      that.focus_node_for_edit = null;
      that.target_node = null;
      that.merge_action = null;
    };

    let drag = d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    // node circle
    let node_groups = that.e_nodes
      .enter()
      .append("g")
      .attr("class", "tree-node")
      .attr("id", (d) => "id-" + d.id)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");
    node_groups
      .transition()
      .duration(that.create_ani)
      .delay(that.remove_ani + that.update_ani)
      .style("opacity", 1);
    node_groups
      .append("title")
      .style("font-size", "0.835vw")
      .text((d) => d.full_name);
    node_groups
      .append("rect")
      .attr("class", "background")
      .attr("rx", that.layer_height / 12)
      .attr("ry", that.layer_height / 12)
      .attr("x", that.layer_height / 4)
      .attr("y", (-that.layer_height * 0.8) / 2)
      .attr("height", that.layer_height * 0.8)
      .attr("width", () => {
        return that.max_text_width;
      })
      // TODO:
      // .style("fill", d => d.selected_flag ? Global.DarkGray : "#EBEBF3")
      .style("fill", "#EBEBF3")
      .style("fill-opacity", 0)
      .call(drag)
      .on("mouseover", (ev) => {
        let element = d3.select(ev.toElement).node().parentElement;
        // element = d3.select(element);
        that.highlight(ev);
        if (that.editing_state) {
          console.log("dragged hover");
          if (!that.target_node){
              that.target_node = d3.select(ev.toElement).data()[0];
          }
          else{
            console.log("treggle ", that.target_node.id, element.id);
              if (that.target_node.id != element.id){
                console.log("treggle differnt target node");
                that.tree_node_group.selectAll("#merge-panel-g").remove();
                that.target_node = d3.select(ev.toElement).data()[0];
              }
          }
          that.PanelWidth = 40;
          that.PanelHeight = 40;
          that.ImageMargin = that.PanelWidth * 0.12;
          that.PanelMargin = 0;
          that.PanelOffset = 1;
          if (that.tree_node_group.selectAll("#merge-panel-g").node()) return;
          let is_leaf = d3.select(ev.toElement).data()[0].all_children.length == 0;
          console.log("is leaf", is_leaf);
          let panel = that.tree_node_group
            .append("g")
            .attr("id", "merge-panel-g")
            .attr("transform",  "translate(" + 0 + ", " + 0 + ")");
          panel
            .append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "start")
            .attr("font-size", "18px")
            .text("move to")
            .attr("display",  is_leaf ? "none":"block");
          panel.append("image")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", 10)
            .attr("xlink:href", that.parent.server_url + "/icon/" + "forbid")
            .attr("display", is_leaf ? "block":"none");
          if (!is_leaf){
              that.merge_action = "absorb";
          }
          else{
              that.merge_action = null;
          }
        
        }
      })
      .on("mouseout", () => {
        // that.hideTooltip();
        that.dehighlight();
        if (that.editing_state){
          console.log("that.merge_action", that.merge_action);
          setTimeout(() =>{
            if (!that.merge_action) {
                that.tree_node_group.select("#merge-panel-g").remove();
                that.target_node = null;
            }
          }, 2);
        }
      })
      .on("click", (ev, d) => {
        console.log("on click tree node");
        // that.change_selected_flag(d, !d.selected_flag);
        if (d.all_children.length && d.all_children.length > 0){
          that.set_focus_node([d]);
          return;
        }
        // TODO: double click
        let node = {
          full_name: d.full_name,
          id: d.id,
        };
        that.set_selected_node(node);

        d3.select(".loading-wordcloud-svg")
          .transition()
          .duration(1)
          .style("opacity", 1);
        Global.disable_global_interaction();
        that.fetch_word();
        that.fetch_image();
      })
      .transition()
      .duration(that.create_ani)
      .delay(that.remove_ani + that.update_ani)
      .style("fill-opacity", 1);

    // precision and recall
    let bars = node_groups
      .append("g")
      .attr("class", "node-bars")
      .style("pointer-events", "none")
      .attr(
        "transform",
        () =>
          "translate(" +
          (that.max_text_width - 15) +
          ", " +
          -(that.bar_height - that.rounded_r) / 2 +
          ")"
      );
    let individual_bar = bars
      .selectAll("g.bar")
      .data((d) => {
        let precision = {
          value: d.data.precision,
          color: "#c982ce",
          type: "precision",
        };
        let recall = {
          value: d.data.recall,
          color: "#4fa7ff",
          type: "recall",
        };
        return [precision, recall];
      })
      .enter()
      .append("g")
      .attr("class", "bar")
      .attr(
        "transform",
        (_, i) => "translate(" + i * (that.bar_width + 3) + ", " + 0 + ")"
      );
    individual_bar
      .append("rect")
      .attr("class", "bar-background")
      .attr("rx", that.rounded_r)
      .attr("ry", that.rounded_r)
      .attr("width", that.bar_width)
      .attr("height", that.bar_height)
      .style("fill", "none")
      .style("stroke", (d) => d.color)
      .style("stroke-width", 1);

    individual_bar
      .append("rect")
      .attr("class", (d) => "bar-value bar-" + d.type)
      .attr("rx", that.rounded_r)
      .attr("ry", that.rounded_r)
      .attr("width", that.bar_width)
      .attr("height", that.bar_height)
      .style("fill", (d) => d.color)
      .style("clip-path", (d) => {
        return `inset(${(1 - d.value) *
          that.bar_height}px ${0}px ${0}px ${0}px)`;
      });
    bars
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.remove_ani + that.update_ani)
      .style("opacity", 1);

    // edit icon
    node_groups
      .append("rect")
      .attr("class", "edit-icon")
      .attr("width", "15px")
      .attr("height", "15px")
      .attr("fill", "url(#edit-svg-icon)")
      .attr("x", that.layer_height / 4 + that.max_text_width - 1)
      .attr("y", (-that.layer_height * 0.8) / 2 - 2)
      .style("opacity", 0)
      .on("click", (ev) => {
        that.textClickHandler(ev);
        ev.stopPropagation();
      })
      .on("mouseover", (ev) => {
        that.highlight(ev);
      })
      .on("mouseout", () => {
        // that.hideTooltip();
        that.dehighlight();
      });

    node_groups
      .append("path")
      .attr("class", (d) => "icon icon-" + d.type)
      .attr("d", function(d) {
        return Global.node_icon(0, 0, d.type);
      })
      .style("fill", Global.GrayColor)
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", () => (that.expand_tree ? 1 : 0));

    node_groups
      .append("rect")
      .attr("class", (d) => "icon-background icon-bg-" + d.type)
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16)
      .style("fill", "white")
      .style("opacity", 0)
      .on("mouseover", (ev, d) => {
        that.icon_highlight(ev, d);
      })
      .on("mouseout", (ev, d) => {
        that.icon_dehighlight(ev, d);
      })
      .on("click", (ev, d) => {
        console.log("click icon", d.type, d);
        if (!that.expand_tree) return;
        // if (d.type > 0) return;
        console.log("click tree node", d.name);
        // that.highlight(ev, d, "rgb(211, 211, 229)");
        that.set_focus_node([d]);
      });

    // node name
    node_groups
      .append("text")
      .attr("class", "node-name")
      .text((d) => {
        return d.name;
      })
      .attr("text-anchor", "start")
      .attr("x", that.layer_height / 2 - 2)
      .attr("font-size", "18px")
      .style("fill", Global.DeepGray)
      .attr("dy", ".3em")
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", 1);
    // node_groups.append("foreignObject")
    //     .attr("x", that.layer_height / 2)
    //     .attr("y", -10)
    //     .attr("width", ( (that.max_text_width - 30) - 2 * 5))
    //     .attr("height", 20)
    //     .append("div")
    //     .append("input")
    //     .attr("value", d => d.name);

    // node link
    node_groups
      .append("path")
      .attr("class", "node-link")
      .attr("d", (d) => {
        return (
          "M" +
          d.link_x +
          ", " +
          d.link_top +
          " L " +
          d.link_x +
          ", " +
          d.link_bottom
        );
      })
      .style("stroke", Global.GrayColor)
      .style("stroke-width", 0.5)
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", 1);
  };

  that.rest_node_create = function() {
    let node_groups = that.e_rest_nodes
      .enter()
      .append("g")
      .attr("class", "rest-tree-node")
      .attr("id", (d) => "id-" + d.id)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")")
      .style("opacity", 0)
      .on("click", (ev, d) => {
        console.log("set focus node");
        that.set_focus_node(d.rest_children);
      });
    node_groups
      .append("path")
      .attr("class", "icon")
      .attr("d", Global.node_icon(0, 0, 0))
      .attr("fill", Global.GrayColor);
    node_groups
      .selectAll("rest-node-rect")
      .data((d) => {
        console.log("rest node groups data", d);
        return d.rest_children;
      })
      .enter()
      .append("rect")
      .attr("class", "rest-node-rect")
      .attr("rx", that.layer_height / 12)
      .attr("ry", that.layer_height / 12)
      .attr("x", (d) => that.layer_height / 4 + d.x_delta)
      .attr("y", (d) => d.y_delta)
      .attr("height", that.layer_height * 0.6)
      .attr("width", () => {
        return that.max_text_width;
      })
      .style("fill", (d) =>
        d.last_rest_children ? "#EBEBF3" : "rgb(211, 211, 229)"
      )
      .style("stroke", "white")
      .style("stroke-width", 1);
    node_groups
      .transition()
      .duration((d) => {
        if (d.prev_vis) {
          // return that.remove_ani * 0.5;
          return that.create_ani;
        } else {
          return that.create_ani;
        }
      })
      .delay((d) => {
        if (d.prev_vis) {
          // return that.remove_ani * 0.5 + that.remove_ani;
          return that.remove_ani + that.update_ani;
        } else {
          return that.remove_ani + that.update_ani;
        }
      })
      .style("opacity", 1);
  };

  that.update = function() {
    that.node_update();
    that.rest_node_update();
  };

  that.node_update = function() {
    that.tree_node_group
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("transform", () => {
        return (
          "translate(" +
          that.tree_node_group_x +
          ", " +
          that.tree_node_group_y +
          ")"
        );
      });
    that.e_nodes
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");
    that.e_nodes
      .select("rect.background")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("x", that.layer_height / 4)
      .attr("y", (-that.layer_height * 0.8) / 2)
      .attr("height", that.layer_height * 0.8)
      .attr("width", () => {
        // return Global.getTextWidth(d.data.name, "16px Roboto, sans-serif") + that.layer_height / 2;
        return that.max_text_width;
      })
      .style("fill", (d) => (d.selected_flag ? Global.DarkGray : "#EBEBF3"));

    if (that.focus_node) {
      that.tree_node_group
        .select("#id-" + that.focus_node[0].id)
        .select("rect.background")
        .transition()
        .duration(that.create_ani)
        .delay(that.remove_ani + that.update_ani + that.create_ani)
        .style("fill", "#EBEBF3");
    }

    that.e_nodes
      .select("path.icon")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("d", function(d) {
        return Global.node_icon(0, 0, d.type);
      })
      .style("opacity", () => (that.expand_tree ? 1 : 0))
      .style("fill", Global.GrayColor);
    that.e_nodes
      .select("rect.icon-background")
      .attr("class", (d) => "icon-background icon-bg-" + d.type);

    // that.e_nodes
    //     .select("text")
    //     .transition()
    //     .duration(that.update_ani)
    //     .delay(that.remove_ani)
    //     .text((d) => d.name)
    //     .style("opacity", 1);

    that.e_nodes
      .select("path.node-link")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("d", (d) => {
        return (
          "M" +
          d.link_x +
          ", " +
          d.link_top +
          " L " +
          d.link_x +
          ", " +
          d.link_bottom
        );
      });

    that.e_nodes
      .select("g.node-bars")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .style("pointer-event", "none")
      .attr(
        "transform",
        () =>
          "translate(" +
          (that.max_text_width - 15) +
          ", " +
          -(that.bar_height - that.rounded_r) / 2 +
          ")"
      );
    that.e_nodes
      .select("g.node-bars")
      .selectAll("g.bar")
      .data((d) => {
        let precision = {
          value: d.data.precision,
          color: "#c982ce",
          type: "precision",
        };
        let recall = {
          value: d.data.recall,
          color: "#4fa7ff",
          type: "recall",
        };
        return [precision, recall];
      })
      .attr(
        "transform",
        (_, i) => "translate(" + i * (that.bar_width + 3) + ", " + 0 + ")"
      )
      .selectAll(".bar-value")
      .style("clip-path", (d) => {
        return `inset(${(1 - d.value) *
          that.bar_height}px ${0}px ${0}px ${0}px)`;
      });
  };

  that.rest_node_update = function() {
    that.rest_node_group
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("transform", () => {
        let x = that.layer_height / 2;
        if (!that.expand_tree) {
          x = 0;
        }
        return (
          "translate(" +
          x +
          ", " +
          (that.text_height + that.layer_height / 2) +
          ")"
        );
      });
    that.e_rest_nodes
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");
    that.e_rest_nodes
      .selectAll("rest-node-rect")
      .attr("y", (d, i) => (-that.layer_height * 0.8) / 2 + i * 10)
      .attr("width", () => {
        return that.max_text_width;
      });
  };

  that.remove = function() {
    that.node_remove();
    that.rest_node_remove();
  };

  that.node_remove = function() {
    that.e_nodes.exit().attr("", (d) => {
      let [type, translate] = exit_type(d);
      d.exit_type = type;
      d.translate = translate;
      d.exit_duration = d.exit_type > 1 ? that.update_ani : that.remove_ani;
      d.exit_delay = d.exit_type > 1 ? that.remove_ani : 0;
    });
    that.e_nodes
      .exit()
      .transition()
      .duration((d) => d.exit_duration)
      .delay((d) => d.exit_delay)
      .attr("transform", (d) => d.translate + " scale(1, 0)")
      .style("opacity", 0)
      .remove();
  };

  that.rest_node_remove = function() {
    that.e_rest_nodes.exit().attr("", (d) => {
      let [type, translate] = exit_type(d.parent);
      d.exit_type = type;
      d.translate = translate;
      d.exit_duration = d.exit_type > 1 ? that.update_ani : that.remove_ani;
      d.exit_delay = d.exit_type > 1 ? that.remove_ani : 0;
      console.log(
        "rest_node_remove",
        d.exit_type,
        d.exit_duration,
        d.exit_delay,
        d.translate
      );
    });
    that.e_rest_nodes
      .exit()
      .transition()
      .duration((d) => d.exit_duration)
      .delay((d) => d.exit_delay)
      .attr("transform", (d) => d.translate + " scale(1, 0)")
      .style("opacity", 0)
      .remove();
  };

  // that.highlight = function(ev, d, color) {
  that.highlight = function(ev, color) {
    // console.log("highlight in tree");
    if (that.highlight_fixed) return;
    let self = d3.select(ev.target.parentElement);
    let d = self.data()[0];
    self.selectAll(".edit-icon").style("opacity", 1);
    // color = color || "rgb(219, 219, 233)";
    color = color || "#ffa953";
    that.tree_node_group
      .select("#id-" + d.id)
      .select("rect.background")
      // .style("fill", color);
      .style('stroke', color)
      .style("stroke-width", 2);
    if (Global.linked_highlight) that.connection_highlight(d);
  };

  // that.dehighlight = function(ev, d) {
  that.dehighlight = function() {
    if (that.highlight_fixed) return;
    // let self = d3.select(ev.target.parentElement);
    // let d = self.data()[0];
    that.tree_node_group
      .selectAll(".tree-node")
      .selectAll(".edit-icon")
      .style("opacity", 0);
    that.tree_node_group
      .selectAll(".tree-node")
      .select("rect.background")
      // .style("fill", "#EBEBF3");
      .style("stroke", "");
    for (let i = 0; i < that.parent.selected_node.node_ids.length; i++){
      let id = that.parent.selected_node.node_ids[i];
      d3.selectAll(`#id-${id}`)
          .selectAll(".background").style('stroke', "#ffa953")
          .style("stroke-width", 2);
    }
    if (Global.linked_highlight) that.connection_dehilight();
  };

  that.connection_highlight = function(node) {
    that.parent.connection_view.highlight_by_node(node);
  };

  that.connection_dehilight = function() {
    that.parent.connection_view.dehighlight();
  };

  that.icon_highlight = function(ev, d) {
    console.log("icon-highlight");
    // if (d.type > 0) return;
    that.tree_node_group
      .select("#id-" + d.id)
      .select("path.icon")
      .style("fill", "#1f1f1f");
  };

  that.icon_dehighlight = function(ev, d) {
    that.tree_node_group
      .select("#id-" + d.id)
      .select("path.icon")
      .style("fill", Global.GrayColor);
  };

  that.clean = function() {
    that.tree_node_group.selectAll(".tree-node").remove();
    that.rest_node_group.selectAll(".rest-tree-node").remove();
    // clean selected state
    for (let i = 0; i < that.parent.selected_node.node_ids.length; i++) {
      let tmp_node = {
        full_name: that.parent.selected_node.nodes[i].full_name,
        id: that.parent.selected_node.node_ids[i],
      };
      that.set_selected_node(tmp_node);
    }
  };
};

export default TextTree;
