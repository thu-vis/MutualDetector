function assert(flag, string){
    if (!flag){
      throw Error(string);
    }
}

const TreeCut = function (bbox_width, bbox_height, layer_height) {
    let _this = this;
    let _tree = null;
    let _tree_layout = null;
    let _bbox_width = bbox_width;
    let _bbox_height = bbox_height;
    let _layer_height = layer_height;
    let pinArray = [];
    let clickQueue = [];
    let tmp_children = {};
    clickQueue.insertAt = function (index, obj) {
        this.splice(index, 0, obj);
    };
    clickQueue.removeAt = function (index) {
        this.splice(index, 1);
    };

    this._update_tree = function(tree){
        _tree = tree;
        return true;
    };

    this._update_tree_layout = function(tree_layout){
        _tree_layout = tree_layout;
        return true;
    };

    this.candraw = function(root){
        let nodes = _tree_layout(root);
        _this.recover_children(root);
        let x1 = Number.MAX_VALUE, x2 = Number.MIN_VALUE, y1 = Number.MAX_VALUE, y2 = Number.MIN_VALUE;
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if ((node.x - node._total_width/2) < x1) {
                x1 = node.x - node._total_width/2;
            }
            if ((node.x + node._total_width/2) > x2) {
                x2 = node.x + node._total_width/2;
            }
            if (node.y < y1) {
                y1 = node.y;
            }
            if (node.y > y2) {
                y2 = node.y;
            }
        }
        //if(max_depth === 5){
        //    console.log("candraw max_depth", max_depth, y2, y1);
        //}
        // console.log(x1, x2, y1, y2, _bbox_width, _bbox_height, _layer_height);
        if (x2 - x1 > _bbox_width || y2 - y1 > (_bbox_height - _layer_height)) {
            return false;
        }
        //if(max_depth === 5){
        //    console.log("candraw max_depth", max_depth);
        //}
        let offset = (x1 + x2) / 2 + 10;
        // console.log("offset:", offset);
        if (!offset){
            offset = 0.001;
        }
        return offset;
    };

    this.recover_children = function(source){
        let that = this;
        if(!source.children) source.children=[];
        source.all_children.forEach(d => that.recover_children(d));
    };

    this.initial = function(root){
        _this._initial(root);
    };

    this._initial = function (d) {
        // if (!d._children) {
        //     d._children = [];
        // }
        if (!d.children) {
            d.children = [];
        }
        if (!d.all_children){
            d.all_children = [];
        }
        if (!d.window) {
            d.window = {};
        }
        if (!d.window.x) {
            d.window.x = 0;
        }
        if (!d.window.y) {
            d.window.y = 0;
        }
        if (!d.beforeList) {
            d.beforeList = [];
        }
        if (!d.afterList) {
            d.afterList = [];
        }
        // let ratio = d.value_new.reduce((acc,x) => acc + x) / d.value.reduce((acc,x) => acc + x);
        //d.api = d._total_width * (1 + 10 * ratio) - 5 * Uncertainty(d);
        // d.api = 2 - (d.data.precision * 2 + d.data.recall) / 2; //Math.sqrt(d._total_width) * (1 + 10 * ratio) ;
        assert(!isNaN(d.api), "api NaN error");
        d.doi = d.api;
        d.all_children.forEach(_this._initial);
    };

    this.drawPin = function () {
        for (let i = 0; i < pinArray.length; i++) {
            _this.draw_single_node(pinArray[i]);
        }
    };

    this.update_before_after_cnt_field = function (source) {
        // update before list and after list according window.x and window.y
        source.beforeList = [];
        for (let i = source.window.x - 1; i >= 0; i--) {
            if (source.children.indexOf(source.all_children[i]) < 0) {
                source.beforeList.push(source.all_children[i]);
            }
        }
        source.afterList = [];
        for (let i = source.window.y; i < source.all_children.length; i++) {
            if (source.children.indexOf(source.all_children[i]) < 0) {
                source.afterList.push(source.all_children[i]);
            }
        }
    };

    this.update_has_after_cnt_field = function (source) {
        // initial before list and update after list
        source.beforeList = [];
        source.afterList = [];
        if (source.children.length === 0){
            return;
        }

        let min_idx = 1000, max_idx = -1;
        for (let i = 0; i < source.children.length; i++){
            let siblings_id = source.children[i].siblings_id;
            if (siblings_id > max_idx){
                max_idx = siblings_id;
            }
            if (siblings_id < min_idx){
                min_idx = siblings_id;
            }
        }
        // console.log("update has after cnt field", min_idx, max_idx, source.children.map(d => d.siblings_id), source.all_children.map(d => d.siblings_id));
        for (let i = max_idx - 1; i >= 0; i--) {
            if (source.children.indexOf(source.all_children[i]) < 0) {
                source.beforeList.push(source.all_children[i]);
            }
        }
        for (let i = max_idx + 1; i < source.all_children.length; i++) {
            // if (source.children.indexOf(source.all_children[i]) < 0) {
                source.afterList.push(source.all_children[i]);
            // }
        }

        // for (let i = 0; i < source.all_children.length; i++) {
        //     if (source.children.indexOf(source.all_children[i]) < 0) {
        //         source.afterList.push(source.all_children[i]);
        //     }
        // }
    };

    this.check_order = function(arr){
        if (arr.length < 2) return;
        for(let i = 0; i < arr.length-1; i++){
            assert(arr[i].siblings_id <= arr[i+1].siblings_id, "check order error");
        }
    };

    this.from_rest_to_children = function (node) {
        // put node to children
        if (node.parent.all_children.indexOf(node) < 0) {
            return false;
        }
        if (node.parent.children.indexOf(node) < 0) {
            let parent_id = node.parent.id;
            assert(parent_id !== undefined, "parent id error");
            tmp_children[parent_id] = node.parent.children.slice(); // shallow copy

            // // added in random
            // node.parent.children.push(node);

            // added in order
            let i = 0;
            for(; i < node.parent.children.length; i++){
                if (node.parent.children[i].siblings_id > node.siblings_id){
                    break;
                }
            }
            node.parent.children.splice(i,0,node);
            this.check_order(node.parent.children);

            // reordering(node.parent);

            this.update_has_after_cnt_field(node.parent);
            return true;
        } else {
            // assert(0, "from rest to children error");
            return false;
        }
    };

    this.from_children_to_rest = function (node) {
        let id = node.parent.children.indexOf(node);
        if (id >= 0){
            // node.parent.children.splice(id, 1);
            let parent_id = node.parent.id;
            assert(tmp_children[parent_id].length === node.parent.children.length - 1, "children length error");
            node.parent.children = tmp_children[parent_id];
            _this.update_has_after_cnt_field(node.parent);
            return true;
        }
        else{
            assert(0, "from children to rest error");
            return false;
        }
    };

    this.draw_single_node = function (source) {
        //
        let node = source;
        let drawArr = [];
        while (node != null) {
            if (node.parent != null && _this.from_rest_to_children(node)) {
                drawArr.push(node);
                node = node.parent;
            } else {
                break;
            }
        }
        if (_this.candraw(_tree)) {
            return true;
        } else {
            for (let i = 0; i < drawArr.length; i++) {
                _this.from_children_to_rest(drawArr[i]);

            }
            return false;
        }
    };

    this.searchUpY = function(source){
        for (let y = source.window.y; y < source.all_children.length; y++) {
            if (source.children.indexOf(source.all_children[y]) < 0) {
                let node = source.all_children[y];
                _this.from_rest_to_children(node);
                if (!_this.candraw(_tree)) {
                    _this.from_children_to_rest(node);
                    break;
                }
            }
            source.window.y = y + 1;
        }
    };

    this.searchDownX = function (source) {
        for (var x = source.window.x - 1; x >= 0; x--) {
            if (source.children.indexOf(source.all_children[x]) < 0) {
                var node = source.all_children[x];
                _this.from_rest_to_children(node);
                if (!_this.candraw(_tree)) {
                    _this.from_children_to_rest(node);
                    break;
                }
            }
            source.window.x = x;
        }
    }

    this.draw_my_children = function(source){
        source.window.x = 0;
        source.window.y = 0;
        _this.searchUpY(source);
    };

    this.draw_node_as_much_as_possible = function(source){
        let node = source;
        if (node != null) {
            node = node.parent;
        }
        while (node != null) {
            _this.draw_my_children(node);
            node = node.parent;
        }
    };

    this.draw_nodes_according_to_click_queue = function () {
        // try to draw as many nodes in click queue as possible
        let nodes_in_click_queue_drawn = [];
        for (let i = 0; i < clickQueue.length; i++) {
            if (_this.draw_single_node(clickQueue[i].node)){
                nodes_in_click_queue_drawn.push(clickQueue[i]);
            }
        }
        // if all nodes in click queue cannot be drawn
        if (nodes_in_click_queue_drawn.length === 0){
            _this.draw_my_children(_tree);
        }
        // try to draw the children of nodes that have been drawn
        else{
            for(let i = 0; i < nodes_in_click_queue_drawn.length; i++){
                if(nodes_in_click_queue_drawn[i].drawChildren){
                    _this.draw_my_children(nodes_in_click_queue_drawn[i].node);
                }
                _this.draw_node_as_much_as_possible(nodes_in_click_queue_drawn[i].node);
            }
        }
    };

    // this.update_rest_node = function(source){
    //     if (source.id.length > 5 && source.id.slice(0,5) === "rest-") return;
    //     if (source.beforeList.length > 0){
    //         // create a rest node
    //         let rest_node = new TreeNode();
    //         rest_node.id = "rest-before-node-" + source.id;
    //         rest_node._widthes = new Array(20).fill(0); // TODO:  20
    //         // insert the rest node in the front of children list
    //         source.children = [rest_node].concat(source.children);
    //     }
    //     if (source.afterList.length > 0){
    //         // create a rest node
    //         let rest_node = new TreeNode();
    //         rest_node.id = "rest-after-node-" + source.id;
    //         rest_node._widthes = new Array(20).fill(0); // TODO:  20
    //         // insert the rest node in the back of children list
    //         source.children.push(rest_node);
    //     }
    //     source.children.forEach(_this.update_rest_node);
    // };

    
    
    this.treeCut = function (sources, tree, tree_layout) {
        console.log("bbox width and height", bbox_width, bbox_height);
        _this._update_tree(tree);
        _this._update_tree_layout(tree_layout);
        if(!sources){
            sources = [_tree];
        }
        let source = sources[0];
        _this.initial(_tree);
        let nodes = _tree_layout(_tree).filter(d => !d.is_rest_node); // update depth
        nodes.forEach(d=>d.debug_visited=false);
        traverse_for_doi(_tree, source);
        console.log("source in treecut", sources);
        clickQueue = get_selection_array(_tree, sources);
        // console.log("clickqueue", clickQueue.map(d => d.node.name));
        pinArray = nodes.filter(d=>d.pinned);
        console.log("pinArray: ", pinArray);
        collapse(_tree);
        _this.drawPin();
        _this.draw_nodes_according_to_click_queue();
          
        // update__children(_tree);
        let offset = _this.candraw(_tree);
        assert(offset, "offset error");
        return offset;
    };

    function tree_distance(r1, r2){
        let LCA2 = function(a,b){
            while (a.depth > b.depth) {
                a = a.parent;
            }
            while (b.depth > a.depth) {
                b = b.parent;
            }
            while (a.id !== b.id) {
                a = a.parent;
                b = b.parent;
            }
            return a;
        };
        let p = LCA2(r1, r2);
        let d = r1.depth + r2.depth - p.depth * 2;
        if (r1.id != r2.id){
            d = d + 0.1 - 0.1 / (r1.order - r2.order) / (r1.order - r2.order);
        }
        if (r1.id != r2.id && r1.depth === r2.depth && r1.parent.all_children.indexOf(r2) > 0){
            console.log("siblings");
            let siblings_dis = (r1.siblings_id - r2.siblings_id) * (r1.siblings_id - r2.siblings_id);
            siblings_dis = 1 / siblings_dis / 5;
            d = d - siblings_dis;
        }
        // console.log(d, r1, r2);
        assert(d >= 0, "distance error!!!");
        if (p == r2) return d / 5;
        if (p == r2.parent) return d / 2;
        return d;
    }

    function traverse_for_doi(r, source) {
        assert(source, "source is empty");
        //calculate present doi
        // let alpha = 0.6, beta = 0.4, decay = 0.9;
        let beta = 1;
        let dis = tree_distance(r, source);
        // r.doi = r.doi * (decay * alpha + 1.0 / (dis + 1) / (dis + 1) * beta);
        r.doi = r.api + 1.0 / (dis + 1) / (dis + 1) * beta;
        assert(!isNaN(r.doi), "doi NaN error!");
        r.in_selection_array = false;
        if(!r.children){return;}
        for(let i = 0; i < r.all_children.length; i++){
            traverse_for_doi(r.all_children[i], source);
        }
    }

    function get_selection_array(root, sources) {
        let selection_array = [];
        // add selected node and his children to selection array
        let source = sources[0];
        // selection_array.push({
        //     "node": source,
        //     "drawChildren": true
        // });
        sources.forEach(d=>{
            selection_array.push({
                "node": d,
                "drawChildren": true
            });
            d.in_selection_array = true;
        });
        source.in_selection_array = true;
        for(let i = 0; i < source.all_children.length; i++){
            selection_array.push({
                "node": source.all_children[i],
                "drawChildren": true
            });
            source.all_children[i].in_selection_array = true;
        }
        // add other nodes according to doi
        let all_node = [];
        let first_not_visited_node = 0;
        all_node.push(root);
        while(first_not_visited_node !== all_node.length){
            let visited_node = all_node[first_not_visited_node];
            first_not_visited_node ++;
            if (visited_node.all_children){
                for(let i = 0; i < visited_node.all_children.length; i++ ){
                    all_node.push(visited_node.all_children[i]);
                }
            }
        }
        all_node.sort(function(a,b){return b.doi - a.doi;});
        for (let i = 0; i < all_node.length; i++){
            if (!all_node[i].in_selection_array){
                selection_array.push({
                    "node": all_node[i],
                    "drawChildren": true
                })
            }
        }

        // // remove redundant nodes in selection array: clickQueue.removeRedundantNodes in tree.cut.js
        // for (let i = selection_array.length - 1; i >= 1; i--){
        //     if (inPath(source, selection_array[i].node)){
        //         selection_array.splice(i, 1);
        //     }
        // }

        // // preserve nodes with top-k doi (optional)
        // selection_array.splice(5);

        return selection_array
    }

    function collapse(node) {
        //collapse all children, namely all children are stored in node.children and node._children is empty
        node.children = [];
        if (node.all_children.length > 0){
            node.all_children.forEach(collapse);
        }
    }

    // function update__children(node) {
    //     // update node._children according to node.children
    //     node._children = [];
    //     for (let i = 0; i < node.all_children.length; i++ ){
    //         if (node.children.indexOf(node.all_children[i]) < 0){
    //             node._children.push(node.all_children[i]);
    //         }
    //     }
    //     node.all_children.forEach(update__children);
    // }

    // function inPath(source, item) {
    //     let node = item;
    //     while (node != null) {
    //         if (node === source)
    //             return true;
    //         node = node.parent;
    //     }
    //     node = source;
    //     while (node != null) {
    //         if (node === item)
    //             return true;
    //         node = node.parent;
    //     }
    //     return false;
    // }
};

export {TreeCut}