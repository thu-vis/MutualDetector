import * as d3 from "d3";
// import * as Global from "./global";
const TextImageConnection = function (parent) {
    let that = this;
    that.parent = parent;

    that.set_link_group = that.parent.set_link_group;

    // animation
    that.create_ani = that.parent.create_ani;
    that.update_ani = that.parent.update_ani;
    that.remove_ani = that.parent.remove_ani;

    // this.mismatch_threshold = 1500;
    this.mismatch_threshold = 0.5;

    this.get_expand_set_id = function(){
        return that.parent.expand_set_id;
    };
    
    that.sub_component_update = function (set_links) {
        // update state

        // update view
        that.e_set_links = that.set_link_group
            .selectAll(".set-link")
            .data(set_links, d => d.source.id + "-" + d.target.id); 

        that.create();
        that.update();
        that.remove();
    }

    that.create = function () {
        // set links
        that.e_set_links
            .enter()
            .append("path")
            .attr("class", d => d.mismatch_value > that.mismatch_threshold ? 
                "set-link mismatched-link": "set-link matched-link")
            .attr("id", d => d.source.id + "-" + d.target.id)
            // .attr("d", Global.set_line)
            .attr(
                "d",
                d3.linkHorizontal()
                    .x((d) => d.x)
                    .y((d) => d.y)
            )
            .style("opacity", 0)
            // .style("stroke", d => d.mismatch_value > that.mismatch_threshold ? 
            //     Global.Red: Global.GrayColor)
            .style("stroke-width", 1)
            // .style("stroke-dasharray", "5, 5")
            .transition()
            .duration(that.create_ani)
            .delay(that.update_ani + that.remove_ani)
            .style("opacity", d => {
                let id = that.get_expand_set_id();
                return id === -1 || id === d.target.id ? 1 : 0;
            });
    };

    that.update = function () {
        that.e_set_links
            .transition()
            .duration(that.update_ani)
            .delay(that.remove_ani)
            .attr("class", d => d.mismatch_value > that.mismatch_threshold ? 
                "set-link mismatched-link": "set-link matched-link")
            .attr("d", 
            d3.linkHorizontal()
                .x((d) => d.x)
                .y((d) => d.y))
            .style("opacity", d => {
                let id = that.get_expand_set_id();
                return id === -1 || id === d.target.id ? 1 : 0;
            });
    };

    that.remove = function () {
        that.e_set_links
            .exit()
            .transition()
            .duration(that.remove_ani)
            .style("opacity", 0)
            .remove();

    };

    that.highlight_by_node = function(node){
        let id = node.id;
        d3.selectAll(".set").style("opacity", 0.3);
        that.set_link_group
            .selectAll("path")
            .each(function(d){
                let self = d3.select(this);
                if (d.source.id === id){
                    self.style("opacity", 1);
                    self.style("stroke-width", 2);
                    let cluster_id = "#set-" + d.target.id;
                    d3.select(cluster_id)
                        .style("opacity", 1);
                } 
                else{
                    let id = that.get_expand_set_id();
                    self.style("opacity", id === -1 ? 0.2 : 0);
                    self.style("stroke-width", 1);
                }
            })
        
    };

    that.dehighlight = function(){
        that.set_link_group
            .selectAll("path")
            .style("opacity", d => {
                let id = that.get_expand_set_id();
                return id === -1 || id === d.target.id ? 1 : 0;
            })
            .style("stroke-width", 1);
        d3.selectAll(".set").style("opacity", 1);
        d3.selectAll(".tree-node").style("opacity", 1);
        d3.selectAll(".rest-tree-node").style("opacity", 1);
    };

    that.highlight_by_image_cluster = function(node){
        // console.log("highlight_by_image_cluster", node);
        let id = node.id;
        d3.selectAll(".tree-node").style("opacity", 0.2);
        d3.selectAll(".rest-tree-node").style("opacity", 0.2);
        that.set_link_group
            .selectAll("path")
            .each(function(d){
                let self = d3.select(this);
                if (d.target.id === id){
                    self.style("opacity", 1);
                    self.style("stroke-width", 2);
                    let cluster_id = ".tree-node#id-" + d.source.id;
                    d3.select(cluster_id)
                        .style("opacity", 1);
                } 
                else{
                    let id = that.get_expand_set_id();
                    self.style("opacity", id === -1 ? 0.2 : 0);
                    self.style("stroke-width", 1);
                }
            })

    };
    
  that.clean = function(){
    that.set_link_group.selectAll(".set-link").remove();
  };
}

export default TextImageConnection;