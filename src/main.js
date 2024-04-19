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
const DB = localforage.createInstance({
  name: "VerseEras",
  storeName: 'favorites',
})
/*
  SVG
  https://svgjs.dev/docs/3.0/getting-started/
*/

/*
  UI Resources  
*/
//Preact
import {h, Component, render} from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';
// Initialize htm with Preact
const html = htm.bind(h);

//Simple roman numeral conversion 
Number.prototype.romanNumeral = function() {
  let n = this
  var units = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

  if (n < 0 || n >= 20) {
    return n;
  } else if (n >= 10) {
    return "X" + (n - 10).romanNumeral();
  } else {
    return units[n];
  }
}

//Simple roman numeral conversion 
Number.prototype.suffix = function() {
  let n = this % 10

  if (this <= 0) {
    return n;
  } else if (this > 3 && this < 20) {
    return this + 'th';
  } else {
    return this + ['st', 'nd', 'rd'][n - 1];
  }
}

//clamp a number to a value 
Number.prototype.clamp = function  (min,max) {
  return this > max ? max : this < min ? min : this
}

//sum for array 
Array.prototype.sum = function () {
  return this.reduce((s,v)=>s+=v,0)
}

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
const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]

class App extends Component {
  constructor() {
    super();
    this.state = {
      saves : [],
      show: "Galaxy",
      sub: "",
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
      showBars : [true,true],
      //time keeping 
      period : 60, //ticks to a day 
      tick : [0,0,0]
    };

    this.DB = DB
    //use in other views 
    this.html = html
    //generate 
    this.galaxy = new Galaxy(this)
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    //display galaxy
    this.galaxy.display()

    //now get ids for saves 
    DB.iterate((value,key,iterationNumber)=>{
      // Resulting key/value pair
      this.state.saves.push(value)
    }
    ).then(() => this.refresh())

    //timer 
    setInterval(()=>{
      this.tick()
    }, 1000)
    
    //Watch for browser/canvas resize events
    window.addEventListener("resize", ()=>{
      this.galaxy.display()
      this.refresh()
    }
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {}

  tick () {
    let {period,tick} = this.state 
    //clock timing 
    tick[0]++
    //check for day and year 
    if(tick[0]==period){
      tick[1]++
      tick[0]=0
    }
    if(tick[1]==365){
      tick[2]++
      tick[1]=0
    }
    this.setState({tick})
  }

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

    this.galaxy.display()
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
    let G = this.galaxy

    //final layout 
    return html`
	<div class="absolute z-0 top-0 left-0 w-100 h-100 pa2">
      ${this.show}
    </div>
    ${this.dialog}
    `
  }
}
//<canvas id="renderCanvas"></canvas>
render(html`<${App}/>`, document.body);

function reportWindowSize() {
  heightOutput.textContent = window.innerHeight;
  widthOutput.textContent = window.innerWidth;
}

window.onresize = reportWindowSize;
