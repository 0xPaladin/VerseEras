import {MakeName} from '../utils/randomName.js';

import {System} from './starSystem.js';

import {CreatePOI} from './poi.js';

import {RandomPeople} from '../people.js';

import {Elements, Magic} from '../data.js';

const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]

/*
  Isometric 
*/

const toIsometric = (_x, _y, _z) => {
  return {
    x: (_x - _y) * 0.866025,
    y: _z + (_x + _y) * 0.5
  }
}

/*
  Sector Class 
*/

const SECTOR = 1000
// sector size in LY 

export class Sector {
  constructor(G, id) {
    this.what = "Sector"
    this.filter = "All"

    this.galaxy = G

    this._seed = G.seed || chance.natural()
    this.id = id.slice(0,2)
	this.d = id[2]

    this.seed = [G.seed, 'Sector', id.join()].join(".")

    //establish random gen 
    let RNG = new Chance(this.seed)

    let FA = this.factions.map(f => f.alignment)
    let alignment = this.alignment = FA.length > 0 ? RNG.pickone(FA) : ['Heralds', 'ExFrame'].includes(G._era) ? RNG.pickone(['chaotic', 'evil']) : "neutral"
    let alMod = [5, 3, 0, -3, -5][['chaotic', 'evil', 'neutral', 'good', 'lawful'].indexOf(alignment)]
    let sR = RNG.d12() + alMod
    this.safety = sR <= 1 ? ["safe", 3] : sR <= 3 ? ["unsafe", 2] : sR <= 9 ? ["dangerous", 1] : ["perilous", 0]
  }
  /*
    Functions 
  */
  refresh() {
    let G = this.galaxy
    let {safety} = this
    //keep names for no repeats 
    this._names = []
    //systems 
    this._loc = []
    this._systems = []

    //establish random gen 
    let RNG = new Chance(this.seed)

    //number of systems 
	let ngs = this.starsInSector.points.length
	//based upon stars in sector - R<0.95 <8 <20
    let ns = ngs > 20 ? 600 : ngs > 0 ? 333 : this.d < 1 ? 150 : 75
    for (let i = 0; i < ns; i++) {
      let _name = MakeName(this._names, RNG)
      //make and push to systems 
      this._systems.push(new System(this,{
        i,
        _name
      }))
    }

    //create faction sytems 
    this._fs = this.allFactions.map(F => {
      //generate 5 systems per tier 
      return _.fromN(5 + 5 * F.tier, i => {
        let _name = MakeName(this._names, RNG)

        //what is the system 
        let _what = RNG.pickone(["Settlement", "Site"])
        _what = "Settlement" ? RNG.weightedString(F.settlementTypes) : RNG.weighted(['Outpost', 'Resource', 'Gate', 'Infrastructure'], [2, 2, 1, 1])
        //check for planet 
        let HI = _what == "Planet" ? F.isAncient || F.people == 'Proto-Ancient' ? RNG.pickone([1, 2, 3]) : 1 : null

        //make 
        //create system 
        let si = F.i * 10000 + i
        let S = new System(this,{
          i: si,
          HI,
          _name
        })

        //determine owner 
        let altFaction = RNG.pickone(this.factions)
        let f = this.galaxy._era == F.era ? F : altFaction

        //poi needs  {type, f, creator, ei, _i} 
        let poi = {
          _i: si,
          f: f,
          creator: F,
          ei: G.eraList.indexOf(F.era),
          type: i < F.tier ? F.settlementTypes.split("/")[0].split(",")[0] : _what,
        }
        S.POI = [CreatePOI.faction(S, poi, RNG)]
        S._f = f

        //done
        return S
      }
      )
    }
    ).flat()
  }
  //add a system to the sector 
  addSystem(opts, RNG=chance) {
    let i = opts.i || RandBetween(1000000, 20000000, RNG)
    //create system 
    let S = new System(this,i)
    if (opts.HI) {
      //repeat until we get a system 
      while (opts.HI != S.HI) {
        i += 10000
        S = opts.HI < 3 ? new System(this,i,opts.HI) : new System(this,i)
      }
    }

    return S
  }
  //get habitable systems
  get habitable() {
    return BuildArray(4, (_, i) => {
      let planets = []
      let moons = []
      this.systems.forEach(s => {
        planets = planets.concat(s.planetHI[i])
        moons = moons.concat(s.moonHI[i])
      }
      )

      return {
        planets,
        moons
      }
    }
    )
  }
  get systems() {
    return this._systems.concat(this._fs)
  }
  showSystems(filter) {
    //["All","Earthlike", "Survivable", "Factions", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]

    let hab = ["Earthlike", "Survivable"]
    let poi = ["Settlements", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
    let res = []

    if (hab.includes(filter)) {
      res = this.systems.filter(s => s.HI == hab.indexOf(filter) + 1)
    } else if (filter == "Factions") {
      res = this.systems.filter(s => s.POI && s.POI.reduce( (state, poi) => {
        return state || poi.f || poi.creator
      }
      , false))
    } else if (filter == "Ruins") {
      res = this.systems.filter(s => s.POI && s.POI.reduce( (state, poi) => {
        return state || poi.what == "Ruin" || poi.isRuin
      }
      , false))
    } else if (poi.includes(filter)) {
      let what = filter.slice(0, -1)
      res = this.systems.filter(s => s.POI && s.POI.reduce( (state, poi) => {
        return state || poi.what == what || poi.type == what
      }
      , false))
    } else {
      res = this.systems
    }

    return res.sort( (a, b) => a.name < b.name ? -1 : 1)
  }
  get system() {
    return this.systems[this._system]
  }
  get features() {
    return Object.values(this._features).flat()
  }
  get wormhole() {
    return null
  }
  /*
    Sector Data lookup 
  */
  ///neighbor sector 
  get neighbors() {
    let {_sectors} = this.galaxy
    const NEIGHBOR = [[0, 1], [1, 0], [0, -1], [-1, 0]]
    let nids = NEIGHBOR.map(nid => nid.map( (v, i) => this.id[i] + v))
    return nids.map(_id => _sectors.get(_id.join()))
  }
  //distance between two sectors 
  distance(x, y) {
    let[sx,sy] = this.id
    let dx = x - sx
      , dy = y - sy;
    let d = Math.sqrt(dx * dx + dy * dy)
    return d
  }
  get starsInSector() {
    return this.galaxy.sectorStars(this.id)
  }
  //check for same sector 
  isSameSector(sid) {
    let[x,y] = sid.split(",").map(Number)
    return this.id[0] == x && this.id[1] == y
  }
  /*
    faction information 
  */
  get closestFaction() {
    //only use neighbor sectors, otherwise too distant 
    return this.neighbors.map(n => n.factions).flat()
  }
  get pastFactions() {
    let G = this.galaxy
    let e = G.eraList.slice(0, G.eraList.indexOf(this.galaxy._era))
    return this.allFactions.filter(f => e.includes(f.era))
  }
  get allFactions() {
    return this.galaxy._factions.filter(f => f.claims.filter(c => this.isSameSector(c)).length > 0)
  }
  get factions() {
    return this.galaxy.factions.filter(f => f.claims.filter(c => this.isSameSector(c)).length > 0)
  }

  async display(opts={}) {
    Display(this, opts)
  }
  /*
    UI
  */
  get UI() {
    return ""

    let {app, galaxy} = this
    const {html} = app
    let {showBars} = app.state

    const systemFilters = ["All", "Earthlike", "Survivable", "Factions", "Settlements", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
    let showSystems = this.showSystems(this.filter)

    const SectorSystemUI = (s) => html`
    <div class="pointer flex items-center justify-between db ba br2 ma1 pa2" onClick=${ () => galaxy.show = s}>
    	<div>${s.name}</div>
    	<div>
    		${s._planets.length}<div class="d-circle-sm"div class="d-circle-sm" style="background-color:${s.UIColor}"></div>
    	</div>
    </div>`

    const SlideBarRight = html`<div class="db tc v-mid pointer dim ba br2 mh1 pa2 ${showBars[1] ? "" : "rotate-180"}" onClick=${ () => app.updateState("showBars", showBars, showBars[1] = !showBars[1])}>➤</div>`
    const SlideBarLeft = html`<div class="db f4 tc v-mid pointer dim ba br2 mr1 pa2 ${showBars[0] ? "rotate-180" : ""}" onClick=${ () => app.updateState("showBars", showBars, showBars[0] = !showBars[0])}>➤</div>`

    const linkCSS = "b pointer underline-hover hover-blue flex mh1"
    const header = html`
	<div class="flex">
		<span class="${linkCSS}" onClick=${ () => galaxy.show = galaxy}>Galaxy</span>::
		<span class="${linkCSS}" onClick=${ () => galaxy.show = this}>Sector [${this.id.join()}]</span>
	</div>`

    //filter 
    const left = html`
    ${galaxy._option.length == 0 ? "" : galaxy._option[1]}
	<div class="flex" style="background-color: rgba(255,255,255,0.5);">
		${SlideBarLeft}
		<div class="dropdown" style="direction: ltr;">
			<div class="f4 tc pointer dim underline-hover hover-blue db pa2 ba br2">System Filter: ${this.filter} [${showSystems.length}]</div>
	        <div class="dropdown-content w-100 bg-white ba bw1 pa1">
	    	    ${systemFilters.map(sf => html`
	    		<div class="link pointer underline-hover" onClick=${ () => app.refresh(this.filter = sf, galaxy.display())}>${sf}</div>`)}
	    	</div>
		</div>
	</div>
	<div class="${showBars[0] ? "" : "dn-ns"}">
		<div class="vh-75 overflow-x-hidden overflow-auto">${showSystems.map(s => SectorSystemUI(s))}</div>
	</div>`

    const right = html``

    return ""
  }
}

/*
	SVG 
*/
const Display = (S, opts={}) => {
  if (SVG('svg')) {
    SVG.find('svg').remove()
  }

  let mapBBox = document.querySelector("#map").getBoundingClientRect()
  let minD = mapBBox.height < mapBBox.width ? ["h", mapBBox.height] : ["w", mapBBox.width]
  let svg = SVG().addTo('#map').size('100%', '100%')

  //get display options 
  let {filter=S.filter, isometric=true} = opts
  S.filter = filter

  let[sx,sy] = [...S.id.map(p => p * SECTOR)]
  let n = 10
  let grid = SECTOR / n
  let _z = 500
  //create the grid 
  let gridmap = svg.group().attr('id', 'gridmap')
  gridmap.back()

  _.fromN(n, (i) => _.fromN(n, (j) => {
    let xyz = [[sx + i * grid, sy + j * grid, _z], [sx + i * grid + grid, sy + j * grid, _z], [sx + i * grid + grid, sy + j * grid + grid, _z], [sx + i * grid, sy + j * grid + grid, _z]].map(_xyz => {
      let {x, y} = isometric ? toIsometric(..._xyz) : {
        x: _xyz[0],
        y: _xyz[1]
      }
      return [x, y].join(",")
    }
    ).join(" ")
    gridmap.add(svg.polygon(xyz).addClass('grid'))
  }
  ))

  //create the stars 
  let stars = svg.group().attr('id', 'stars')
  let systems = S.showSystems(filter)

  systems.forEach( (s) => {
    let sector = S
    let G = S.galaxy
    let _p = s.point
    let {x, y} = isometric ? toIsometric(..._p) : {
      x: _p[0],
      y: _p[1]
    }

    let _star = svg.circle(s._r * 5).attr({
      cx: x,
      cy: y
    }).fill(s._color).addClass('star').data({
      id: s.id
    }).click(async function() {
      let id = this.data("id")

      let _s = sector.systems.find(s => s.id == id)
      let _POI = _s.POI || []
      console.log(_s)

      //set system if selected 
      const setSystem = () => {
        App._focus = _s
        App.show = "system"
      }

      //build html to show 
      let text = _.html`
            <div class="f4 tc pointer dim bg-light-green br2 pa2 mb1"  onClick=${()=> setSystem()}>View ${_s.name} System</div>
            ${_POI.map(p => _.html`<div class="f5 i ph2 mb2">${p.short}</div>`)}`

      _.AppSelect("select-system", text)

    })
	  
    if (s.claim > -1) {
      _star.attr({
        stroke: S.factions.find(f => f.id == s.claim).color,
        'stroke-width': 3
      })
    }

    stars.add(_star)
  }
  )

  let BBox = stars.bbox()
  //adjust viewbox to see sector 
  svg.viewbox(BBox.x, BBox.y, BBox.w, BBox.h)
}

/*
	History 
*/

const History = () => {
  G.eraList.filter( (e, i) => i <= G.eraList.indexOf(G._era)).forEach( (e, i) => {
    let ef = this.allFactions.filter(f => f.era == e)
    //keep all systems if empty 
    if (_fs.length == 0) {
      _fs = ef.map(f => f.systems).flat()
      return
    }
    //if not empty, see what will be kept 
    if (ef.length == 0) {
      /*
          Settlements 'Orbital,Planet,Moon,Asteroid'
          Sites 'Dwelling,Outpost,Resource'
          May disappear due to progression of time 
        */
      _fs = _fs.filter(f => 'Planet,Resource'.includes(f.type) ? true : f.type == 'Orbital' ? Likely(75, RNG) : RNG.bool()).map(s => Object.assign(s, {
        isRuin: true
      }))
    } else {
      let tsum = 0
        , nfs = _fs.length;
      //if multiple factions split between 
      ef.map(f => {
        tsum += f.tier
        return f.tier
      }
      ).map( (t, j) => Math.floor(nfs * t / tsum)).map(n => _fs.splice(0, n)).forEach( (_efs, j) => _efs.forEach(sArr => {
        let _f = ef[j]
        //see what the new faction keeps
        let cfs = _f.systems
        //core systems of the faction 
        let core = cfs.splice(0, _f.claims.length)
        //keep certain items, set faction to current 
        let kfs = sArr.filter(s => 'Planet,Resource'.includes(s.type) ? true : s.type == 'Orbital' ? Likely(85, RNG) : 'Moon,Asteroid'.includes(s.type) ? Likely(65, RNG) : RNG.bool()).map(s => Object.assign(s, {
          f: _f,
          isRuin: false
        }))
        //if keep systems is less than faction systems, push 
        let dk = cfs.length - kfs.length
        dk <= 0 ? null : BuildArray(dk, () => kfs.push(cfs.splice(0, 1)))
        //add core and kept 
        _fs.push(...kfs, ...core)
      }
      ))
    }
  }
  )

}
