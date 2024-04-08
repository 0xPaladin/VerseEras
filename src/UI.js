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

const GalaxyUI = (app)=>{
  const {html} = app
  const {selection, show} = app.state
  let G = app.galaxy
  //get what to display 
  let[what,sub="",sid=""] = show.split(".")

  return html`
  <div>
	  <div class="f3 pointer underline-hover hover-blue absolute bg-white br1 ma1 pa2 ${selection == "" ? 'hidden' : ''}" onClick=${()=>app.updateState("show", [what,"MajorSector",selection.join()].join("."))}>View Sector [${selection == "" ? "" : selection.join(", ")}]</div>
	  <div class="container galaxy"></div>
  </div>
  `
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

const Faction = (app)=>{
  const {html, sector} = app
  let[what,id,ui] = app.state.dialog.split(".")
  let F = sector.factions.find(f=>f.id == Number(id))

  let mission = app.state.mission = F.mission()

  return html`
  <div style="width:600px;">
    <div class="flex items-center justify-between">
      <h2 class="mb0">${F.name}</h2>
      <div class="pointer dim underline-hover hover-orange b ba pa2" onClick=${()=>app.dialog = ""}>X</div>
    </div>
    <div class="w-100">
      <div>${F.about.join(", ")}</div>
      <div class="pa2">
        <div>People: ${F.people}</div>
        <div>Values: ${F.values.join("/")}</div>
        <div>Tech: ${F.style} ${F.tech}</div>
        ${F.form == "alien" ? html`<div>Thralls: ${F.thralls.map(t=>t.text).join(", ")}</div>` : ""}
        ${F.form != "alien" ? html`<div>Random Mission: ${mission} <span class="b white pointer underline-hover bg-green br1 ph1" onClick=${()=>app.updateState('mission', F.mission())}>↻</span></div>` : ""}
      </div>
      <h3 class="ma0">Claims</h3>
      <div class="flex flex-wrap pa2">
        ${F.claims.map(c=>html`<div class="pointer underline-hover br bl hover-blue ph1" onClick=${()=>app.dialog = "System." + c.i}>${c.name}</div>`)}
      </div>
    </div>
  </div>
  `
}

const D = {
  Main,
  System,
  Faction
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

export {Main, Dialog, Frontier, Heralds, Wanderer, ExFrame, Firewall}
