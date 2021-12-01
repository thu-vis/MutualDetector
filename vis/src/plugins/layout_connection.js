const ConnectionLayout = function(parent, cluster_association_mat){
    let that = this;
    that.parent = parent;
    that.cluster_association_mat = cluster_association_mat;
    // this.threshold = 120;

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


    this.get_cluster_association_mat = function(){
        return that.parent.cluster_association_mat;
    };

    this.get_mismatch = function(){
        return that.parent.mismatch;
    },

    this.get_tree_node_group_x = function(){
        return that.parent.tree_node_group_x;
    };

    this.get_tree_node_group_y = function(){
        return that.parent.tree_node_group_y - that.parent.text_height;
    }

    this.update = function(text_nodes, image_nodes){
        console.log("layout_connection");
        that.text_nodes = text_nodes;
        that.image_nodes = image_nodes;
        let text_idxs = text_nodes.map(d => d.data.descendants_idx ? d.data.descendants_idx: [d.id]);
        console.log("text_idxs", text_idxs);
        let image_idxs = image_nodes.map(d => d.cluster_idxs);
        let text_num = text_idxs.length;
        let image_num = image_idxs.length;
        that.matrix = [];
        that.mismatch = [];
        for (let i = 0; i < text_num; i++){
            that.matrix.push([]);
            that.mismatch.push([]);
            for (let j = 0; j < image_num; j++){
                let element = 0;
                let mm_element = 0;
                for (let s = 0; s < text_idxs[i].length; s++){
                        element += that.get_cluster_association_mat()[j][text_idxs[i][s]];
                        // mm_element += that.get_mismatch()[j][text_idxs[i][s]];
                        if (that.get_mismatch()[j][text_idxs[i][s]] > 1000){
                            mm_element += 1;
                        }
                }
                that.matrix[i].push(element);
                that.mismatch[i].push(mm_element);
            }
        }

        for (let j = 0; j < image_num; j++){
            let connected_nodes = [];
            let mismatch_values = [];
            for (let i = 0; i < text_num; i++){
                let element = that.matrix[i][j];
                if (element > 0) {
                    connected_nodes.push(text_nodes[i]);
                    mismatch_values.push(that.mismatch[i][j]);
                }
            }
            image_nodes[j].connected_nodes = connected_nodes;
            image_nodes[j].mismatch_values = mismatch_values;
        }
    };


    this.get_links = function(image_nodes){
        that.links = [];
        for (let i = 0; i < image_nodes.length; i++){
            let connected_nodes = image_nodes[i].connected_nodes;
            let mismatch_values = image_nodes[i].mismatch_values;
            for (let j = 0; j < connected_nodes.length; j++){
                let text_node = connected_nodes[j];
                let mismatch_value = mismatch_values[j];
                let image_node = image_nodes[i];
                let source = {
                    "x": text_node.x + that.text_width + that.get_tree_node_group_x(),
                    "y": text_node.y + that.get_tree_node_group_y(),
                    "id":text_node.id
                }
                let turn_point = {
                    "x": that.right_max,
                    "y": text_node.y
                }
                let target = {
                    "x": image_node.x,
                    "y": image_node.y_center,
                    "id": image_node.id
                }
                that.links.push({source, target, turn_point, mismatch_value})
            }
        }
        // for (let i = 0; i < that.text_nodes.length; i++){
        //     for (let j = 0; j < that.image_nodes.length; j++){
        //         let element = that.matrix[i][j];
        //         if (element > 0){
        //             let text_node = that.text_nodes[i];
        //             let image_node = that.image_nodes[j];
        //         }
        //     }
        // }
        return that.links;
    }
}

export {ConnectionLayout};