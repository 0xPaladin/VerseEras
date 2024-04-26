import {MakeName} from './random_name.js';

import {StarsInSector} from './starryHost.js';
import {System} from './starSystem.js';

import {CreatePOI} from './poi.js';

import {RandomPeople} from './people.js';

import {Elements, Magic} from './data.js';

const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]

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
  Sector Class 
*/

const MAJORSECTOR = 5000
// sector size in LY 

class MajorSector {
  constructor(G, id=[3, 6]) {
    this.what = "MajorSector"
    this.filter = "All"

    this.galaxy = G

    this._seed = G.seed || chance.natural()
    this.id = id

    this.seed = [G.seed, 'MajorSector', id.join()].join(".")

    //establish random gen 
    let RNG = new Chance(this.seed)

    let FA = this.factions.map(f=>f.alignment)
    let alignment = this.alignment = FA.length > 0 ? RNG.pickone(FA) : ['Heralds', 'ExFrame'].includes(G._era) ? RNG.pickone(['chaotic', 'evil']) : "neutral"
    let alMod = [5, 3, 0, -3, -5][['chaotic', 'evil', 'neutral', 'good', 'lawful'].indexOf(alignment)]
    let sR = RNG.d12() + alMod
    this.safety = sR <= 1 ? ["safe", 3] : sR <= 3 ? ["unsafe", 2] : sR <= 9 ? ["dangerous", 1] : ["perilous", 0]
  }
  /*
    app getters 
  */
  get app() {
    return this.galaxy.app
  }
  /*
    Functions 
  */
  refresh() {
	let {safety} = this 
	//keep names for no repeats 
    this._names = []
	  //systems 
    this._loc = []
    this._systems = []

	//establish random gen 
    let RNG = new Chance(this.seed)
	  
    //number of systems 
    let ns = 333
    for (let i = 0; i < ns; i++) {
      let _name = MakeName(this._names,RNG)
      //make and push to systems 
      this._systems.push(new System(this,{i,_name}))
    }

    //create faction sytems 
    let allF = this.allFactions
    this._fs = allF.map(f=>f.systemsInSector(this)).flat().map(s=>{
      //check for planet 
      let HI = s.type == "Planet" ? s.creator.isAncient || s.creator.isProtoAncient ? RNG.pickone([1, 2, 3]) : 1 : null
      //create system 
      let S = new System(this,{i:s.i,HI,_name:s.name,loc:s.p})
      S.POI = [CreatePOI.faction(S, s, RNG)]
      return S
    }
    )
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
    return BuildArray(4, (_,i)=>{
      let planets = []
      let moons = []
      this.systems.forEach(s=>{
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
      res = this.systems.filter(s=>s.HI == hab.indexOf(filter) + 1)
    } else if (filter == "Factions") {
      res = this.systems.filter(s=>s.POI && s.POI.reduce((state,poi)=>{
        return state || poi.f || poi.creator
      }
      , false))
    } else if (filter == "Ruins") {
      res = this.systems.filter(s=>s.POI && s.POI.reduce((state,poi)=>{
        return state || poi.what == "Ruin" || poi.isRuin
      }
      , false))
    } else if (poi.includes(filter)) {
      let what = filter.slice(0, -1)
      res = this.systems.filter(s=>s.POI && s.POI.reduce((state,poi)=>{
        return state || poi.what == what || poi.type == what
      }
      , false))
    } else {
      res = this.systems
    }

    return res.sort((a,b)=>a.name < b.name ? -1 : 1)
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
  distance(x, y) {
    let[sx,sy] = this.id
    let dx = x - sx
      , dy = y - sy;
    let d = Math.sqrt(dx * dx + dy * dy)
    return d
  }
	get StarsInSector () {
		return StarsInSector(this.id)
	}
  //check for same sector 
  isSameSector(x, y) {
    return this.id[0] == x && this.id[1] == y
  }
  /*
    faction information 
  */
  get closestFaction() {
    let fd = this.galaxy.factions.map(f=>f.sectors.map(s=>[this.distance(...s), f])).flat().sort((a,b)=>a[0] - b[0])
    return fd[0][1]
  }
  get pastFactions() {
    let G = this.galaxy
    let e = G.eraList.slice(0, G.eraList.indexOf(this.galaxy._era))
    return this.allFactions.filter(f=>e.includes(f.era))
  }
  get allFactions() {
    return this.galaxy._factions.filter(f=>f.claims.filter(c=>this.isSameSector(...c.sid)).length > 0)
  }
  get factions() {
    return this.galaxy.factions.filter(f=>f.claims.filter(c=>this.isSameSector(...c.sid)).length > 0)
  }

  async display(opts={}) {  
    let app = this.app
    let svg = SVG('svg')

    //get display options 
    let {filter=this.filter, isometric=false} = opts
    this.filter = filter

    let[sx,sy] = [...this.id.map(p=>p * MAJORSECTOR)]
    let n = 5
    let grid = MAJORSECTOR / n
    let _z = 500
    //create the grid 
    let gridmap = svg.group().attr('id', 'gridmap')
    gridmap.back()

    _.fromN(n, (i)=>_.fromN(n, (j)=>{
      let xyz = [[sx + i * grid, sy + j * grid, _z], [sx + i * grid + grid, sy + j * grid, _z], [sx + i * grid + grid, sy + j * grid + grid, _z], [sx + i * grid, sy + j * grid + grid, _z]].map(_xyz=>{
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
    let systems = this.showSystems(filter)

    systems.forEach((s)=>{
      let sector = this
      let G = this.galaxy
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

        let _s = sector.systems.find(s=>s.id == id)
        let _POI = _s.POI || []
        console.log(_s)
        //build html to show 
        let html = sector.app.html
        let text = html`
            <div class="f4 tc pointer dim bg-light-green br2 pa2 mb1"  onClick=${(e)=>G.show = _s}>View ${_s.name} System</div>
            ${_POI.map(p=>html`<div class="f5 i ph2 mb2">${p.short}</div>`)}`
        app.refresh(G._option = [['setVisibleSystem', id], text])
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

    //adjust viewbox to see sector 
    svg.attr('viewBox', [...this.id.map(p=>p * MAJORSECTOR), MAJORSECTOR, MAJORSECTOR].join(" "))
  }
  /*
    UI
  */
  get UI() {
    let {app, galaxy} = this
    const {html} = app
    let {showBars} = app.state

    const systemFilters = ["All", "Earthlike", "Survivable", "Factions", "Settlements", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
    let showSystems = this.showSystems(this.filter)

    const SectorSystemUI = (s)=>html`
    <div class="pointer flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>galaxy.show = s}>
    	<div>${s.name}</div>
    	<div>
    		${s._planets.length}<div class="d-circle-sm"div class="d-circle-sm" style="background-color:${s.UIColor}"></div>
    	</div>
    </div>`

    const SlideBarRight = html`<div class="db tc v-mid pointer dim ba br2 mh1 pa2 ${showBars[1] ? "" : "rotate-180"}" onClick=${()=>app.updateState("showBars", showBars, showBars[1] = !showBars[1])}>➤</div>`
    const SlideBarLeft = html`<div class="db f4 tc v-mid pointer dim ba br2 mr1 pa2 ${showBars[0] ? "rotate-180" : ""}" onClick=${()=>app.updateState("showBars", showBars, showBars[0] = !showBars[0])}>➤</div>`

	const linkCSS = "b pointer underline-hover hover-blue flex mh1"
    const header = html`
	<div class="flex">
		<span class="${linkCSS}" onClick=${()=>galaxy.show = galaxy}>Galaxy</span>::
		<span class="${linkCSS}" onClick=${()=>galaxy.show = this}>Sector [${this.id.join()}]</span>
	</div>`

    //filter 
    const left = html`
    ${galaxy._option.length == 0 ? "" : galaxy._option[1]}
	<div class="flex" style="background-color: rgba(255,255,255,0.5);">
		${SlideBarLeft}
		<div class="dropdown" style="direction: ltr;">
			<div class="f4 tc pointer dim underline-hover hover-blue db pa2 ba br2">System Filter: ${this.filter} [${showSystems.length}]</div>
	        <div class="dropdown-content w-100 bg-white ba bw1 pa1">
	    	    ${systemFilters.map(sf=>html`
	    		<div class="link pointer underline-hover" onClick=${()=>app.refresh(this.filter=sf,galaxy.display())}>${sf}</div>`)}
	    	</div>
		</div>
	</div>
	<div class="${showBars[0] ? "" : "dn-ns"}">
		<div class="vh-75 overflow-x-hidden overflow-auto">${showSystems.map(s=>SectorSystemUI(s))}</div>
	</div>`

    const right = html``

    return {
      header,
      left,
      right
    }
  }
}

const History = ()=>{
  G.eraList.filter((e,i)=>i <= G.eraList.indexOf(G._era)).forEach((e,i)=>{
    let ef = this.allFactions.filter(f=>f.era == e)
    //keep all systems if empty 
    if (_fs.length == 0) {
      _fs = ef.map(f=>f.systems).flat()
      return
    }
    //if not empty, see what will be kept 
    if (ef.length == 0) {
      /*
          Settlements 'Orbital,Planet,Moon,Asteroid'
          Sites 'Dwelling,Outpost,Resource'
          May disappear due to progression of time 
        */
      _fs = _fs.filter(f=>'Planet,Resource'.includes(f.type) ? true : f.type == 'Orbital' ? Likely(75, RNG) : RNG.bool()).map(s=>Object.assign(s, {
        isRuin: true
      }))
    } else {
      let tsum = 0
        , nfs = _fs.length;
      //if multiple factions split between 
      ef.map(f=>{
        tsum += f.tier
        return f.tier
      }
      ).map((t,j)=>Math.floor(nfs * t / tsum)).map(n=>_fs.splice(0, n)).forEach((_efs,j)=>_efs.forEach(sArr=>{
        let _f = ef[j]
        //see what the new faction keeps
        let cfs = _f.systems
        //core systems of the faction 
        let core = cfs.splice(0, _f.claims.length)
        //keep certain items, set faction to current 
        let kfs = sArr.filter(s=>'Planet,Resource'.includes(s.type) ? true : s.type == 'Orbital' ? Likely(85, RNG) : 'Moon,Asteroid'.includes(s.type) ? Likely(65, RNG) : RNG.bool()).map(s=>Object.assign(s, {
          f: _f,
          isRuin: false
        }))
        //if keep systems is less than faction systems, push 
        let dk = cfs.length - kfs.length
        dk <= 0 ? null : BuildArray(dk, ()=>kfs.push(cfs.splice(0, 1)))
        //add core and kept 
        _fs.push(...kfs, ...core)
      }
      ))
    }
  }
  )

}

export {MajorSector}
