import * as d3 from "d3"
import {TreeCut} from "./treecut"
 
const exit_type = function(d){
    let p = d;
    let child_p = null;
    // 0: collapsing to parent
    // 1: stay till
    // 2: collapsing to beforelist
    // 3: collapsing to afterlist
    let type = -1;
    let translate = "";
    while(p.parent && p.parent.children.indexOf(p) < 0){
        child_p = p;
        p = p.parent;
    }
    if (p.children.length === 0){
        type = 0;
        translate = "translate(" + p.prev_x + ", " + p.prev_y + ")";
    }
    else if (child_p && p.children.length !== 0){
        if (child_p.in_before_list){
            type = 2;
            translate = "translate(" + p.before_node.x + ", " + p.before_node.y + ")";
        }
        else if (child_p.in_after_list){
            type = 3;
            translate = "translate(" + p.after_node.x + 
                ", " + p.after_node.y + ")";
        }
    }
    else{
        type = 1;
        translate = "translate(" + p.prev_x + ", " + p.prev_y + ")";
    }
    return [type, translate]
}

const mini_tree_layout = function(Size){
    let that = this;
    that.Size = Size;
    
    this.layout = function(data){
        // backup state
        data.all_descendants.forEach(d => {
            d.backup_children = d.children;
            d.children = d.all_children;
            if (d.children && d.children.length === 0) d.children = undefined;
            d.backup_x = d.x;
            d.backup_y = d.y;
        });

        // tree layout
        data = d3.tree()
        .size(that.Size)(data);
        
        let nodes = data.descendants();
        let links = data.links();

        // restore state 
        data.descendants().forEach(d => {
            d.mini_x = d.x;
            d.mini_y = d.y;
            d.x = d.backup_x;
            d.y = d.backup_y;
            d.children = d.backup_children;
            d.mini_selected = false;
        });

        // set selected state
        data.descendants().forEach(d => d.mini_selected = true);

        return {nodes, links};
    };
};

const tree_layout = function(nodeSize, layout_height){
    let that = this;
    that.nodeSize = nodeSize;
    that.x_delta = nodeSize[0];
    that.y_delta = nodeSize[1];
    that.layout_height = layout_height;
    that.max_num = parseInt(that.layout_height / that.y_delta);

    this.layout = function(data, expand_tree){
        if (expand_tree === false){
            return that._aligned_layout(data);
        }
        else{
            return that._layout(data);
        }
    };

    this.update_layout_by_num = function(num){
        if (num < that.max_num){
            that.y_delta = that.layout_height / num;
        }
        else{
            that.y_delta = that.nodeSize[1];
        }
    };

    this.reset_layout = function(){
        that.y_delta = that.nodeSize[1];
    };
    this.layout_with_nodes = function(data, expand_tree){
        if (expand_tree === false){
            return that._aligned_layout(data);
        }
        else{
            // const root = that._layout(data);
            return that._layout(data).filter(d => !d.is_rest_node);
        }
    };

    this.layout_with_rest_node = function(data, expand_tree){
        if (expand_tree === false){
            return that._aligned_layout(data);
        }
        else{
            // const root = that._layout(data);
            return that._layout(data);
        }
    }

    this._aligned_layout = function(data){
        data.descendants().forEach(d => {
            if (!d.children) d.children = [];
        });
        let nodes = data.descendants().filter(d => d.children.length === 0);
        // let y_delta = that.y_delta * (data.descendants().length - 1) / nodes.length;
        let y_delta = that.layout_height / (nodes.length);
        console.log("y_delta in aligned_layout", y_delta);
        let layer = 0;
        data.eachBefore(d => {
            if (d.children.length === 0){
                d.y = layer * y_delta;
                layer += 1;
            }
        })
        nodes.forEach((d) => {
            d.x = 0;
            d.link_x = 0;
            d.link_top = that.y_delta / 2;
            d.link_bottom = d.link_top;
        });
        return nodes;
    }

    this._layout = function(data){
        data.all_descendants.forEach(d => {
            d.is_rest_node = false;
            d.in_before_list = false;
            d.in_after_list = false;
        });
        let visible_nodes = data.descendants();
        visible_nodes.forEach(d => {
            d.tmp_children = d.children.slice();
            if (d.beforeList.length > 0){
                d.beforeList.forEach(n => n.in_before_list = true);
                let rest_node = {};
                rest_node.id = "rest-before-" + d.id;
                rest_node.is_rest_node = true;
                rest_node.rest_children = d.beforeList;
                rest_node.parent = d;
                rest_node.depth = d.depth + 1;
                rest_node.data = {};
                rest_node.data.precision = 1;
                rest_node.data.recall = 1;
                rest_node.siblings_id = -1;
                rest_node.prev_vis = false;
                d.beforeList.forEach(n => {
                    if (n.prev_vis) rest_node.prev_vis=true;
                })
                d.children.push(rest_node);
                d.before_node = rest_node;

            }
            if (d.afterList.length > 0){
                d.afterList.forEach(n => n.in_after_list = true);
                let rest_node = {};
                rest_node.id = "rest-after-" + d.id;
                rest_node.is_rest_node = true;
                rest_node.rest_children = d.afterList;
                rest_node.parent = d;
                rest_node.depth = d.depth + 1;
                rest_node.data = {};
                rest_node.data.precision = 1;
                rest_node.data.recall = 1;
                rest_node.siblings_id = 1000;
                rest_node.prev_vis = false;
                d.afterList.forEach(n => {
                    if (n.prev_vis) rest_node.prev_vis=true;
                })
                d.children.push(rest_node);
                d.after_node = rest_node;
            }
            d.children.sort(function(a,b){return a.siblings_id - b.siblings_id;})
        });

        data.eachBefore((d,i) => {
            d.x = (d.depth - 1) * that.x_delta;
            d.y = (i - 1) * that.y_delta;
        });
        data.descendants().forEach(d => {
            if (!d.children) d.children = [];
            // if (d.parent){
            //     d.parent_x = d.parent.x;
            //     d.parent_y = d.parent.y;
            // }
        })
        // calculate node link 
        data.descendants().forEach(d => {
            d.link_x = 0;
            d.link_top = that.y_delta / 2;
            if (d.children && d.children.length > 0){
                d.link_bottom = d.link_top + (d.descendants().length - 1) * that.y_delta;
            }
            else{
                d.link_bottom = d.link_top;
            }
        })
        // calculate node type
        data.descendants().forEach(d => {
            let type = -1;
            if (!d.all_children || d.all_children.length===0){
                type = 2;
            }
            else{
                if (!d.children || d.children.length===0){
                    type = 0;
                }
                else{
                    type = 1;
                }
            }
            d.type = type;
        });
        let nodes = data.descendants().filter(d => d.name !== "root");
        nodes.filter(d => d.is_rest_node).forEach(d => {
            d.rest_children.forEach(n => {n.x = d.x; n.y = d.y;})
            d.rest_children = d.rest_children.slice(0, 3); // show max 3 rest children
            let children_num = d.rest_children.length;
            let single_height = that.y_delta * 0.6;
            let max_delta = that.y_delta * 0.2;
            let total_height = single_height + max_delta * (children_num - 1);
            if (total_height > that.y_delta * 0.8){
                let delta = (this.y_delta * 0.8 - single_height) / (children_num - 1);
                d.rest_children.forEach((e,i) => {
                    e.x_delta = i * 4;
                    e.y_delta = - that.y_delta * 0.8 / 2 + i * delta;
                    e.is_rest_node = true;
                })
            }
            else{
                d.rest_children.forEach((e,i) =>{
                    e.x_delta = i * 4;
                    e.y_delta = i * max_delta - total_height / 2;
                })
            }
            d.rest_children.forEach((e,i) => {
                e.last_rest_children = i === (d.rest_children.length - 1);
            })
        })
        visible_nodes.forEach(d => {d.children = d.tmp_children});
        return nodes;
    }

}

export {TreeCut, tree_layout, mini_tree_layout, exit_type}