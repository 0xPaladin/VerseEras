//https://andrewdcampbell.github.io/galaxy-sim/assets/cubemaps/BlueNebular_back.jpg
//https://github.com/snorpey/circlepacker
//import {CirclePacker} from '../lib/circlepacker.esm.min.js';

import {GasGiantColors} from './data.js';

import {Game, GameTemplates} from './game/games.js';
import {Character} from './game/characters.js';

import {Faction, Ancients} from './factions.js';

import {FillGalaxy, Sectors, Allowable, BBox} from './starryHost.js';
import {MajorSector} from './majorSector.js';

/*
	Colors  for factions 
*/
const COLORS = ["maroon", "salmon", "pink", "tan", "olive", "goldenrod", "lime", "green", "teal", "aquamarine", "navy", "steelblue", "fuchsia", "purple"]

/*
  Galaxy Dimensions 
*/
const GALAXYWIDTH = 76900
//ly
const SECTOR = 100
const MAJORSECTOR = 5000
//ly 

/*
  IMAGE TO GALAXY 
  reference image [2000, 1373.4]
  gives image position 
*/
const IMG = [2000, 1373.4]
const GALAXY = {
  large: [1370, 30, 0],
  small: [600, 1400, 158]
}
const LYTOPIXEL = GALAXYWIDTH / GALAXY.large[0]
let MAXLY = [Math.floor(IMG[0] * LYTOPIXEL / MAJORSECTOR) * MAJORSECTOR, Math.floor(IMG[1] * LYTOPIXEL / MAJORSECTOR) * MAJORSECTOR]
let NSECTOR = [MAXLY[0] / MAJORSECTOR, MAXLY[1] / MAJORSECTOR]

/*
  Sector IDS
*/
const SECTORIDS = _.fromN(NSECTOR[0], (j)=>_.fromN(NSECTOR[1], (k)=>[j, k])).flat()
const BLANKSECTORS = ['0,14', '0,0', '0,1', '1,0', '2,0', '2,1', '3,1', '3,0', '4,0', '1,1', '10,14', '11,14', '12,14', '13,14', '13,13', '14,13', '14,11', '14,12', '16,0', '17,0', '18,0', '19,0', '20,0', '21,0', '20,1', '21,1', '21,2', '21,7', '21,8'].concat(_.fromN(7, (i)=>_.fromN(6, (j)=>[15 + i, 9 + j].join()))).flat()
const CORESECTORS = ['7,6', '8,6', '9,6', '7,7', '8,7', '9,7', '7,8', '8,8', '9,8', '18,4', '19,4', '18,5', '19,5']
const NOBLANKS = SECTORIDS.filter(sid=>!BLANKSECTORS.includes(sid.join()))
const VIABLESECTORS = SECTORIDS.filter(_id=>{
  let id = _id.join()
  return ![0, 21].includes(_id[0]) && ![0, 14].includes(_id[1]) && !BLANKSECTORS.includes(id) && !CORESECTORS.includes(id)
}
)
const Neighboors = (x,y,free)=>{
  return free.filter(([fx,fy])=>{
    let dx = fx - x
    let dy = fy - y
    return (Math.abs(dx) == 1 && dy == 0) || (Math.abs(dy) == 1 && dx == 0)
    //|| (Math.abs(dy) == 1 && dx == 1)
  }
  )
}
const CORE = {
  large: [300, 640, 526],
  small: [160, 1624.5, 377.5],
}
const SMALLGALAXYWIDTH = GALAXY.small[0] * LYTOPIXEL

/*
	Voronoi for Planets 
*/
const SetVoronoi = (G)=>{
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

/*
  Eras 
*/
const ERAS = ["PreHistory", "Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]
const ERAOPTIONS = {
  "PreHistory": [],
  "Heralds": ["Kindle a Flame"],
  "Frontier": ["Launch a Ship"],
  "Firewall": ["Assemble a Team"],
  "ExFrame": ["Call a Ranger"],
  "Wanderer": ["Assemble a Crew", "Establish an Enterprise"]
}
const ERAFACTIONS = {
  Heralds: {
    t: ['Crysik.1-6.1-3', 'Cthulhi.1-6.1-3', 'Deep Dwellers.1-6.1-3', 'Dholes.1-6.1-3', 'Elder Things.1-6.1-3', 'Hydra.1-6.1-3', 'Mi-go.1-6.1-3', 'Morkoth.1-6.1-3', 'Neh-thalggu.1-6.1-3', 'Rhukothi.1-6.1-3', 'Shk-mar.1-6.1-3', 'Space Polyps.1-6.1-3', 'Worms.1-6.1-3', 'Yellow Court.1-6.1-3', 'Yith.1-6.1-3'],
    n: ['Ikarya.2-3.1-2', 'Xsur.3-4.1-3', 'Shoggoth.2.1-3', 'The Free.3-5.1'],
    a: ['Solars.2.1-2', 'The Free.3-5.1']
  },
  Frontier: {
    t: ['Crysik.1-2.1-2', 'Cthulhi.1-2.1-3', 'Deep Dwellers.1-2.1-3', 'Dholes.1-2.1-2', 'Elder Things.1-2.1-3', 'Hydra.1-2.1-2', 'Mi-go.1-2.1-2', 'Morkoth.1-2.1-2', 'Neh-thalggu.1-2.1-2', 'Rhukothi.1-2.1-2', 'Shk-mar.1-2.1-2', 'Space Polyps.1-2.1-2', 'Worms.1-2.1-2', 'Yellow Court.1-2.1-2', 'Yith.1-2.1-2'],
    n: ['Gemeli.2-3.1-3', 'Crysik.1-2.1-2', 'Ikarya.2-3.1-2', 'Shoggoth.2.1-3', 'People.20.1-3', 'People.1.4'],
    a: ['People.20.1-3', 'People.1.4']
  },
  Firewall: {
    t: ['Barren.10-20.1', 'Lyns.10-20.1', 'Reapers.10-20.1'],
    n: ['Gemeli.3-6.1-3', 'Ikarya.2-3.1-2', 'People.8.2-4'],
    a: ['People.8.2-4']
  },
  ExFrame: {
    t: ['Barren.3-8.1-3', 'Lyns.3-8.1-3', 'Reapers.3-8.1-3', 'Deep Dwellers.2-4.1-2', 'Hegemony.1-3.1-2', 'Worms.2-4.1-2'],
    n: ['Gemeli.2-3.1-2', 'Ikarya.2-4.1-2', 'Alari.4-8.1-2', 'Independents.8-16.1'],
    a: ['Free Union.10-15.1']
  },
  Wanderer: {
    t: ['Barren.1-3.1-2', 'Lyns.1-3.1-2', 'Reapers.1-3.1-2', 'Deep Dwellers.1-3.1-2', 'Worms.1.1-2', 'Hegemony.1-3.1-2', 'Dominion.1.4', 'Tyrants.2-4.1-2', 'Hordes.2-4.1-2', 'Myr.2-4.1-3', 'Shadowsteel Syndicate.1.1-3', 'Rukhothi.1.1-2', 'The Circle.1.1-3', 'Clan Virin.1.1-2'],
    n: ['Gemeli.1-3.1-2', 'Ikarya.1-3.1-2', 'Cultivators.2.2-4', 'Myr.1-3.1-2', 'Red Dawn.1.4'],
    a: ['Archons.1-2,1-3', 'Forge Worlds.2-4.1-3', "Guardians.1.2", 'Houses of the Sun.1-3.1-3', 'Protectorate.1-3.2-3', 'Free Union.3.3']
  }
}

/*
	Factions 
*/
const EstablishFactions = (G,eras)=>{
  let RNG = new Chance(G.seed + ".Factions")
  let freeSectors = []

  //result 
  let res = []

  //jitter function for position
  const Jitter = ()=>_.fromN(2, ()=>RNG.randBetween(500, 2000))

  //faction claimed sectors
  //function to add a new sector 
  const AddSector = (t)=>{

    let n = [1, 1, 1, 1, 3][t] || 1
    //get initial sector 
    let _sids = n == 1 ? [freeSectors[0]] : [freeSectors[0], ...Neighboors(...freeSectors[0], freeSectors).slice(0, n - 1)]
    //for each sid 
    return _sids.map(sid=>{
      let data = {
        sid
      }
      //remove from free
      if (t > 1) {
        freeSectors.splice(freeSectors.map(fs=>fs.join()).indexOf(sid.join()), 1)
      }
      //which quad of sector 
      let quad = RNG.shuffle([[0, 0], [1, 0], [1, 1], [0, 1]]).map(q=>Jitter().map((j,i)=>j + q[i] * MAJORSECTOR / 2))
      //radius and point of center 
      data.pr = _.fromN(t < 3 ? 1 : 2, (i)=>{
        let radius = RNG.randBetween(...["10,50", "100,1000", "2000,3000", "2000,3500", "2000,3500"][t].split(",").map(Number))
        //get point with jitter 
        let p = quad[i].map((_p,j)=>sid[j] * MAJORSECTOR + _p)
        return [...p, radius]
      }
      )
      //push to sector
      return data
    }
    )
  }

  const addFaction = (era,threat,people,tier,color)=>{
    let id = res.length
    let seed = [G.seed, 'Faction', id].join(".")

    let F = new Faction(G,{
      id,
      seed,
      era: [era, threat],
      people,
      tier,
      color
    })

    //claim a number of sectors depending upon tier 
    F.claims = AddSector(tier)

    //done 
    res.push(F)
  }

  //for every era
  for (let e in eras) {
    //reset sectors 
    freeSectors = RNG.shuffle(G.allowableSectors)
    //track colors for the era 
    let _fc = {}
    //for the ally, neutral, and threat arrays 
    for (let ant in eras[e]) {
      //the array of factions 
      eras[e][ant].forEach(fd=>{
        let[people,_n,_t] = fd.split(".")
        let n = _n.includes("-") ? RNG.randBetween(..._n.split("-").map(Number)) : Number(_n)
        //handle colors 
        let color = _fc[people] = _fc[people] && people != "People" ? _fc[people] : RNG.pickone(GasGiantColors).name
        //create a faction for each 
        _.fromN(n, ()=>{
          //tier
          let tier = _t.includes("-") ? RNG.randBetween(..._t.split("-").map(Number)) : Number(_t)
          addFaction(e, ant, people, tier, color)
        }
        )
      }
      )
    }
  }

  //done 
  return res
}

/*
  Galaxy Class 
*/
class Galaxy {
  constructor(app, opts={}) {
    this.app = app

    //object info 
    this.what = "Galaxy"
    this.w = GALAXYWIDTH / SECTOR

    //eras 
    this.eraList = ERAS
    this._era = "Wanderer"

    //state 
    let o = this.opts = opts
    //seed for rng 
    o.seed = opts.seed || chance.string({
      alpha: true,
      length: 10,
      casing: 'upper'
    })
    //time keeping - era, period, seconds, days, years 
    o.time = opts.time || ERAS.map(e=>[e, 30, [0, 0, 0]])
    //state that is saved - may be updated by user 
    o.favorites = opts.favorites || []
    o.characters = opts.characters || []
    o.games = opts.games || []

    this._sectors = new Map()

    //start generation 
    let RNG = new Chance(this.seed)

    //Radius and twist 
    let _R = RNG.randBetween(8, 12)
    this._R = _R * 5000
    this._twist = RNG.randBetween(30, 150)/10

    //create star backdrop 
    console.time('Starry Host')
    FillGalaxy(this)
    console.timeEnd('Starry Host')

    //Factions 
    console.time('Galaxy Factions')
    this._factions = EstablishFactions(this, ERAFACTIONS)
    this._factions.forEach(f=>f.initialize(RNG))
    console.timeEnd('Galaxy Factions')

    //wormholes for every era 
    this._wormholes = this.eraList.slice(1).map((e,ei)=>{
      let esids = RNG.shuffle(this.allowableSectors)
      return _.fromN(RNG.sumDice("2d4"), ()=>[e, ei + 1, ...esids.splice(0, 2)])
    }
    ).flat()

    this._show = 'Galaxy'
    this._option = []
    this._filter = "Factions"

    //pause for display and then create standard voronoi
    setTimeout(()=>{
      this.allSectors.forEach(id=>this._sectors.set(id.join(), new MajorSector(this,id)))
    }
    , 1000)

    //pause for display and then create standard voronoi
    setTimeout(()=>SetVoronoi(this), 2000)
  }
  get seed() {
    return this.opts.seed
  }
  get allowableSectors() {
	  return Allowable//Sectors.map(sid=>sid.split(",").map(Number))
  }
  get allSectors() {
    let _R = this._R / 5000
    let AS = []
    _.fromN(2 * _R, (i)=>_.fromN(2 * _R, (j)=>{
      let dx = _R - i
        , dy = _R - j
        , d = dx * dx + dy * dy;
      if (d <= _R * _R * 1.1) {
        AS.push([i, j])
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
    return this.opts.time.find(t=>t[0] == this._era).slice(1)
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
    return new Game(this,this.opts.games.find(o=>o.id == id))
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
    return new Character(this,this.opts.characters.find(o=>o.id == id))
  }
  /*
		Game functions 
*/
  //passage of time 
  tick() {
    let T = this.opts.time
    //era, period, seconds, days, years 
    let ti = T.map(t=>t[0]).indexOf(this._era)
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
    let emptySector = ()=>{
      let fs = this.factions.map(f=>f.claims.map(c=>c.sid.join())).flat()
      let es = VIABLESECTORS.filter(sid=>!fs.includes(sid.join()))
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
    return this.factionSystems.filter(s=>s.type == "Orbital")
  }
  get gates() {
    return this.factionSystems.filter(s=>s.type == "Gate")
  }
  //turn favorites into an object for display 
  get favorites() {
    return this.opts.favorites.filter(f=>f[4] == this._era).map(([seed,HI,sid,favs,era,name])=>{
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
          return this.sector.systems.find(s=>s.seed == this.seed)
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
    return this._factions.filter(f=>this.eraList.indexOf(f.era) < ei)
  }
  get factionsByEra() {
    return Object.fromEntries(this.eraList.map(e=>[e, this._factions.filter(f=>f.era == e)]))
  }
  get factions() {
    return this._factions.filter(f=>f.era == this._era)
  }
  getFactionBySector(_sid) {
    return this._factions.filter(f=>f.claims.filter(({sid})=>sid[0] == _sid[0] && sid[1] == _sid[1]).length > 0)
  }
  get factionSystems() {
    return this._factions.map(f=>f.systemsInSector()).flat()
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
    if (SVG('svg')) {
      SVG.find('svg').remove()
    }

    let mapBBox = document.querySelector("#map").getBoundingClientRect()
    let minD = mapBBox.height < mapBBox.width ? ["h", mapBBox.height] : ["w", mapBBox.width]

    let G = this
    let app = this.app
    let svg = SVG().addTo('#map').size('100%', '100%')

    this._show = what

    let claimmap = svg.group().attr('id', 'claims')

    //major faction claims 
    this.factions.forEach((f,i)=>{
      let scpr = f.claims.map(c=>c.pr.map(_pr=>[c.sid, ..._pr])).flat()
      scpr.forEach(([sid,cx,cy,r])=>{
        let _claim = svg.circle(r * 2).attr({
          cx,
          cy
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

    if (what == 'Galaxy') {
      let G = this
      let mSector = svg.group().attr('id', 'majorSectors')
      //show major sectors
      this.allSectors.forEach(([j,k])=>{
        let x = j * MAJORSECTOR
        let y = k * MAJORSECTOR

        //create svg object
        let s = svg.rect(MAJORSECTOR, MAJORSECTOR).attr({
          x,
          y
        }).data({
          id: [j, k]
        }).addClass('majorSector').click(async function() {
          let id = this.data("id")
          let f = G.getFactionBySector(id).find(f=>f.era == G._era) || {}
          let MS = G._sectors.get(id.join())

          console.log(MS)

          let html = G.app.html
          let text = html`
            <div class="f4 tc pointer dim bg-light-green br2 pa2 mb1"  onClick=${(e)=>G.show = MS}>View Sector [${id.join()}]</div>
            ${!f.name ? "" : html`<div class="f5 i ph2">Faction: ${f.name}</div>`}`
          app.refresh(G._option = [['setMajorSector', id], text])
        })

        mSector.add(s)
      }
      )

      //viewbox
      svg.attr('viewBox', [0, 0, this._R * 2, this._R * 2].join(" "))
    } else {
      this[what].display()
    }
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
    const {html} = this.app

    let data = {
      "Factions": this.factions.sort((a,b)=>a.name < b.name ? -1 : 1),
      "Historic Factions": this.pastFactions.sort((a,b)=>a.name < b.name ? -1 : 1),
      "Orbitals": this.orbitals,
      "Gates": this.gates,
      "Wormholes": this._wormholes.filter(w=>w[0] == this._era).map(w=>w.slice(2)),
      "Favorites": this.favorites,
      "Games": this.opts.games,
      "Characters": this.opts.characters,
    }[this._filter]

    const showSystem = (s)=>{
      this.show = s.sector
      this.show = s.system
    }

    const ogButton = (o)=>html`
    <div class="tc pointer dim bg-white flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>showSystem(o)}>
      ${o.name}
      <div class="flex items-center">S[${o.sid.join()}]</div>
    </div>`
    const favButton = (o)=>html`
    <div class="tc pointer bg-white dim flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>showSystem(o)}>
      ${o.name}
      <div class="flex items-center">S[${o.sid.join()}]</div>
    </div>`
    const gcButton = (what,o)=>html`
    <div class="tc pointer bg-white dim flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>this[what](o.id).show()}>
      ${o.name || "No Name"}
      <div class="flex items-center">${o.playbook}</div>
    </div>`

    if (["Factions", "Historic Factions"].includes(this._filter)) {
      return html`${data.map(f=>f.UI.button)}`
    }
    if (["Orbitals", "Gates"].includes(this._filter)) {
      return html`${data.map(ogButton)}`
    } else if (this._filter == "Favorites") {
      return html`${data.map(favButton)}`
    } else if (["Games", "Characters"].includes(this._filter)) {
      return html`${data.map(d=>gcButton("get" + this._filter.slice(0, -1), d))}`
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
    let {app, filter, favorites, _era} = this
    const {html} = app
    let {saves, showBars} = app.state

    const SlideBarRight = html`<div class="db tc v-mid pointer dim ba br2 mh1 pa2 ${showBars[1] ? "" : "rotate-180"}" onClick=${()=>app.updateState("showBars", showBars, showBars[1] = !showBars[1])}>➤</div>`
    const SlideBarLeft = html`<div class="db f4 tc v-mid pointer bg-white dim ba br2 mr1 pa2 ${showBars[0] ? "rotate-180" : ""}" onClick=${()=>app.updateState("showBars", showBars, showBars[0] = !showBars[0])}>➤</div>`

    const header = html`<div class="b pointer underline-hover hover-blue flex mh1" onClick=${()=>this.show = this}>Galaxy</div>`

    //filter sectors 
    const filters = ["Factions", "Orbitals", "Gates", "Historic Factions"]
    const possibleFilters = ["favorites", "games", "characters"]
    possibleFilters.forEach(id=>{
      if (this.opts[id].length > 0) {
        filters.splice(1, 0, _.capitalize(id));
      }
    }
    )

    const left = html`
	${this._option.length == 0 ? "" : this._option[1]}
	<div class="flex w-100">
		${SlideBarLeft}
		<div class="dropdown w-100" style="direction: ltr;">
			<div class="f4 tc pointer dim underline-hover hover-blue bg-white db pa2 ba br2">${this._filter}</div>
			<div class="dropdown-content w-100 bg-white ba bw1 pa1">
				${filters.map(sf=>html`
				<div class="link pointer underline-hover" onClick=${()=>app.refresh(this._filter = sf)}>${sf}</div>`)}
			</div>
		</div>
	</div>
	<div class="${showBars[0] ? "" : "dn-ns"}">
		<div class="overflow-x-hidden overflow-auto" style="max-height:75vh;">
			${filter.map(f=>html`${f}`)}
		</div>
	</div>`

    const right = html`
	<div class="w-100 f4 flex justify-end mb1">
		<div class="dropdown w-100">
		  <div class="tc bg-white pointer dim ba br2 pa2">ID: ${this.seed}</div>
		  <div class="dropdown-content w-100 bg-white ba bw1 pa1">
			  ${ERAOPTIONS[_era].map(o=>html`<div class="f4 link pointer underline-hover ma2" onClick=${()=>this.newGame(o)}>${o}</div>`)}
			  ${saves.filter(s=>s.seed != this.seed).map(s=>html`<div class="f4 link pointer underline-hover ma2" onClick=${()=>app.load(s)}>Load ${s.seed}</div>`)}
			  <div class="f4 link pointer underline-hover ma2" onClick=${()=>app.new()}>New Galaxy</div>
		  </div>
		</div>
	</div>
	<div class="${showBars[1] ? "" : "dn-ns"}">
	</div>`

    return {
      header,
      left,
      right
    }
  }
}

export {Galaxy}
