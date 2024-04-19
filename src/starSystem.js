import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {starTypeData, gravity, blackbody, planetTypeData} from './astrophysics.js';

import {Planet} from './planet/index.js';

import {CreatePOI} from './poi.js';

//generating a system based upon a seed 
class System {
  constructor(parent, i, HI=null) {
    this._HI = HI
    this.what = "System"

    this.app = parent.app
    this.parent = parent
    this.seed = [parent.seed, 'System', i].join(".")
    this.id = i
    this.claim = -1

    let RNG = new Chance(this.seed)

    //star detail 
    const SPECTRAL = ["O", "B", "A", "F", "G", "K", "M"]
    let star = {}
      , _sC = RNG.weighted([0, 1, 2, 3, 4, 5, 6], [0.0001, 0.2, 1, 3, 8, 12, 20])
      , spectralClass = HI == null ? SPECTRAL[_sC] : "G"
      , spectralIndex = RandBetween(0, 9, RNG)
      , stellarTemplate = starTypeData[spectralClass];

    star.spectralType = spectralClass + spectralIndex;
    star.luminosity = stellarTemplate.luminosity * (4 / (spectralIndex + 2));
    star.template = stellarTemplate;
    this.star = star

    //radius 
    var [rmin,rmax] = ["6.6,20", "1.8,6.6", "1.4,1.8", "1.1,1.4", "0.9,1.1", "0.7,0.9", "0.1,0.7"][_sC].split(",")
    this.stellarR = Number(rmin) + RNG.random() * (Number(rmax) - Number(rmin))
    let s = Math.log(star.luminosity) + 8;
    s = Math.max(Math.min(s, 20), 2);
    this._r = s

    //color 
    this._color = star.template.color

    let range = (min,max)=>min + RNG.random() * (max - min)

    //planets 
    let numberOfPlanets = RandBetween(...stellarTemplate.planets, RNG)
      , radius_min = 0.4 * range(0.5, 2)
      , radius_max = 50 * range(0.5, 2)
      , total_weight = (Math.pow(numberOfPlanets, 2) + numberOfPlanets) * 0.5
      , pr = radius_min;

    this._planets = [];
    for (var i = 0; i < numberOfPlanets; i++) {
      pr += i / total_weight * range(0.5, 1) * (radius_max - radius_min);
      this._planets.push(new Planet(this,pr,star.luminosity / Math.pow(pr, 2),HI))
    }

    let list = this._planets.map(p=>p.HI).concat(this._planets.map(p=>p._moons.map(m=>m.HI)).flat()).sort()
    this.HI = list.length ? list.shift() : 5;

    //POI 
    let _poi = (r)=>r <= 4 ? 'raiders' : r <= 6 ? 'hazard' : r == 7 ? 'obstacle' : r <= 12 ? 'site' : 'settlement'
    let _safe = this.parent.safety[1]
    //always make two, only use as defined by ssytem and rand 
    let poiArr = BuildArray(2, ()=>_poi(RNG.d12() + _safe))
    poiArr = this.HI < 3 ? poiArr : RNG.weighted([poiArr,poiArr.slice(0,1), []], [1, 1, 2])
    //generate and assign
    this.POI = poiArr.map((p,i)=>CreatePOI[p] ? CreatePOI[p](this, new Chance([this.seed, "POI", i].join("."))) : null)
  }
  get name() {
    return this._name || this.parent._names[this.id]
  }
  //parent 
  get galaxy() {
    return this.parent.galaxy
  }
  /*
    Functions 
  */
  setGradients(RNG=new Chance(this.seed)) {
    this._planets.forEach(p=>{
      if (p.classification == "gas giant") {
        let c = d3.color(p.color)
        let bright = RNG.pickone([0, 1])
        let color = ()=>RNG.pickone([c.brighter(), c.darker(), c])
        let n = RandBetween(4, 10, RNG)
        p._gradient = BuildArray(n, (_,i)=>[i / n + (RNG.random() * 0.15 - 0.075), i % 2 == bright ? c.brighter(3) : color()])
      }
    }
    )
  }
  /*
    Celestial Bodies 
  */
  get habitible() {
    return BuildArray(2, (_,i)=>this.planetHI[i].concat(this.moonHI[i]))
  }
  get planetHI() {
    return BuildArray(4, (_,i)=>this._planets.filter(m=>m.HI == i + 1))
  }
  get planets() {
    return this._planets
  }
  get objects () {
    return this.planets.concat(this.POI || []).sort((a,b)=>a._orbitalRadius-b._orbitalRadius)
  }
  get moons() {
    return this._planets.map(p=>p._moons).flat()
  }
  get moonHI() {
    return BuildArray(4, (_,i)=>this._planets.map(p=>p._moons).flat().filter(m=>m.HI == i + 1))
  }
  /*
    Location and Distance 
  */
  get point() {
    return this._loc || this.parent._loc[this.id]
  }
  distance(s) {
    let pi = this.point
    let pj = s.point

    let d2 = pj.map((p,i)=>(p - pi[i]) * (p - pi[i])).reduce((s,v)=>s + v, 0)
    return Math.sqrt(d2)
  }
  get svgPad() {
    //show star 
    let SR = 695.700
    //1000 km 
    let starR = this.stellarR * SR

    // run through the planets 
    return this.objects.reduce((s,p,j)=>{
      let pad = 10
      let _r = p.radius / 1000 < 3 ? 3 : p.radius / 1000
      let dr = j == 0 ? (starR * 0.5 + _r + pad) : (s[j - 1][1] + 2 * _r + pad)
      s.push([p._seed||p.i,dr])
      return s
    }
    , [])
  }
  /*
    Factions 
  */
  get faction() {
    return this.claim > -1 ? this.galaxy._factions.find(f=>f.id == this.claim) : null
  }
  get nearestFactionSystem() {
    return this.parent.systems.filter(s=>s.claim > -1).map(s=>[s, this.distance(s)]).sort((a,b)=>a[1] - b[1])[0][0]
  }
  /*
    Favorites 
  */
  get isFavorite() {
    let allF = this.galaxy._favorites.map(f=>f[0])
    return allF.includes(this.seed)
  }
  manageFavorites() {
    let G = this.galaxy
    let i = G._favorites.map(f=>f[0]).indexOf(this.seed)
    i > -1 ? G._favorites.splice(i, 1) : G._favorites.push([this.seed, this._HI, this.name, this.parent.id])
    //save 
    G.save()
  }
  randomEvent() {}
  /*
    UI
  */
  get UIColor() {
    return ["green", "blue", "yellow", "red", "black"][this.HI - 1]
  }
  display() {
    if (SVG('svg')) {
      SVG.find('svg').remove()
    }
    
    //set gas giant gradients 
    this.setGradients()

    this.galaxy._show = "System"

    let app = this.app
    let svg = SVG().addTo('#map').size('100%', '100%')

    //show system
    let S = this
    let G = this.galaxy

    //show star 
    let SR = 695.700
    //1000 km 
    let starR = this.stellarR * SR
    svg.circle(2 * starR).attr({
      cx: 0 - starR * 0.75,
      cy: 0
    }).addClass('star').fill(S._color)

    //create & place svg for planets and moons 
    let planetGroup = svg.group().attr('id', 'planets')
    this.objects.forEach(o=> o.svg(svg,planetGroup))

    //size 
    let {x, y, height, width} = planetGroup.bbox()
    //viewbox
    svg.attr('viewBox', [0, y, x + width + 10, height + 10].join(" "))

    //log 
    console.log(this)
  }
}

export {System}
