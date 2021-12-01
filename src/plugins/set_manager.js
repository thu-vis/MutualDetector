import {getTextWidth} from "../plugins/global"

// function unique(arr){
//     return Array.from(new Set(arr));
// }

function set_unique(arr){
    let res = [];
    let keys = [];
    for (let i = 0; i < arr.length; i++){
        if (keys.indexOf(arr[i].type) == -1){
            keys.push(arr[i].type);
            res.push(arr[i]);
        }
    }
    return res;
}

const SetManager = function (parent){
    let that = this;
    that.parent = parent;


    that.text_width = that.parent.max_text_width + that.parent.layer_height / 4;
    that.layout_width = that.parent.layout_width;
    that.layout_height = that.parent.layout_height;
    that.set_left = that.parent.set_left;
    that.set_width = that.parent.set_width;
    that.set_margin = that.parent.set_margin;
    that.set_height = that.parent.set_height;
    that.set_num = that.parent.set_num;
    that.image_height = that.parent.image_height;
    that.image_margin = that.parent.image_margin;

    that.selected_nodes = [];

    this.update_data_from_parent = function(){
        that.sets = that.parent.sets;
        that.selected_nodes = that.parent.selected_nodes;
        let right_max = that.selected_nodes.map(d => 
            d.y + getTextWidth(d.data.name, "16px Roboto, sans-serif"));
        that.right_max = Math.max(...right_max);

        that.tree_node_group_x = that.parent.tree_node_group_x;
        that.tree_node_group_y = that.parent.tree_node_group_y - that.parent.text_height;

    };

    this.get_sets = function(){
        this.update_data_from_parent();
        that.all_arr = {}
        // get map
        that.selected_nodes.forEach(d => {
            d.data.sets.forEach(n => that.all_arr[n.type] = []);
        })
        that.selected_nodes.forEach(d => {
            d.data.sets.forEach(n => that.all_arr[n.type].push(d));
        })

        let arr = that.selected_nodes.map(d => d.data.sets);
        // let arr = Object.values(all_arr);
        arr = Array.prototype.concat.call(...arr);
        that.arr = set_unique(arr);
        console.log("arr in get_sets", that.arr);
        that.filter_and_sort();

        that.get_set_links();
        return [that.set_to_display, that.set_links]
    }

    this.get_set_links = function(){
        that.set_links = [];
        for (let i = 0; i < that.selected_nodes.length; i++){
            let node = that.selected_nodes[i];

            let source = {
                "x": node.x + that.text_width + that.tree_node_group_x,
                "y": node.y + that.tree_node_group_y,
                "id": node.id
            };

            let turn_point = {
                "x": that.right_max,
                "y": node.y
            }

            // console.log("node:", node);
            for (let j = 0; j < node.data.sets.length; j++){
                let set_name = node.data.sets[j]["type"];
                let set_node = that.set_map[set_name];
                if (!set_node) continue;
                let target = {
                    "x": set_node.x,
                    "y": set_node.y_center,
                    "id": set_node.id
                }
                that.set_links.push({
                    source, target, turn_point
                });
            }
        }
    }

    this.filter_and_sort = function(){
        // TODO: filtering or sorting
        let num_to_display = that.set_num;
            // Math.floor(that.layout_height / that.set_height);
        that.set_to_display = [];
        that.set_map = [];
        // that.arr.sort((a,b) => (Math.min(...a.match_percent) - Math.min(...b.match_percent)));
        for (let i = 0; i < num_to_display; i++){
            that.set_to_display.push(that.arr[i]);
            that.set_map[that.arr[i]["type"]] = that.set_to_display[i];
        }
        let mean = function(arr){
            let sum = 0;
            for(let i = 0; i < arr.length; i++){
                sum += arr[i];
            }
            return sum / arr.length;
        };
        that.set_to_display.forEach(d => {
            let nodes = that.all_arr[d.type];
            let ys = nodes.map(n => n.y);
            d.order = mean(ys);
        })
        that.set_to_display.sort((a,b) => a.order - b.order);
        
        that.set_to_display.forEach(function(d, i){
            d.x = that.set_left;
            d.y = i * that.set_height + that.set_margin / 2;
            d.y_center = d.y + (that.set_height - that.set_margin) / 2;
            d.width = that.set_width - that.set_margin;
            d.height = that.set_height - that.set_margin;
            d.vis_image = [];
            let x = that.image_margin;
            for (let j = 0; j < d.selected_image.length; j++){
                let img = d.selected_image[j];
                let height = that.image_height;
                let width = img.w / img.h * height;
                img.vis_w = width;
                img.vis_h = height;
                if ((x + width + that.image_margin) < that.set_width){
                    img.x = x;
                    x = x + width + that.image_margin;
                    d.vis_image.push(img);
                }
                else{
                    break;
                }
            }
        });
    }
}

export {SetManager}