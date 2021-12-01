<template>
  <div class="custom-tooltip"
    :style="{
      background: background,
      color: color,
      'font-size': `${fontsize}px`,
      width: `${width}px`,
      visibility: show ? 'visible' : 'hidden',
      opacity: show ? 1 : 0,
      left: `${fixed_left}px`,
      top: `${fixed_top}px`,
      transition: 'left 0.5s',
      transition: 'top 0.5s',
    }"
    ref="current_tooltip"
  >
  </div>
</template>
<script>
export default {
  data(){
    return {}
  },
  computed: {
    fixed_top() {
      const rect = document.getElementsByTagName('body')[0].getBoundingClientRect()
      const height = rect.height
      return Math.min(height - 30, this.top)
    },
    fixed_left() {
      const rect = document.getElementsByTagName('body')[0].getBoundingClientRect()
      const width = rect.width
      return Math.min(width - this.width, this.left)
    }
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    left: {
      type: Number,
      default: 0,
    },
    top: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      default: '',
    },
    fontsize: {
      type: Number,
      default: 18,
    },
    width: {
      type: Number,
      default: 40,
    },
    background: {
      type: String,
      default: 'rgba(20, 20, 20, .9)',
    },
    color: {
      type: String,
      default: 'white',
    }
  },
  watch: {
    content(val) {
      this.$refs.current_tooltip.innerHTML = val
    }
  }
}
</script>
<style scoped>
.custom-tooltip {
  font-family: "Roboto", sans-serif;
  border-radius: .3rem;
  display: block;
  position: absolute;
  padding: .1rem .6rem;
  word-wrap: break-word;
  white-space:normal;
  z-index: 300;
}
</style>