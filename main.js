/*
  V0.3
*/

/*
  Mixins for standard functions
  Array, Math, Sting...
*/
import "./src/mixins.js"

/*
    Chance JS Mixin
*/
//Add to ChanceJS prototype
Chance.prototype.randBetween = function (min, max) {
    return this.integer({
        min,
        max
    })
}
Chance.prototype.weightedString = function (str) {
    let [w, p] = str.split("/").map(w => w.split(","))
    if (w.length != p.length) {
        console.log(str)
    }
    return this.weighted(w, p.map(Number))
}
//seed generator
Chance.prototype.makeSeed = function (length = 12) {
    return this.string({ length, casing: 'upper', alpha: true });
}

/*
  UI Resources  
*/
//Preact & HTM
import { html, Component, render } from 'https://unpkg.com/htm/preact/standalone.module.js';

//UI Components
const UI = {}

/*
  App generators
*/
import { Galaxy } from './src/galaxy.js';
import { Sector } from './src/sector.js';

/*
  Declare the main App 
*/
class App extends Component {
    constructor() {
        super();
        this.state = {
            show: "Galaxy",
            dialog: "",
            sectorInfo: null,
            systemInfo: null
        };

        //save to global
        window.App = this;

        //use in other views 
        this.html = html

        //active objects
        this.active = {}
    }

    // Lifecycle: Called whenever our component is created
    async componentDidMount() {
        //generate galaxy and display 
        this.galaxy = new Galaxy({
            seed: "KVPNBVBDTW",
            radius: 50,
            twist: 100
        });
        this.galaxy.display();
        console.log(this.galaxy)

        //timer 
        setInterval(() => {
            this.refresh();
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
    componentWillUnmount() { }

    load(_id) {
        //pull from db 
        DB.getItem(_id).then((saved) => {
            //galaxy data 
            this.galaxy = new Galaxy(saved[_id]);
            //update active state with all other saved data
            this.mapActive(saved);
            //display
            this.galaxy.display();
        }
        )
    }

    getSector(x, y, z) {
        this.sector = new MajorSector({
            id: [x, y, z]
        });
        this.sector.refresh();
        this.sector.display();
    }

    // Display a sector by its ID and claim
    displaySector(sectorId, claim) {
        const [col, row] = sectorId.split(',').map(Number);
        this.sector = new Sector({
            id: [col, row, 0],
            claim: claim
        });
        this.sector.display();
        // Clear system info when switching to sector view
        this.updateState("systemInfo", null);
    }

    /*
    Render functions 
  */

    notify(text, type = "success") {

    }

    //main function for updating state 
    async updateState(what, val = "") {
        let s = {}
        s[what] = val
        await this.setState(s)
    }
    refresh() {
        this.show = this.state.show
    }

    set show(what) {
        this.updateState("show", what)
    }

    get show() {
        let [what, id] = this.state.show.split(".")
        return UI[what] ? UI[what](this) : this[what] ? this[what][id].UI ? this[what][id].UI() : "" : ""
    }

    set dialog(what) {
        this.updateState("dialog", what)
    }

    get dialog() {
        let [what, id] = this.state.dialog.split(".")
        return what == "" ? "" : UI.Dialog(this)
    }

    //clears current UI 
    cancel() {
        this.show = ""
        this.dialog = "Main"
    }

    //main page render 
    render({ }, { info, sectorInfo, systemInfo }) {
        //final layout 
        return html`
	<div class="absolute z-0 top-0 left-0 w-100 h-100 pa2">
      <canvas id="starryHost" class="w-100 h-100"></canvas>
      <div id="map" class="z-0 absolute top-0 left-0 w-100 h-100 pa2"></div>
      <div id="overlay" class="z-1 absolute top-0 left-0 pa2">${info}</div>
      ${this.show}
    </div>
    ${this.dialog}
    ${sectorInfo ? html`
      <div class="absolute z-2 top-2 right-2 bg-black-80 white pa3 br3 shadow-4" style="min-width: 220px;">
        <div class="f6 b mb2">Sector Information</div>
        <div class="f7">Sector: <span class="b">${sectorInfo.sector}</span></div>
        <div class="f7">Claim: <span class="b">${sectorInfo.claim}</span></div>
        <button 
          class="mt2 pa2 bg-blue white br2 pointer hover-bg-dark-blue"
          onClick=${() => {
                    if (this.sector) {
                        // Return to galaxy view
                        this.galaxy.display();
                        this.sector = null;
                        this.updateState("sectorInfo", null);
                        this.updateState("systemInfo", null);
                    } else {
                        // View sector
                        this.displaySector(sectorInfo.sector, sectorInfo.claim);
                    }
                }}
        >
          ${this.sector ? "Return to Galaxy" : "View Sector"}
        </button>
      </div>
    ` : ''}
    ${systemInfo ? html`
      <div class="absolute z-2 top-2 left-2 bg-black-80 white pa3 br3 shadow-4" style="min-width: 250px; max-width: 350px;">
        <div class="f6 b mb2">System Information</div>
        <div class="f7">Name: <span class="b">${systemInfo.name}</span></div>
        <div class="f7">Type: <span class="b">${systemInfo.star.type}-type</span></div>
        <div class="f7">Claim: <span class="b">${systemInfo.claim}</span></div>
        <div class="f7">Tech Level: <span class="b">TL${systemInfo.techLevel}</span></div>
        <div class="f7">Status: <span class="b">${systemInfo.panhumanStatus}</span></div>
        <div class="f7">Planets: <span class="b">${systemInfo.planets.length}</span></div>
        ${systemInfo.habitablePlanets.length > 0 ? html`
            <div class="f7">Habitable Planets: <span class="b">${systemInfo.habitablePlanets.length}</span></div>` : ''}
        ${systemInfo.features && systemInfo.features.length > 0 ? html`
          <div class="f7">Features: <span class="b">${systemInfo.features.join(", ")}</span></div>
        ` : ''}
        <button 
          class="mt2 pa2 bg-blue white br2 pointer hover-bg-dark-blue"
          onClick=${() => this.updateState("systemInfo", null)}
        >
          Close
        </button>
      </div>
    ` : ''}
    `
    }
}

// Render the app
render(html`<${App}/>`, document.body);
