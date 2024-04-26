const ACTIONS = ["Scan", "Tinker", "Trick", "Finesse", "Skulk", "Smash", "Banter", "Invoke", "Command"]

const Claims = [["New Claim", 0, "any"], ["Test Claim", 1, "any"], ]
const Abilities = [["New Ability", 0, "any"], ["Test Ability", 1, "any"], ]
const Upgrades = [["New Upgrade", 0, "any"], ["Test Upgrade", 1, "any"], ]

/*
	Cohort Template 
	0 - about , text
	1 - acctions , array of a ctions 
	2 - upgrades,perks/flaws, array of tags
	3 - health , remaining health
*/
const COHORT = ["About", [], [], 3]
const COHORTUPF = {
	"Adept": `Can cast a single tier 2 spell per cycle. [$]`,
	"Companion": `They will always join a raid without asking for gold and you can decide what happens to them when they're taken down. [*]`,
	"Expert" : `Exceedingly good in a limited skillset. What is it? [*]`,
	"Equipped": `Have a defense of your choice. [$]`,
	"Expendable": `Automatically re-recruited without spending gold or taking a downtime action. [$]`,
	"Mindset": `Fearless - loyal - zealous - make one up. [$]`,
	"Strapped": `Have 1 supply slot from your supply. [$]`,
	"Trained": `Take +1d on one downtime action type. [$]`,
	"Versatile": `Have extra actions (2d, 1d, 1d). [$]`,
	"Fearsome": `The cohort is terrifying in aspect and reputation. [P]`,
	"Independent": `The cohort can be trusted to make good decisions and act on their own initiative in the absence of direct orders. [P]`,
	"Loyal": `The cohort can’t be bribed or turned against you. [P]`,
	"Tenacious": `The cohort won’t be deterred from a task. [P]`,
	"Principled": `The cohort has an ethic or values that it won’t betray. [F]`,
	"Savage": `The cohort is excessively violent and cruel. [F]`,
	"Unreliable": `The cohort isn’t always available, due to other obligations, stupefaction from their vices, etc. [F]`,
	"Wild": `The cohort is drunken, debauched, and loud-mouthed. [F]`
}

/*
	Contact Template 
	0 - name/about , text
	1 - job , text
	2 - where , seed of location 
	3 - factions, array of two ides +/-  
*/
const CONTACT = ["About", "Job", "", []]

const GameTemplates = {
  "Kindle a Flame": {
    playbook: ["Lance", "Torch", "Shield"],
    resources: [["Hyper", 4, 4, 8]],
    cType: "FitD"
  },
  "Launch a Ship": {
    playbook: ["Explorer", "Black Ops", "Trader", "Warship"],
    resources: [["ex", 4, 4, 8]],
    cType: "ItO"
  },
  "Assemble a Team": {
    playbook: ["Striker", "Hound", "Engineer"],
    resources: [["ex", 4, 4, 8], ["Hyper", 4, 4, 8]],
    cType: "ItO"
  },
  "Call a Ranger": {
    playbook: ["Striker", "Hound", "Engineer"],
    resources: [["ex", 4, 4, 8], ["Hyper", 4, 4, 8]],
    cType: "ItO"
  },
  "Assemble a Crew": {
    playbook: ["Traders", "Mercs", "Bounty Hunters", "Ghosts", "Explorers"],
    resources: [["ex", 4, 4, 8], ["Hyper", 4, 4, 8]],
    cType: "FitD"
  },
  "Establish an Enterprise": {
    playbook: ["Trade House", "Mercenaries", "Shadows", "Arcanists"],
    resources: [["Hyper", 4, 4, 8]],
    cType: "FitD"
  }
}

/*
	Games
*/

class Game {
  constructor(G, opts) {
    this.what = "Game"

    let o = this.opts = opts
    this.parent = G

    o.id = opts.id || chance.natural()
    o.name = opts.name || "New Game"
    o.reputation = opts.reputation || "Reputation"
    o.est = opts.est || G.time[1].slice()
    o.home = opts.home || ""
    o.playbook = opts.playbook || this.template.playbook[0]
    o.xp = opts.xp || 0
    o.rep = opts.rep || 0
    o.tier = opts.tier || "0.s"
    o.res = opts.res || Object.fromEntries(this.template.resources.map(r=>[r[0], 0]))
    o.heat = opts.heat || [0, 0]
    o.contacts = opts.contacts || []
    o.cohorts = opts.cohorts || []
    o.claims = opts.claims || []
    o.abilities = opts.abilities || []
    o.upgrades = opts.upgrades || []
    o.notes = opts.notes || ""

    this._edit = ""
    this._select = {}

    console.log(this)
  }
  get app() {
    return this.parent.app
  }
  get galaxy() {
    return this.parent
  }
  get id() {
    return this.opts.id
  }
  get type() {
    return this.opts.type
  }
  get template() {
    return GameTemplates[this.type]
  }
	get home () {
		return this.galaxy.favorites.find(f=> f.seed == this.opts.home)
	}
  get claims() {
    return this.opts.claims.map(id=>Claims.find(c=>c[1] == id))
  }
  get resources() {
    return Object.entries(this.opts.res).map(([key,val])=>{
      let tres = this.template.resources.find(r=>r[0] == key)
      return [key, val, tres.slice(1)]
    }
    )
  }
  get abilities() {
    return this.opts.abilities.map(id=>Abilities.find(c=>c[1] == id))
  }
  get upgrades() {
    return this.opts.upgrades.map(id=>Upgrades.find(c=>c[1] == id))
  }
  get cohorts() {
    return this.opts.cohorts
  }
  get availableContacts() {
    return []
  }
  get contacts() {
    return this.opts.contacts
  }
  /*
    May Be changed 
  */
  mod(what, d=null) {
    this.opts[what] = d == null ? this.opts[what] : d
    return this.opts[what]
  }
  show() {
    this.galaxy.game = this
    this.app.dialog = "galaxy.game.UI"
  }
  cohortUI(i) {
    let c = this.opts.cohorts[i]
    let ar = [2, 1, 1, 2, 1, 1]
    let[about,actions,upf=[]] = c
    return _.html`
		<div class="flex items-center">
			<input class="w-100" type="text" value=${about} onInput=${(e)=>this.opts.cohorts[i][0] = e.target.value}></input>
			<div class="tc b bg-red white pointer dim underline-hover pa1" onClick=${()=>this.opts.cohorts.splice(i, 1)}>✗</div>
	    </div>
		<div class="flex items-center">
			<div class="d-circle-sm bg-black"></div><div class="d-circle-sm bg-black mr1">
			</div>${_.UISelect(ACTIONS, actions[0], (e)=>actions[0] = e.target.value, "w-100")}
		</div>
		<div class="flex items-center justify-between">
			<div class="d-circle-sm bg-black mr1"></div>${_.fromN(2, (i)=>_.UISelect(ACTIONS, actions[i + 1], (e)=>actions[i + 1] = e.target.value, "w-50"))}
		</div>
		<div class="flex flex-wrap ma1">
		${upf.map((tag,j)=>_.html`
			<div class="dropdown mh1" style="direction: ltr;">
				<div class="pointer underline-hover hover-blue b--dashed">
					<div class="tooltip tt-top">${tag}
						<span class="tooltiptext">${COHORTUPF[tag]}</span>
					</div>
				</div>
				<div class="dropdown-content bg-white ba bw1 pa1">
					<div class="link pointer underline-hover" onClick=${()=>c[2].splice(j, 1)}>DELETE</div>
					${Object.keys(COHORTUPF).map(upf=>_.html`<div class="link pointer underline-hover" onClick=${()=>c[2][j]=upf}>${upf}</div>`)}
				</div>
			</div>`)}
		</div>
		<div class="tc b bg-light-green pointer dim underline-hover hover-green ba mb1 pa1" onClick=${()=>c[2].push("Equipped")}>Add Upgrade/Perk/Flaw</div>`
  }
  get UI() {
    let width = window.innerWidth < 1000 ? window.innerWidth - 4 : 1000
    let {claims, abilities, _select, resources, cohorts, template} = this
    //manage modifications to stats 
    let mod = (what,d)=>this.mod(what, d)
    let[tier,hold] = mod("tier").split(".")
    let[heat,wanted] = mod("heat")

    //helper UI pieces 
    let _input = (edit,css="")=>_.html`<input class=${css} type="text" value=${mod(edit)} onInput=${(e)=>mod(edit, e.target.value)}></input>`
    let _inputSelect = (master,what)=>master.length == 0 ? "" : _.html`
    <div class="mv2">
      <h3 class="ma0">${what.toUpperCase()}</h3>
      ${this[what].map((c,i)=>_.html`
        <div class="flex items-center justify-between mv1 ph1">
          ${c[0]}
          <div class="tc b bg-red white pointer dim underline-hover pa2" onClick=${()=>this.opts[what].splice(i, 1)}>✗</div>
        </div>`)}
      <div class="flex">
        ${_.UISelect(master, master[what], (e)=>_select[what] = Number(e.target.value.split(",")[1]), "w-100")}
        <div class="tc b bg-light-green pointer dim underline-hover hover-green ba pa2" onClick=${()=>this.opts[what].push([_select[what] || 0, 1, false])}>✚</div>
      </div>
    </div>`

    //modify resources 
    let modRes = (res,steps,val)=>{
      let t = _.sum(steps) + val + 1
      t = t == 1 && this.opts.res[res] > 1 ? 0 : t
      this.opts.res[res] = t
      console.log(this.opts.res)
    }

    return _.html`
    <div style="width:${width}px;max-height:75vh;">
      <div class="fl w-40 ph1">
        ${_input("name", "w-50")}
        ${_input("reputation", "w-50")}
        <div class="flex mv1">
          <b>HOME:</b> 
		  <div class="dropdown mh1" style="direction: ltr;">
				<div class="pointer underline-hover hover-blue" style="text-decoration: underline dotted;">${this.home ? `${this.home.name}; Sector [${this.home.sid}]` : `Please pick from your favorites.`}</div>
				<div class="dropdown-content bg-white ba bw1 pa1">
					${this.home ? _.html`<div class="link pointer underline-hover bb mb2" onClick=${()=>null}>Go to ${this.home.name}</div>` : ""}
					${this.galaxy.favorites.map(s=>_.html`<div class="link pointer underline-hover" onClick=${()=>this.opts.home=s.seed}>${`${s.name}; Sector [${s.sid}]`}</div>`)}
				</div>
			</div>
        </div>
        <div class="flex items-center justify-between mv1">
          <div class="b mr2">REP</div>
          ${_.fromN(12, (i)=>_.html`<div class="blades-rep ${i < mod("rep") ? "bg-black" : ""}" onClick=${()=>i == 0 && mod("rep") > 1 ? mod("rep", 0) : mod("rep", i + 1)}></div>`)}
          <div class="b mh2">TIER</div>
          ${_.fromN(4, (i)=>_.html`<div class="blades-tier ${i < Number(tier) ? "bg-black" : ""}" onClick=${()=>i == 0 && tier > 1 ? mod("tier", "0.s") : mod("tier", [i + 1, hold].join("."))}></div>`)}
          <div class="b mh2">HOLD</div>
          <div class="flex items-center b mr1">S<div class="blades-tier ${hold == "s" ? "bg-black" : ""}" onClick=${()=>mod("tier", [tier, "s"].join("."))}></div></div>
          <div class="flex items-center b">W<div class="blades-tier ${hold == "w" ? "bg-black" : ""}" onClick=${()=>mod("tier", [tier, "w"].join("."))}></div></div>
        </div>
        <div class="flex justify-between mv2">
          <div class="flex items-center flex-column">
            <div class="f6 b mr2">HEAT</div>
            <div>${_.fromN(9, (i)=>_.html`<div class="blades-rep ${i < heat ? "bg-black" : ""}" onClick=${()=>i == 0 && heat > 1 ? mod("heat", [0, wanted]) : mod("heat", [i + 1, wanted])}></div>`)}</div>
          </div>
          <div class="flex items-center flex-column">
            <div class="f6 b mr2">WANTED</div>
            <div>${_.fromN(4, (i)=>_.html`<div class="blades-rep ${i < wanted ? "bg-black" : ""}" onClick=${()=>i == 0 && wanted > 1 ? mod("heat", [heat, 0]) : mod("heat", [heat, i + 1])}></div>`)}</div>
          </div>
          ${resources.map(([res,val,steps])=>_.html`
          <div class="flex items-center flex-column">
            <div class="f6 b mr2">${res.toUpperCase()}</div>
            <div>${steps.map((ns,i)=>_.html`
              <div class="flex items-center mb1">${_.fromN(ns, (j)=>_.html`<div class="blades-res ${val > _.sum(steps.slice(0, i)) + j ? "bg-black" : ""}" onClick=${()=>modRes(res, steps.slice(0, i), j)}></div>`)}</div>`)}
            </div>
          </div>`)}
        </div>
        ${_inputSelect(Claims, "claims")}
        <textarea class="w-100" rows="6" cols="50" value=${mod("notes")} onInput=${(e)=>mod("notes", e.target.value)}></textarea>
        <div class="flex">
          <div class="w-50 tc b bg-light-green pointer dim underline-hover hover-green ba pa2" onClick=${()=>this.save()}>Save</div>
          <div class="w-50 tc b bg-light-gray pointer dim underline-hover hover-orange ba pa2" onClick=${()=>this.app.dialog = ""}>Cancel</div>
        </div>
      </div>
      <div class="fl w-60 ph1">
        <div class="fl w-60 ph2">
          <div class="dropdown" style="direction: ltr;">
			<div class="pointer dim underline-hover hover-blue"><h1 class="ma0">${mod("playbook")}</h1></div>
			<div class="dropdown-content bg-white ba bw1 pa1">
				${template.playbook.map(p=>_.html`
				<div class="f4 link pointer underline-hover" onClick=${()=>mod("playbook", p)}>${p}</div>`)}
			</div>
          </div>
          ${_inputSelect(Abilities, "abilities")}
          ${_inputSelect(Upgrades, "upgrades")}
          <div class="flex items-center justify-between bg-light-gray">
            <div class="b">Crew XP</div>
            <div>${_.fromN(8, (i)=>_.html`<div class="blades-rep ${i < mod("xp") ? "bg-black" : ""}" onClick=${()=>i == 0 && mod("xp") > 1 ? mod("xp", 0) : mod("xp", i + 1)}></div>`)}</div>
          </div>
          <div class="f6">
            <p>At the end of each mission, for each item below, mark 1 xp (or 2 xp instead if that item occurred multiple times).</p>
            <ul class="i pl3">
              <li>You executed a successful ... operation.</li>
              <li>You contended with challenges above your current station.</li>
              <li>You bolstered the organization's reputation or developed a new one.</li>
              <li>You expressed the goals, drives, inner conflict, or essential nature of the organization.</li>
            </ul>
          </div>
        </div>
        <div class="fl w-40">
          <h3 class="ma0 ${cohorts.length != 0 ? "" : "dn"}">COHORTS</h3>
	      ${cohorts.map((c,i)=>this.cohortUI(i))}
		  <div class="w-100 tc b bg-light-green pointer dim underline-hover hover-green ba mb1 pa2" onClick=${()=>this.opts.cohorts.push(COHORT.slice())}>Add Cohort</div>
          <div class="w-100 tc b bg-light-green pointer dim underline-hover hover-green ba pa2" onClick=${()=>this.galaxy.addCharacter(this)}>Add Character</div>
        </div>
      </div>
    </div>`
  }
  save() {
    this.app.dialog = ""
    this.galaxy.save()
    console.log(this)
  }
}

export {Game, GameTemplates}
