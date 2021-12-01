import * as d3 from "d3"
// import {TreeCut} from "./treecut"

const image_cluster_list_layout = function(parent){
    let that = this;
    that.parent = parent;

    this.get_set_layout_from_parent = function(){
        that.layout_height = that.parent.layout_height;
        that.set_height = that.parent.set_height;
        that.set_left = that.parent.set_left;
        that.set_width = that.parent.set_width;
        that.set_margin = that.parent.set_margin;
        that.mini_set_height = that.parent.mini_set_height;
        that.large_set_height = that.parent.large_set_height; 
        that.top_image_margin = that.parent.top_image_margin;
        that.x_position = that.parent.x_position;
        that.collapse_height = 30;
    };
    this.get_set_layout_from_parent();

    this.get_expand_set_id = function(){
        return that.parent.expand_set_id;
    }

    this.get_grid_data = function(){
        return that.parent.grid_data;
    }

    this.get_grid_image_info = function() {
        return that.parent.grid_image_info;
    };
      

    this.update_parent_set_layout = function(data){
        console.log("update_parent_set_layout");
        that.parent.set_num = data.length;
        that.parent.mini_set_height = 0;
        let collapsed_num = eval(data.map(d => d.collapse).join("+"));
        if (that.get_expand_set_id() !== -1) {
            that.parent.set_margin = 0;
        } else if (collapsed_num === 0){
            that.parent.set_margin = 5;
            that.parent.set_height = (that.layout_height + that.parent.set_margin - 5) // 5 is the top padding of svg 
            / that.parent.set_num;
        }
        else{
            that.parent.set_margin = 5;
            let rest_num = that.parent.set_num - collapsed_num;
            let collapse_total_height = collapsed_num * (that.collapse_height + 2 * that.parent.set_margin);
            that.parent.set_height = (that.layout_height + that.parent.set_margin - collapse_total_height) /
                rest_num;
        }
        that.parent.image_height = that.parent.set_height - that.parent.set_margin - 2 * that.parent.image_margin;
        that.parent.top_image_margin = that.parent.image_margin;
        let image_num = 10;
        that.parent.x_position = function(i){
            let box = that.parent.image_height + 2 * that.parent.image_margin;
            let offset = (that.parent.set_width - box) / (image_num - 1);
            return i * offset;
        }
        let img_height = that.parent.set_width / image_num - 2 * that.parent.image_margin;
        if (img_height < that.parent.image_height) {
            that.parent.image_height = img_height;
            that.parent.top_image_margin = (that.parent.set_height - img_height) / 2;
            that.parent.x_position = function(i){
                let box = that.parent.image_height + 2 * that.parent.image_margin;
                return i * box;
            }
        }

        // that.parent.mini_set_height = 20;
        that.parent.large_set_height = that.layout_height - 10 - 
            (that.parent.set_num - 1) * that.parent.mini_set_height;
    };
    
    let mean = function(arr){
        let sum = 0;
        for(let i = 0; i < arr.length; i++){
            sum += arr[i];
        }
        return sum / arr.length;
    };

    this.reorder = function(data){
        data.forEach( d => {
            let nodes = d.connected_nodes;
            let ys = nodes.map(n => n.y);
            d.order = mean(ys);
        })
        data.sort((a,b) => a.order - b.order);
        return data;
    }

    this.layout = function(data){
        console.log("image layout");
        this.update_parent_set_layout(data);
        this.get_set_layout_from_parent();

        // data = this.reorder(data);
        let offset = 0;
        data.forEach((d) => {
            d.x = that.set_left;
            // d.x = (d.depth - 1) * that.x_delta;
            // d.y = i * that.set_height + that.set_margin / 2;
            // d.y_center = d.y + (that.set_height - that.set_margin) / 2;
            let w = d.id === that.get_expand_set_id() ? 
                that.large_set_height: that.mini_set_height;
            if (that.get_expand_set_id() === -1){
                if (d.collapse > 0) w = that.collapse_height;
                else w = that.set_height;
            } 
            d.y = offset;
            offset = offset + w;
            d.y_center = d.y + (w) / 2;
            d.height = w - that.set_margin;
            d.width = that.set_width;
        });
        let grids = [];
        let pos = {};
        if (that.get_expand_set_id()!==-1) {
            [grids, pos] = that.grid_layout(data);
            d3.select("#grid-control")
                .style("display", "block");
            d3.select("#grid-legend-group")
                .style("visibility", "visible");
        } else {
            d3.select("#grid-control")
                .style("display", "none");
            d3.select("#grid-legend-group")
                .style("visibility", "hidden");
        }
        return [data, grids, pos];
    }

    this.grid_layout = function(data){
        let grid_height = that.large_set_height * 0.98;
        let grid_margin = that.large_set_height * 0.01;
        let grid_width = that.set_width;
        let side_length = 0;
        let offset_x = 0;
        let offset_y = 0;
        if (grid_height > grid_width){
            offset_y = (grid_height - grid_width) / 2 + grid_margin;
            offset_x = that.set_left + grid_margin;
            side_length = grid_width;
        }
        else{
            offset_y = grid_margin;
            offset_x = that.set_left + (grid_width - grid_height) / 2 + grid_margin;
            side_length = grid_height;
        }
        // let control_panel_width = (grid_width - grid_height);
        side_length = side_length - that.set_margin * 2;
        // offset_x -= control_panel_width / 2;
        offset_y = offset_y + that.set_margin / 3;
        offset_y = offset_y + data.filter(d => d.id === that.get_expand_set_id())[0].y;
        console.log("offset_x, offset_y", offset_x, offset_y);

        let grid_data = that.get_grid_data();
        let grid_size = Math.ceil(Math.sqrt(grid_data.length));
        let cell_width = 1.0 / grid_size;
        grid_data.forEach(d => {
            d.x = offset_x + side_length * d.pos[0];
            d.y = offset_y + side_length * d.pos[1];
            d.width = cell_width * side_length;
            d.normed_w = cell_width;
            d.selected = false;
        })
        return [grid_data, {offset_x, offset_y, side_length}];
    }
}

export {image_cluster_list_layout}