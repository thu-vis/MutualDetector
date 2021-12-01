import * as d3 from "d3";

const GrayColor = "#7f7f7f";
const DarkGray = "rgb(211, 211, 229)";
const DeepGray = "rgb(50, 50, 50)";
const LightGray = "#EBEBF3";
const Orange = "#ffa953";
const Red = "rgb(237, 41, 57)";
const BoxRed = "#93ff2f";
const Animation = 1000; 
const WindowHeight = window.innerHeight - 10;
const linked_highlight = true;

const d_rollback="M793 242H366v-74c0-6.7-7.7-10.4-12.9-6.3l-142 112c-4.1 3.2-4.1 9.4 0 12.6l142 112c5.2 4.1 12.9 0.4 12.9-6.3v-74h415v470H175c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h618c35.3 0 64-28.7 64-64V306c0-35.3-28.7-64-64-64z";
const d_scan="M136 384h56c4.4 0 8-3.6 8-8V200h176c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H196c-37.6 0-68 30.4-68 68v180c0 4.4 3.6 8 8 8zM648 200h176v176c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V196c0-37.6-30.4-68-68-68H648c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zM376 824H200V648c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v180c0 37.6 30.4 68 68 68h180c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM888 640h-56c-4.4 0-8 3.6-8 8v176H648c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h180c37.6 0 68-30.4 68-68V648c0-4.4-3.6-8-8-8zM904 476H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z";
const d_select="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h360c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H184V184h656v320c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V144c0-17.7-14.3-32-32-32zM653.3 599.4l52.2-52.2c4.7-4.7 1.9-12.8-4.7-13.6l-179.4-21c-5.1-0.6-9.5 3.7-8.9 8.9l21 179.4c0.8 6.6 8.9 9.4 13.6 4.7l52.4-52.4 256.2 256.2c3.1 3.1 8.2 3.1 11.3 0l42.4-42.4c3.1-3.1 3.1-8.2 0-11.3L653.3 599.4z";



const deepCopy = function(obj) {
    let _obj = Array.isArray(obj) ? [] : {}
    for (let i in obj) {
      _obj[i] = typeof obj[i] === 'object' ? deepCopy(obj[i]) : obj[i]
    }
    return _obj
};

function pos2str_inverse(pos){
    return pos.y + "," + pos.x;
}

function pos2str(pos){
    return pos.x + "," + pos.y;
}

const tree_line = function(d){
    let start = {x: d.source.x, y: d.source.y};
    let middle = {x: d.target.turn_x, y: d.target.turn_y};
    let end = {x: d.target.x, y: d.target.y};
    let t1 = {x: start.x, y: (start.y + middle.y) / 2};
    let t2 = {x: middle.x, y: t1.y};
    return "M" + pos2str_inverse(start) + "C" + pos2str_inverse(t1) + "," + pos2str_inverse(t2) 
        + "," + pos2str_inverse(middle) + "L" + pos2str_inverse(end);
}

const set_line = function(d){
    let start = {x: d.source.x, y: d.source.y};
    let middle = {x:d.turn_point.x, y: d.turn_point.y};
    let end = {x: d.target.x, y: d.target.y};
    let t1 = {x: (middle.x + end.x) / 2, y: middle.y};
    let t2 = {x: t1.x, y: end.y};
    return "M" + pos2str(start) + "L" + pos2str(middle) + "C" 
        + pos2str(t1) + "," + pos2str(t2) + "," + pos2str(end);
}

const getTextWidth = function(text, font) {
    let canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    return context.measureText(text).width;
  }

const collapse_icon = function(x, y, type, basic_ratio){
    basic_ratio = basic_ratio || 4;
    if (type === 0) { // collapsed
        let ratio = basic_ratio * 1;
        let p1 = {x: x + ratio, y: y};
        let p2 = {x: x - 0.5 * ratio, y: y - 1.866 * ratio};
        let p3 = {x: x - 0.5 * ratio, y: y + 1.866 * ratio};
        return "M" + pos2str(p2) + "L" + pos2str(p1) + "L" + pos2str(p3);
    }
    else if (type === 1){
        let ratio = basic_ratio * 1;
        let p1 = {x: x, y: y + ratio};
        let p2 = {x: x + 1.866 * ratio, y: y - 0.5 * ratio};
        let p3 = {x: x - 1.866 * ratio, y: y - 0.5 * ratio};
        return "M" + pos2str(p2) + "L" + pos2str(p1) + "L" + pos2str(p3);
    }
    else{
        return 1;
    }
}

const node_icon = function(x, y, type, basic_ratio){
    basic_ratio = basic_ratio || 4;
    if (type === 0){ // collapsed
        let ratio = basic_ratio * 1.8;
        let p1 = {x: x + ratio, y: y};
        let p2 = {x: x - 0.5 * ratio, y: y - 0.866 * ratio};
        let p3 = {x: x - 0.5 * ratio, y: y + 0.866 * ratio};
        return "M" + pos2str(p1) + "L" + pos2str(p2) + "L" + pos2str(p3) + "Z";
    }
    else if (type === 1){ //expanded
        let ratio = basic_ratio * 1.8;
        let p1 = {x: x, y: y + ratio};
        let p2 = {x: x + 0.866 * ratio, y: y - 0.5 * ratio};
        let p3 = {x: x - 0.866 * ratio, y: y - 0.5 * ratio};
        return "M" + pos2str(p1) + "L" + pos2str(p2) + "L" + pos2str(p3) + "Z";
    }
    else if (type === 2){ // leaf node
        let ratio = 0;
        return "M " + (x - ratio) + ", " + (y) + 
            "a" + ratio + ", " + ratio + " 0 1, 0 " + (ratio * 2) + ", 0" +  
            "a" + ratio + ", " + ratio + " 0 1, 0 " + (- ratio * 2) + ", 0"; 
    }
    else if (type === -1){
        return "M 0,0 L 0,0";
    }
    else{
        return 1;
    }
}

function plus_path_d(start_x, start_y, width, height, k) {
    let sum_k = 2 * k + 1;
    let x = [start_x, start_x + k / sum_k * width, start_x + (k + 1) / sum_k * width, start_x + width];
    let y = [start_y, start_y + k / sum_k * height, start_y + (k + 1) / sum_k * height, start_y + height];
    let d = `M${x[0]},${y[1]}`;
    d += `L${x[1]},${y[1]}`;
    d += `L${x[1]},${y[0]}`;
    d += `L${x[2]},${y[0]}`;
    d += `L${x[2]},${y[1]}`;
    d += `L${x[3]},${y[1]}`;
    d += `L${x[3]},${y[2]}`;
    d += `L${x[2]},${y[2]}`;
    d += `L${x[2]},${y[3]}`;
    d += `L${x[1]},${y[3]}`;
    d += `L${x[1]},${y[2]}`;
    d += `L${x[0]},${y[2]}`;
    d += `L${x[0]},${y[1]}`;
    return d;
}

function minus_path_d(start_x, start_y, width, height, k){
    let sum_k = 2 * k + 1;
    let x = [start_x, start_x  + width];
    let y = [start_y + k / sum_k * height, start_y + (k + 1) / sum_k * height];
    let d = `M${x[0]},${y[0]}`; 
    d += `L${x[1]},${y[0]}`
    d += `L${x[1]},${y[1]}`
    d += `L${x[0]},${y[1]}`;
    return d;
}

function half_rounded_rect(x, y, w, h, r_left, r_right){
    // assert(w > 2 * r, "w > 2 * r")
    // assert(h > r, "h > r")
    let p1 = {x: x, y: y};
    let p2 = {x: x + w, y: y};
    let p3 = {x: x + w, y: y + h - r_right};
    let delta4 = {x: -r_right, y: r_right};
    let p5 = {x: x + r_left, y: y + h};
    let delta6 = {x: -r_left, y: - r_left};
    return "M" + pos2str(p1) + "L" + pos2str(p2) + "L" + pos2str(p3) + "a" + r_right + ", " + r_right
        + " 0,0,1 " + pos2str(delta4) + "L" + pos2str(p5) +  "a" + r_left + ", " + r_left 
        + " 0,0,1 " + pos2str(delta6) + "z";
}

const get_path_of_page_btn = function(x, y, width, height, direction){
    let path = '';
    if (direction === 'up') {
        for (let j = 0;j < 2;j++) {
            let points = []
            for (let i = 0;i < 3;i++) {
                points.push(`${x + i / 2 * width},${y + (j + 1 - i % 2) / 2 * height}`);
            }
            path += 'M' + points.join('L');
        }
    }
    else if (direction === 'down') {
        for (let j = 0;j < 2;j++) {
            let points = []
            for (let i = 0;i < 3;i++) {
                points.push(`${x + i / 2 * width},${y + (j + i % 2) / 2 * height}`);
            }
            path += 'M' + points.join('L');
        }
    }
    else if (direction === 'left') {
        for (let j = 0;j < 2;j++) {
            let points = []
            for (let i = 0;i < 3;i++) {
                points.push(`${x + (j + 1 - i % 2) / 2 * width}, ${y + i / 2 * height}`);
            }
            path += 'M' + points.join('L');
        }
    }
    else if (direction === 'right') {
        for (let j = 0;j < 2;j++) {
            let points = []
            for (let i = 0;i < 3;i++) {
                points.push(`${x + (j + i % 2) / 2 * width}, ${y + i / 2 * height}`);
            }
            path += 'M' + points.join('L');
        }
    }
    return path;
}

function disable_global_interaction(){
    d3.select(".loading")
        .style("display", "block")
        .style("opacity", 0.5);
}

function enable_global_interaction(delay){
    delay = delay || 1;
    d3.select(".loading")
        .transition()
        .duration(1)
        .delay(delay)
        .style("display", "none")
        .style("opacity", 1);

}


function begin_loading(){
    // $(".loading").show();
    // $(".loading-svg").show();
    d3.select(".loading")
    .style("display", "block");
    d3.select(".loading-svg")
        .style("display", "block");
  }
function end_loading(delay){
    delay = delay || 1;
    console.log("delay", delay);
    d3.select(".loading")
        .transition()
        .duration(1)
        .delay(delay)
        .style("display", "none");
    d3.select(".loading-svg")
        .transition()
        .duration(1)
        .delay(delay)
        .style("display", "none");
  }



export {
    GrayColor,
    DarkGray,
    DeepGray,
    LightGray,
    Orange,
    BoxRed,
    Animation,
    WindowHeight,
    Red,
    d_rollback,
    d_scan,
    d_select,
    linked_highlight,
    get_path_of_page_btn,
    deepCopy,
    tree_line,
    getTextWidth,
    set_line,
    collapse_icon,
    node_icon,
    plus_path_d,
    minus_path_d,
    half_rounded_rect,
    begin_loading,
    end_loading,
    disable_global_interaction,
    enable_global_interaction
}