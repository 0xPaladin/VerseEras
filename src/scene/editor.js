/*
  V0.3
*/

/*
  UI Resources  
*/
//Preact
import { h, render, Component } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';

/*
  Mixins for standard functions
  Array, Math, Sting...
*/
import "../utils/mixins.js"
// Initialize htm with Preact
const html = _.html = htm.bind(h);

/*
  Chance RNG
*/
import "../../lib/chance.slim.js"
const chance = new Chance()

/*
  Storage - localforage
  https://localforage.github.io/localForage/
*/
import "../../lib/localforage.min.js"
const DB = localforage.createInstance({
  name: "VerseEras",
  storeName: 'favorites',
})

/*
  App Sub UI
*/
import * as Scenarios from "../scenarios/index.js"
import { Scene } from "./scene.js"
import * as UI from "../ui/UI.js"

/*
  Declare the main App 
*/

class App extends Component {
  constructor() {
    super();
    this.state = {
      tick: 0,
      saves: [],
      show: "",
      reveal: new Set(),
      selection: new Map([["crew-edit", {}]]),
      dialog: "",
      unlocked : {}
    };

    //set unlocked for each chapter 
    Object.keys(Scenarios).forEach(s => this.state.unlocked[s] = [])

    this.DB = DB
    //use in other views 
    this.html = html

    window.App = this;
    _.app = this

    //update selection 
    _.AppSelect = function(key, val) {
      let A = window.App
      A.refresh(A.state.selection.set(key, val))
    }

    //whether to show or not based upon unlocked
    _.show = function(key) {
      let [chapter,id] = key.split(",")
      return window.App.state.unlocked[chapter].includes(id)
    }
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {

    //timer 
    setInterval(() => {
      this.tick()
    }
      , 1000)
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() { }

  tick() {
    let tick = this.state.tick + 1
    this.setState({
      tick
    })
  }

  /*
    Game Functions 
  */
  setUnlock (u) {
    u.forEach(ukey => {
      let [chapter,key] = ukey.split(",")
      this.state.unlocked[chapter].includes(key) ? null : this.state.unlocked[chapter].push(key)
    })
  }

  /*
    Render functions 
  */

  notify(text, type = "success") {
    let opts = {
      theme: "relax",
      type,
      text,
      layout: "center"
    }

    new Noty(opts).show();
  }

  //main function for updating state 
  async updateState(what, val = "") {
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
    let [what, id] = this.state.show.split(".")
    return UI[what] ? UI[what](this) : this[what] ? (this[what].UI || this[what][id].UI()) : ""
  }

  set dialog(what) {
    this.state.newData = undefined
    this.state.selected = ""
    this.updateState("dialog", what)
  }

  get dialog() {
    let [what, id] = this.state.dialog.split(".")
    return what == "" ? "" : UI.Dialog(this)
  }

  //clears current UI 
  cancel() {
    this.show = ""
    this.dialog = ""
  }

  //main page render 
  render({ }, { show, selection }) {
    let sid = selection.get("scene-select") || []

    //final layout 
    return html`
	<div class="absolute z-1 top-0 left-0 w-100 h-100 pa2">
      <div class="fr flex ma2">
        <select class="pa1" value=${sid} onChange=${(e) => _.AppSelect("scene-select", e.currentTarget.value)}>
          ${Object.entries(Scenarios).map(([chapter, scenes]) => Object.keys(scenes).map(s => {
      return html`<option value=${[chapter, s]}>${chapter} - ${s}</option>`
    }))}
        </select>
        <div class="btn bg-light-green pa1 ph3 mh2" onClick=${() => Scene.enter(sid)}>Enter</div>
        <div class="btn bg-light-green pa1 ph3">Clear</div>
      </div>
      <div class="z-5 fr ma2">
        ${UI.TOC()}
        <div class="f3 btn bg-light-gray br2 p1"><img src="img/lantern.png" width="40"></img></div>
      </div>
      ${this.show}
    </div>
    ${this.dialog}
    `
  }
}
//<canvas id="renderCanvas"></canvas>
render(html`<${App}/>`, document.body);
