import * as d3 from "d3";
/**  svg-dropdown.js - svg dropdown library  */
function svgDropDown(options) {
    if (typeof options !== 'object' || options === null || !options.container) {
        console.error(new Error("Container not provided"));
        return;
    }
    const defaultOptions = {
        width: 200,
        members: [],
        fontSize: 12,
        color: "#333",
        fontFamily: "Calibri,Candara,Segoe,Segoe UI,Optima,Arial,sans-serif",
        x: 0,
        y: 0,
        changeHandler: function() {}
    };

    options = { ...defaultOptions,
        ...options
    };

    options.optionHeight = options.fontSize * 2;
    options.height = options.fontSize + 8;
    options.padding = 5;
    options.hoverColor = "#0c56f5";
    options.hoverTextColor = "#fff";
    options.bgColor = "#fff";
    options.width = options.width - 2;

    const g = options.container
        .append("svg")
        .attr("x", options.x)
        .attr("y", options.y)
        .attr("shape-rendering", "crispEdges")
        .append("g")
        .attr("transform", "translate(1,1)")
        .attr("font-family", options.fontFamily);

    let selectedOption =
        options.members.length === 0 ? {
        label: "",
        value: ""
        } :
        options.members[options.initMember];

    /** Rendering Select Field */
    const selectField = g.append("g");

    // background
    selectField
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.height)
        .attr("class", "option select-field")
        .attr("fill", options.bgColor)
        .style("stroke", "#a0a0a0")
        .style("stroke-width", "1");

    // text
    const activeText = selectField
        .append("text")
        .text(selectedOption.label)
        .attr("x", options.padding)
        .attr("y", options.height / 2 + options.fontSize / 3)
        .attr("font-size", options.fontSize)
        .attr("fill", options.color);

    // arrow symbol at the end of the select box
    selectField
        .append("text")
        .text("▼")
        .attr("x", options.width - options.fontSize - options.padding)
        .attr("y", options.height / 2 + (options.fontSize - 2) / 3)
        .attr("font-size", options.fontSize - 2)
        .attr("fill", options.color);

    // transparent surface to capture actions
    selectField
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.height)
        .style("fill", "transparent")
        .on("click", handleSelectClick);

    /** rendering options */
    const optionGroup = g
        .append("g")
        .attr("transform", `translate(0, ${options.height})`)
        .attr("opacity", 0); //.attr("display", "none"); Issue in IE/Firefox: Unable to calculate textLength when display is none.

    // Rendering options group
    const optionEnter = optionGroup
        .selectAll("g")
        .data(options.members)
        .enter()
        .append("g")
        .on("click", handleOptionClick);

    // Rendering background
    optionEnter
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.optionHeight)
        .attr("y", function(d, i) {
        return i * options.optionHeight;
        })
        .attr("class", "option")
        .style("stroke", options.hoverColor)
        .style("stroke-dasharray", (d, i) => {
        let stroke = [
            0,
            options.width,
            options.optionHeight,
            options.width,
            options.optionHeight
        ];
        if (i === 0) {
            stroke = [
            options.width + options.optionHeight,
            options.width,
            options.optionHeight
            ];
        } else if (i === options.members.length - 1) {
            stroke = [0, options.width, options.optionHeight * 2 + options.width];
        }
        return stroke.join(" ");
        })
        .style("stroke-width", 1)
        .style("fill", options.bgColor);

    // Rendering option text
    optionEnter
        .append("text")
        .attr("x", options.padding)
        .attr("y", function(d, i) {
        return (
            i * options.optionHeight +
            options.optionHeight / 2 +
            options.fontSize / 3
        );
        })
        .text(function(d) {
        return d.label;
        })
        .attr("font-size", options.fontSize)
        .attr("fill", options.color)
        .each(wrap);

    // Rendering option surface to take care of events
    optionEnter
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.optionHeight)
        .attr("y", function(d, i) {
        return i * options.optionHeight;
        })
        .style("fill", "transparent")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    //once the textLength gets calculated, change opacity to 1 and display to none
    optionGroup.attr("display", "none").attr("opacity", 1);

    d3.select("body").on("click", function() {
        optionGroup.attr("display", "none");
    });

    // Utility Methods
    function handleMouseOver(event) {
        d3.select(event.target.parentNode)
        .select(".option")
        .style("fill", options.hoverColor);

        d3.select(event.target.parentNode)
        .select("text")
        .style("fill", options.hoverTextColor);
    }

    function handleMouseOut(event) {
        d3.select(event.target.parentNode)
        .select(".option")
        .style("fill", options.bgColor);

        d3.select(event.target.parentNode)
        .select("text")
        .style("fill", options.color);
    }

    function handleOptionClick(event, d) {
        event.stopPropagation();
        selectedOption = d;
        activeText.text(selectedOption.label).each(wrap);
        typeof options.changeHandler === 'function' && options.changeHandler.call(this, d);
        optionGroup.attr("display", "none");
    }

    function handleSelectClick(event) {
        console.log(event);
        event.stopPropagation();
        const visibility = optionGroup.attr("display") === "block" ? "none" : "block";
        optionGroup.attr("display", visibility);
    }

    // wraps words
    function wrap() {
        const width = options.width;
        const padding = options.padding;
        const self = d3.select(this);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        const textArr = text.split(/\s+/);
        let lastWord = "";
        while (textLength > width - 2 * padding && text.length > 0) {
        lastWord = textArr.pop();
        text = textArr.join(" ");
        self.text(text);
        textLength = self.node().getComputedTextLength();
        }
        self.text(text + " " + lastWord);

        // providing ellipsis to last word in the text
        if (lastWord) {
        textLength = self.node().getComputedTextLength();
        text = self.text();
        while (textLength > width - 2 * padding && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + "...");
            textLength = self.node().getComputedTextLength();
        }
        }
    }
    }
export {svgDropDown}