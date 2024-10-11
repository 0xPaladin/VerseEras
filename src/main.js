/*
  V0.3
*/

/*
  UI Resources  
*/
//Preact
import {h, Component, render} from '../lib/preact.module.js';
import htm from '../lib/htm.module.js';

/*
  Mixins for standard functions
  Array, Math, Sting...
*/
import "./mixins.js"
// Initialize htm with Preact
const html = _.html = htm.bind(h);

/*
  Chance RNG
*/
import "../lib/chance.slim.js"
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
  App Sub UI
*/
import {Galaxy} from './galaxy.js';
import*as UI from './ui/UI.js';

/*
  Declare the main App 
*/
const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]

class App extends Component {
  constructor() {
    super();
    this.state = {
      tick: 0,
      saves: [],
      show: "Generate",
      reveal: new Set(),
      selection: new Map([["crew-edit", {}]]),
      dialog: ""
    };

    this.DB = DB
    //use in other views 
    this.html = html

    window.App = this;
    _.app = this

    _.AppSelect = function(key, val) {
      let A = window.App
      A.refresh(A.state.selection.set(key, val))
    }
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    this.show = localStorage.getItem("show") || "About"
    //generate 
    this.galaxy = new Galaxy(this)
    //display galaxy
    this.galaxy.display()

    //now get ids for saves 
    DB.iterate( (value, key, iterationNumber) => {
      // Resulting key/value pair
      this.state.saves.push(value)
    }
    ).then( () => {
      let _last = this.state.saves.find(s => s.seed == localStorage.getItem("last")) || null
      if (_last != null) {
        this.load(_last)
      } else {
        this.refresh()
      }
    }
    )

    //timer 
    setInterval( () => {
      this.tick()
    }
    , 1000)

    //Watch for browser/canvas resize events
    window.addEventListener("resize", () => {
      this.galaxy.display()
      this.refresh()
    }
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {}

  tick() {
    let tick = this.state.tick + 1
    this.setState({
      tick
    })
  }

  new() {
    this.galaxy = new Galaxy(this)
    this.galaxy.display()
    this.refresh()
  }

  //load galaxy 
  async load(opts) {
    let G = this.galaxy = new Galaxy(this,opts)
    this.refresh()
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
  }
  refresh() {
    this.show = this.state.show
    this.dialog = this.state.dialog
  }

  set show(what) {
    localStorage.setItem("show", what)
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
	<div class="absolute z-1 top-0 left-0 w-100 h-100 pa2">
      <div class="fr ma2">${UI.TOC()}</div>
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
