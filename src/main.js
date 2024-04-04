/*
  V0.3
*/

/*
  Chance RNG
*/
import "../lib/chance.min.js"
const chance = new Chance()

/*
  Storage - localforage
  https://localforage.github.io/localForage/
*/
import "../lib/localforage.min.js"

/*
  SVG
  https://svgjs.dev/docs/3.0/getting-started/
*/

/*
  UI Resources  
*/
//Preact
import {h, Component, render} from 'https://unpkg.com/preact?module';
import htm from 'https://unpkg.com/htm?module';
// Initialize htm with Preact
const html = htm.bind(h);

// capitalizes first character of a string
String.prototype.capitalize = function() {
  if (this) {
    return this.substr(0, 1).toUpperCase() + this.substr(1);
  } else {
    return '';
  }
}
;
// standard clamp function -- clamps a value into a range
Math.clamp = function(a, min, max) {
  return a < min ? min : (a > max ? max : a);
}
;

// linear interpolation from a to b by parameter t
Math.lerp = function(a, b, t) {
  return a * (1 - t) + b * t;
}
;

/*
  App Sub UI
*/
import {Galaxy} from './galaxy.js';
import*as UI from './UI.js';

/*
  Declare the main App 
*/

class App extends Component {
  constructor() {
    super();
    this.state = {
      show: "Wanderer",
      reveal: [],
      dialog: "",
      //for UI selection 
      galaxyView: "Sector",
      isometric: "Flat",
      mission: "",
      filter: "",
      filterSystem: "All",
      selection: "",
      selected: "",
    };

    //use in other views 
    this.html = html

    //generate 
    this.galaxy = new Galaxy(this)
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    this.show = "Wanderer"
    //const canvas = document.getElementById("renderCanvas");
    // Get the canvas element
    //this.engine = new BABYLON.Engine(canvas,true);

    /*
    // Register a render loop to repeatedly render the scene
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    // Watch for browser/canvas resize events
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
	*/
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {}

  //Get data 
  get sector() {
    return this.galaxy.sector
  }
  get region() {
    return this.galaxy.region
  }

  /*
    Render functions 
  */

  notify(text, type="success") {
    let opts = {
      theme: "relax",
      type,
      text,
      layout: "center"
    }

    new Noty(opts).show();
  }

  //main function for updating state 
  async updateState(what, val="") {
    let s = {}
    s[what] = val
    await this.setState(s)

    this.galaxy.display(what=="show"? val : this.state.show)
  }
  refresh() {
    this.show = this.state.show
    this.dialog = this.state.dialog
  }

  set show(what) {
    this.updateState("show", what)
  }

  get show() {
    let[what,id] = this.state.show.split(".")
    return UI[what] ? UI[what](this) : this[what] ? this[what][id].UI ? this[what][id].UI() : "" : ""
  }

  set dialog(what) {
    this.state.newData = undefined
    this.state.selected = ""
    this.updateState("dialog", what)
  }

  get dialog() {
    let[what,id] = this.state.dialog.split(".")
    return what == "" ? "" : UI.Dialog(this)
  }

  //clears current UI 
  cancel() {
    this.show = ""
    this.dialog = "Main"
  }

  //main page render 
  render({}, {show, active, selected, filter, filterSystem, isometric, galaxyView}) {
	  
    //final layout 
    return html`
    <div class="relative flex flex-wrap items-center justify-between ph3 z-2">
      <div>
        <h1 class="pointer underline-hover mv2" onClick=${()=>this.cancel()}>Verse: ${show.split(".")[0]}</h1>
      </div>
      <div class="flex items-center">
		  <div class="dropdown w-100 ma1">
			<div class="tc pointer dim underline-hover hover-blue db pa1 ba br2">Menu</div>
			<div class="dropdown-content w-100 bg-white ba bw1 pa1">
				<div class="link pointer underline-hover" onClick=${()=>this.show = "Heralds"}>Heralds</div>
				<div class="link pointer underline-hover" onClick=${()=>this.show = "Frontier"}>Frontier</div>
				<div class="link pointer underline-hover" onClick=${()=>this.show = "Wanderer"}>Wanderer</div>
			</div>
		  </div>
      </div>
    </div>
    <div class="absolute z-1 w-100 h-100 pa2">
      ${this.show}
    </div>
    ${this.dialog}
    `
  }
}
//<canvas id="renderCanvas"></canvas>
render(html`<${App}/>`, document.body);
