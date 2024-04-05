//https://github.com/snorpey/circlepacker
import {CirclePacker} from '../lib/circlepacker.esm.min.js';

import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {Faction,Ancients} from './factions.js';

import {Region} from './region.js';
import {Sector} from './sector.js';
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
const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]
const ERAFACTIONS = {
  "Heralds": [['n', 'a'], ['n', 'a'], ['n', 'a']],
  "Frontier": [['t', 'n', 'n', 'a'], ['t', 'n', 'n', 'a'], ['t', 'n', 'a', 'a'], ['t', 'n']],
  "Firewall": [['t', 't', 'n', 'a'], ['t', 'n', 'n', 'a'], ['t', 'n', 'a', 'a'], ['n', 'a']],
  "ExFrame": [['t', 't', 'n', 'a'], ['t', 't', 'n', 'a'], ['t', 't', 'n', 'a'], ['t', 't']],
  "Wanderer": [['t', 'n', 'n', 'a'], ['t', 't', 'n', 'a'], ['t', 'n', 'a', 'a'], ['n', 'a']]
}
class Galaxy {
  constructor(app, seed=chance.natural(), start=RandomStart()) {
    this.w = GALAXYWIDTH / SECTOR

    this.app = app
    this.seed = seed
    let RNG = new Chance(seed)

    //eras 
    this._era = "Wanderer"
    this._eras = Object.fromEntries(ERAS.map(e=>[e, {
      factions: []
    }]))

    let _sectors = RNG.shuffle(SECTORIDS)
    this.colors = RNG.shuffle(COLORS)

    //function to add faction to specified array - sets position in galaxy 
    const addFaction = (F,e,t,c)=>{
      let jitter = [...BuildArray(2, ()=>RandBetween(1000, 4000)), RandBetween(0, 1000)]
      let radius = t == 0 ? 1 : SumDice(t + "d100", RNG) * 50

      let j = this._eras[e].factions.length
      //sector 
      let sp = [..._sectors[j], 0]
      //actual position 
      let p = sp.map((_p,k)=>_p * MAJORSECTOR + jitter[k])

      //push data to factions 
      this._eras[e].factions.push(Object.assign(F, {
        tier: t,
        color: c,
        radius,
        p
      }))
    }

    //random ancients to populate the rest of the galaxy 
    BuildArray(100, (_,id)=>{
      addFaction(new Faction({
        id,
        seed: [this.seed, 'Heralds', 'Faction', id].join("."),
        era: ['Heralds', RNG.pickone['t',
        'n']],
        people: 'Ancient'
      }), 'Heralds', 0, RNG.pickone(COLORS))
    }
    )

    //add know Ancients to Heralds
    Ancients.forEach(a =>{
      addFaction(new Faction({
        id,
        seed: [this.seed, 'Heralds', 'Faction', id].join("."),
        era: ['Heralds', RNG.pickone['t',
        'n']],
        people: 'Ancient'
      }), 'Heralds', 0, RNG.pickone(COLORS))
    })

    //now build factions for each era 
    ERAS.forEach(e=>{
      //reset sectors 
      _sectors = RNG.shuffle(VIABLESECTORS)
      //get current faction array 
      let fArr = this._eras[e].factions
      ERAFACTIONS[e].forEach((_ft,i)=>_ft.forEach(t=>addFaction(new Faction({
        id: fArr.length,
        seed: [this.seed, e, 'Faction', fArr.length].join("."),
        era: [e, t],
      }), e, i, this.colors[i])))
    }
    )
    //starting sector 
    this.setMajorSector()

    //start region 
    //this.region = new Region(this)

    //create wormholes 
    this._wormholes = BuildArray(SumDice("2d10", RNG), ()=>BuildArray(2, ()=>{
      let ab = RNG.weighted(["A", "B"], [3, 1])
      return [ab, SectorInGalaxy(ab, RNG)]
    }
    ))

    //create megastructures 
    this._orbitals = BuildArray(SumDice("5d6", RNG), ()=>{
      let ab = RNG.weighted(["A", "B"], [3, 1])
      let sz = RNG.pickone([2000, 3000, 4000])
      let plates = RandBetween(300, 1000, RNG)
      return [ab, SectorInGalaxy(ab, RNG), sz, plates]
    }
    )

    console.log(this)
  }
  get era() {
    return this._eras[this._era]
  }
  get factions() {
    return this.era.factions
  }
  genRegion(seed=chance.natural(), opts={}) {
    let sector = opts.sector || this._sector
    this.region = new Region(this,{
      seed,
      sector
    })
  }
  setSector(sid) {
    this.sector = new Sector(this.app,this,sid)
  }
  setMajorSector(sid) {
    this.majorSector = new MajorSector(this.app,this,sid)
  }
  display(_what) {
    if (SVG('svg')) {
      SVG.find('svg').remove()
    }

    //get what to display 
    let[what,sub="",sid=""] = _what.split(".")
    if (sub == 'MajorSector') {
      this.setMajorSector(sid.split(",").map(Number))
      return this.majorSector.display()
    }

    let app = this.app
    let svg = SVG().addTo('.container').size('1200', '800')

    let claimmap = svg.group().attr('id', 'claims')
    let mSector = svg.group().attr('id', 'majorSectors')

    //major faction claims 
    this.factions.forEach((c,i)=>{
      let _claim = svg.circle(c.radius).attr({
        cx: c.p[0],
        //+ GData[0] * LYTOPIXEL,
        cy: c.p[1]//+ GData[1] * LYTOPIXEL
      }).addClass('claim').fill(c.color).data({
        c
      }).click(async function() {
        let c = this.data("c")
        console.log(c)
      })

      claimmap.add(_claim)
    }
    )

    //show sectors
    let noSector = ['0,14', '0,0', '0,1', '1,0', '2,0', '2,1', '3,1', '3,0', '4,0', '1,1', '10,14', '11,14', '12,14', '13,14', '13,13', '14,13', '14,11', '14,12', '16,0', '17,0', '18,0', '19,0', '20,0', '21,0', '20,1', '21,1', '21,2', '21,7', '21,8'].concat(BuildArray(7, (_,i)=>BuildArray(6, (_,j)=>[15 + i, 9 + j].join()))).flat()
    let imgX = 2000
      , imgY = 1373.4;
    let maxX = Math.floor(imgX * LYTOPIXEL / MAJORSECTOR) * MAJORSECTOR
      , maxY = Math.floor(imgY * LYTOPIXEL / MAJORSECTOR) * MAJORSECTOR;
    let nx = maxX / MAJORSECTOR
      , ny = maxY / MAJORSECTOR;
    BuildArray(nx, (_,j)=>BuildArray(ny, (_,k)=>{
      let _x = j * MAJORSECTOR
      let _y = k * MAJORSECTOR
      //check if display 
      let d = noSector.includes([j, k].join())
      if (d)
        return;
      //establish position - any x,y correction 
      let x = _x
      let y = _y

      //create svg object
      let s = svg.rect(MAJORSECTOR, MAJORSECTOR).attr({
        x,
        y
      }).data({
        id: [j, k]
      }).addClass('majorSector').click(async function() {
        let id = this.data("id")
        console.log(id)
        app.updateState("selection", id)
      })

      mSector.add(s)
    }
    ))

    //viewbox - image adj size 
    svg.attr('viewBox', [0, 0, maxX, maxY].join(" "))
  }
}

export {Galaxy}
