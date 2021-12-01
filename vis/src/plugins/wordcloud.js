// import * as d3 from "d3";

function wordcloud() {
    let size = [256, 256],
      center = null,
      text = cloudText,
      font = cloudFont,
      fontSize = cloudFontSize,
      fontStyle = cloudFontNormal,
      fontWeight = cloudFontNormal,
      padding = cloudPadding,
      rangex = cloudRangex,
      rangey = cloudRangey,
      expandx = cloudExpandx,
      expandy = cloudExpandy,
      flexible = cloudFlexible,
      barriers = [],
      words = [],
      grid_step = 4,
      grid_size = 20
  
    const self = {}
  
    const align = (x) => x - x % grid_size
    let rows = [], cols = [], rects = [], nFixedRect = 0
    self.addRect = function (top, left, bottom, right) {
      let rect = [top, left, bottom, right]
      for (let i = align(top); i < bottom; i += grid_size) {
        if (!rows[i]) rows[i] = []
        rows[i].push(rect)
      }
      for (let j = align(left); j < right; j += grid_size) {
        if (!cols[j]) cols[j] = []
        cols[j].push(rect)
      }
      rects.push(rect)
    }
  
    // function forceCollide() {
    //   let nodes
  
    //   function force() {
    //     const quad = d3.quadtree(nodes, d => d.x, d => d.y);
    //     for (const d of nodes) {
    //       quad.visit((q) => {
    //         let updated = false;
    //         if (q.data && q.data !== d) {
    //           let x = d.x - q.data.x,
    //             y = d.y - q.data.y,
    //             xSpacing = padding + (q.data.width + d.width) / 2,
    //             ySpacing = padding + (q.data.height + d.height) / 2,
    //             absX = Math.abs(x),
    //             absY = Math.abs(y),
    //             l,
    //             lx,
    //             ly;
  
    //           if (absX < xSpacing && absY < ySpacing) {
    //             l = Math.sqrt(x * x + y * y);
  
    //             lx = (absX - xSpacing) / l;
    //             ly = (absY - ySpacing) / l;
  
    //             // the one that's barely within the bounds probably triggered the collision
    //             if (Math.abs(lx) > Math.abs(ly)) {
    //               lx = 0;
    //             } else {
    //               ly = 0;
    //             }
    //             d.x -= x *= lx;
    //             d.y -= y *= ly;
    //             q.data.x += x;
    //             q.data.y += y;
  
    //             updated = true;
    //           }
    //         }
    //         return updated;
    //       });
    //     }
    //   }
  
    //   force.initialize = _ => nodes = _;
  
    //   return force;
    // }
  
    self.checkVectical = function (lines) {
      if (!Array.isArray(lines)) {
        lines = [lines]
      } else {
        lines = lines.sort()
      }
  
      let s = []
      for (let i = 0; i < lines.length; ++i) {
        let x = lines[i], x0 = align(lines[i])
        if (cols[x0]) {
          for (let rect of cols[x0]) {
            if (rect[1] < x && x < rect[3]) {
              s.push([rect[0], rect[2]])
            }
          }
        }
      }
      s = s.sort((a, b) => a[0] - b[0])
  
      let ret = [], top = 0, bottom = 0
      for (let i = 0; i < s.length; ++i) {
        if (s[i][0] <= bottom) {
          if (s[i][1] > bottom) {
            bottom = s[i][1]
          }
        } else {
          ret.push(bottom)
          top = s[i][0]
          bottom = s[i][1]
          ret.push(top)
        }
      }
      ret.push(bottom)
      ret.push(size[1])
      return ret
    }
  
    self.checkHorizontal = function (lines) {
      if (!Array.isArray(lines)) {
        lines = [lines]
      } else {
        lines = lines.sort()
      }
  
      let s = []
      for (let i = 0; i < lines.length; ++i) {
        let y = lines[i], y0 = align(lines[i])
        if (rows[y0]) {
          for (let rect of rows[y0]) {
            if (rect[0] < y && y < rect[2]) {
              s.push([rect[1], rect[3]])
            }
          }
        }
      }
      s = s.sort((a, b) => a[0] - b[0])
  
      let ret = [], left = 0, right = 0
      for (let i = 0; i < s.length; ++i) {
        if (s[i][0] <= right) {
          if (s[i][1] > right) {
            right = s[i][1]
          }
        } else {
          ret.push(right)
          left = s[i][0]
          right = s[i][1]
          ret.push(left)
        }
      }
      ret.push(right)
      ret.push(size[0])
      return ret
    }
  
    // self.start = async () => {
    self.start =  () => {
      let cw = 1 << 11 >> 5, ch = 1 << 11, canvas
      if (typeof document !== "undefined") {
        canvas = document.createElement("canvas")
        canvas.width = 1
        canvas.height = 1
        canvas.width = (cw << 5)
        canvas.height = ch
      } else {
        canvas = new canvas(cw << 5, ch)
      }
  
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = ctx.strokeStyle = "red"
      ctx.textAlign = "center"
  
      function measure(d) {
        ctx.save()
        ctx.font = `${d.style} ${d.weight} ${d.size}px ${d.font}`
        let ret = ctx.measureText(d.text)
        const width = ret.actualBoundingBoxRight + ret.actualBoundingBoxLeft
        let height = ret.actualBoundingBoxAscent + 1 //ret.actualBoundingBoxDescent
        const dx = ret.actualBoundingBoxRight - ret.actualBoundingBoxLeft
        let dy = ret.actualBoundingBoxDescent / 2
        ctx.restore()
        // TODO: hack the wordcloud
        if (d.text.indexOf('p') != -1 || d.text.indexOf('g') != -1 || d.text.indexOf('q') != -1 || d.text.indexOf('y') != -1) {
          dy -= height * 0.2
          height *= 1.2
          console.log(d.text)
        }
        /*
        if (d.text.indexOf('l') != -1 || d.text.indexOf('h') != -1 || d.text.indexOf('t') != -1 || d.text.indexOf('b') != -1 || d.text.indexOf('f') != -1) {
          dy -= d.height * 0.1
          height *= 1.1
        }
        */
        return [width, height, dx, dy]
      }
  
      words.forEach((d, index) => {
        d.text = text(d, index)
        d.font = font(d, index)
        d.size = fontSize(d, index)
        d.style = fontStyle(d, index)
        d.weight = fontWeight(d, index)
        d.padding = padding(d, index)
        d.rangex = rangex(d, index)
        d.rangey = rangey(d, index)
        d.expandx = expandx(d, index)
        d.expandy = expandy(d, index)
        d.flexible = flexible(d, index)
      })
  
      let data = words
  
      data.forEach(d => {
        const x = measure(d)
        d.width = x[0] + d.padding + d.expandx
        d.height = x[1] + d.padding + d.expandy
        if (d.flexible && d.width > size[0] * 0.95) {
          let scale = (x[0] * 0.95) / (size[0] - d.padding - d.expandx)
          d.width = x[0] / scale + d.padding + d.expandx
          d.height = x[1] / scale + d.padding + d.expandy
          d.size = d.size / scale
        }
        d.dx = d.padding / 2 - x[2]
        d.dy = d.padding / 2 + x[3]
        d.display = false
      })
      data.sort((a, b) => { return b.size - a.size })
  
      if (!center) {
        center = [size[0] / 2, size[1] / 2]
      }
      for (let rect of barriers) {
        self.addRect(rect.y0, rect.x0, rect.y1, rect.x1)
      }
      nFixedRect = barriers.length
  
      for (let i = 0; i < data.length; ++i) {
        let d = data[i]
        if (d.text.length <= 1) {
          d.display = false
          continue
        }
        let mid = d.rangey[2] * size[1]
        let top_range = d.rangey[0] * size[1]
        let bottom_range = d.rangey[1] * size[1]
        let left_range = d.rangex[0] * size[0]
        let right_range = d.rangex[1] * size[0]
        let flag = 0, x, y
        for (let delta = 0; mid - delta >= top_range || mid + delta <= bottom_range; delta += grid_step) {
          if (flag) break
          for (let direction = -1; direction <= 1; direction += 2) {
            if (flag) break
            y = mid + delta * direction
            if (y < top_range || y > bottom_range
              || y - d.height / 2 < 0 || y + d.height / 2 > size[1]
              || delta == 0 && direction == 1) {
              continue
            }
            let s = self.checkHorizontal([y - d.height / 2, y - d.height / 4, y, y + d.height / 4, y + d.height / 2])
            let x0 = -1
            for (let i = 0; i < s.length; i += 2) {
              let left = Math.max(s[i], left_range), right = Math.min(s[i + 1], right_range)
              left += d.width / 2
              right -= d.width / 2
              if (right < left) {
                continue
              }
              if (left <= center[0] && center[0] <= right) {
                x0 = center[0]
                flag = 1
                break
              } else if (right <= center[0]) {
                x0 = right
              } else if (left >= center[0]) {
                if (Math.abs(center[0] - left) < Math.abs(center[0] - x0)) {
                  x0 = left
                }
              }
            }
            if (x0 != -1) {
              flag = 1
              let s = self.checkVectical([x0 - d.width / 2, x0 - d.width / 4, x0, x0 + d.width / 4, x0 + d.width / 2])
              for (let i = 0; i < s.length; i += 2) {
                let top = Math.max(s[i], top_range), bottom = Math.min(s[i + 1], bottom_range)
                top += d.height / 2
                bottom -= d.height / 2
                if (y < top || y > bottom) {
                  continue
                }
              }
              x = x0 - d.width / 2
              y = y + d.height / 2
              d.display = true
              self.addRect(y - d.height, x, y, x + d.width)
            }
          }
        }
      }
      for (let i = 0, j = nFixedRect; i < data.length; ++i) {
        if (data[i].display) {
          let pd = data[i].padding / 2
          data[i].width -= data[i].padding
          data[i].height -= data[i].padding
          rects[j][0] += data[i].dx
          rects[j][1] += data[i].dy
          rects[j][2] -= pd
          rects[j][3] -= pd
          ++j
        }
      }
  
      let previous_data = data
      data = data.filter(d => d.display)
  
      // const simulation = d3.forceSimulation(data)
      //   .force("x", d3.forceX(center[0] / 2).strength(0.05))
      //   .force("y", d3.forceY(center[1] / 2).strength(0.05))
      //   .force("collide", forceCollide())
  
      // for (let i = 0; i < 5; ++i) {
      //   // await simulation.tick()
      //   simulation.tick()
      // }
  
      data = previous_data
  
      for (let i = 0, j = nFixedRect; i < data.length; ++i) {
        if (data[i].display) {
          data[i].x = rects[j][1] + data[i].expandx // + data[i].width / 2
          data[i].y = rects[j][0] + data[i].height + data[i].expandy
          ++j
        } else {
          data[i].x = center[0] - data[i].width / 2
          data[i].y = size[1] * data[i].rangey[2] + data[i].height / 2
        }
      }
      // callback(data)
      return data;
    }
  
    self.data = function (x) {
      return arguments.length ? (words = x, self) : words
    }
  
    self.center = function (x) {
      if (arguments.length) {
        center = [+x[0], +x[1]]
        return self
      } else {
        return center
      }
    }
  
    self.size = function (x) {
      if (arguments.length) {
        size = [+x[0], +x[1]]
        rows = []
        cols = []
        return self
      } else {
        return size
      }
    }
  
    self.font = function (x) {
      return arguments.length ? (font = functor(x), self) : font
    }
  
    self.fontStyle = function (x) {
      return arguments.length ? (fontStyle = functor(x), self) : fontStyle
    }
  
    self.fontWeight = function (x) {
      return arguments.length ? (fontWeight = functor(x), self) : fontWeight
    }
  
    self.barriers = function (x) {
      return arguments.length ? (barriers = x, self) : barriers
    }
  
    self.text = function (x) {
      return arguments.length ? (text = functor(x), self) : text
    }
  
    self.expandx = function (x) {
      return arguments.length ? (expandx = functor(x), self) : expandx
    }
  
    self.flexible = function (x) {
      return arguments.length ? (flexible = functor(x), self) : flexible
    }
  
  
    self.expandy = function (x) {
      return arguments.length ? (expandy = functor(x), self) : expandy
    }
  
  
    self.rangex = function (x) {
      return arguments.length ? (rangex = functor(x), self) : rangex
    }
  
    self.rangey = function (x) {
      return arguments.length ? (rangey = functor(x), self) : rangey
    }
  
    self.flexible = function (x) {
      return arguments.length ? (flexible = functor(x), self) : flexible
    }
  
    self.fontSize = function (x) {
      return arguments.length ? (fontSize = functor(x), self) : fontSize
    }
  
    self.padding = function (x) {
      return arguments.length ? (padding = functor(x), self) : padding
    }
  
    function functor(x) {
      return typeof x === "function" ? x : function () { return x }
    }
  
    function cloudFlexible() {
      return 0
    }
  
    function cloudExpandx() {
      return 0
    }
  
    function cloudExpandy() {
      return 0
    }
  
    function cloudText(d) {
      return d.text
    }
  
    function cloudFont() {
      return "Arial"
    }
  
    function cloudFontNormal() {
      return "normal"
    }
  
    function cloudFontSize(d) {
      return Math.sqrt(d.value)
    }
  
    function cloudRangex() {
      return [0, 1, 0.5]
    }
  
    function cloudRangey() {
      return [0, 1, 0.5]
    }
  
    function cloudPadding() {
      return 1
    }
  
    return self
  }

  export {wordcloud}