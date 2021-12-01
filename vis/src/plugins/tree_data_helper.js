
const tree_process = function(text_tree) {
    
    text_tree.eachAfter(element => {
        if(element.all_children) element.all_children.forEach((d,i) => d.siblings_id = i);
        element.children = element.all_children;
        // if (!element.data.precision){
        //     let s = element.all_children.map(d=>d.data.precision);
        //     if (s) element.data.precision = s.reduce((a,c)=>{return a+c}, 0) / s.length;
        // }
        // if (!element.data.recall){
        //     let s = element.all_children.map(d=>d.data.recall);
        //     if (s) element.data.recall = s.reduce((a,c)=>{return a+c}, 0) / s.length;
        // }
        // if (!element.data.mismatch){
        //     let s = element.all_children.map(d=>d.data.mismatch);
        //     if (s) element.data.mismatch = s.reduce((a,c)=>{return a+c}, 0);
        // }
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
        // element.api = element.f1_api;
    });

    // text_tree.eachBefore((d, i) => d.order = i);

    // text_tree.all_descendants = text_tree.descendants();
    text_tree.all_descendants.forEach(d => d.children = []);
    return tree_process;
};

export {
    tree_process,
}