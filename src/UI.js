const ERAS = ["Heralds", "Frontier", "Firewall", "ExFrame", "Wanderer"]

//simple roman numeral generator for naming planets after their star
const romanNumeral = n=>{
  var units = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

  if (!n) {
    return "";
  } else if (n < 0 || n >= 20) {
    return n;
  } else if (n >= 10) {
    return "X" + romanNumeral(n - 10);
  } else {
    return units[n - 1];
  }
}
;

/*
  UI Resources  
*/

const Main = (app)=>{
  const {html} = app

  return html`
  <div class="flex flex-column justify-center m-auto mw6">
    <div class="f3 tc link pointer dim underline-hover hover-orange bg-white-70 db br2 mv1 pa2" onClick=${()=>app.show = "Start"}><i>Start</i></div>
  </div>
  `
}

const Galaxy = (app)=>{
  const {html} = app
  let {saves, showBars,tick,period} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  let S = G.system
  let P = G.planet

	let ci = ['Galaxy','Sector','System','Planet']
  let chain = ["Galaxy"]
  G._show == 'Sector' ? chain.push(`:: Sector [${MS.id.join()}]`) : G._show == 'System' ? chain.push(`:: Sector [${MS.id.join()}]`, `System [${S.name}]`) : G._show == 'Planet' ? chain.push(`:: Sector [${MS.id.join()}]`, `System [${S.name}]`, `:: ${P.name}`) : null

  const SlideBarRight = html`<div class="db tc v-mid pointer dim ba br2 mh1 pa2 ${showBars[1] ? "" : "rotate-180"}" onClick=${()=>app.updateState("showBars", showBars, showBars[1] = !showBars[1])}>➤</div>`
  const SlideBarLeft = html`<div class="db f4 tc v-mid pointer dim ba br2 mr1 pa2 ${showBars[0] ? "rotate-180" : ""}" onClick=${()=>app.updateState("showBars", showBars, showBars[0] = !showBars[0])}>➤</div>`

  let Filter = (filter,what)=>app.refresh(what == 'Galaxy' ? G.sectorFilter = filter : MS.display({
    filter
  }))

  const systemFilters = ["All", "Earthlike", "Survivable", "Factions", "Settlements", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
  let showSystems = MS ? MS.showSystems(MS.filter) : []
  //filter systems 
  let SystemFilterSelect = ()=>html`
  <div class="dropdown" style="direction: ltr;">
	<div class="f4 tc pointer dim underline-hover hover-blue db pa2 ba br2">System Filter: ${MS.filter} [${showSystems.length}]</div>
    <div class="dropdown-content w-100 bg-white ba bw1 pa1">
	    ${systemFilters.map(sf=>html`
		<div class="link pointer underline-hover" onClick=${()=>Filter(sf)}>${sf}</div>`)}
	</div>
  </div>`

  //filter sectors 
  const galaxyFilters = ["Favorites", "Historic Factions", "Orbitals", "Gates", "Wormholes"]
  let showSectors = G && G._show == 'Galaxy' ? G.showSectors() : []
  let SectorFilterSelect = ()=>html`
  <div class="dropdown" style="direction: ltr;">
	<div class="f4 tc pointer dim underline-hover hover-blue db pa2 ba br2">Sectors: ${G.sectorFilter} [${showSectors.length}]</div>
	<div class="dropdown-content w-100 bg-white ba bw1 pa1">
		${galaxyFilters.map(sf=>html`
		<div class="link pointer underline-hover" onClick=${()=>Filter(sf, 'Galaxy')}>${sf}</div>`)}
	</div>
  </div>`

  //favorites 
  const LoadGalaxy = html`
  <div class="dropdown w-100">
	  <div class="tc bg-white pointer dim ba br2 pa2">ID: ${G.seed}</div>
	  <div class="dropdown-content w-100 bg-white ba bw1 pa1">
		  ${saves.map(s=>html`<div class="f4 link pointer underline-hover ma2" onClick=${()=>app.refresh(G.load(s))}>Load ${s.seed}</div>`)}
	  </div>
  </div>`
  //☰➤

  return html`
  <div id="map" class="z-0 absolute top-0 left-0 w-100 h-100 ${G._show == 'Galaxy' ? "galaxy" : ""}"></div>
  <div class="absolute top-0 left-0pa2" style="max-width: 20rem;"> 
	<h3 class="ma0 pv1" style="background-color: rgba(255,255,255,0.5);">
		<h2 class="flex ma0" onClick=${()=>app.refresh()}>
			<span>Verse :: </span> 
			<div class="ml2 ${G._show != 'System' ? 'dropdown' : ''}" style="direction: ltr;">
				<div class="pointer underline-hover hover-blue">${G._era}</div>
				<div class="dropdown-content w-100 bg-white ba bw1 pa1">
					${ERAS.map(e=>html`<div class="f4 link pointer underline-hover ma2" onClick=${()=>G.display("Galaxy", G.era = e)}>${e}</div>`)}
				</div>
			</div>
		</h2>
		<div class="flex items-center flex-wrap">
			${chain.map((c,i)=>html`<div class="b pointer underline-hover hover-blue flex mh1" onClick=${()=>app.refresh(G._show = ci[i],G._option=[])}>${c}</div>`)}
			${G._show == 'System' ? html`<div class="f3 gray pointer favorite ${S.isFavorite ? "selected" : ""}" onClick=${()=>app.refresh(S.manageFavorites())}>★</div>` : ""}
		</div>
	</h3>
	<div style="background-color: rgba(255,255,255,0.5);">
		${G._show == 'System' && S.POI ? html`
		<div class="flex ba br1 mb1 ph2">
			<div class="b mr2">POI:</div>
			<div>${S.POI.map(p=>html`
				<div>❖${p.text || p.short}</div>
				<div class="i ph3">➣${p.whereText}</div>`)}
			</div>
		</div>` : ""}
		${G._show == 'System' && S.HI < 3 ? html
		  `<div class="flex ba br1 mb1 ph2">
			  <div class="b mr1">Habitable:</div>
			  <div>${S.habitible.flat().map(p=>html`
				  <div class="pointer underline-hover hover-blue" onClick="${()=>app.updateState("show", "Galaxy", G._show = "Planet", G.planet = p, G._option = [])}">${p.name}</div>`)}
			  </div>
			</div>` : ""}
		${G._option.length == 0 ? "" : G._option[1]}
	</div>
	<div class="flex" style="background-color: rgba(255,255,255,0.5);">
		${!['System','Planet'].includes(G._show) ? SlideBarLeft : ""}
		<div class="w-100 ${showBars[0] ? "" : "dn-ns"}">
			${G._show == 'Galaxy' ? SectorFilterSelect() : ""}
			${G._show == 'Sector' ? SystemFilterSelect() : ""}
			${G._show == 'Planet' ? P.slider : ""}
		</div>
	</div>
	<div class="${showBars[0] ? "" : "dn-ns"}">
		${G._show == 'Galaxy' ? html`
			<div class="vh-75 overflow-x-hidden overflow-auto">
				${showSectors.map(s=>html`<div class="tc pointer dim flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>app.refresh(G.display("Sector", G._option = [], G.setMajorSector(s)))}>Sector [${s.join()}]</div>`)}
			</div>` : ""}
		${G._show == 'Sector' ? html`<div class="vh-75 overflow-x-hidden overflow-auto">${showSystems.map(s=>SectorSystemUI(app, s))}</div>` : ""}
		</div>
  </div>
  <div class="absolute top-0 right-0 w5 pa2">
	  <div class="h1 w-100 mb1">
		  <div class="tc b white h-100 bg-green br2" style="width:${100*tick[0]/period}%;">Day ${tick[1]+1}</div>
	  </div>
	  <div class="w-100 f4 flex justify-end mb1">
		  <div class="w-100 ${showBars[1] ? "" : "dn-ns"}">
			  ${G._show == 'Galaxy' ? LoadGalaxy : ""}
		  </div>
		  ${!['System','Planet'].includes(G._show) ? SlideBarRight : ""}
	  </div>
	  <div class="${showBars[1] ? "" : "dn-ns"}">
		  ${G._show == 'Galaxy' ? html`<div class="f4 tc bg-white pointer dim ba br2 pa2" onClick=${()=>app.dialog = "GalaxyFactionUI"}>Show Factions</div>` : ""}
	  </div>
  </div>
  `
}

const SectorSystemUI = (app,s)=>app.html`
<div class="pointer flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>app.updateState("show", "Galaxy", app.galaxy._show = "System", app.galaxy._option = [], app.galaxy.system = s)}>
	<div>${s.name}</div>
	<div>
		${s._planets.length}<div class="d-circle-sm"div class="d-circle-sm" style="background-color:${s.UIColor}"></div>
	</div>
</div>`

const GalaxyFactionUI = (app)=>{
  const {html, galaxy} = app

  let FbyTier = [4, 3, 2, 1].map(t=>galaxy.factions.filter(f=>f.tier == t))

  //${F.form != "alien" ? html`<div>Random Mission: ${mission} <span class="b white pointer underline-hover bg-green br1 ph1" onClick=${()=>app.updateState('mission', F.mission())}>↻</span></div>` : ""}

  const FUI = (F)=>html`
  <div class="bb">
	<h4 class="mb0 mt2">${F.name} </h4>
    <div class="w-100">
      <div class="i mb1">${F.eraType}, ${F.about.join(", ")}</div>
      <div class="ph2">
		  <div><b>Values:</b> ${F.values.join("/")}</div>
		  <div><b>Tech:</b> ${F.style} ${F.tech}</div>
	      <div class="flex"><b>Sectors:</b> ${F.claims.map(c=>html`<div class="pointer underline-hover hover-blue mh1">[${c.sid.join()}]</div>`)}</div>
	      <div class="flex">
	        <span class="b">Goals: </span>
			<div class="mh2">${F.goals.map(g=>html`<div>${g.goal} [${g.clock}]</div>`)}</div>
	      </div>
	  </div>
    </div>
  </div>
  `

  return html`
  <div class="vh-75" style="width:600px;">
	<div class="flex items-center justify-between pb2 mb2 bb">
      <h2 class="ma0">Factions</h2>
      <div class="pointer dim underline-hover hover-orange b ba pa2" onClick=${()=>app.dialog = ""}>X</div>
    </div>
	${FbyTier.map((f,i)=>html`
	<div class="mb2 pb1 bb">
		<h3 class="ma0">Tier ${4 - i}</h3>
		${f.map(FUI)}
	</div>
	`)}
  </div>`
}

const MajorSectorUI = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div>
	  <div class="container"></div>
  </div>
  `
}

/*
	Eras 
*/

const Wanderer = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div class="w-100 flex justify-center" id="map">
	  ${sub == "" ? GalaxyUI(app) : MajorSectorUI(app)}
  </div>
  `
}

const Heralds = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div class="w-100 flex justify-center" id="map">
	  ${sub == "" ? GalaxyUI(app) : MajorSectorUI(app)}
  </div>
  `
}

const ExFrame = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div class="w-100 flex justify-center" id="map">
	  ${sub == "" ? GalaxyUI(app) : MajorSectorUI(app)}
  </div>
  `
}

const Firewall = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div class="w-100 flex justify-center" id="map">
	  ${sub == "" ? GalaxyUI(app) : MajorSectorUI(app)}
  </div>
  `
}

const Frontier = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div class="w-100 flex justify-center" id="map">
	  ${sub == "" ? GalaxyUI(app) : MajorSectorUI(app)}
  </div>
  `
}

const WandererBAK = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  let MS = G.majorSector
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  const FeatureUI = (f)=>html`
  <div>${f.text}</div>
  `
  const MSUI = ()=>html`
  <div class="ph2">
	  <h2 class="ma0" onClick=${()=>app.show = show}>Sector [${sid}]</h2>
	  <div class="i mb2">${MS.safety[0]}</div>
	  ${sub == "" ? "" : Object.entries(MS._features).map(([key,val])=>html`
	  <div class="pa1">
		<h3 class="ma0">${key}</h3>
		${val.sort((a,b)=>a.text < b.text ? -1 : 1).map(FeatureUI)}
	  </div>`)}
	</div>`

  return html`
  <div class="w-100 flex justify-center" id="map">
	  ${sub == "" ? GalaxyUI(app) : MajorSectorUI(app)}
	  ${sub == "" ? "" : MSUI()}
  </div>
  `
}

const HeraldsBAK = (app)=>{
  SVG.find('svg').remove()
  const {html, region} = app
  let {name, climate, terrain, alignment, safety, factions} = region
  let seed = region._seed
  const tiers = [4, 3, 2, 1]

  const FactionUI = (f)=>html`
  <div class="bb mv1 pa1">
	  <div><b>${f.people.type ? f.people.type : f.people}</b> [${f.type}]</div>
	  ${f.goals.map(g=>html`
	  <div class="ph1">${g.goal} ${g.what ? g.what : ""} [clock: ${g.clock}]</div>
	  `)}
  </div>
  `

  const FeatureUI = (f)=>html`
  <div>${f.text}</div>
  `

  return html`
  <div class="w-100 overflow-auto" style="height:95%">
	<div class="flex justify-between items-center center" style="width:700px;"> 
		<div class="mh2">
			<h2 class="ma0">${name}</h2>
			<div class="i">${[climate, terrain, alignment, safety].join(", ")}</div>
		</div>
		<div class="tc">
			<div class="flex items-end">
				<div class="tc mh2">
					<div class="f6 i">The current Region seed.</div>
					<input class="tc pa1" type="text" value=${seed} onChange=${(e)=>seed = e.target.value}></input>
				</div>
				<div class="b tc pointer dim underline-hover hover-white hover-bg-green db ba br2 pa2" onClick=${()=>app.galaxy.genRegion(seed, {}, app.show = 'Heralds')}>New Region</div>
			</div>
			<div class="f6 i">Change the seed to make a new Region.</div>
		</div>
	</div>
	<div class="flex justify-center">
		<div class="ma1" style="width:250px;">
			<h3 class="ma0">Factions</h3>
			${tiers.map(ti=>html`
			<div class="pa1">
				<h4 class="ma0">Tier ${ti}</h4>
				${factions.filter(f=>f.tier == ti).map(FactionUI)}
			</div>
			`)}
		</div>
		<iframe src=${region.perilousShores} style="width:700px;height:700px;"></iframe>
		<div style="width:250px;">
			<div class="ph1">
				<h3 class="ma0">Ancients</h3>
				<div><b>Reigning:</b> ${region.ancient.people}</div>
				<div class="i">${region.ancient.about.join(", ")}</div>
				<div><b>Peoples:</b> ${region.thralls.map(t=>t.type).join(", ")}</div>
				<div class="mv1">
					<div><b>Predecessor:</b> ${region.predecessor.people}</div>
					<div><b>Usurper:</b> ${region.usurper.people}</div>
				</div>
			</div>
			${Object.entries(region._features).map(([key,val])=>html`
			<div class="pa1">
				<h3 class="ma0">${key}</h3>
				${val.sort((a,b)=>a.text < b.text ? -1 : 1).map(FeatureUI)}
			</div>
			`)}
		</div>
	</div>
  </div>`
}

const FrontierBAK = (app)=>{
  const {html, sector} = app
  const {show, active, selected, filter, filterSystem, isometric, galaxyView} = app.state
  let {factions, showSystems} = sector
  const SFilters = ["All", "Earthlike", "Survivable", "Factions", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]

  let showGalaxy = galaxyView == 'Sector' ? 'Galaxy' : 'Sector'
  let showFactions = filter == 'Factions' ? 'All' : 'Factions'
  let showIsometric = isometric == 'Flat' ? 'Isometric' : 'Flat'

  const FactionUI = (f)=>html`
	<div class="pointer flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>this.dialog = "Faction." + f.id}>
		<div>
			<div class="d-circle-sm" style="background-color:${f.color}"></div> 
		</div>
		<div>${f.claims[0].name}</div>
		<div>${f.designator.join("")}</div>
		<div>
			${f._claims.length}<span class="yellow">☀</span>
		</div>
	</div>
	`

  const SystemUI = (s)=>html`
	<div class="pointer flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>app.dialog = "System." + s.i}>
		<div>${s.name}</div>
		<div>
			${s._planets.length}<div class="d-circle-sm"div class="d-circle-sm" style="background-color:${s.UIColor}"></div>
		</div>
	</div>
	`

  return html`
  <div class="w-100 flex justify-center" id="map">	 
    <div class="w5 vh-75">
      <h3 class="mb0">Factions [${factions.length}]</h3>
      <div class="h-100 overflow-x-hidden overflow-scroll">${factions.map(FactionUI)}</div>
	</div>
	<div>
      <div class="flex justify-center">
        <div class="b tc pointer dim underline-hover hover-white hover-bg-green db ba br2 ma1 pa2" onClick=${()=>app.refreshMap('isometric', showIsometric)}>Show ${showIsometric}</div>
        <div class="b tc pointer dim underline-hover hover-white hover-bg-green db ba br2 ma1 pa2" onClick=${()=>app.refreshMap('galaxyView', showGalaxy)}>Show ${showGalaxy}</div>
      </div>
      <div class="container"></div>
	</div>
	<div class="w5 vh-75">
      <h3 class="mb0">Systems [${showSystems.length}]</h3>
      <div class="dropdown w-100 ma1">
        <div class="tc pointer dim underline-hover hover-blue db pa1 ba br2">${filterSystem}</div>
        <div class="dropdown-content w-100 bg-white ba bw1 pa1">
          ${SFilters.map(sf=>html`
            <div class="link pointer underline-hover" onClick=${()=>app.refreshMap('filterSystem', sf)}>${sf}</div>`)}
		</div>
      </div>
      <div class="h-100 overflow-x-hidden overflow-scroll">${showSystems.map(SystemUI)}</div>
	</div>
  </div>`
}

const System = (app)=>{
  const {html, sector} = app
  let[what,id,ui] = app.state.dialog.split(".")
  let system = sector.systems.find(s=>s.i == id)

  return html`
  <div style="width:600px;">
    <div class="flex items-center justify-between">
      <h2>${system.name}</h2>
      <div class="pointer dim underline-hover hover-orange b ba pa2" onClick=${()=>app.dialog = ""}>X</div>
    </div>
    <div class="w-100">
      ${system.faction ? html`<div><span class="b">Faction: </span> ${system.faction.name}</div>` : ""}
      ${system.faction ? "" : html`<div><span class="b">Closest Faction: </span> ${system.nearestFactionSystem.faction.name} [${system.nearestFactionSystem.name}]</div>`}
      ${system.POI ? html`<div><span class="b">POI:</span> ${system.POI.text || ""}</div>` : ""}
      ${system._planets.map((p,i)=>html`
      <div class="pa1">
        <div class="flex items-center justify-between">
          <span>${romanNumeral(i + 1)} ${p.classification.capitalize()}</span>
          <span>${p.description}</span>
        </div>
        <div>${p.atmosphere} atmosphere; ${p.temp}; ${p.g}g </div>
      </div>
    `)}
    </div>
  </div>
  `
}

const D = {
  Main,
  GalaxyFactionUI
}
const Dialog = (app)=>{
  let[what,id,ui] = app.state.dialog.split(".")

  return app.html`
  <div class="fixed z-2 top-1 left-1 bottom-1 right-1 flex items-center justify-center">
    <div class="overflow-y-auto o-90 bg-washed-blue br3 shadow-5 pa2">
      ${app[what] ? app[what][id][ui] : D[what] ? D[what](app) : ""}
    </div>
  </div>`
}

export {Main, Dialog, Galaxy}
