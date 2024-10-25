//https://stackoverflow.com/questions/55983221/auto-generate-pixel-planets-in-canvas
//https://github.com/dgreenheck/threejs-procedural-planets

import {starTypeData, gravity, blackbody, planetTypeData} from '../astrophysics.js';
import {GasGiantColors, RockyColors, TerrainColors} from "../../data.js"
import {Plate, TopoPoly} from "./plate.js"

/*
  Planets 
*/

class Planetoid {
  constructor(parent, orbitalRadius, insolation) {
    this.app = parent.app
    this.parent = parent
    // Earth incident radiation from Sol == 1
    this._insolation = insolation
    this._orbitalRadius = orbitalRadius

    this._rotate = 1
  }
  get galaxy() {
    return this.app.galaxy
  }
  get system() {
    return this.what == "Planet" ? this.parent : this.parent.parent
  }
  get ellipse() {
    return [0, 0, this._orbitalRadius, this._minorAxis]
  }
  get gravity() {
    return gravity(this.radius, this.density)
  }
  detail() {
    detail.orbitalRadius = this._orbitalRadius.toFixed(2);
    detail.insolation = this.insolation.toFixed(2);
    detail.blackbodyK = blackbody(this.insolation);
  }
  get shortName() {
    let S = this.system
    return `${this.what == "Planet" ? _.romanNumeral(this.i) : _.romanNumeral(this.parent.i) + ", " + _.suffix((this.i + 1)) + " Moon"}`
  }
  get name() {
    let S = this.what == "Planet" ? this.parent : this.parent.parent
    return `${S.name} ${this.what == "Planet" ? _.romanNumeral(this.i) : _.romanNumeral(this.parent.i) + ", " + _.suffix((this.i + 1)) + " Moon"}`
  }
  get info() {
    let {classification, _orbitalRadius, gravity, description, atmosphere, temp} = this

    return `${_orbitalRadius.toFixed(1)} ${this.what == "Planet" ? "AU" : "LD"}, ${classification}, ${gravity.toFixed(2)}g, ${temp}, ${atmosphere.toLowerCase()} atmosphere, ${description}`
  }
  get cssClass() {
    let _type = this.classification
    return _type == "gas giant" ? "gasGiant" : this.HI == 1 ? "earthlike" : _type
  }
  /*
    Favorites 
  */
  get isFavorite() {
    return this.system._favorites.includes(this.seed)
  }
  manageFavorites() {
    this.system.manageFavorites(this.seed)
  }
  /*
    Topograpy 
  */
  setTopo() {
    if (this._topo)
      return

    console.time('Planet Topo')
    //get basic voronoi 
    let {plates, topo} = this.galaxy.voronoi
    let pD = plates.delaunay
    let tD = topo.delaunay

    //planet info 
    let hydro = Number(this.hydrographics) / 100
    let isHI = hydro > 0 && this.HI < 3

    //establish topo object 
    let t = this._topo = {
      pids: [],
      plates: [],
      polys: []
    }

    let RNG = new Chance(this.seed)

    //create a plate 
    let createPlate = ()=>t.plates.push(new Plate(this,t.plates.length,RNG.randBetween(56, 750) / 1000));

    //group plates 
    let remain = d3.range(pD.polygons.length).map(i=>i)
    let pi = 0
    let pushPlate = (id,_plate)=>{
      t.pids[id] = pi
      remain.splice(remain.indexOf(id), 1)
      _plate.push(id)
      return _plate
    }
    while (remain.length > 0) {
      //create plate 
      createPlate()
      //random number and reduce 
      let n = RNG.d6() + 1
      n = n > remain.length ? remain.length : n
      //set start poly plate 
      let _plate = pushPlate(RNG.pickone(remain), [])
      //group polys by neighbor 
      while (_plate.length < n) {
        let j = 0
        //only select neighbors that remain 
        let cn = pD.neighbors[RNG.pickone(_plate)].filter(pid=>remain.includes(pid))
        //pick different if no neighbor, but keep loop to 10 
        while (cn.length == 0 && j < 10) {
          cn = pD.neighbors[RNG.pickone(_plate)].filter(pid=>remain.includes(pid))
          j++
        }
        if (cn.length > 0) {
          pushPlate(RNG.pickone(cn), _plate)
        } else {
          //break loop if no cn 
          break;
        }
      }
      //step plate 
      pi++
    }

    let nPlate = t.plates.length
    //run topo if a rocky world 
    if (this.classification == "rocky") {
      topo.polygons().features.forEach((poly,i)=>{
        let site = poly.properties.site.coordinates
        let pi = t.pids[pD.find(...site)]
        t.polys.push(new TopoPoly(t.plates[pi],poly,i,(RNG.randBetween(0, 100) - 50) / 1000))
      }
      )

      //also create mountain ranges 
      RNG.shuffle(t.plates).slice(0, 10 + RNG.sumDice("2d6")).forEach(p=>{
        //mountain range height
        let me = RNG.randBetween(200, 550) / 1000
        //border 
        let bi = RNG.pickone(Object.keys(p.borders))
        let border = p.borders[bi]
        let bids = border.map(b=>b.i)
        let elevated = []
        //run through border adding height 
        border.forEach(bp=>{
          bp.e += me
          bp.isMountain = true
          //increase neighbor elevations 
          bp.NData.forEach(n=>{
            if (!(elevated.includes(n.i) || bids.includes(n.i))) {
              n.e += me / 2
              elevated.push(n.i)
            }
          }
          )
        }
        )
      }
      )
    } else {
      //gas giant 
      plates.polygons().features.forEach((poly,i)=>{
        let pi = t.pids[i]
        t.polys.push(Object.assign({}, poly, {
          i,
          pi,
          e: 0.5,
          color: "brown"
        }))
      }
      )
    }

    console.timeEnd('Planet Topo')
    console.log(this)
  }
  /*
    UI 
  */
  //slider for planet rotate
  get slider() {
    let html = this.app.html

    //get basic voronoi 
    let {projection, path} = this.galaxy.voronoi

    let Rotate = (val)=>{
      this._rotate = val
      projection.rotate([val, 0]);
      d3.select("svg").selectAll('path').attr('d', path);
    }

    return html`
    <div class='flex'>
      <span class="mh1">Rotate</span>
      <input class="w-100 slider" type="range" min="1" max="360" value="${this._rotate}" onChange="${(e)=>Rotate(Number(e.target.value))}"></input>
      <span class="mh1"></span>
    </div>`
  }
  //click functionality in sysyem 
  onClick() {
    let G = this.galaxy
    let html = this.app.html
    //provide details 
    //build html to show 
    let text = html`
    <div class="bg-white br2 pa2">
      <div class="flex items-center justify-between">
        <span class="f4">${this.name}</span> 
        <div class="tc b pointer dim bg-light-green br2 pa2" onClick=${()=>G.show = this}>View</div>
      </div>
      <div class="i">${this.info}</div>
    </div>`
    G._option = [['planetData', this], text]
    this.app.updateState("show", "Galaxy")
    console.log(this)
  }
  //planet display 
  display(shader="Surface") {
    //set topo 
    this.setTopo()

    console.time('Planet Draw')
    //get svg 
    let svg = d3.select("svg")
    //clear 
    svg.selectAll("*").remove()

    let P = this
    //get basic voronoi s
    let {plates, topo, projection, path} = this.galaxy.voronoi
    let pTopo = this._topo

    //make a gradient for gass giants 
    let makeGradient = (p)=>{
      return SVG('svg').gradient('linear', function(add) {
        p._gradient.forEach(_g=>add.stop(..._g))
        add.stop(0.95, '#fff')
        add.stop(1, p.color)
      }).attr("gradientTransform", "rotate(90)")
    }

    svg.append('path').attr('id', 'planetoid').attr('class', this.cssClass).datum({
      type: "Sphere"
    }).attr('d', path).attr('fill', this.cssClass == "gasGiant" ? makeGradient(this) : "none")

    svg.append('g').attr('class', `polygons ${this.cssClass}`).selectAll('path').data(pTopo.polys).enter().append('path').attr('class', 'poly').attr('d', path).attr('fill', this._gradient ? "white" : function(d, i) {
      return d.color
    })
	.attr('stroke', (d,i)=> {
		return d.color
	})
    .on("click", (e,d)=>{
      const [x,y] = d3.pointer(e)
      console.log(d)
    }
    )

    //size 
    let {x, y, height, width} = SVG('#planetoid').bbox()
    //viewbox
    svg.attr('viewBox', [0, y, x + width + 10, height + 10].join(" "))
    console.timeEnd('Planet Draw')
  }
  /*
    UI 
  */
  /*
    UI 
  */
  get UI() {
    let {app, parent, system, galaxy} = this
    let MS = galaxy.MajorSector
    let S = galaxy.System
    const {html} = app

    const linkCSS = "b pointer underline-hover hover-blue flex mh1"
    const header = html`
	<div>
      <div class="flex items-center">
        <span class="${linkCSS}" onClick=${()=>galaxy.show = galaxy}>Galaxy</span>::
		<span class="${linkCSS}" onClick=${()=>galaxy.show = MS}>Sector [${MS.id.join()}]</span>
      </div>
      <div class="flex items-center">
        <span class="${linkCSS}" onClick=${()=>galaxy.show = S}>${S.name}</span>
        <span class="${linkCSS}" onClick=${()=>galaxy.show = this}>${this.shortName}</span>
        <div class="f3 gray pointer favorite ${this.isFavorite ? "selected" : ""}" onClick=${()=>app.refresh(this.manageFavorites())}>★</div>
      </div>
	  ${this.slider}
	</div>`

    const left = html``

    const right = html``

    return {
      header,
      left,
      right
    }
  }
}

class Moon extends Planetoid {
  constructor(parent, orbitalRadius, insolation, isMinor=false) {
    super(parent, orbitalRadius, insolation);

    this.what = "Moon"
    this.i = parent._moons.length
    this.seed = [parent.seed, "Moon", this.i].join(".")

    let RNG = new Chance(this.seed)
    RNG.range = (min,max)=>min + RNG.random() * (max - min)

    //orbit 
    let a = this._orbitalRadius
    let _e = RNG.weighted(['200.800', '5.200'], [1, 3])
    let e = this._eccentricity = RNG.randBetween(..._e.split(".").map(Number)) / 1000
    let b = this._minorAxis = Math.sqrt(a * a * (1 - e * e))

    //planet template 
    let template = this.template = planetTypeData[0];
    //always rocky
    this.classification = template.classification;

    //calculations 
    this.radius = parent.classification == "rocky" || isMinor ? RNG.range(50, 2500) : RNG.range(template.radius[0], template.radius[1]);
    this.density = RNG.range(template.density[0], template.density[1]);
    this.hydrographics = template.hydrographics(RNG, insolation, this.radius, this.density);
    this.atmosphere = template.atmosphere(RNG, insolation, this.radius, this.density, this.hydrographics);

    Object.assign(this, this.template.HI(this._insolation, this.radius, this.density, Number(this.hydrographics), this.atmosphere))

    this.color = RNG.pickone(RockyColors).name

    return this;
  }
}

class Planet extends Planetoid {
  constructor(parent, orbitalRadius, insolation, HI=null) {
    super(parent, orbitalRadius, insolation);

    this.what = "Planet"
    this.i = parent._planets.length
    this.seed = [parent.seed, "Planet", this.i].join(".")

    let RNG = new Chance(this.seed)
    RNG.range = (min,max)=>min + RNG.random() * (max - min)

    let a = this._orbitalRadius
    let _e = RNG.weighted(['200.800', '5.200'], [1, 3])
    let e = this._eccentricity = RNG.randBetween(..._e.split(".").map(Number)) / 1000
    let b = this._minorAxis = Math.sqrt(a * a * (1 - e * e))

    //planet template 
    let template = this.template = RNG.weighted(planetTypeData, [insolation * 100, 10, 1]);
    //let template = this.template = opts.ti != null ? planetTypeData[opts.ti] : this.template
    let _type = this.classification = template.classification;

    //calculations 
    this.radius = RNG.range(template.radius[0], template.radius[1]);
    this.density = RNG.range(template.density[0], template.density[1]);
    this.hydrographics = template.hydrographics(RNG, insolation, this.radius, this.density);
    this.atmosphere = template.atmosphere(RNG, insolation, this.radius, this.density, this.hydrographics);

    /*
      insure a habitible world
    */
    if (_type == "rocky" && HI == 1 && (orbitalRadius < 1.5 && orbitalRadius > 0.65)) {
      this.radius = RNG.range(6357 * 0.7, 6357 * 1.3)
      //(Earth = 6357)
      this.density = RNG.range(5.52 * 0.7, 5.52 * 1.3)
      //(Earth = 5.52)
      this.hydrographics = RNG.range(15, 95)
      this.atmosphere = "Breathable"
    }

    Object.assign(this, this.template.HI(this._insolation, this.radius, this.density, Number(this.hydrographics), this.atmosphere))
    this.color = _type == "gas giant" ? RNG.pickone(GasGiantColors).name : _type == "rocky" ? RNG.pickone(RockyColors).name : "brown"

    //moons 
    let nMajor = _type == "rocky" ? RNG.pickone([0, 0, 1, 2]) : 1 + RNG.d4()
    let nMinor = _type == "rocky" ? RNG.pickone([0, 0, 1, 2]) : RNG.sumDice("2d6")
    let radius_min = 0.4 * RNG.range(0.5, 2)
      , radius_max = 50 * RNG.range(0.5, 2)
      , total_weight = (Math.pow(nMajor + nMinor, 2) + nMajor + nMinor) * 0.5
      , pr = radius_min;

    this._moons = []
    _.fromN(nMajor, ()=>{
      let ni = this._moons.length
      pr += ni / total_weight * RNG.range(0.5, 1) * (radius_max - radius_min);
      this._moons.push(new Moon(this,pr,insolation,false))
    }
    )
    _.fromN(nMinor, ()=>{
      let ni = this._moons.length
      pr += ni / total_weight * RNG.range(0.5, 1) * (radius_max - radius_min);
      this._moons.push(new Moon(this,pr,insolation,true))
    }
    )

    return this;
  }
  get moonHI() {
    return _.fromN(4, (i)=>this._moons.filter(m=>m.HI == i + 1))
  }
  get svgPad() {
    let _r = this.radius / 1000 < 3 ? 3 : this.radius / 1000

    return this._moons.reduce((s,m,j)=>{
      let pad = 10
      let _mr = m.radius / 1000 < 3 ? 3 : m.radius / 1000
      j == 0 ? s.push(50 + _r + _mr + pad) : s.push(s[j - 1] + 2 * _mr + pad)
      return s
    }
    , [])
  }
  //svg for system display
  svg(svg, pG) {
    let p = this
    //make a gradient for gass giants 
    let makeGradient = ()=>{
      return svg.gradient('linear', function(add) {
        p._gradient.forEach(_g=>add.stop(..._g))
      }).attr("gradientTransform", "rotate(90)")
    }

    //data for svg display 
    let pad = this.parent.svgPad.find(_pad=>_pad[0] == this.i)[1]
    let _r = this.radius / 1000 < 3 ? 3 : this.radius / 1000
    let cx = pad - _r

    let psvg = svg.circle(2 * _r).attr({
      cx,
      cy: 0
    }).addClass('planet').addClass(this.cssClass).fill(this.cssClass == "gasGiant" ? makeGradient() : this.color).data({
      i: this.i
    }).click(()=>p.onClick())
    //add to group 
    pG.add(psvg)

    let mPad = this.svgPad
    this._moons.forEach((m,i)=>{
      let _mr = m.radius / 1000 < 3 ? 3 : m.radius / 1000

      let moon = svg.circle(2 * _mr).attr({
        cx,
        cy: mPad[i] - _mr
      }).addClass('planet').fill(m.color).data({
        i
      }).click(()=>m.onClick())
      //add to group 
      pG.add(moon)
    }
    )
  }
}

export {Planet}
