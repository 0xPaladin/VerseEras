//https://github.com/snorpey/circlepacker
//import {CirclePacker} from '../lib/circlepacker.esm.min.js';

import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {Faction, Ancients, EraFactions} from './factions.js';

//import {Region} from './region.js';
import {MajorSector} from './majorSector.js';

/*
  Galaxy Dimensions 
*/
const GALAXYWIDTH = 76900
//ly
const SECTOR = 50
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
const SECTORIDS = BuildArray(NSECTOR[0], (_,j)=>BuildArray(NSECTOR[1], (_,k)=>[j, k])).flat()
const BLANKSECTORS = ['0,14', '0,0', '0,1', '1,0', '2,0', '2,1', '3,1', '3,0', '4,0', '1,1', '10,14', '11,14', '12,14', '13,14', '13,13', '14,13', '14,11', '14,12', '16,0', '17,0', '18,0', '19,0', '20,0', '21,0', '20,1', '21,1', '21,2', '21,7', '21,8'].concat(BuildArray(7, (_,i)=>BuildArray(6, (_,j)=>[15 + i, 9 + j].join()))).flat()
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
  Bounding boxes for initial sector pick 
  topx, topy, width, height
*/
const Bounds = {
  start: [[254, 336, 282, 648], [591, 149, 645, 285], [1101, 494, 267, 337], [638, 866, 443, 276]]
}

const COLORS = ["white", "maroon", "salmon", "pink", "tan", "olive", "goldenrod", "lime", "green", "teal", "aquamarine", "navy", "steelblue", "fuchsia", "purple"]

/*
  Random Position 
*/

const RandomStart = ()=>{
  let[x,y,w,h] = chance.pickone(Bounds.start)
  let sx = chance.natural({
    min: Math.floor(x * LYTOPIXEL / SECTOR),
    max: Math.floor((x + w) * LYTOPIXEL / SECTOR)
  })
  let sy = chance.natural({
    min: Math.floor(y * LYTOPIXEL / SECTOR),
    max: Math.floor((y + h) * LYTOPIXEL / SECTOR)
  })
  return [sx, sy]
}

const SectorInGalaxy = (AorB="A",RNG=chance)=>{
  let max = (AorB == "A" ? GALAXYWIDTH : SMALLGALAXYWIDTH) / SECTOR
  return [RandBetween(0, max, RNG), RandBetween(0, max, RNG)]
}

/*
  Galaxy Class 
*/
const ERAS = ["PreHistory", "Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]
const ERAFACTIONS = {
  "Heralds": [['n', 'a'], ['n', 'a'], ['n', 'a']],
  "Frontier": [['t', 'n', 'n', 'a'], ['t', 'n', 'n', 'a'], ['t', 'n', 'a', 'a'], ['t', 'n']],
  "Firewall": [['t', 't', 'n', 'a'], ['t', 'n', 'n', 'a'], ['t', 'n', 'a', 'a'], ['n', 'a']],
  "ExFrame": [['t', 't', 'n', 'a'], ['t', 't', 'n', 'a'], ['t', 't', 'n', 'a'], ['t', 't']],
  "Wanderer": [['t', 'n', 'n', 'a'], ['t', 't', 'n', 'a'], ['t', 'n', 'a', 'a'], ['n', 'a']]
}
class Galaxy {
  constructor(app, opts={}) {
    this.opts = opts
    this._favorites = opts.favorites || []

    this.w = GALAXYWIDTH / SECTOR

    this.app = app
    this.seed = this.opts.seed = opts.seed || chance.string({
      alpha: true,
      length: 10,
      casing: 'upper'
    })
    let RNG = new Chance(this.seed)

    //eras 
    this.eraList = ERAS
    this._era = "Wanderer"

    let freeSectors = RNG.shuffle(SECTORIDS)
    this.colors = RNG.shuffle(COLORS)

    //function to add faction to specified array - sets position in galaxy 
    this._factions = []
    const addFaction = (F,e,t,c)=>{
      //jitter function for position
      const Jitter = ()=>BuildArray(2, ()=>RandBetween(500, 2000))

      //faction claimed sectors
      //function to add a new sector 
      const addSector = (n=1)=>{
        //get initial sector 
        let _sids = n == 1 ? [freeSectors[0]] : [freeSectors[0], ...Neighboors(...freeSectors[0], freeSectors).slice(0, n - 1)]
        //for each sid 
        return _sids.map(sid=>{
          let data = {
            sid
          }
          //remove from free
          freeSectors.splice(freeSectors.map(fs=>fs.join()).indexOf(sid.join()), 1)
          //which quad of sector 
          let quad = RNG.shuffle([[0, 0], [1, 0], [1, 1], [0, 1]]).map(q=>Jitter().map((j,i)=>j + q[i] * MAJORSECTOR / 2))
          //radius and point of center 
          data.pr = BuildArray(t < 3 ? 1 : 2, (_,i)=>{
            let radius = RandBetween(...["10,50", "100,1000", "2000,3000", "2000,3500", "2000,3500"][t].split(",").map(Number), RNG)
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

      //claim a number of sectors depending upon tier 
      let claims = addSector([1, 1, 1, 1, 3][t])

      //push data to factions 
      this._factions.push(Object.assign(F, {
        tier: t,
        color: c,
        claims
      }))

      return F.people
    }

    console.time('Galaxy Factions')
    //random ancients to populate the rest of the galaxy 
    BuildArray(100, (_,id)=>{
      addFaction(new Faction(this,{
        id,
        seed: [this.seed, 'Faction', id].join("."),
        era: ['PreHistory', RNG.pickone(['t', 'n'])],
        people: 'Ancient'
      }), 'PreHistory', RNG.weighted([1, 2, 3, 4], [3, 2, 2, 1]), RNG.pickone(COLORS))
    }
    )

    //reset sectors 
    freeSectors = RNG.shuffle(VIABLESECTORS)
    //add know Ancients to Heralds
    Ancients.forEach((a,i)=>{
      //get a color
      let c = RNG.pickone(COLORS)
      //number of times they will appear  
      BuildArray(SumDice("2d4", RNG), ()=>{
        let id = this._factions.length
        let tier = RandBetween(1, 2, RNG)
        addFaction(new Faction(this,{
          id,
          seed: [this.seed, 'Faction', id].join("."),
          era: ['Heralds', 't'],
          people: a
        }), 'Heralds', tier, c)
      }
      )
    }
    )

    let _wormholes = []
    //now build factions for each era 
    let Unlimited = ['Independents*', 'The Free', 'People', 'Free Union']
    this.eraList.slice(1).forEach((e,ei)=>{
      let ef = Object.fromEntries(Object.entries(EraFactions[e]).map(([key,f])=>[key, RNG.shuffle(f)]))
      //reset sectors 
      freeSectors = RNG.shuffle(VIABLESECTORS)
      //get current faction array 
      ERAFACTIONS[e].forEach((_ft,i)=>_ft.forEach(t=>{
        let people = ef[t][0]
        !Unlimited.includes(people) ? ef[t].splice(0, 1) : null

        let id = this._factions.length
        addFaction(new Faction(this,{
          id,
          seed: [this.seed, 'Faction', id].join("."),
          era: [e, t],
          people
        }), e, i + 1, RNG.pickone(COLORS))
      }
      ))

      //set goals 
      this.factionsByEra[e].forEach(f=>f.setGoals(RNG))
      //create wormholes 
      let esids = RNG.shuffle(SECTORIDS)
      BuildArray(SumDice("2d4", RNG), (_,j)=>_wormholes.push([e, ei + 1, ...esids.splice(0, 2)]))
    }
    )
    console.timeEnd('Galaxy Factions')
    this._wormholes = _wormholes

    this._show = 'Galaxy'
    this._option = []
    this.sectorFilter = "Favorites"

    //pause for display and then create standard voronoi
    setTimeout(()=>this.setVoronoi(), 3000)
  }
  set era(e) {
    this._era = e
    return this.app.refresh()
    // calls g.display in main 
  }
  get era() {
    return {
      factions: this._factions.filter(f=>f.era == this._era)
    }
  }
  /*
    Sector lists 
  */
  showSectors() {
    let ei = this.eraList.indexOf(this._era)
    let filter = this.sectorFilter
    //SECTORIDS
    let list = []
    const addToList = (sid)=>{
      list.includes(sid.join()) ? null : list.push(sid.join())
    }
    //["Favorites", "Historic Factions", "Orbitals", "Gates", "Wormholes"]
    if (filter == "Favorites") {
      this._favorites.forEach(f=>addToList(f[4]))
    } else if (filter == "Historic Factions") {
      this.pastFactions.forEach(f=>f.claims.forEach(c=>addToList(c.sid)))
    } else if (filter == "Orbitals") {
      this.orbitals.filter(o=>o.ei <= ei).forEach(o=>addToList(o.sid))
    } else if (filter == "Gates") {
      this.gates.filter(g=>g.ei <= ei).forEach(g=>addToList(g.sid))
    } else if (filter == "Wormholes") {
      this._wormholes.filter(w=>w[0] == this._era).forEach(w=>w.slice(2).map(sid=>addToList(sid)))
    }

    return list.map(s=>s.split(",").map(Number)).sort((a,b)=>a[0] - b[0])
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
  /*
    Get faction data 
  */
  get pastFactions() {
    let ei = this.eraList.indexOf(this._era)
    return this._factions.filter(f=>this.eraList.indexOf(f.era) <= ei)
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
    Voronoi 
  */
  setVoronoi() {
    let RNG = new Chance(this.seed)
    
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
    
    this.voronoi = {
      plates : d3.geoVoronoi()(platePoints),
      topo : d3.geoVoronoi()(topoPoints),
      projection,
      path
    }
    console.timeEnd('Voronoi')
    console.log(this)
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
  setMajorSector(sid, show=false) {
    this.majorSector = new MajorSector(this.app,this,sid)
  }
  //follow the selected option based upon user selection 
  followOption() {
    let[f,opts] = this._option[0]
    //run function 
    this[f] ? this[f](opts) : null

    if (f == 'setMajorSector') {
      this._option = []
      this.display('Sector')
    }
    if (f == 'setVisibleSystem') {
      this._option = []
      this.display('System')
    }

    this.app.refresh()
  }
  display(what=this._show) {
    if (SVG('svg')) {
      SVG.find('svg').remove()
    }

    let mapBBox = document.querySelector("#map").getBoundingClientRect()
    let minD = mapBBox.height < mapBBox.width ? ["h", mapBBox.height] : ["w", mapBBox.width]
    //let gImg = minD[0] == "h" ? [minD[1], ] : [2000 * 800 / 1373.4, 800] //[2000,1373.4]
    let svgSize = [mapBBox.width, mapBBox.height]
    //what == "Galaxy" ? gImg : [minD[1], minD[1]]

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
      NOBLANKS.forEach(([j,k])=>{
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

          console.log(id, f)

          let html = G.app.html
          let text = html`
            <div class="f4 tc pointer dim bg-light-green br2 pa2 mb1"  onClick=${(e)=>G.followOption()}>View Sector [${id.join()}]</div>
            ${!f.name ? "" : html`<div class="f5 i ph2">Faction: ${f.name}</div>`}`
          app.refresh(G._option = [['setMajorSector', id], text])
        })

        mSector.add(s)
      }
      )

      //viewbox - image adj size 
      svg.attr('viewBox', [0, 0, ...MAXLY].join(" "))
    } else if (what == 'Sector') {
      this.majorSector.display()
    } else if (what == 'System') {
      this.system.display()
    }
    else if (what == 'Planet') {
      this.planet.display()
    }
  }
  async save() {
    let {seed, opts, _favorites, app} = this

    let data = {
      seed,
      opts,
      favorites: _favorites
    }

    let state = await app.DB.setItem(seed, data)
  }
  async load({seed, opts, favorites}) {
    this.app.galaxy = new Galaxy(this.app,Object.assign(opts, {
      seed,
      favorites
    }))
  }
}

export {Galaxy}
