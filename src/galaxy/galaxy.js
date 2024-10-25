//https://andrewdcampbell.github.io/galaxy-sim/assets/cubemaps/BlueNebular_back.jpg
//https://github.com/snorpey/circlepacker
//import {CirclePacker} from '../lib/circlepacker.esm.min.js';

import {GasGiantColors} from '../data.js';

import {Game, GameTemplates} from '../game/games.js';
import {Character} from '../game/characters.js';

import {FillGalaxy,StarsInSector, Sectors, BBox, Display as HostDisplay} from './starryHost.js';
import {Sector} from './sector.js';

import {MakeClaims} from './claim.js';

/*
	Voronoi for Planets 
*/
const SetVoronoi = (G) => {
  let RNG = new Chance(G.seed)

  console.time('Voronoi')
  var platePoints = {
    type: "FeatureCollection",
    features: d3.range(200).map(function() {
      return {
        type: "Point",
        coordinates: [360 * RNG.random(), 90 * (RNG.random() - RNG.random())],
        tris: []
      }
    })
  }

  var topoPoints = {
    type: "FeatureCollection",
    features: d3.range(5000).map(function() {
      return {
        type: "Point",
        coordinates: [360 * RNG.random(), 90 * (RNG.random() - RNG.random())]
      }
    })
  }

  //geo voronoi 
  let projection = d3.geoOrthographic()
    , path = d3.geoPath().projection(projection);

  G.voronoi = {
    plates: d3.geoVoronoi()(platePoints),
    topo: d3.geoVoronoi()(topoPoints),
    projection,
    path
  }
  console.timeEnd('Voronoi')
  console.log(G)
  G.display()
}

const ERAOPTIONS = {
  "PreHistory": [],
  "Heralds": ["Kindle a Flame"],
  "Frontier": ["Launch a Ship"],
  "Firewall": ["Assemble a Team"],
  "ExFrame": ["Call a Ranger"],
  "Cosmic": ["Assemble a Crew", "Establish an Enterprise"]
}

/*
  Galaxy Dimensions 
  In LY 
*/
const GALAXYWIDTH = 100000
const SUBSECTOR = 100
const SECTOR = 1000

/*
  Galaxy Class 
*/
class Galaxy {
  constructor(app, opts={}) {
    this.app = app

    //object info 
    this.what = "Galaxy"

    //eras 
    this.eraList = ["Pre-Ancient", "Ancient", "Pan-Humanity", "AI Scourge", "Cosmic"]
    this._era = "Cosmic"

    //state 
    let o = this.opts = opts
    //seed for rng 
    o.seed = opts.seed || "Verse"
    //time keeping - era, period, seconds, days, years 
    o.time = opts.time || this.eraList.map(e => [e, 30, [0, 0, 0]])
    //state that is saved - may be updated by user 
    o.favorites = opts.favorites || []
    o.characters = opts.characters || []
    o.games = opts.games || []

    this._sectors = new Map()

    //start generation 
    let RNG = new Chance(this.seed)

    //Radius and twist 
    let _R = RNG.randBetween(8, 12)
    this._R = (this.seed == "Verse" ? 10 : _R) * 5000
    let _twist = RNG.randBetween(30, 150) / 10
    this._twist = this.seed == "Verse" ? 9 : _twist

    //create star backdrop 
    console.time('Starry Host')
    FillGalaxy(this)
    console.timeEnd('Starry Host')

    //Factions 
    this._factions = []
    MakeClaims(this)

    //wormholes for every era 
    this._wormholes = []

    this._show = 'Galaxy'
    this._option = []
    this._filter = "Factions"

    //pause for display and then create standard voronoi
    setTimeout( () => {
      this.allSectors.forEach(id => this._sectors.set(id.slice(0,2).join(), new Sector(this,id)))
    }
    , 1000)

    //pause for display and then create standard voronoi
    setTimeout( () => SetVoronoi(this), 2000)
  }
  get seed() {
    return this.opts.seed
  }
sectorStars(sid) {
    return StarsInSector(sid)
  }
  get allSectors() {
    let _R = this._R / SECTOR
    let AS = []
    _.fromN(2 * _R, (i) => _.fromN(2 * _R, (j) => {
      let dx = _R - i
        , dy = _R - j
        , d = dx * dx + dy * dy;
      if (d <= _R * _R * 1.05) {
        AS.push([i, j, Math.sqrt(d)/_R])
      }
    }
    ))
    return AS
  }
  /* active state 
	*/
  set era(e) {
    this._era = e
    this.app.refresh()
    this.display()
  }
  get time() {
    return this.opts.time.find(t => t[0] == this._era).slice(1)
  }
  get active() {
    return this._show == "Galaxy" ? this : this[this._show]
  }
  /*
		Games and Characters 
	*/
  newGame(type) {
    let id = chance.natural()
    //create state 
    this.opts.games.push({
      id,
      type
    })

    this.getGame(id).show()
    this.save()
  }
  getGame(id) {
    return new Game(this,this.opts.games.find(o => o.id == id))
  }
  addCharacter(game) {
    let id = chance.natural()
    //create state 
    this.opts.characters.push({
      id,
      game: game.id
    })

    this.getCharacter(id).show()
    this.save()
  }
  getCharacter(id) {
    return new Character(this,this.opts.characters.find(o => o.id == id))
  }
  /*
		Game functions 
*/
  //passage of time 
  tick() {
    let T = this.opts.time
    //era, period, seconds, days, years 
    let ti = T.map(t => t[0]).indexOf(this._era)
    let[period,tick] = T[ti].slice(1)
    //clock timing 
    tick[0]++
    //check for day and year 
    if (tick[0] == period) {
      tick[1]++
      tick[0] = 0
    }
    if (tick[1] == 365) {
      tick[2]++
      tick[1] = 0
    }
    T[ti] = [this._era, period, tick]
    return tick
  }
  //random 
  random(RNG=chance) {
    let emptySector = () => {
      let fs = this.factions.map(f => f.claims.map(c => c.sid.join())).flat()
      let es = this.allSectors.filter(sid => !fs.includes(sid.join()))
      return RNG.pickone(es)
    }
    return {
      emptySector
    }
  }
  /*
    Features of the galaxy 
  */
  get orbitals() {
    return this.factionSystems.filter(s => s.type == "Orbital")
  }
  get gates() {
    return this.factionSystems.filter(s => s.type == "Gate")
  }
  //turn favorites into an object for display 
  get favorites() {
    return this.opts.favorites.filter(f => f[4] == this._era).map( ([seed,HI,sid,favs,era,name]) => {
      return {
        G: this,
        name,
        seed,
        HI,
        sid,
        favs,
        get sector() {
          return this.G._sectors.get(this.sid.join())
        },
        get system() {
          return this.sector.systems.find(s => s.seed == this.seed)
        }
      }
    }
    )
  }
  /*
    Get faction data 
  */
  get pastFactions() {
    let ei = this.eraList.indexOf(this._era)
    return this._factions.filter(f => this.eraList.indexOf(f.era) < ei)
  }
  get factionsByEra() {
    return Object.fromEntries(this.eraList.map(e => [e, this._factions.filter(f => f.era == e)]))
  }
  get factions() {
    return this._factions.filter(f => f.era == this._era)
  }
  getFactionBySector(_sid) {
    return this._factions.filter(f => f.claims.filter( ({sid}) => sid[0] == _sid[0] && sid[1] == _sid[1]).length > 0)
  }
  get factionSystems() {
    return this._factions.map(f => f.systemsInSector()).flat()
  }
  /*
    Create a Region 
  */
  genRegion(seed=chance.natural(), opts={}) {
    let sector = opts.sector || this._sector
    this.region = new Region(this,{
      seed,
      sector
    })
  }
  /*
	SVG
*/
  display(what=this._show) {
    Display(this, what)
  }
  /*
		Save and Load 
	*/
  async save() {
    let {app, seed, opts} = this
    await app.DB.setItem(seed, opts)
    localStorage.setItem("last", seed)
  }
  /*
    UI
  */
  get filter() {
    return []
    const {html} = this.app

    let data = {
      "Factions": this.factions.sort( (a, b) => a.name < b.name ? -1 : 1),
      "Historic Factions": this.pastFactions.sort( (a, b) => a.name < b.name ? -1 : 1),
      "Orbitals": this.orbitals,
      "Gates": this.gates,
      "Wormholes": this._wormholes.filter(w => w[0] == this._era).map(w => w.slice(2)),
      "Favorites": this.favorites,
      "Games": this.opts.games,
      "Characters": this.opts.characters,
    }[this._filter]

    const showSystem = (s) => {
      this.show = s.sector
      this.show = s.system
    }

    const ogButton = (o) => html`
    <div class="tc pointer dim bg-white flex items-center justify-between db ba br2 ma1 pa2" onClick=${ () => showSystem(o)}>
      ${o.name}
      <div class="flex items-center">S[${o.sid.join()}]</div>
    </div>`
    const favButton = (o) => html`
    <div class="tc pointer bg-white dim flex items-center justify-between db ba br2 ma1 pa2" onClick=${ () => showSystem(o)}>
      ${o.name}
      <div class="flex items-center">S[${o.sid.join()}]</div>
    </div>`
    const gcButton = (what, o) => html`
    <div class="tc pointer bg-white dim flex items-center justify-between db ba br2 ma1 pa2" onClick=${ () => this[what](o.id).show()}>
      ${o.name || "No Name"}
      <div class="flex items-center">${o.playbook}</div>
    </div>`

    if (["Factions", "Historic Factions"].includes(this._filter)) {
      return html`${data.map(f => f.UI.button)}`
    }
    if (["Orbitals", "Gates"].includes(this._filter)) {
      return html`${data.map(ogButton)}`
    } else if (this._filter == "Favorites") {
      return html`${data.map(favButton)}`
    } else if (["Games", "Characters"].includes(this._filter)) {
      return html`${data.map(d => gcButton("get" + this._filter.slice(0, -1), d))}`
    } else {
      return []
    }
  }
  set show(obj) {
    if (obj.seed == this.active.seed) {
      this.display()
      return this.app.refresh();
    }

    //update object 
    let what = obj.what
    this._show = what
    this[what] = obj
    this._option = []

    //check for refresh
    obj.refresh ? obj.refresh() : null

    //update map and ui 
    this.display()
    this.app.refresh()

    console.log(obj)
  }
  get show() {
    return this._show == "Galaxy" ? this.UI : this.active.UI
  }
  get UI() {
    return ""
  }
}

/*
	SVG Display 
*/
const Display = (G) => {
  if (SVG('svg')) {
    SVG.find('svg').remove()
  }

  let mapBBox = document.querySelector("#map").getBoundingClientRect()
  let minD = mapBBox.height < mapBBox.width ? ["h", mapBBox.height] : ["w", mapBBox.width]

  let app = G.app
  let svg = SVG().addTo('#map').size('100%', '100%')

  let claimmap = svg.group().attr('id', 'claims')
  //major faction claims 
  G.factions.forEach( (f, i) => {
    f.claims.forEach(sid => {
      let[x,y] = sid.split(",").map(Number).map(v => v * SECTOR)

      let _claim = svg.rect(SECTOR, SECTOR).attr({
        x,
        y
      }).addClass('claim').fill(f.color).data({
        fi: i,
      }).click(async function() {
        let fi = this.data("fi")
        console.log(G.factions[fi])
      })

      claimmap.add(_claim)
    }
    )
  }
  )

  let mSector = svg.group().attr('id', 'sectors')
  //show major sectors
  G.allSectors.forEach( ([j,k]) => {
    let x = j * SECTOR
    let y = k * SECTOR

    //create svg object
    let s = svg.rect(SECTOR, SECTOR).attr({
      x,
      y
    }).data({
      id: [j, k]
    }).addClass('sector').click(async function() {
      let id = this.data("id")
      let MS = G._sectors.get(id.join())
      let f = MS.factions[0] || {}
      console.log(MS)

      //set sector if selected 
      const setSector = (_id) => {
        app._focus = G._sectors.get(_id)
        app._focus.refresh()
        app.show = "sector"
      }

      let text = _.html`
            <div class="f4 b btn bg-light-green br2 pa2 mb1"  onClick=${ (e) => setSector(id.join())}>View Sector [${id.join()}]</div>
            ${!f.name ? "" : _.html`<div class="f5 i ph2">Faction: ${f.name}</div>`}`

      _.AppSelect("select-sector", text)
    })

    mSector.add(s)
  }
  )

  //viewbox
  svg.attr('viewBox', [0, 0, G._R * 2, G._R * 2].join(" "))

  //display stars 
  setTimeout( () => HostDisplay(), 100)
}

export {Galaxy}
