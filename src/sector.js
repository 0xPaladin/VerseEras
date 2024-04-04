import {RandBetween, SumDice, Likely, Difficulty, ZeroOne, Hash, BuildArray, SpliceOrPush, DiceArray, WeightedString, capitalize, chance} from './random.js'

import {starTypeData, gravity, blackbody, planetTypeData} from './astrophysics.js';
import {random_name, isBadWord} from './random_name.js';

import {Animals, Oddities, Elements, Magic} from './data.js';
import {Ancients, CreateAncient} from './ancients.js';
import {Claim} from './people.js';

/*
  Isometric 
*/

const toIsometric = (_x,_y,_z)=>{
  return {
    x: (_x - _y) * 0.866025,
    y: _z + (_x + _y) * 0.5
  }
}

/*
  POI
*/
const POI = ['creature', 'obstacle', 'hazard', 'site', 'factionOutpost']
const CreatePOI = {
  creature(s, RNG=chance) {
    let what = RNG.weighted(['animal', 'robot'], [2, 1])
    s[s._POI] = {
      what,
      text : `Creature [${what}]`
    }
  },
  obstacle(s, RNG=chance) {
    let what = RNG.pickone(['defensive', 'impeniterable', 'difficult', 'hazardous'])
    let data = {
      what
    }
    if (what == 'defensive') {
      data.ancient = RNG.pickone(s.parent.ancients.flat())
    }

    data.text = `Obstacle [${what}${what == 'defensive' ? ": "+data.ancient.name : ""}]`

    s[s._POI] = data
  },
  hazard(s, RNG=chance) {
    let what = RNG.pickone(['unseen danger', 'ensnaring', 'defensive', 'impairing', 'difficult'])
    let data = {
      what
    }
    if (what == 'defensive') {
      data.ancient = RNG.pickone(s.parent.ancients.flat())
    }

    data.text = `Hazard [${what}${what == 'defensive' ? ": "+data.ancient.name : ""}]`

    s[s._POI] = data
  },
  site(s, RNG=chance) {
    let what = RNG.weighted(['Ruin', 'Dwelling', 'Outpost', 'Landmark', 'Resource'], [2, 1, 1, 1, 1])
    let data = {
      what
    }

    if (what == 'Ruin') {
      data.ancient = RNG.pickone(s.parent.ancients.flat())
      data.type = RNG.weighted(['necropolis', 'temple', 'mine', 'military', 'settlement'], [1, 2, 2, 1, 4])
    }
    if (what == 'Dwelling') {
      data.type = RNG.pickone(['common', 'criminal', 'revolutionary', 'recreation', 'mercenary', 'religious', 'craft', 'trade', 'industrial', 'foreign', 'academic'])
    }
    if (what == 'Outpost') {
      data.type = RNG.pickone(['Trading Post', 'Industrial Site', 'Relay', 'Gate'])
    }
    if (what == 'Landmark') {
      data.type = RNG.pickone(['Pulsar', 'Black Hole', 'Nebula', 'Gate'])
    }
    if (what == 'Resource') {
      data.type = RNG.weighted(['uncommon', 'rare', 'very rare'], [3, 1.5, 0.5])
    }

    if(['Relay','Gate'].includes(data.type)){
      data.ancient = RNG.pickone(s.parent.ancients.flat())
    }

    data.text = `${what} [${data.type}${data.ancient ? ", "+data.ancient.name : ""}]`

    s[s._POI] = data
  },
  factionOutpost(s, RNG=chance) {
    //faction presence, link to faction - don't care about distance 
    let f = RNG.pickone(s.parent.factions)
    s.claim = f.id
    let type = RNG.pickone(['common', 'recreation', 'military', 'religious', 'craft', 'trade', 'industrial', 'academic'])
    let state = RNG.weighted(['failing', 'nascent', 'stable', 'expanding', 'dominating'], [3, 2, 4, 2, 1])

    s[s._POI] = {
      f,
      what: 'faction',
      type,
      state,
      text: `Faction Outpost [${f.name}, ${type}, ${state}]`
    }
  },
}

/*
  Planets 
*/

class Planet {
  constructor(seed, i, orbitalRadius, insolation) {
    this.seed = seed
    this.i = i
    //romanNumeral(i + 1)
    this._orbitalRadius = orbitalRadius;
    // AU
    this._insolation = insolation;
    // Earth incident radiation from Sol == 1

    let RNG = new Chance(seed)
    RNG.range = (min,max)=>min + RNG.random() * (max - min)

    //planet template 
    let template = this.template = RNG.weighted(planetTypeData, [insolation * 100, 10, 1]);

    //calculations 
    this.classification = template.classification;
    this.radius = RNG.range(template.radius[0], template.radius[1]);
    this.density = RNG.range(template.density[0], template.density[1]);
    this.hydrographics = template.hydrographics(RNG, insolation, this.radius, this.density);
    this.atmosphere = template.atmosphere(RNG, insolation, this.radius, this.density, this.hydrographics);

    Object.assign(this, this.template.HI(this._insolation, this.radius, this.density, this.hydrographics, this.atmosphere))

    return this;
  }
  get gravity() {
    return gravity(this.radius, this.density)
  }

  detail() {
    detail.orbitalRadius = this.orbitalRadius.toFixed(2);
    detail.insolation = this.insolation.toFixed(2);
    detail.blackbodyK = blackbody(this.insolation);
  }
}

//generating a system based upon a seed 
class System {
  constructor(parent, i) {
    this.parent = parent
    this.seed = [parent.seed, i].join(".")
    this.i = i
    this.claim = -1
    
    let RNG = new Chance(this.seed)

    //ofset from edge of grid 
    //this.offset = BuildArray(3, ()=> parent.GRIDSIZE * RandBetween(20, 80, RNG) / 100)
    this.offset = [0, 0, 0]

    //star detail 
    let star = {}
      , spectralClass = RNG.weighted(["O", "B", "A", "F", "G", "K", "M"], [0.0001, 0.2, 1, 3, 8, 12, 20])
      , spectralIndex = RandBetween(0, 9, RNG)
      , stellarTemplate = starTypeData[spectralClass];

    star.spectralType = spectralClass + spectralIndex;
    star.luminosity = stellarTemplate.luminosity * (4 / (spectralIndex + 2));
    star.template = stellarTemplate;
    this.star = star

    //radius 
    var s = Math.log(star.luminosity) + 8;
    s = Math.max(Math.min(s, 20), 2);
    this._r = s;

    //color 
    this._color = star.template.color

    let range = (min,max)=>min + RNG.random() * (max - min)

    //planets 
    let numberOfPlanets = RandBetween(...stellarTemplate.planets, RNG)
      , radius_min = 0.4 * range(0.5, 2)
      , radius_max = 50 * range(0.5, 2)
      , total_weight = (Math.pow(numberOfPlanets, 2) + numberOfPlanets) * 0.5
      , pr = radius_min
      , _planets = [];

    for (var i = 0; i < numberOfPlanets; i++) {
      pr += i / total_weight * range(0.5, 1) * (radius_max - radius_min);
      _planets.push(new Planet([this.seed, i].join("."),i,pr,star.luminosity / Math.pow(pr, 2)))
    }
    this._planets = _planets;

    let list = _planets.map(p=>p.HI).sort();
    this._habitability = list.length ? list.shift() : 5;
  }
  get point() {
    let G = 1
    // this.parent.GRIDSIZE
    let g = this.parent._grid[this.i]
    return g.map((p,i)=>(p * G) + this.offset[i])
    //- this.parent.SECTORSIZE/2
  }
  distance(s) {
    let pi = this.point
    let pj = s.point

    let d2 = pj.map((p,i)=>(p - pi[i]) * (p - pi[i])).reduce((s,v)=>s + v, 0)
    return Math.sqrt(d2)
  }
  get faction () {
    return this.claim > -1 ? this.parent.factions.find(f=> f.id == this.claim) : null
  }
  get nearestFactionSystem () {
    return this.parent.systems.filter(s => s.claim>-1).map(s => [s,this.distance(s)]).sort((a,b)=> a[1]-b[1])[0][0]
  }
  get POI() {
    return this._POI ? this[this._POI] : this._POI
  }
  get name() {
    return this.parent.names[this.i]
  }
  get UIColor() {
    return ["green", "blue", "yellow", "red", "black"][this._habitability - 1]
  }
  randomEvent () {
    
  }
}

class Sector {
  constructor(app, G={}, sp=RandomStart()) {
    this.app = app
    this.parent = G

    this._seed = G.seed || chance.natural()
    this.sp = sp

    this.seed = [this._seed, sp.join(",")].join(".")

    this.names = []
    this.systems = []
    this.factions = []

    let RNG = new Chance(this.seed)

    //ancients present 
    this._ancients = RNG.shuffle(Ancients).slice(0, 2)
    this._ancients[0] = this.withinClaim ? this.withinClaim.ancient : this._ancients[0]

    //make a name and reject badwords 
    let makeName = ()=>{
      var number_of_syllables = Math.floor(RNG.random() * 2 + 2), new_name;
      //generate a unique name without badwords
      while (true) {
        new_name = random_name(RNG, number_of_syllables);
        if (this.names.indexOf(new_name) >= 0 || isBadWord(new_name)) {} else {
          break;
        }
      }
      this.names.push(new_name);
    }

    //number of systems 
    let ns = 900 + RNG.d100() + RNG.d100()
    //create all grid ids possilbe 
    this.SECTORSIZE = 50
    this.GRIDSIZE = 5
    const gridids = BuildArray(10, (_,i)=>BuildArray(10, (_,j)=>BuildArray(10, (_,k)=>[i, j, k]))).flat(2)
    //shuffle them to get the random placement of points 
    //this._grid = RNG.shuffle(gridids).concat(RNG.shuffle(gridids)).slice(0, ns)
    this._grid = []

    for (let i = 0; i < ns; i++) {
      this._grid.push(BuildArray(3, ()=>RandBetween(0, this.SECTORSIZE * 1000, RNG) / 1000))
      makeName()
      this.systems.push(new System(this,i))
    }

    const COLORS = ["white", "maroon", "salmon", "pink", "tan", "olive", "goldenrod", "lime", "green", "teal", "aquamarine", "navy", "steelblue", "fuchsia", "purple"]
    let colors = RNG.shuffle(COLORS).concat(RNG.shuffle(COLORS))

    //get major factions at habitable worlds 
    this._major = []
    this.systems.filter(s=>s._habitability == 1).forEach(s=>{
      Claim(s, colors[this._major.length], RNG)
      this._major.push(s.i)
    }
    )

    //create lesser factions at suitable worlds and create POI at others 
    this.systems.forEach(s=>{
      let hi = s._habitability
      if (hi == 2) {
        Claim(s, RNG.pickone(COLORS), RNG)
      } else if (hi > 2) {
        //['creature','obstacle','hazard','site','faction']
        s._POI = RNG.bool() ? RNG.weighted(POI, [2, 1, 2, 4, 1]) : null
      }
    }
    )

    //establish/generate POI 
    this.systems.forEach(s=>CreatePOI[s._POI] ? CreatePOI[s._POI](s, new Chance(s.seed + ".POI")) : null)

    console.log(this)
  }
  get wormhole () {
    let p = ['A',this.sp].join()
    let w = this.parent._wormholes.filter(([a,b]) => p == a.join() || p == b.join())
    return w.length > 0 ? w[0] : null
  }
  get withinClaim() {
    let sp = this.sp
    //find if within 
    let c = this.parent.ancientClaims.filter(_c=>{
      let dx = _c.position.x - sp[0]
      let dy = _c.position.y - sp[1]
      return Math.sqrt(dx * dx + dy * dy) < _c.radius
    }
    )

    return c.length == 0 ? null : c[0]
  }
  get galaxy() {
    return this.parent
  }
  get ancients() {
    let others = this.factions.filter(f=>f.what == 'alien' && typeof f._people !== "string")
    return this._ancients.map(id=>{
      return this.factions.filter(f=>f._people == id)
    }
    ).concat(others)
  }
  get POI() {
    //create object 
    let poi = Object.fromEntries(POI.map(p=>[p, []]))
    //reduce poi into object
    return this.systems.filter(s=>s._POI).reduce((all,s)=>{
      all[s._POI].push(Object.assign({
        s
      }, s.POI))
      return all
    }
    , poi)
  }
  get showSystems () {
    let hab = ["Earthlike", "Survivable"]
    let poi = ["Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
    //["All","Earthlike", "Survivable", "Factions", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
    let filter = this.app.state.filterSystem

    let res = []
    
    if(hab.includes(filter)) {
      res = this.systems.filter(s => s._habitability == hab.indexOf(filter)+1)
    }
    else if (filter == "Factions") {
      res = this.systems.filter(s=> s.claim > -1)
    }
    else if (poi.includes(filter)) {
      let what = filter.slice(0,-1)
      res = this.systems.filter(s => s.POI && (s.POI.what == what || s.POI.type == what))
    }
    else {
      res = this.systems
    }

    return res.sort((a,b)=> a.name<b.name ? -1 : 1)
  }
  display3d() {
    const canvas = document.getElementById("renderCanvas");
    let engine = this.app.engine
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    const camera = new BABYLON.ArcRotateCamera("Camera",0,0,10,new BABYLON.Vector3(0,0,0),scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light",new BABYLON.Vector3(0,1,0),scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    //One 'sphere' for systems.
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
      diameter: 0.2,
      segments: 32,
      updatable: true
    });

    this.systems.forEach((s,i)=>{
      let _star = sphere.clone("star." + i);
      _star.position = new BABYLON.Vector3(...s.point);
      //scale 
      _star.scaling = new BABYLON.Vector3(...BuildArray(3, ()=>0.5 * s._r))
    }
    )

    sphere.setEnabled(false)
    /*
    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {
      width: 6,
      height: 6
    }, scene);
    */

    this.app.scene = scene;
  }
  galaxyDisplay() {
    if (SVG('g')) {
      SVG.find('g').remove()
    }

    let app = this.app
    let svg = this.app.svg

    let claimmap = svg.group().attr('id', 'claimmap')
    this.parent.ancientClaims.forEach((c,i)=>{
      let p = c.position

      let _claim = svg.circle(c.radius).attr({
        cx: p.x,
        cy: p.y
      }).addClass('claim').data({
        c
      }).click(async function() {
        let c = this.data("c")
        console.log(c)
      })

      claimmap.add(_claim)
    }
    )

    //size 
    let {x, y, height, width} = claimmap.bbox()
    //viewbox
    svg.attr('viewBox', [x, y, width, height].join(" "))
  }
  display() {
    let app = this.app
    let svg = SVG().addTo('.container').size('800', '800')
    let systems = this.showSystems

    let isometric = app.state.isometric == 'Isometric'

    let SECTORSIZE = 50
    //ly
    let PIXELSCALE = 20
    let GRIDCOUNT = 10

    let grid = SECTORSIZE * PIXELSCALE / GRIDCOUNT
    let mid = PIXELSCALE * SECTORSIZE / 2
    //create the grid 
    let gridmap = svg.group().attr('id', 'gridmap')
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        let xyz = [[i * grid, j * grid, mid], [i * grid + grid, j * grid, mid], [i * grid + grid, j * grid + grid, mid], [i * grid, j * grid + grid, mid]].map(_xyz=>{
          let {x, y} = isometric ? toIsometric(..._xyz) : {
            x: _xyz[0],
            y: _xyz[1]
          }
          return [x, y].join(",")
        }
        ).join(" ")
        gridmap.add(svg.polygon(xyz).addClass('grid'))
      }
    }

    //keep track of all claims 
    let allClaims = [...this.factions.values()].map(f=>f._claims).flat()
    //create the stars 
    let stars = svg.group().attr('id', 'stars')
    systems.forEach((s)=>{
      let _p = s.point.map(_p=>_p * PIXELSCALE)
      let {x, y} = isometric ? toIsometric(..._p) : {
        x: _p[0],
        y: _p[1]
      }

      let _star = svg.circle(s._r * 1.5).attr({
        cx: x,
        cy: y
      }).fill(s._color).addClass('star').data({
        i : s.i
      }).click(async function() {
        let _i = this.data("i")

        console.log(app.system)
        app.dialog = "System." + _i
      })
      if (s.claim > -1) {
        _star.attr({
          stroke: this.factions.find(f=>f.id == s.claim).color,
          'stroke-width': 3
        })
      }

      stars.add(_star)
    }
    )

    //size 
    let {x, y, height, width} = app.state.filterSystem == "All" ? stars.bbox() : gridmap.bbox()
    //viewbox
    svg.attr('viewBox', [x, y, width, height].join(" "))
  }
}

export {Sector}
