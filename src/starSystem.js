import {starTypeData, gravity, blackbody, planetTypeData} from './astrophysics.js';

import {Planet} from './planet/index.js';

import {CreatePOI} from './poi.js';

//function to create a random point in the sector
const PointInSector = (sid,RNG)=>{
  let p = [..._.fromN(2, (i)=>5000 * sid[i] + RNG.randBetween(1, 5000)), RNG.randBetween(1, 1000)]
  return p
}

//generating a system based upon a seed 
class System {
  constructor(parent, opts={}) {
    this.what = "System"

    this.app = parent.app
    this.parent = parent

    this.id = opts.i || chance.natural()
    this.seed = [parent.seed, 'System', this.id].join(".")
    this._HI = opts.HI || null
    this._name = opts._name || null

    let RNG = new Chance(this.seed)

    //location in sector 
    this._loc = opts.loc || PointInSector(parent.id || [0, 0], RNG)

    //star detail 
    const SPECTRAL = ["O", "B", "A", "F", "G", "K", "M"]
    let star = {}
      , _sC = RNG.weighted([0, 1, 2, 3, 4, 5, 6], [0.0001, 0.2, 1, 3, 8, 12, 20])
      , spectralClass = this._HI == null ? SPECTRAL[_sC] : "G"
      , spectralIndex = RNG.randBetween(0, 9, RNG)
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
    let numberOfPlanets = RNG.randBetween(...stellarTemplate.planets)
      , radius_min = 0.4 * range(0.5, 2)
      , radius_max = 50 * range(0.5, 2)
      , total_weight = (Math.pow(numberOfPlanets, 2) + numberOfPlanets) * 0.5
      , pr = radius_min;

    this._planets = [];
    for (var i = 0; i < numberOfPlanets; i++) {
      pr += i / total_weight * range(0.5, 1) * (radius_max - radius_min);
      this._planets.push(new Planet(this,pr,star.luminosity / Math.pow(pr, 2),this._HI))
    }

    let list = this._planets.map(p=>p.HI).concat(this._planets.map(p=>p._moons.map(m=>m.HI)).flat()).sort()
    this.HI = list.length ? list.shift() : 5;

    //POI 
    let _poi = (r)=>r <= 4 ? 'raiders' : r <= 6 ? 'hazard' : r == 7 ? 'obstacle' : r <= 12 ? 'site' : 'settlement'
    let _safe = this.parent.safety[1]
    //always make two, only use as defined by ssytem and rand 
    let poiArr = _.fromN(2, ()=>_poi(RNG.d12() + _safe))
    poiArr = this.HI < 3 ? poiArr : RNG.weighted([poiArr, poiArr.slice(0, 1), []], [1, 1, 2])
    //generate and assign
    this.POI = poiArr.map((p,i)=>CreatePOI[p] ? CreatePOI[p](this, new Chance([this.seed, "POI", i].join("."))) : null)

    //favorites 
    let _gf = this.galaxy.favorites.find(f=>f.seed == this.seed) || {}
    this._favorites = _gf.favs || []
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
        let n = RNG.randBetween(4, 10)
        p._gradient = _.fromN(n, (i)=>[i / n + (RNG.random() * 0.15 - 0.075), i % 2 == bright ? c.brighter(3) : color()])
      }
    }
    )
  }
  /*
    Celestial Bodies 
  */
  get habitible() {
    return _.fromN(2, (i)=>this.planetHI[i].concat(this.moonHI[i]))
  }
  get planetHI() {
    return _.fromN(4, (i)=>this._planets.filter(m=>m.HI == i + 1))
  }
  get planets() {
    return this._planets
  }
  get objects() {
    return this.planets.concat(this.POI || []).sort((a,b)=>a._orbitalRadius - b._orbitalRadius)
  }
  get moons() {
    return this._planets.map(p=>p._moons).flat()
  }
  get moonHI() {
    return _.fromN(4, (i)=>this._planets.map(p=>p._moons).flat().filter(m=>m.HI == i + 1))
  }
  /*
    Location and Distance 
  */
  get point() {
    return this._loc
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
      s.push([p._seed || p.i, dr])
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
  get favorites() {
    return this.objects.concat(this.moons).filter(o=>this._favorites.includes(o.seed))
  }
  get isFavorite() {
    let allF = this.galaxy.opts.favorites.map(f=>f[0])
    return allF.includes(this.seed)
  }
  manageFavorites(seed=null) {
    let G = this.galaxy
    let GF = G.opts.favorites
    //favorite index and data 
    let i = GF.map(f=>f[0]).indexOf(this.seed)
    let fav = [this.seed, this._HI, this.parent.id, this._favorites, G._era, this.name]
    //manage planet Favorites
    let pi = this._favorites.indexOf(seed)
    if (pi > -1) {
      this._favorites.splice(pi, 1)
    } else {
      this._favorites.push(seed)
    }
    //save favorites 
    if (i > -1) {
      if (seed != null) {
        //save specific 
        GF[i] = fav
      } else {
        //remove
        GF.splice(i, 1)
      }

    } else {
      GF.push(fav)
    }
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
    let svg = SVG().addTo('#map').size('100%', '100%').addClass("system")

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
    this.objects.forEach(o=>o.svg(svg, planetGroup))

    //size 
    let {x, y, height, width} = planetGroup.bbox()
    //viewbox
    svg.attr('viewBox', [0, y, x + width + 10, height + 10].join(" "))

    //log 
    console.log(this)
  }
  /*
    UI 
  */
  get UI() {
    let {app, parent, galaxy, POI, habitible, favorites} = this
    let _habitible = habitible.flat()
    const {html} = app

    const linkCSS = "b pointer underline-hover hover-blue flex mh1"
    const header = html`
	<div>
      <div class="flex items-center">
        <span class="${linkCSS}" onClick=${()=>galaxy.show = galaxy}>Galaxy</span>::
		<span class="${linkCSS}" onClick=${()=>galaxy.show = parent}>Sector [${parent.id.join()}]</span>
      </div>
      <div class="flex items-center">
        <span class="${linkCSS}" onClick=${()=>galaxy.show = this}>${this.name}</span>
        <div class="f3 gray pointer favorite ${this.isFavorite ? "selected" : ""}" onClick=${()=>app.refresh(this.manageFavorites())}>★</div>
      </div>
	</div>`

    const left = html`
	<div style="background-color: rgba(255,255,255,0.5);">
		<div class="flex ba br1 mb1 ph2">
			<div class="b mr2 ${POI.length > 0 ? "" : "dn-ns"}">POI:</div>
			<div>${POI.map(p=>html`
				<div>❖${p.text || p.short}</div>
				<div class="i ph3">➣${p.whereText}</div>`)}
			</div>
		</div>
		<div class="flex ba br1 mb1 ph2 ${_habitible.length > 0 ? "" : "dn-ns"}">
			<div class="b mr1">Habitable:</div>
			<div>${_habitible.map(p=>html`
				<div class="pointer underline-hover hover-blue" onClick="${()=>galaxy.show = p}">${p.name}</div>`)}
			</div>
		</div>
		<div class="flex ba br1 mb1 ph2 ${favorites.length > 0 ? "" : "dn-ns"}">
			<div class="b mr1">Favorites:</div>
			<div>${favorites.map(p=>html`
				<div class="pointer underline-hover hover-blue" onClick="${()=>galaxy.show = p}">${p.name}</div>`)}
			</div>
		</div>
		${galaxy._option.length == 0 ? "" : galaxy._option[1]}
	</div>`

    const right = html``

    return {
      header,
      left,
      right
    }
  }
}

export {System}
