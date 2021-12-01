import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import * as d3 from "d3"


axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

//mount Vuex
Vue.use(Vuex)

//create VueX
const store = new Vuex.Store({
    state:{
        // server_url: 'http://localhost:20211',
        server_url: 'http://thuvis.org:20211',
        // action trail
        history: [],
        image_num: 0,
        step: 0,
        name_edit_history: {},
        label_consistency: 0,
        symmetrical_consistency: 0,
        current_id: 0,
        word_tsne: [],
        tree: {},
        use_treecut: true,
        image_cluster_list: [],
        fetched_image_result: [],
        mismatch: [],
        vis_image_per_cluster: {},
        expand_tree: true,
        expand_set_id: -1,
        grid_data: [],
        grid_image_info: [],
        nav_id: [],
        one_image_boxes_threshold: 0.5,
        label_layout_mode: null,
        cluster_association_mat: [],
        focus_node: null,
        selected_node: {
            node_ids: [],
            nodes: [], 
            curr_full_name: ''
        },
        all_sets: [],
        words: [],
        selected_images: [],
        focus_word: null,
        focus_image: null,
        text_list: [],
        focus_text: null,
        image_list: [],
        selected_flag: [],
        f1_score_selected: true,
        tooltip: {
          top: 0,
          left: 0,
          show: false,
          width: 0,
          content: '',
        },
        word_cloud_recycled: {

        },
        classNames:[]
    },
    getters: {
        label_consistency: (state) => {
            return state.label_consistency;
        },
        symmetrical_consistency: (state) => {
            return state.symmetrical_consistency;
        }
    },
    mutations:{
        edit(state){ // for DEBUG
            state.name = "hello 2";
        },
        set_name_edit_history(state, data){
            state.name_edit_history[data.id] = data.name;
        },
        set_manifest_data(state, manifest_data){
            console.log("set manifest data");
            state.step = manifest_data.real_step;
            state.image_num = manifest_data.image_num;
            state.classNames = manifest_data.class_name;
            state.label_consistency = manifest_data.label_consistency;
            state.symmetrical_consistency = manifest_data.symmetrical_consistency;
        },
        set_selected_flag(state, tree){
            console.log("set tree");
            state.tree = tree;
            state.selected_flag = state.tree.all_descendants.map(d => d.selected_flag);
        },
        set_hypergraph_data(state, hypergraph_data){
            console.log("set hypergraph data");
            console.log("hypergraph_data", hypergraph_data);
            console.log("state", state);
            this.commit("set_word_tsne", hypergraph_data.word_tsne);
            this.commit("set_text_tree_data", hypergraph_data.text_tree);
            this.commit("set_image_cluster_list_data", hypergraph_data.image_cluster_list);
            this.commit("set_cluster_association_mat", hypergraph_data.cluster_association_matrix);
            this.commit("set_mismatch", hypergraph_data.mismatch);
            this.commit("set_vis_image_per_cluster", hypergraph_data.vis_image_per_cluster);
        },
        set_word_tsne(state, word_tsne){
            state.word_tsne = word_tsne;
        },
        set_text_tree_data(state, text_tree){
            // process tree 
            state.tree = d3.hierarchy(text_tree,
                function(d){
                    let children = d.children;
                    return children
                });
            state.tree.eachAfter(element => {
                element.id = element.data.id;
                element.full_name = element.data.name;
                element.name = element.full_name;
                // // combining the names of all children as the name of their father
                // if (element.children && element.name !== "root"){
                //     element.name = element.children.map(d=>d.name + " ").join("");
                // }
                
                if (state.name_edit_history[element.id]){
                    element.full_name = state.name_edit_history[element.id];
                    element.name = element.full_name;
                }

                // all_children: all children
                // children: children that are visible
                // _children: children that are invisible
                element.all_children = element.children;
                if(element.children) element.children.forEach((d,i) => d.siblings_id = i);
                element._children = [];
                element._total_width = 0;
                if (!element.data.precision){
                    let s = element.all_children.map(d=>d.data.precision);
                    if (s) element.data.precision = s.reduce((a,c)=>{return a+c}, 0) / s.length;
                }
                if (!element.data.recall){
                    let s = element.all_children.map(d=>d.data.recall);
                    if (s) element.data.recall = s.reduce((a,c)=>{return a+c}, 0) / s.length;
                }
                if (!element.data.mismatch){
                    let s = element.all_children.map(d=>d.data.mismatch);
                    if (s) element.data.mismatch = s.reduce((a,c)=>{return a+c}, 0);
                }
                if (!element.data.descendants_idx){
                    if (!element.all_children){
                        element.data.descendants_idx = [element.data.id];
                    }
                    else{
                        let idxs = [];
                        for (let i = 0; i < element.all_children.length; i++){
                            idxs = idxs.concat(element.all_children[i].data.descendants_idx);
                        }
                        element.data.descendants_idx = idxs;
                    }
                }
                element.f1_api = 2 - (element.data.precision * 2 + element.data.recall) / 2;
                element.mm_api = element.data.mismatch / 20000;
                element.api = state.f1_score_selected ? element.f1_api : element.mm_api;
                // element.api = element.mm_api;
            });

            state.tree.eachBefore((d, i) => d.order = i);

            state.tree.all_descendants = state.tree.descendants();
            state.tree.all_descendants.forEach(d => d.children = []);
            console.log("api", state.tree.all_descendants.map(d => d.api));
            console.log("api", state.tree.all_descendants.map(d => d.mm_api));

            // let temp_history = {};
            // state.tree.all_descendants.filter(d => d.all_children)
            //     .forEach(d => {
            //         temp_history[d.id] = d.name;
            //     })
            // state.name_edit_history = temp_history;  
            

            console.log("state.tree", state.tree)

        },
        set_image_cluster_list_data(state, image_cluster_list){
            state.image_cluster_list = image_cluster_list;
            state.image_cluster_list.forEach(d => d.collapse = 0);
            // state.image_cluster_list[1].collapse = 1;
            console.log("state.image_cluser_list", state.image_cluster_list);
        },
        set_cluster_association_mat(state, cluster_association_mat){
            state.cluster_association_mat = cluster_association_mat;
            console.log("cluster_association_mat:", state.cluster_association_mat);
        },
        set_mismatch(state, mismatch){
            state.mismatch = mismatch;
            console.log("cluster_association_mat:", state.mismatch);
        },
        set_history_data(state, history_data) {
            console.log("set history data");
            state.history = history_data;
        },
        set_focus_node(state, nodes) {
            console.log("set focus node");
            state.focus_node = nodes;
        },
        set_focus_image(state, image){
            console.log("set focus image");
            state.focus_image = image;
            console.log(image);
        }, 
        set_selected_node(state, node) {
            console.log("set selected node");
            let index = state.selected_node.node_ids.indexOf(node.id);
            if (index === -1) {
                state.selected_node.node_ids.push(node.id);
                state.selected_node.nodes.push(node);
                d3.selectAll(`#id-${node.id}`)
                    .selectAll(".background").style('stroke', "#ffa953")
                    .style("stroke-width", 2);
            }
            else {
                d3.selectAll(`#id-${node.id}`).style('stroke', '');
                state.selected_node.node_ids.splice(index, 1);
                state.selected_node.nodes.splice(index, 1);
            }
            let new_full_names = [];
            state.selected_node.nodes.forEach(node=>{
                new_full_names.push(node.full_name); 
            });
            state.selected_node.curr_full_name = new_full_names.join('&');
        },
        set_expand_tree(state, node){
            console.log("set expand tree");
            state.expand_tree = node;
        },
        set_expand_set_id(state, id){
            console.log("set expand set id", id);
            state.expand_set_id = id;
        },
        set_words(state, words){
            console.log("set words");
            state.words = words.map(d => {
                let res = {};
                res.text = d[0];
                res.value = d[1];
                // res.id = element.data.id;
                return res;

            });
            state.words = state.words.slice(0, 20);
        },
        set_selected_images(state, images){
            console.log("set images");
            state.selected_images = images.map((d, i) => {
                let res = {};
                res.id = d.idx;
                res.index = i;
                res.data = d;
                return res;
            });
            // state.images = state.images.slice(0, 20);
        },
        set_focus_word(state, word){
            console.log("set focus word");
            state.focus_word = word;
        },
        set_text_list(state, text_list){
            console.log("set text list");
            state.text_list = text_list;
        },
        set_focus_text(state, text){
            console.log("set focus text");
            state.focus_text = text;
        },
        set_vis_image_per_cluster(state, res){
            console.log("set_vis_image_per_cluster", res);
            for(let i in res){
                state.vis_image_per_cluster[i] = res[i];
            }
        },
        set_use_treecut(state, use_treecut){
            state.use_treecut = use_treecut;
        },
        set_f1_score_selected(state, f1_score_selected){
            state.f1_score_selected = f1_score_selected;
        },
        set_grid_layout_data(state, data){
            console.log("set grid layout data", data);
            state.grid_data = data.layout;
            state.grid_image_info = data.image_info;
            state.nav_id = data.id;
            state.grid_data.forEach((d, i) => {
                d.d = state.grid_image_info[i].d;
            })
        },
        set_one_image_boxes_threshold(state, data){
            console.log("set one_image_boxes_threshold", data);
            state.one_image_boxes_threshold = data;
        },
        showTooltip(state, { top, left, width, content }) {
            state.tooltip.top = top 
            state.tooltip.left = left 
            state.tooltip.content = content
            state.tooltip.show = true
            state.tooltip.width = width
        },
        hideTooltip(state) {
            state.tooltip.show = false
        }
    },
    actions:{
        async fetch_manifest({commit, state}, key){
            console.log("fetch_manifest");
            const resp = await axios.post(`${state.server_url}/detection/GetManifest`, key, 
                {headers: {
                    "Content-Type":"application/json",
                    "Access-Control-Allow-Origin": "*",
                }});
            console.log("get manifest", resp);
            commit("set_manifest_data", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_hypergraph({commit, state}, key){
            console.log("fetch_hypergraph");
            const resp = await axios.post(`${state.server_url}/detection/HyperGraph`, {word: key}, 
                {headers: 
                    {"Access-Control-Allow-Origin": "*"}});
            commit("set_hypergraph_data", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_history({ commit, state }, key){
            console.log("fetch_history");
            const resp = await axios.post(`${state.server_url}/history/GetHistory`, {word: key}, {headers: {"Access-Control-Allow-Origin": "*"}});
            // console.log(resp);
            commit("set_history_data", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_text_by_word_and_cat_ids({commit, state}, key){
            console.log("fetch_text", key);
            let query = {
                "cat_id": key.cat_id,
                "word": key.text,
                "rules": key.rules
            }
            const resp = await axios.post(`${state.server_url}/text/GetTextByWord`, {query}, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_text_list", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_text_by_ids({commit, state}, ids){
            console.log("fetch_text_by_ids", ids);
            let query = {
                "ids": ids,
            }
            const resp = await axios.post(`${state.server_url}/text/GetText`, {query}, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_text_list", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_word({commit, state}){
            console.log("fetch_word");
            let query = {
                tree_node_ids: state.selected_node.node_ids,
                match_type: "p",
            };
            const resp = await axios.post(`${state.server_url}/text/GetWord`, {query}, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_words", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_image({commit, state}){
            console.log("fetch_image");
            let query = {
                tree_node_ids: state.selected_node.node_ids,
                match_type: "p",
            };
            const resp = await axios.post(`${state.server_url}/text/GetImage`, {query}, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_selected_images", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_images({commit, state}, image_cluster_ids){
            console.log("fetch_images", image_cluster_ids);
            const resp = await axios.post(`${state.server_url}/detection/Rank`, image_cluster_ids, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_vis_image_per_cluster", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_single_image_detection({commit, state}, query){
            console.log("fetch_single_image_detection", query);
            const resp = await axios.post(`${state.server_url}/image/SingleImageDetection`, query, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_focus_image", JSON.parse(JSON.stringify(resp.data)));
        },
        async fetch_single_image_detection_for_focus_text({commit, state}, query){
            console.log("fetch_single_image_detection_for_focus_text", query);
            if (state.fetched_image_result[query.image_id] !== undefined){
                console.log("use buffer");
            }
            else{
                query.conf = 0.1;
                const resp = await axios.post(`${state.server_url}/image/SingleImageDetection`, query, {headers: {"Access-Control-Allow-Origin": "*"}});
                state.fetched_image_result[query.image_id] = JSON.parse(JSON.stringify(resp.data));
            }
            commit("set_focus_text", state.fetched_image_result[query.image_id]);
        },
        async fetch_grid_layout({commit, state}, query){
            const resp = await axios.post(`${state.server_url}/detection/GridLayout`, query, {headers: {"Access-Control-Allow-Origin": "*"}});
            commit("set_grid_layout_data", JSON.parse(JSON.stringify(resp.data)));
        }
    },
    // computed: {
    //     selected_flag(){
    //         return this.$store.state.tree.all_descendants.map(d => !! d.selected_flag);
    //     }
    // },
    modules:{
        // empty
    }
})

export default store