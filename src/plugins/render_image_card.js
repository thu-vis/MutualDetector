import * as Global from "../plugins/global";
import * as d3 from "d3";

const ImageCards = function(parent) {
  let that = this;
  that.parent = parent;
  that.server_url = that.parent.server_url;

  that.set_group = that.parent.set_group;
  that.grid_group = that.parent.grid_group;
  that.drag_grid_group = that.parent.drag_grid_group;
  that.label_group = that.parent.label_group;
  that.nav_group = that.parent.nav_group;

  that.nav_gray = "#8f8f8f";
  that.nav_offset_x = 800;
  that.nav_offset_y = 18;
  that.nav_margin = 50;
  that.nav_group.attr(
    "transform",
    "translate(" + that.nav_offset_x + ", " + that.nav_offset_y + ")"
  );
  that.nav_group
    .append("rect")
    .attr("class", "nav-rect")
    .attr("width", 5)
    .attr("height", 0)
    .attr("x", -2.5)
    .attr("fill", Global.GrayColor);

  // animation
  that.create_ani = that.parent.create_ani;
  that.update_ani = that.parent.update_ani;
  that.remove_ani = that.parent.remove_ani;

  // let match_color = "#D3D3E5";
  // let mismatch_color = "#ED2939";
  let match_color = "#D3D3E5";
  let mismatch_color = "#E05246";

  that.image_margin_percent = 0.9;
  that.selected_image_idx = null;
  //
  that.boundingbox_width = 12;

  // let labels = Array(); // Label layout
  let img_width = 80;

  let margin_size = 20;
  // let margin_top_size = 100;
  let plot_width = 800;
  let plot_height = 800;
  var offset_x = 0; // position of the left grid when the mode is "juxtaposition"
  var offset_y = 100;

  let grid_margin = 0.5 * 2;

  this.focus_grid_for_edit = null;
  this.target_grid_image = null;

  let mouse_pressed = false;
  let mouse_pos = {
    x: -1,
    y: -1,
  };

  that.relative_sampling_area = {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  };
  let plot_x,
    plot_y = 1;
  that.click_ids = [];
  that.click_count = 0;
  that.labels = [];
  that.use_label_layout = false;

  this.get_set_layout_from_parent = function() {
    // set
    that.layout_height = that.parent.layout_height;
    that.set_height = that.parent.set_height;
    that.set_left = that.parent.set_left;
    that.set_width = that.parent.set_width;
    that.set_margin = that.parent.set_margin;
    that.image_height = that.parent.image_height;
    that.image_margin = that.parent.image_margin;
    that.text_height = that.parent.text_height;
    that.top_image_margin = that.parent.top_image_margin;
  };
  this.get_set_layout_from_parent();

  (this.set_focus_image = function(image) {
    that.parent.set_focus_image(image);
  }),
    (this.set_expand_set_id = function(id) {
      that.parent.set_expand_set_id(id);
    });

  this.set_grid_layout_data = function(data) {
    that.parent.set_grid_layout_data(data);
  };

  that.set_animation_time = function() {
    // animation
    that.create_ani = that.parent.create_ani;
    that.update_ani = that.parent.update_ani;
    that.remove_ani = that.parent.remove_ani;
  };
  this.get_expand_set_id = function() {
    return that.parent.expand_set_id;
  };

  this.get_grid_data = function() {
    return that.parent.grid_data;
  };

  this.get_grid_image_info = function() {
    return that.parent.grid_image_info;
  };

  this.get_nav_id = function() {
    return that.parent.nav_id;
  };

  this.visible = function(d) {
    if (that.get_expand_set_id() === -1) {
      if (d.collapse === 1) {
        return 0;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  };

  this.fetch_grid_layout = function(query) {
    return that.parent.fetch_grid_layout(query);
  };

  this.sub_component_update = function(
    sets,
    vis_image_per_cluster,
    grids,
    grids_pos
  ) {
    // update layout config
    that.get_set_layout_from_parent();

    // update state
    that.vis_image_per_cluster = vis_image_per_cluster;
    sets.forEach((d) => {
      that.vis_image_per_cluster[d.id].forEach((n) => {
        n.collapse = d.collapse;
      });
    });
    that.grids = grids;
    offset_x = grids_pos.offset_x;
    offset_y = grids_pos.offset_y;
    plot_width = grids_pos.side_length;
    plot_height = grids_pos.side_length;
    Object.values(that.vis_image_per_cluster).forEach((d) => {
      // let x = that.image_margin;
      d.forEach((n, i) => {
        n.vis_h = that.image_height;
        n.vis_w = that.image_height;
        n.x = that.parent.x_position(i) + that.image_margin;
        // n.inner_margin = that.image_height * that.image_margin_percent / 2;
        // x = x + n.vis_w + that.image_margin;
      });
    });
    that.labels = that.label_layout(
      Global.deepCopy(that.grids),
      plot_width,
      that.labels
    );
    // let grid_image_info = that.get_grid_image_info();
    // that.labels.forEach(d => {
    //   let info = grid_image_info.find(info => info.idx === d.img_id);
    //   d.d = info.d;
    // })

    that.use_label_layout = that.labels.length ? 1 : 0;
    if (that.get_expand_set_id() < 0) {
      that.click_ids = [];
    } else {
      that.click_ids.push({
        id: that.get_nav_id(),
        layout: Global.deepCopy(grids),
      });
      that.click_ids.forEach((d, i) => {
        // d.x = i * that.nav_margin;
        // d.y = 0;
        d.x = 0;
        d.y = i * that.nav_margin;
        d.last_one = i === that.click_ids.length - 1 ? true : false;
      });
    }
    console.log("image card sub component update", sets, grids);

    // update view
    that.e_sets = that.set_group.selectAll(".set").data(sets, (d) => d.id);
    that.e_grids = that.grid_group
      .selectAll(".grid")
      .data(grids, (d) => d.img_id);
    that.e_labels = that.label_group
      .selectAll(".label")
      .data(that.labels, (d) => d.img_id);
    that.e_navs = that.nav_group
      .selectAll(".nav-circle")
      .data(that.click_ids, (d) => d.id);

    that.remove();
    that.update();
    that.create();
    that.set_animation_time();
  };

  this.create = function() {
    that.set_create();
    that.grid_create();
    that.label_create();
    that.nav_create();
  };

  this.set_create = function() {
    // set
    let set_groups = that.e_sets
      .enter()
      .append("g")
      .attr("class", "set")
      .attr("id", (d) => "set-" + d.id)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");
    set_groups
      .style("opacity", 0)
      .on("mouseover", function(ev) {
        if (that.get_expand_set_id() === -1) that.box_highlight(ev);
      })
      .on("mouseout", function() {
        that.box_dehighlight();
      })
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", 1);

    // expand icon
    set_groups
      .append("rect")
      .attr("class", "expand-rect")
      .attr("x", -11)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", 10)
      .style("rx", 3)
      .style("ry", 3)
      .style("fill", "white")
      .style("stroke", "gray")
      .style("stroke-width", 1)
      .on("click", (_, d) => {
        if (d.id === that.get_expand_set_id()) {
          that.set_expand_set_id(-1);
        } else {
          if (that.parent.selected_node["node_ids"].length == 0) {
            alert(
              "To check the grid layout, you should select one label in the label hierarchy."
            );
            return;
          }
          that.set_expand_set_id(d.id);
        }
      });

    set_groups
      .append("path")
      .attr("class", "expand-path")
      .style("stroke", "none")
      .style("fill", "gray")
      .attr("d", Global.plus_path_d(-11, 0, 10, 10, 2));


    // set_groups
    //   .append("rect")
    //   .attr("class", "collapse-rect")
    //   .attr("x", -11)
    //   .attr("y", 20)
    //   .attr("width", 10)
    //   .attr("height", 10)
    //   .style("rx", 3)
    //   .style("ry", 3)
    //   .style("fill", "white")
    //   .style("stroke", "gray")
    //   .on("click", (_, d) => {
    //     console.log("collapse click");
    //     d.collapse = d.collapse === 1 ? 0 : 1;
    //     that.parent.update_data();
    //     that.parent.update_view(); // TODO: watch-function way
    //   });
      
    set_groups
      .append("rect")
      .attr("class", "background")
      .style("fill", "white")
      .style("stroke", "#d0d0d0")
      .style("stroke-width", 1.5)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height);


    set_groups
      .append("path")
      .attr("class", "collapse-path")
      .style("stroke", "gray")
      .style("stroke-width", "2")
      .style("fill", "white")
      .style("cursor", "hand")
      .attr("d", d => d.collapse ? Global.collapse_icon(11, d.height / 2, 0) 
        : Global.collapse_icon(-11, d.height / 2 - 10, 1))
      .style("opacity", (d) => (that.visible(d) ? 1 : 0))
      .style("pointer-events", (d) => (that.visible(d) ? "auto" : "none"))
      .on("click", (_, d) => {
        console.log("collapse click");
        d.collapse = d.collapse === 1 ? 0 : 1;
        that.parent.update_data();
        that.parent.update_view(); // TODO: watch-function way
      });
  
  

    that.image_groups = set_groups
      .selectAll("g.detection-result")
      .data((d) => that.vis_image_per_cluster[d.id]);
    let g_image_groups = that.image_groups
      .enter()
      .append("g")
      .attr("class", "detection-result")
      .attr(
        "transform",
        (d) => "translate(" + d.x + ", " + that.top_image_margin + ")"
      );

    g_image_groups
      .append("rect")
      .attr("class", "image-shadow")
      .attr("id", (d) => "image-shadow-" + d.idx)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (d) => d.vis_w)
      .attr("height", (d) => d.vis_h)
      .style("opacity", (d) => (that.visible(d) ? 1 : 0))
      .style("pointer-events", "none")
      .style("fill", "white")
      .style("stroke", "white")
      .style("stroke-width", 5);
    g_image_groups
      .append("image")
      .attr("id", (d) => "set-image-" + d.idx)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (d) => d.vis_w)
      .attr("height", (d) => d.vis_h)
      .style("opacity", (d) => (that.visible(d) ? 1 : 0))
      .style("pointer-events", (d) => (that.visible(d) ? 1 : "none"))
      .attr(
        "href",
        (d) => that.server_url + `/image/image?filename=${d.idx}.jpg`
      )
      .on("mouseover", function(ev) {
        if (that.get_expand_set_id() === -1) that.box_highlight(ev);
        that.image_highlight(ev);
      })
      .on("mouseout", function() {
        that.box_dehighlight();
        that.image_dehighlight();
      })
      .on("click", (ev, d) => {
        console.log("click image", d);
        ev.stopPropagation();
        that.selected_image_idx = d.idx;
        let self = d3
          .select(ev.target.parentElement)
          .selectAll(".image-shadow");
        self.style("stroke", "rgb(237,129,55)");
        // that.set_focus_image(d);
        that.parent.fetch_single_image_detection_for_focus_text({
          image_id: d.idx,
        });
      });

    that.box_groups = that.set_group
      .selectAll(".set")
      .selectAll(".detection-result")
      .selectAll("rect.box")
      .data((d) => {
        // that.box_groups = g_image_groups.selectAll("rect.box").data((d) => {
        let dets = d.d;
        let res = [];
        for (let i = 0; i < dets.length; i++) {
          let x = d.vis_w * dets[i][0];
          let width = d.vis_w * (dets[i][2] - dets[i][0]);
          let y = d.vis_h * dets[i][1];
          let height = d.vis_h * (dets[i][3] - dets[i][1]);
          let collapse = d.collapse;
          res.push({ x, y, width, height, collapse });
        }
        return res;
      });
    that.box_groups
      .exit()
      .transition()
      .duration(that.remove_ani)
      .style("opacity", 0)
      .remove();
    that.box_groups
      .enter()
      .append("rect")
      .attr("class", "box")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .style("fill", "none")
      .style("stroke", Global.BoxRed)
      .style("stroke-width", 1)
      .style("opacity", (d) => (that.visible(d) ? 1 : 0))
      .style("pointer-events", (d) => (that.visible(d) ? 1 : "none"));
    that.box_groups
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .style("opacity", (d) => (that.visible(d)  ? 1 : 0))
      .style("pointer-events", (d) => (that.visible(d) ? "auto" : "none"));
  };

  this.grid_create = function() {
    let set_id = that.get_expand_set_id();
    let selected_set = that.parent.sets[set_id];
    let images = that.vis_image_per_cluster[set_id];
    let dragstarted = function() {
      let tag = d3.select(this);
      console.log("drag start", tag);
      that.timer = setTimeout(function() {
        _dragstarted(tag);
      }, 200);
    };
    let _dragstarted = function(tag) {
      that.focus_grid_for_edit = tag.data()[0];
      that.drag_grid_group
        .append("rect")
        .attr("id", "drag-background")
        .attr("x", that.parent.set_left)
        .attr("y", 0)
        .attr("width", that.parent.set_width)
        .attr("height", that.parent.layout_height)
        .style("fill", "gray")
        .style("opacity", 0.1);
      let drag_grid_group = that.drag_grid_group
        .selectAll("g")
        .data(images)
        .enter()
        .append("g")
        .attr("class", "drag-image")
        .attr(
          "transform",
          (d) =>
            "translate(" +
            (selected_set.x + d.x) +
            ", " +
            that.top_image_margin +
            ")"
        );
      drag_grid_group
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", (d) => d.vis_w)
        .attr("height", (d) => d.vis_h)
        .style("pointer-events", "none")
        .style("fill", "white")
        .style("stroke", "white")
        .style("stroke-width", 5);
      drag_grid_group
        .append("image")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", (d) => d.vis_w)
        .attr("height", (d) => d.vis_h)
        .attr(
          "href",
          (d) => that.server_url + `/image/image?filename=${d.idx}.jpg`
        )
        .on("mouseover", function(ev, d) {
          console.log("drag image mouseover");
          that.target_grid_image = d;
          let element = ev.target;
          let self = d3.select(element.parentElement).selectAll(".rect");
          self.style("stroke", "rgb(237,129,55)");
        })
        .on("mouseout", function() {
          console.log("drag image mouseout");
          that.target_grid_image = null;
          that.drag_grid_group
            .selectAll(".drag-image")
            .selectAll("rect")
            .style("stroke", "white");
        });
      that.drag_grid_group
        .append("rect")
        .attr("id", "drag-grid")
        .attr("x", tag.data()[0].x)
        .attr("y", tag.data()[0].y)
        .attr("width", tag.data()[0].width - 2 * grid_margin)
        .attr("height", tag.data()[0].width - 2 * grid_margin)
        .style("pointer-events", "none")
        .style("stroke", "black")
        .style("fill", "green")
        .style("opacity", 0.5);

      that.grid_group.style("opacity", 0.1);
      that.label_group.style("opacity", 0.1);
    };

    let dragged = function(event) {
      that.drag_grid_group
        .select("#drag-grid")
        .attr("x", event.x)
        .attr("y", event.y);
    };

    let dragended = function() {
      clearTimeout(that.timer);
      console.log("drag end");
      that.drag_grid_group.select("#drag-grid").remove();
      if (that.target_grid_image !== null) {
        let set_id = that.get_expand_set_id();
        let images = that.vis_image_per_cluster[set_id];
        let images_ids = images.map((d) => d.idx);
        let idx = images_ids.indexOf(that.target_grid_image.idx);
        let removed_image = that.vis_image_per_cluster[set_id][idx];
        removed_image.d = that.focus_grid_for_edit.d;
        removed_image.idx = that.focus_grid_for_edit.img_id;
        console.log("image", images);
        that.drag_grid_group
          .selectAll("g")
          .data(images)
          .selectAll("image")
          .attr(
            "href",
            (d) => that.server_url + `/image/image?filename=${d.idx}.jpg`
          );
      }
      that.drag_grid_group.select("#drag-background").remove();
      setTimeout(function() {
        that.drag_grid_group
          .selectAll(".drag-image")
          .transition()
          .duration(that.remove_ani)
          .style("opacity", 0)
          .remove();
        that.grid_group
          .transition()
          .duration(that.remove_ani)
          .style("opacity", 0)
          .style("opacity", 1);
        that.label_group
          .transition()
          .duration(that.remove_ani)
          .style("opacity", 0)
          .style("opacity", 1);
      }, 200);
    };
    let drag = d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
    let grid_groups = that.e_grids
      .enter()
      .append("g")
      .attr("class", "grid")
      .attr("id", (d) => "grid-id-" + d.img_id + "-" + d.id)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")")
      .call(drag)
      .on("mouseover", function() {
        d3.select(this)
          .select("rect")
          .style("stroke-width", 2.0);
      })
      .on("mouseout", function() {
        d3.select(this)
          .select("rect")
          .style("stroke-width", 0.0);
      })
      .on("click", (_, d) => {
        console.log("click image", d);
        // that.set_focus_image(d);
        that.parent.fetch_single_image_detection_for_focus_text({
          image_id: d.img_id,
        });
      });
    // TOOD: mouseover, mouseout
    grid_groups
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", 1);

    grid_groups
      .append("rect")
      .attr("class", "boundingbox")
      .attr("x", 0 + grid_margin)
      .attr("y", 0 + grid_margin)
      .attr("width", (d) => d.width - 2 * grid_margin)
      .attr("height", (d) => d.width - 2 * grid_margin)
      .style("fill", (d) => (d.mismatch > 0 ? mismatch_color : match_color))
      .style("stroke", "black")
      .style("stroke-width", 0)
      .style("stroke-opacity", 1);

    grid_groups
      .append("image")
      .attr("class", "display")
      .attr("x", 0.5 * that.boundingbox_width + grid_margin)
      .attr("y", 0.5 * that.boundingbox_width + grid_margin)
      .attr("width", (d) => d.width - that.boundingbox_width - 2 * grid_margin)
      .attr("height", (d) => d.width - that.boundingbox_width - 2 * grid_margin)
      .attr("xlink:href", (d) =>
        that.use_label_layout
          ? null
          : that.server_url + `/image/image?filename=${d.img_id}.jpg`
      )
      .style("pointer-events", "none");

    let box_groups = grid_groups.selectAll("rect.box").data((d) => {
      let dets = d.d;
      let res = [];
      for (let i = 0; i < dets.length; i++) {
        let tmp = dets[i].slice(0, 4);
        tmp.width = d.width;
        res.push(tmp);
      }
      return res;
    });
    box_groups
      .enter()
      .append("rect")
      .attr("class", "box")
      .attr(
        "x",
        (d) =>
          0.5 * that.boundingbox_width +
          (d.width - that.boundingbox_width) * d[0]
      )
      .attr(
        "y",
        (d) =>
          0.5 * that.boundingbox_width +
          (d.width - that.boundingbox_width) * d[1]
      )
      .attr("width", (d) => (d.width - that.boundingbox_width) * (d[2] - d[0]))
      .attr("height", (d) => (d.width - that.boundingbox_width) * (d[3] - d[1]))
      .style("fill", "none")
      .style("stroke", Global.BoxRed)
      .style("stroke-width", 1)
      .style(
        "opacity",
        !that.use_label_layout && that.get_expand_set_id() > -1 ? 1 : 0
      )
      .style(
        "pointer-events",
        !that.use_label_layout && that.get_expand_set_id() > -1 ? 1 : "none"
      );
  };

  this.label_create = function() {
    let label_group = that.e_labels
      .enter()
      .append("g")
      .attr("class", "label")
      .attr("id", (d) => "label-id-" + d.img_id);
    label_group
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", 1);
    // label_group
    //       .append("rect")
    //       .attr("x", d => d.grid.x + offset_x + 1)
    //       .attr("y", d => d.grid.y + offset_y + 1)
    //       .attr("width", d => d.grid.w - 2)
    //       .attr("height", d => d.grid.h - 2)
    //       .style("fill", "black")
    //       .style("stroke", "none")
    //       .style("opacity", 0.25);
    label_group
      .append("rect")
      .attr("x", (d) => d.grid.x + offset_x)
      .attr("y", (d) => d.grid.y + offset_y)
      .attr("width", (d) => d.grid.w)
      .attr("height", (d) => d.grid.h)
      .style("fill", "none")
      .style("stroke", "#fdfe6c")
      .style("stroke-width", 4);
    label_group
      .append("image")
      .attr("x", (d) => d.label.x + offset_x)
      .attr("y", (d) => d.label.y + offset_y)
      .attr("width", (d) => d.label.w)
      .attr("height", (d) => d.label.h)
      .attr(
        "xlink:href",
        (d) => that.server_url + `/image/image?filename=${d.img_id}.jpg`
      )
      .on("click", (_, d) => {
        console.log("click image", d);
        // that.set_focus_image(d);
        that.parent.fetch_single_image_detection_for_focus_text({
          image_id: d.img_id,
        });
      });

    let box_groups = label_group.selectAll("rect.box").data((d) => {
      let dets = d.d;
      let res = [];
      for (let i = 0; i < dets.length; i++) {
        let x = d.label.x + offset_x + d.label.w * dets[i][0];
        // let width = d.grid.w * (dets[i][2] - dets[i][0]);
        let width = d.label.w * (dets[i][2] - dets[i][0]);
        let y = d.label.y + offset_y + d.label.h * dets[i][1];
        let height = d.label.h * (dets[i][3] - dets[i][1]);
        res.push({ x, y, width, height });
      }
      return res;
    });

    box_groups
      .enter()
      .append("rect")
      .attr("class", "box")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .style("fill", "none")
      .style("stroke", Global.BoxRed)
      .style("stroke-width", 1)
      .style("opacity", that.get_expand_set_id() > -1 ? 1 : 0)
      .style("pointer-events", that.get_expand_set_id() > -1 ? 1 : "none");
  };

  this.nav_create = function() {
    let nav_group = that.e_navs
      .enter()
      .append("circle")
      .attr("class", "nav-circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 10)
      .style("fill", (d) => (d.last_one ? "white" : that.nav_gray))
      .style("stroke", (d) => (d.last_one ? that.nav_gray : "white"))
      .style("stroke-width", (d) => (d.last_one ? 3 : 0))
      .on("click", (_, d) => {
        if (d.id === that.click_ids.slice(-1)[0].id) return;
        let i = 0;
        for (; i < that.click_ids.length; i++) {
          if (d.id === that.click_ids[i].id) break;
        }
        that.click_ids = that.click_ids.slice(0, i);
        that.set_grid_layout_data(d);
      });
    nav_group
      .style("opacity", 0)
      .transition()
      .duration(that.create_ani)
      .delay(that.update_ani + that.remove_ani)
      .style("opacity", 1);
  };

  this.update = function() {
    that.set_update();
    that.grid_update();
    that.label_update();
    that.nav_update();
  };

  this.set_update = function() {
    that.e_sets
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");

    that.set_group
      .selectAll(".set")
      .select("rect.background")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("height", (d) => d.height);

    that.e_sets
      .selectAll("g.detection-result")
      .selectAll(".image-shadow")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      // .attr("height", d => that.get_expand_set_id() === -1 ? d.vis_h : 0);
      .attr("width", (d) => d.vis_w)
      .attr("height", (d) => d.vis_h)
      .style("opacity", (d) => (that.visible(d) ? 1 : 0))
      .style("pointer-events", "none");

    that.set_group
      .selectAll(".set")
      .selectAll("g.detection-result")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr(
        "transform",
        (d) => "translate(" + d.x + ", " + that.top_image_margin + ")"
      );

    that.set_group
      .selectAll(".set")
      .selectAll("g.detection-result")
      .selectAll("image")
      .attr(
        "href",
        (d) => that.server_url + `/image/image?filename=${d.idx}.jpg`
      )
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("width", (d) => d.vis_w)
      .attr("height", (d) => d.vis_h)
      // .attr("height", d => that.get_expand_set_id() === -1 ? d.vis_h : 0);
      .style("opacity", (d) => (that.visible(d) ? 1 : 0))
      .style("pointer-events", (d) => (that.visible(d) ? "auto" : "none"));
    // .style("pointer-events", "auto");

    // that.set_group
    //   .selectAll(".set")
    //   .selectAll("g.detection-result")
    //   .selectAll("rect.box")
    //   .transition()
    //   .duration(that.update_ani)
    //   .delay(that.remove_ani)
    //   .style("opacity", (d) => 
    //   (that.visible(d) ? 1 : 0))
    //   .style("pointer-events", (d) => (that.visible(d) ? "auto" : "none"));

      that.set_group
      .selectAll(".set")
      .selectAll(".collapse-path")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("d", d => d.collapse ? Global.collapse_icon(11, d.height / 2, 0) 
      : Global.collapse_icon(-11, d.height / 2 - 10, 1))
      .style("opacity", that.get_expand_set_id() == -1 ? 1 : 0)
      .style("pointer-events", that.get_expand_set_id() == -1 ? "auto" : "none");

    that.e_sets
      .select(".expand-path")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("d", (d) =>
        d.id === that.get_expand_set_id()
          ? Global.minus_path_d(-11, 0, 10, 10, 2)
          : Global.plus_path_d(-11, 0, 10, 10, 2)
      )
      .style("opacity", (d) =>
        that.visible(d) || that.get_expand_set_id() === d.id
          ? 1
          : 0
      );

    that.e_sets
      .select(".expand-rect")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .style("opacity", (d) =>
        that.visible(d) || that.get_expand_set_id() === d.id
          ? 1
          : 0
      );
  };

  this.grid_update = function() {
    that.e_grids
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("transform", (d) => "translate(" + d.x + ", " + d.y + ")");

    that.e_grids
      .select(".boundingbox")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("x", 0 + grid_margin)
      .attr("y", 0 + grid_margin)
      .attr("width", (d) => d.width - 2 * grid_margin)
      .attr("height", (d) => d.width - 2 * grid_margin)
      .style("fill", (d) => (d.mismatch > 0 ? mismatch_color : match_color));

    that.e_grids
      .select(".display")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("x", 0.5 * that.boundingbox_width + grid_margin)
      .attr("y", 0.5 * that.boundingbox_width + grid_margin)
      .attr("width", (d) => d.width - that.boundingbox_width - 2 * grid_margin)
      .attr("height", (d) => d.width - that.boundingbox_width - 2 * grid_margin)
      .attr("xlink:href", (d) =>
        that.use_label_layout
          ? null
          : that.server_url + `/image/image?filename=${d.img_id}.jpg`
      );

    that.e_grids
      .selectAll("rect.box")
      .data((d) => {
        let dets = d.d;
        let res = [];
        for (let i = 0; i < dets.length; i++) {
          let tmp = dets[i].slice(0, 4);
          tmp.width = d.width;
          res.push(tmp);
        }
        return res;
      })
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr(
        "x",
        (d) =>
          0.5 * that.boundingbox_width +
          (d.width - that.boundingbox_width) * d[0]
      )
      .attr(
        "y",
        (d) =>
          0.5 * that.boundingbox_width +
          (d.width - that.boundingbox_width) * d[1]
      )
      .attr("width", (d) => (d.width - that.boundingbox_width) * (d[2] - d[0]))
      .attr("height", (d) => (d.width - that.boundingbox_width) * (d[3] - d[1]))
      .style(
        "opacity",
        !that.use_label_layout && that.get_expand_set_id() > -1 ? 1 : 0
      )
      .style(
        "pointer-events",
        !that.use_label_layout && that.get_expand_set_id() > -1 ? 1 : "none"
      );
  };

  this.label_update = function() {
    that.e_labels
      .select("rect")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("x", (d) => d.grid.x + offset_x)
      .attr("y", (d) => d.grid.y + offset_y)
      .attr("width", (d) => d.grid.w)
      .attr("height", (d) => d.grid.h);
    that.e_labels
      .select("image")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("x", (d) => d.label.x + offset_x)
      .attr("y", (d) => d.label.y + offset_y)
      .attr("width", (d) => d.label.w)
      .attr("height", (d) => d.label.h)
      .attr(
        "xlink:href",
        (d) => that.server_url + `/image/image?filename=${d.img_id}.jpg`
      );
    // that.e_labels
    //     .selectAll("rect.box")
    //     .transition()
    //     .duration(that.update_ani)
    //     .delay(that.remove_ani)
    //     .style("opacity", that.get_expand_set_id() > -1 ? 1 : 0)
    //     .style("pointer-events", that.get_expand_set_id() > -1 ? 1 : "none");
  };

  this.nav_update = function() {
    that.e_navs
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .style("fill", (d) => (d.last_one ? "white" : that.nav_gray))
      .style("stroke", (d) => (d.last_one ? that.nav_gray : "white"))
      .style("stroke-width", (d) => (d.last_one ? 3 : 0));
    that.nav_group
      .select("rect")
      .transition()
      .duration(that.update_ani)
      .delay(that.remove_ani)
      .attr(
        "height",
        that.click_ids.length === 0
          ? 0
          : that.nav_margin * (that.click_ids.length - 1)
      );
  };

  this.remove = function() {
    that.set_remove();
    that.grid_remove();
    that.label_remove();
    that.nav_remove();
  };

  this.set_remove = function() {
    that.e_sets
      .exit()
      .transition()
      .duration(that.remove_ani)
      .style("opacity", 0)
      .remove();
  };

  that.grid_remove = function() {
    that.e_grids
      .exit()
      .transition()
      .duration(that.remove_ani)
      .style("opacity", 0)
      .remove();
  };

  this.label_remove = function() {
    that.e_labels
      .exit()
      .transition()
      .duration(that.remove_ani)
      .style("opacity", 0)
      .remove();
  };

  this.nav_remove = function() {
    that.e_navs
      .exit()
      .transition()
      .duration(that.remove_ani)
      .style("opacity", 0)
      .remove();
  };

  that.set_mode = function(mode) {
    console.log("set mode", mode);
    that.mode = mode;
    if (mode === "cropping") {
      d3.select("#cropping")
        .select("path")
        .attr("d", Global.d_rollback);
      d3.select("#selecting")
        .select("path")
        .attr("d", Global.d_select);
      that.enter_overview();
    } else if (mode === "selecting") {
      d3.select("#selecting")
        .select("path")
        .attr("d", Global.d_rollback);
      d3.select("#cropping")
        .select("path")
        .attr("d", Global.d_scan);
      that.enter_overview();
    } else if (mode === "exploring") {
      d3.select("#cropping")
        .select("path")
        .attr("d", Global.d_scan);
      d3.select("#selecting")
        .select("path")
        .attr("d", Global.d_select);
      that.quit_overview();
    }
  };

  that.get_mode = function() {
    return that.mode;
  };

  that.enter_overview = function() {
    that.overview_group
      .select("#overview-1")
      .attr("x", offset_x)
      .attr("y", offset_y)
      .attr("width", plot_width)
      .attr("height", plot_height);
    // that.overview_group.select("#overview-2")
    //     .attr("x", small_x_2)
    //     .attr("y", small_y_2)
    //     .attr("width", small_grid_width)
    //     .attr("height", small_grid_width);
    that.overview_group.style("visibility", "visible");
    that.overview_group.select("#viewbox").style("visibility", "hidden");
    that.confirm_button.style("visibility", "hidden");
  };

  that.quit_overview = function() {
    that.overview_group.style("visibility", "hidden");
    that.overview_group.select("#viewbox").style("visibility", "hidden");
    that.confirm_button
      .select("#confirm-resample")
      .style("visibility", "hidden");
  };

  that._init = function() {
    that.overview_group = that.parent.svg
      .append("g")
      .attr("id", "overview-group");

    that.overview_group
      .attr("transform", "translate(" + 0 + "," + that.text_height + ")")
      .style("visibility", "hidden");
    that.overview_group
      .append("rect")
      .attr("id", "overview-1")
      .attr("class", "overview-box");
    // that.overview_group.append("rect")
    //     .attr("id", "overview-2")
    //     .attr("class", "overview-box");
    that.overview_group
      .selectAll(".overview-box")
      .attr("x", 0)
      .attr("y", 0)
      .style("fill", "white")
      .style("stroke", "grey")
      .style("stroke-width", 5)
      .style("opacity", 0.3);
    that.overview_group
      .append("rect")
      .attr("id", "viewbox")
      .style("stroke-dasharray", "5, 5")
      .style("fill", "white")
      .style("stroke", "grey")
      .style("stroke-width", 5)
      .style("opacity", 0.5);

    d3.select("#cropping").on("click", function() {
      var mode =
        d3
          .select(this)
          .select("path")
          .attr("d") === Global.d_scan
          ? "cropping"
          : "exploring";
      that.set_mode(mode);
    });

    d3.select("#selecting").on("click", function() {
      var mode =
        d3
          .select(this)
          .select("path")
          .attr("d") === Global.d_select
          ? "selecting"
          : "exploring";
      that.set_mode(mode);
    });

    d3.select("#home").on("click", () => {
      console.log("home buttom click");
      // let d = that.click_ids[0];
      // that.click_ids = that.click_ids.slice(0, i);
      that.update_ani = 2000;
      that.create_ani = 2000;
      let d = that.click_ids[1];
      that.click_ids = that.click_ids.slice(0, 1);
      that.set_grid_layout_data(d);
    });

    function adjust_sampling_area(area) {
      that.relative_sampling_area = area;
      // console.log("relative_sampling are", that.relative_sampling_area);
      that.overview_group
        .select("#viewbox")
        .attr("x", that.relative_sampling_area.x * plot_width + offset_x)
        .attr("y", that.relative_sampling_area.y * plot_height + offset_y) //- that.text_height)
        .attr("width", that.relative_sampling_area.w * plot_width)
        .attr("height", that.relative_sampling_area.h * plot_height);
    }
    function compute_viewbox(x1, y1, x2, y2) {
      var min_x = Math.min(x1, x2),
        max_x = Math.max(x1, x2),
        min_y = Math.min(y1, y2),
        max_y = Math.max(y1, y2);
      var new_area = {
        x: (min_x - plot_x) / plot_width,
        y: (min_y - plot_y) / plot_height,
        w: (max_x - min_x) / plot_width,
        h: (max_y - min_y) / plot_height,
      };
      if (new_area.x + new_area.w > 1 && new_area.x < 1) {
        return that.relative_sampling_area;
      } else {
        return new_area;
      }
    }

    that.overview_group
      .on("mousedown", function(ev) {
        // var offset = $(d3.select(this).node()).offset();
        plot_x = offset_x;
        plot_y = offset_y + that.text_height;
        mouse_pos = {
          x: ev.offsetX,
          y: ev.offsetY,
        };
        console.log(plot_x, plot_y, mouse_pos);
        mouse_pressed = d3.select(this).attr("id");
        that.overview_group.select("#viewbox").style("visibility", "visible");
        that.confirm_button.style("visibility", "hidden");
        adjust_sampling_area(
          compute_viewbox(mouse_pos.x, mouse_pos.y, mouse_pos.x, mouse_pos.y)
        );
      })
      .on("mousemove", function(ev) {
        if (!mouse_pressed) {
          return;
        }

        adjust_sampling_area(
          compute_viewbox(mouse_pos.x, mouse_pos.y, ev.offsetX, ev.offsetY)
        );

        let left_x = that.relative_sampling_area.x;
        let top_y = that.relative_sampling_area.y;
        let right_x = left_x + that.relative_sampling_area.w;
        let bottom_y = top_y + that.relative_sampling_area.h;
        // console.log("relative sampling area", left_x, right_x, top_y, bottom_y);
        if (that.get_mode() !== "exploring") {
          let grid_data = that.get_grid_data();
          grid_data.forEach((d) => {
            let x = d.pos[0];
            let y = d.pos[1];
            let width = d.normed_w;
            if (
              x + width > left_x &&
              x < right_x &&
              y + width > top_y &&
              y < bottom_y
            ) {
              if (d.selected === false) {
                d.selected = true;
                d3.select("#grid-id-" + d.img_id)
                  .select(".boundingbox")
                  .style(
                    "fill",
                    d.mismatch > 0
                      ? d3.rgb(Global.Orange).darker(1.5)
                      : d3.rgb(Global.GrayColor).darker(1.5)
                  );
                d3.select("#grid-id-" + d.img_id)
                  .select(".display")
                  .style(
                    "fill",
                    d.mismatch > 0
                      ? d3.rgb(Global.Orange).darker(1.5)
                      : d3.rgb(Global.GrayColor).darker(1.5)
                  );
              }
            } else {
              if (d.selected === true) {
                d.selected = false;
                d3.select("#grid-id-" + d.img_id)
                  .select(".boundingbox")
                  .style(
                    "fill",
                    d.mismatch > 0 ? Global.Orange : Global.GrayColor
                  );
                d3.select("#grid-id-" + d.img_id)
                  .select(".display")
                  .style(
                    "fill",
                    d.mismatch > 0 ? Global.Orange : Global.GrayColor
                  );
              }
            }
          });
        }
      })
      .on("mouseup", function(ev) {
        if (!mouse_pressed) {
          return;
        }
        mouse_pressed = false;
        adjust_sampling_area(
          compute_viewbox(mouse_pos.x, mouse_pos.y, ev.offsetX, ev.offsetY)
        );
        let button_x =
          (that.relative_sampling_area.x + that.relative_sampling_area.w) *
            plot_width +
          margin_size +
          offset_x -
          10;
        let button_y =
          (that.relative_sampling_area.y + that.relative_sampling_area.h) *
            plot_height +
          // margin_top_size +
          that.text_height +
          offset_y;
        that.confirm_button
          .attr("transform", "translate(" + button_x + ", " + button_y + ")")
          .style("visibility", "visible");
      });

    that.confirm_button = that.parent.svg
      .append("g")
      .attr("id", "confirm-resample")
      .style("visibility", "hidden");
    that.confirm_button
      .append("circle")
      .attr("r", 20)
      .attr("fill", "grey");
    that.confirm_button
      .append("text")
      .attr("class", "glyphicon")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("dy", "0.25em")
      .style("fill", "white")
      .style("opacity", 1)
      .style("font-size", "20px")
      .style("cursor", "hand")
      .text("\ue015");

    that.confirm_button.on("click", function(ev) {
      console.log("confirm buttom click");
      if (that.get_mode() === "cropping") {
        that.click_count = that.click_ids.slice(-1)[0].id;
        // that.click_ids.push(that.click_count);
        let query = {
          // "image_cluster_id": that.expand_set_id,
          cat_ids: that.parent.selected_node.node_ids,
          "left-x": that.relative_sampling_area.x,
          "top-y": that.relative_sampling_area.y,
          width: that.relative_sampling_area.w,
          height: that.relative_sampling_area.h,
          "node-id": that.click_count,
          image_cluster_id: that.get_expand_set_id(),
        };
        that.fetch_grid_layout(query);
      } else if (that.get_mode() === "selecting") {
        // let selected_items_id = [];
        // for (let i = 0; i < train_data.length; i++) {
        //     if (train_data[i].selected === true) {
        //         selected_items_id.push(train_data[i].get_id());
        //     }
        // }
        // for (let i = 0; i < test_data.length; i++) {
        //     if (test_data[i].selected === true) {
        //         selected_items_id.push(test_data[i].get_id());
        //     }
        // }
      }
      that.set_mode("exploring");
      d3.select(this).style("visibility", "hidden");
      ev.stopPropagation();
    });
  }.call();

  that.label_layout = function(data, plot_size, labels) {
    let padding_label = 40;
    if (data.length <= 25 ** 2) {
      labels = Array();
      return [];
    }
    var grid_N = Math.ceil(Math.sqrt(data.length));
    var grid_size = plot_size / grid_N;
    var img_size = img_width;
    var new_labels = [];

    var intersect = function(rect1, rect2) {
      return !(
        rect1.x + rect1.w + padding_label < rect2.x ||
        rect2.x + rect2.w + padding_label < rect1.x ||
        rect1.y + rect1.h + padding_label < rect2.y ||
        rect2.y + rect2.h + padding_label < rect1.y
      );
    };
    var legal = function(rect) {
      return (
        rect.x > 0 &&
        rect.y > 0 &&
        rect.x + rect.w < plot_size &&
        rect.y + rect.h < plot_size
      );
    };
    const offset = [
      { x: 0, y: 0 },
      { x: 0, y: -img_size },
      { x: -img_size, y: -img_size },
      { x: -img_size, y: 0 },
    ];
    data.sort((x, y) => y.mismatch - x.mismatch);
    for (let d of data) {
      var center = {
        x: d.pos[0] * plot_size + 0.5 * grid_size,
        y: d.pos[1] * plot_size + 0.5 * grid_size,
      };
      var tmp_grid = {
        x: d.pos[0] * plot_size,
        y: d.pos[1] * plot_size,
        w: d.normed_w * plot_size,
        h: d.normed_w * plot_size,
      };
      var tmp_label;
      var can_placed;
      var prev_label = labels.filter((lbl) => lbl.id === d.id);
      if (prev_label.length > 0) {
        var direction = prev_label[0].label.dir;
        tmp_label = {
          dir: direction,
          x: center.x + offset[direction].x,
          y: center.y + offset[direction].y,
          w: img_size,
          h: img_size,
        };
        can_placed = true;
        for (let r of new_labels) {
          if (
            intersect(tmp_label, r.label) ||
            intersect(tmp_grid, r.label) ||
            intersect(tmp_label, r.grid) ||
            intersect(tmp_grid, r.grid) ||
            !legal(tmp_label)
          ) {
            can_placed = false;
            break;
          }
        }
        if (can_placed) {
          new_labels.push({
            label: tmp_label,
            grid: tmp_grid,
            ...d,
          });
        }
      } else {
        for (var i = 0; i < 4; ++i) {
          tmp_label = {
            dir: i,
            x: center.x + offset[i].x,
            y: center.y + offset[i].y,
            w: img_size,
            h: img_size,
          };
          can_placed = true;
          for (let r of new_labels) {
            if (
              intersect(tmp_label, r.label) ||
              intersect(tmp_grid, r.label) ||
              intersect(tmp_label, r.grid) ||
              intersect(tmp_grid, r.grid) ||
              !legal(tmp_label)
            ) {
              can_placed = false;
              break;
            }
          }
          if (can_placed) {
            new_labels.push({
              label: tmp_label,
              grid: tmp_grid,
              ...d,
            });
            break;
          }
        }
      }
    }
    return new_labels;
  };

  that.box_highlight = function(ev) {
    let element = ev.target;
    while (element.tagName !== "g" || element.className.baseVal !== "set") {
      element = element.parentElement;
    }
    let self = d3.select(element);
    let d = self.data()[0];
    let group = that.set_group.select("#set-" + d.id);
    group
      .selectAll(".background")
      // .style("stroke", "rgb(128, 128, 128)");
      .style("stroke", "rgb(237,129,55)")
      .style("stroke-width", 2);
    group.selectAll(".expand-rect").style("stroke", "rgb(38, 38, 38)");

    if (Global.linked_highlight) that.connection_highlight(d);
  };

  that.box_dehighlight = function() {
    let groups = that.set_group.selectAll(".set");
    groups
      .selectAll(".background")
      .style("stroke", "rgb(208, 208, 208)")
      .style("stroke-width", 1);
    groups.selectAll(".expand-rect").style("stroke", "gray");
    if (Global.linked_highlight) that.connection_dehighlight();
  };

  that.image_highlight = function(ev) {
    // console.log('image highlight');
    let element = ev.target;
    let self = d3.select(element.parentElement).selectAll(".image-shadow");
    self.style("stroke", "rgb(237,129,55)");
  };

  that.image_dehighlight = function() {
    that.set_group
      .selectAll(".set")
      .selectAll(".image-shadow")
      .style("stroke", "white");
    if (that.selected_image_idx !== null) {
      d3.select("#image-shadow-" + that.selected_image_idx).style(
        "stroke",
        "rgb(237,129,55)"
      );
    }
  };

  that.connection_highlight = function(node) {
    that.parent.connection_view.highlight_by_image_cluster(node);
  };

  that.connection_dehighlight = function() {
    that.parent.connection_view.dehighlight();
  };

  that.clean = function() {
    that.set_group.selectAll(".set").remove();
  };
};

export default ImageCards;
