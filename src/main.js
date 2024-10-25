/*
  V0.3
*/

/*
  Mixins for standard functions
  Array, Math, Sting...
*/
import "./utils/mixins.js"

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
const html = _.html = htm.bind(h);

/*
  App Sub UI
*/
import {Galaxy} from './galaxy/galaxy.js';
import*as UI from './ui/UI.js';

/*
  Declare the main App 
*/
const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Cosmic"]

class App extends Component {
  constructor() {
    super();
    this.state = {
      saves : [],
      show: "galaxy",
      dialog: "",
      reveal: new Set(),
      selection: new Map([["crew-edit", {}]]),
      unlocked : {},
      //for UI selection 
      galaxyView: "Sector",
      isometric: "Flat",
      mission: "",
      filter: "",
      filterSystem: "All",
      //time keeping 
      tick : 0
    };

    //focus object 
    this._focus = {}

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
      let u = window.App.state.unlocked
      let [chapter,id] = key.split(",")
      return u[chapter] ? u[chapter].includes(id) : false 
    }
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    //generate 
    this._focus = this.galaxy = new Galaxy(this)
    //display galaxy
    this.galaxy.display()

    //now get ids for saves 
    DB.iterate((value,key,iterationNumber)=>{
      // Resulting key/value pair
      this.state.saves.push(value)
    }
    ).then(() => {
      let _last = this.state.saves.find(s=>s.seed == localStorage.getItem("last")) || null
      if(_last != null){
        this.load(_last)
      }
      else {this.refresh()}
    })

    //timer 
    setInterval(()=>{
      let tick = this.state.tick+1
      this.setState({tick}) 
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

  /*
    Game Functions 
  */
  setUnlock (u) {
    u.forEach(ukey => {
      let [chapter,key] = ukey.split(",")
      this.state.unlocked[chapter].includes(key) ? null : this.state.unlocked[chapter].push(key)
    })
  }
  
  //load galaxy 
  async load(opts) {
    let G = this.galaxy = new Galaxy(this,opts)
    this.refresh()
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
    this.updateState("show", what)
    //display 
    this._focus.display ? this._focus.display() : null 
  }

  get show() {
    let [what] = this.state.show.split(".")
    //chain of display - main ui, subcomponent ui, sub UI 
    return UI[what] ? UI[what](this) : (this._focus.UI || "")
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
    this.dialog = ""
  }

  //main page render 
  render({}, {show,selection}) {
    let G = this.galaxy || {}
    let _f = this._focus
    let sectorSelect = selection.get("select-sector") || ""
    let systemSelect = selection.get("select-system") || ""
    let eraSelect = selection.get("select-era") || "Cosmic"

    let depth = ["galaxy","sector","system"].indexOf(show)
    let _select = [sectorSelect,systemSelect,""][depth]

    //final layout 
    return html`
	<div class="absolute z-0 top-0 left-0 w-100 h-100 pa2">
      <canvas id="starryHost" class="w-100 h-100 ${show=='galaxy'?'':'dn'}"></canvas>
      <div id="map" class="z-0 absolute top-0 left-0 w-100 h-100 pa2"></div>
      ${this.show}
      <div class="absolute top-0 left-0 pa2 ma1" style="max-width: 20rem;background-color: rgba(255,255,255,0.5);"> 
        <h2 class="flex ma0" onClick=${()=>this.refresh()}>
        	<span>Verse :: </span> 
        	<div class="ml2 dropdown" style="direction: ltr;">
              <div class="pointer underline-hover hover-blue">${eraSelect}</div>
              <div class="dropdown-content w-100 bg-white ba bw1 pa1">
        		${(G.eraList || []).map(e=>html`<div class="f4 link pointer underline-hover ma2" onClick=${()=>_.AppSelect("select-era",e)}>${e}</div>`)}
              </div>
          </div>
        </h2>
        <h3 class="ma0 pv1">	
          <div class="flex items-center flex-wrap">
            <div class="b pointer underline-hover hover-blue mh1" onClick=${ () => (this._focus=G,this.show = "galaxy")}>Galaxy</div>
            <span class="${depth>0 ? '' : 'dn'}">::</span>
            <div class="b pointer underline-hover hover-blue mh1 ${depth>0 ? '' : 'dn'}" onClick=${ () => this.show = "Galaxy"}>Sector</div>
            <span class="${depth>1 ? '' : 'dn'}">::</span>
            <div class="b pointer underline-hover hover-blue mh1 ${depth>0 ? '' : 'dn'}" onClick=${ () => this.show = "Galaxy"}>System</div>
          </div>
        </h3>
        ${_select}
      </div>
      <div class="absolute z-5 top-0 right-0 ma3">
        ${UI.TOC()}
        <div class="dib v-mid btn bg-light-gray br2 ml2">
          <img src="img/lantern.png" width="45"></img>
        </div>
      </div>
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
