//https://github.com/snorpey/circlepacker
import {CirclePacker} from '../lib/circlepacker.esm.min.js';

import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {Ancients, CreateAncient} from './ancients.js';

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
const GALAXY = {
  large: [1370, 30, 0],
  small: [600, 1400, 158]
}
const CORE = {
  large: [300, 640, 526],
  small: [160, 1624.5, 377.5],
}
const LYTOPIXEL = GALAXYWIDTH / GALAXY.large[0]
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
  Packing
*/
const GalaxyPack = {
  noWorker: true,
  continuousMode: false,
  collisionPasses: 3,
  // for static calculation, use high values
  // for centerPasses to get better results
  centeringPasses: 120,
  // for static calculation, use high
  // values for correctionPasses to get better results
  correctionPasses: 300
}
const MainGalaxyPack = Object.assign({
  // the bounds of the area we want to draw the circles in
  bounds: {
    width: GALAXYWIDTH,
    height: GALAXYWIDTH
  },
  circles: [{
    id: 'core',
    radius: LYTOPIXEL * CORE.large[0] / 2,
    position: {
      x: GALAXYWIDTH / 2,
      y: GALAXYWIDTH / 2
    },
    isPinned: true,
  }],
}, GalaxyPack)
const SmallGalaxyPack = Object.assign({
  // the bounds of the area we want to draw the circles in
  bounds: {
    width: SMALLGALAXYWIDTH,
    height: SMALLGALAXYWIDTH
  },
  circles: [{
    id: 'core',
    radius: LYTOPIXEL * CORE.small[0] / 2,
    position: {
      x: SMALLGALAXYWIDTH / 2,
      y: SMALLGALAXYWIDTH / 2
    },
    isPinned: true,
  }],
}, GalaxyPack)

/*
  Packing Functions for Various Eras 
*/

const PackAncients = (G)=>{
  let RNG = new Chance(G.seed + ".Ancients")
  let w = G.w

  let circles = Ancients.map((id,i)=>{
    let n = RNG.d6()
    return BuildArray(n, (_,v)=>{
      //random point in circle 
      let c = w / 2
      let r = c * Math.sqrt(RNG.random())
      let theta = RNG.random() * 2 * Math.PI

      return {
        id: [id, v].join("."),
        radius: (RNG.d20() + RNG.d20()) * 2,
        position: {
          x: c + r * Math.cos(theta),
          y: c + r * Math.sin(theta),
        }
      }
    }
    )
  }
  ).flat()

  MainGalaxyPack.onMove = (c)=>{
    //only keep certain data 
    G.ancientClaims = Object.values(c).map(({id, position, radius})=>{
      return {
        id,
        ancient: id.split(".")[0],
        position,
        radius
      }
    }
    ).slice(1)
  }

  MainGalaxyPack.circles.push(...circles)
  const packer = new CirclePacker(MainGalaxyPack);
  packer.update();
}

const PackForWanderer = (G)=>{
  let RNG = new Chance(G.seed + ".Wanderer")
  let w = G.w

  //reset pack 
  MainGalaxyPack.circles = MainGalaxyPack.circles.slice(0, 1)
  SmallGalaxyPack.circles = SmallGalaxyPack.circles.slice(0, 1)

  //establish faction, tier, and which galaxy 
  let wf = [['t', 't', 'n', 'a'], ['t', 'n', 'n', 'a'], ['t', RNG.pickone(['t', 'n']), 'n', 'a'], ['t', 'n']]
  let wl = RNG.shuffle(['l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', RNG.pickone(['l', 's']), 's', 's'])

  //random points in a circle 
  let rpcL = RNG.shuffle([.3, .55, .8].map((r,i)=>BuildArray(6 * [1, 2, 3][i], (_,j)=>[r, 360 * j / (6 * [1, 2, 3][i])])).flat())
  let rpcS = RNG.shuffle(BuildArray(6, (_,i)=>[0.5, 360 * i / 6]))
  let cL = []
    , cS = [];
  wf.forEach((t,i)=>t.forEach(f=>{
    //which galaxy
    let whichG = wl[cL.concat(cS).length]
    //pull right array 
    let cArr = whichG == 'l' ? cL : cS
    //number created 
    let j = cArr.length
    //width of galaxy in question 
    let w = whichG == 'l' ? GALAXYWIDTH : SMALLGALAXYWIDTH
    //current tier 
    let tier = i + 1

    //random gen 
    let jitter = RNG.random() * 0.1 - 0.05
    let radius = SumDice(tier + "d100", RNG) * 50

    //use random point in circle 
    let c = w / 2
    let[r,angle] = whichG == 'l' ? rpcL[j] : rpcS[j]
    let theta = angle * 2 * Math.PI / 360
    //based on center position 
    let cx = c * (1 + (r + jitter) * Math.cos(theta))
    let cy = c * (1 + (r + jitter) * Math.sin(theta))

    //adjust for image top left postion  
    let GData = GALAXY[whichG == 'l' ? 'large' : 'small'].slice(1)
    let gx = cx + (GData[0] * LYTOPIXEL)
    let gy = cy + (GData[1] * LYTOPIXEL)

    //id: [whichG,f,tier].join("."),
    cArr.push({
      g: whichG,
      f,
      tier,
      color: G.colors[cL.concat(cS).length],
      radius,
      position: {
        x: gx,
        y: gy
      }
    })
  }
  ))

  //set claims
  G.wandererClaims = cL.concat(cS)
}

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

class Galaxy {
  constructor(app, seed=chance.natural(), start=RandomStart()) {
    this.w = GALAXYWIDTH / SECTOR

    this.app = app
    this.seed = seed
    let RNG = new Chance(seed)

    //eras 
    this._era = 1
    this.eras = []

    this.colors = RNG.shuffle(COLORS)
    //ancient claims to the galaxy
    PackAncients(this)
    //random ancients to populate the rest of the galaxy  
    this._ancients = BuildArray(100, (_,id)=>Object.assign({
      id
    }, CreateAncient(RNG)))

    //Wanderer Factions 
    //pack 
    PackForWanderer(this)

    //starting sector 
    this.setSector(start)
    this.setMajorSector()

    //start region 
    this.region = new Region(this)

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
  genRegion(seed=chance.natural(), opts={}) {
    let sector = opts.sector || this._sector
    this.region = new Region(this,{
      seed,
      sector
    })
  }
  setSector (sid) {
    this.sector = new Sector(this.app,this,sid)
  }
  setMajorSector (sid) {
    this.majorSector = new MajorSector(this.app,this,sid)
  }
  display(_what) {
    if (SVG('svg')) {
      SVG.find('svg').remove()
    }

    //get what to display 
    let [what,sub="",sid=""] = _what.split(".")
    if(what == 'Heralds') {
      return 
    }
    else if (what == 'Frontier'){
      return this.sector.display()
    }
    else if (sub == 'MajorSector'){
      this.setMajorSector(sid.split(",").map(Number))
      return this.majorSector.display()
    }

    let app = this.app
    let svg = SVG().addTo('.container').size('1200', '800')

    let claimmap = svg.group().attr('id', 'claims')
    let mSector = svg.group().attr('id', 'majorSectors')

    //major faction claims 
    this.wandererClaims.forEach((c,i)=>{
      let GData = GALAXY[c.g == 'l' ? 'large' : 'small'].slice(1)
      let p = c.position

      let _claim = svg.circle(c.radius).attr({
        cx : p.x, //+ GData[0] * LYTOPIXEL,
        cy : p.y //+ GData[1] * LYTOPIXEL
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
    let noSector = ['0,14','0,0','0,1','1,0','2,0','2,1','3,1','3,0','4,0','1,1','10,14','11,14','12,14','13,14','13,13','14,13','14,11','14,12','16,0','17,0','18,0','19,0','20,0','21,0','20,1','21,1','21,2','21,7','21,8'].concat(BuildArray(7,(_,i)=>BuildArray(6,(_,j)=> [15+i,9+j].join()))).flat()
    let imgX = 2000, imgY = 1373.4;
    let maxX = Math.floor(imgX * LYTOPIXEL/MAJORSECTOR)*MAJORSECTOR, maxY = Math.floor(imgY * LYTOPIXEL/MAJORSECTOR)*MAJORSECTOR;
    let nx = maxX/MAJORSECTOR, ny = maxY/MAJORSECTOR;
    BuildArray(nx, (_,j)=>BuildArray(ny, (_,k)=>{
      let _x = j * MAJORSECTOR
      let _y = k * MAJORSECTOR
      //check if display 
      let d = noSector.includes([j,k].join())
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
        app.updateState("selection",id)
      })

      mSector.add(s)
    }
    ))

    //viewbox - image adj size 
    svg.attr('viewBox', [0, 0, maxX, maxY].join(" "))
  }
}

export {Galaxy}
