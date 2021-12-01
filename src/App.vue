<template>
  <v-app style="position: relative;">
    <v-main>
        <v-container fluid class="main-background fill-height pa-0">
          <app-detection></app-detection>
          <v-col cols="3" class="info-panel" style="height: 98%; padding-left: 0" align-self="start">
<!--            <v-row>-->
            <v-col cols="12" class="topname fill-width"> Information </v-col>
            <v-col cols="12" class="other-view fill-height">
            <!-- <app-action-trail></app-action-trail> -->

                <app-text></app-text>
                <app-image></app-image>
              </v-col>
<!--          </v-row>-->
          </v-col>


      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {mapActions} from "vuex"
// import ActionTrail from './components/ActionTrail.vue'
import CapText from './components/Text.vue'
import DetImage from './components/Image.vue'
import Detection from "./components/Detection.vue"
import * as Global from "./plugins/global";
export default {
  name: 'App', 
  components:{
    // "app-action-trail": ActionTrail,
    "app-detection": Detection,
    "app-text": CapText,
    "app-image": DetImage,
  },
  data: () => ({
  }),
  methods:{
    ...mapActions([
      "fetch_manifest"
    ]),
    resize(){

    },
    add(){
      // this.$store.commit('edit');
      console.log("add data");
      // this.$store.dispatch("fetch_history", 1);
    },
  },
  watch:{
    loader () {
      const l = this.loader
      this[l] = !this[l]

      setTimeout(() => (this[l] = false), 30000)

      this.loader = null
    },
  },
  async mounted(){
    this.resize();
    Global.begin_loading();
    await this.$store.dispatch("fetch_manifest", 
    {"step": "step1", "dataset": "COCO17"});
    await this.$store.dispatch("fetch_hypergraph", 1);
    // await this.$store.dispatch("fetch_grid_", {});
    // this.$store.dispatch("fetch_history", 1);
    Global.end_loading(1500);
  }
};
</script>

<style>

.loading {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: gray;
    opacity: 0.8;
    display: flex;
    justify-content: center;
    align-items: center;
}

.loading-svg {
    position: absolute;
    left: 50%;
    top: 45%;
}

.circle-path {
  transform: translate(15px,15px);
/*   transform-origin: center; */
  animation: rotate_arrow 2s infinite;
}


@keyframes rotate_arrow {
  from {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    99.999% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
    to {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
}

.popup-visible {
    position: absolute;
    z-index: 10;
    visibility: visible;
}

.popup-hidden {
    position: absolute;
    z-index: 10;
    visibility: hidden;
}

.main-background {
  /* height: 99%; */
  background-color: #ffffff;
  padding: 0px 0px 0px 0px;
}

.other-view {
  border: 1px solid #c1c1c1;
  padding-bottom: 0;
  padding-top: 0;
  border-radius: 5px;
}


/* .action-trail-view {
  height: 33%;
} */


.custom-loader {
  animation: loader 1s infinite;
  display: flex;
}
@-moz-keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@-webkit-keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@-o-keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
/* Layout
------------ */

.d3-context-menu {
	position: absolute;
	min-width: 150px;
	z-index: 1200;
}

.d3-context-menu ul,
.d3-context-menu ul li {
	margin: 0;
	padding: 0;
}

.d3-context-menu ul {
	list-style-type: none;
	cursor: default;
}

.d3-context-menu ul li {
	-webkit-touch-callout: none; /* iOS Safari */
	-webkit-user-select: none;   /* Chrome/Safari/Opera */
	-khtml-user-select: none;    /* Konqueror */
	-moz-user-select: none;      /* Firefox */
	-ms-user-select: none;       /* Internet Explorer/Edge */
	user-select: none;
}

/*
	Disabled
*/

.d3-context-menu ul li.is-disabled,
.d3-context-menu ul li.is-disabled:hover {
	cursor: not-allowed;
}

/*
	Divider
*/

.d3-context-menu ul li.is-divider {
	padding: 0;
}

/* Theming
------------ */

.d3-context-menu-theme {
	background-color: #f2f2f2;
	border-radius: 4px;

	font-family: Arial, sans-serif;
	font-size: 14px;
	border: 1px solid #d4d4d4;
}

.d3-context-menu-theme ul {
	margin: 4px 0;
}

.d3-context-menu-theme ul li {
	padding: 4px 16px;
}

.d3-context-menu-theme ul li:hover {
	background-color: #4677f8;
	color: #fefefe;
}

/*
	Header
*/

.d3-context-menu-theme ul li.is-header,
.d3-context-menu-theme ul li.is-header:hover {
	background-color: #f2f2f2;
	color: #444;
	font-weight: bold;
	font-style: italic;
}

/*
	Disabled
*/

.d3-context-menu-theme ul li.is-disabled,
.d3-context-menu-theme ul li.is-disabled:hover {
	background-color: #f2f2f2;
	color: #888;
}

/*
	Divider
*/

.d3-context-menu-theme ul li.is-divider:hover {
	background-color: #f2f2f2;
}

.d3-context-menu-theme ul hr {
	border: 0;
	height: 0;
	border-top: 1px solid rgba(0, 0, 0, 0.1);
	border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

/*
	Nested Menu
*/
.d3-context-menu-theme ul li.is-parent:after {
	border-left: 7px solid transparent;
	border-top: 7px solid red;
	content: "";
	height: 0;
	position: absolute;
	right: 8px;
	top: 35%;
	transform: rotate(45deg);
	width: 0;
}

.d3-context-menu-theme ul li.is-parent {
	padding-right: 20px;
	position: relative;
}

.d3-context-menu-theme ul.is-children {
	background-color: #f2f2f2;
	border: 1px solid #d4d4d4;
	color: black;
	display: none;
	left: 100%;
	margin: -5px 0;
	padding: 4px 0;
	position: absolute;
	top: 0;
	width: 100%;
}

.d3-context-menu-theme li.is-parent:hover > ul.is-children {
	display: block;
}
/* diable scrollbar on the right */
/* ::-webkit-scrollbar {display:none;}  */


</style>
