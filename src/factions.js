import {MakeName} from './utils/randomName.js';
import {RandomPeople} from './people.js';
import*as Data from './data.js';

/*
  Ancients 
*/
const Ancients = ['Crysik', 'Cthulhi', 'Deep Dwellers', 'Dholes', 'Elder Things', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Shoggoth', 'Space Polyps', 'Worms', 'Xsur', 'Yellow Court', 'Yith', 'Hegemony']

const CreateAncient = (RNG)=>{
  let type = RNG.shuffle(['air', 'earth', 'water', 'air', 'earth', 'water']).slice(0, 2).map(t=>_.capitalize(RNG.pickone(RNG.pickone(Data.Animals[t]).split("/")))).join("/");

  return {
    form: 'Ancient',
    type,
    oddity: RNG.pickone(Data.Oddities),
    element: RNG.pickone(Data.Elements),
    magic: RNG.pickone(Data.Magic)
  }
}

/*
  Factions by Era 
  Broken int t: threats, n: neutrals, a: allies
*/

const TEMPLATES = {
  Ancient: {
    gen: CreateAncient
  },
  'The Free': {
    gen: RandomPeople
  },
  People: {
    gen: RandomPeople
  },
}

/*
  Factions
*/
const ALIGNMENTS = ['Evil', 'Chaotic', 'Neutral', 'Lawful', 'Good']
const ECONOMY = ['struggling', 'poor', 'comfortable', 'wealthy', 'booming']
const MILITARY = ['pathetic', 'weak', 'capable', 'strong', 'mighty']
const POPULACE = ['rebellious', 'restless', 'stable', 'content', 'exuberant']
const FACTIONTYPES = ['common', 'criminal', 'revolutionary', 'military', 'religious', 'craft', 'trade', 'industrial', 'academic', 'arcane']
const VALUES = {
  Good: "empathy,generosity,valor,trust,cooperation,love,Lawful,Neutral",
  Lawful: "truth,justice,discipline,loyalty,order,honor,Good,Neutral",
  Neutral: "knowledge,balance,advancement,independence,investment,fate,Lawful,Chaotic",
  Chaotic: "satisfaction,impulse,conflict,celebration,disruption,passion,Evil,Neutral",
  Evil: "ignorance,control,subjugation,greed,power,hatred,Chaotic,Neutral"
}

const PeopleByEra = (RNG,opts={})=>{
  let {era=[], restricted=[]} = opts
  //if not present generate 
  let[_era=RNG.pickone(Object.keys(ERAS)),type=RNG.pickone(["t", "n", "a"])] = era
  return RNG.pickone(ERAS[_era][type].filter(p=>!restricted.includes(p)))
}

class Faction {
  constructor(parent, opts={}) {
    this.parent = parent

    this.opts = opts
    this.seed = opts.seed || chance.natural()
    this.id = opts.id || 0

    this.era = opts.era || ""
    let threat = this.threat = opts.threat || "n"

    let RNG = new Chance([this.seed, "Faction", this.id].join("."))

    let t = this.tier = opts.tier || 1 
    let color = RNG.pickone(Data.GasGiantColors) 
    this.color = opts.color ? opts.color : color

    //set stats and goals 
    this._stats = RNG.shuffle(t == 1 ? [1,1,0] : t == 2 ? [2,1,0] : [t,RNG.shuffle([t-1,t-2,t-2,t-3])].flat()).slice(0,3) 

    //lifeform and people 
    let people = opts.people ? opts.people : PeopleByEra(RNG, opts)
    //get template 
    let template = TEMPLATES[people] || {}
    this.people = people
    if(template.gen) {
      this._name = _.capitalize(RNG.word()) 
      this._people = template.gen(RNG) 
    }

    //['Evil', 'Chaotic', 'Neutral', 'Lawful', 'Good']
    this.alignment = threat == "t" ? RNG.pickone(['Evil', 'Chaotic']) : threat == "n" ? RNG.weighted(['Chaotic', 'Neutral', 'Lawful'], [1, 4, 1]) : RNG.pickone(['Lawful', 'Good'])

    this.populace = RNG.weighted(POPULACE, [1, 2, 6, 2, 1])

    this.values = RNG.shuffle(VALUES[this.alignment].split(",")).slice(0, 2).map(v=>{
      return VALUES[v] ? VALUES[v].split(",")[RNG.d6() - 1] : v
    }
    )

    let tech = RNG.shuffle(["Standard", "Organic", "Arcane"])
    this.tech = tech.slice(0, RNG.pickone([1, 2])).join("/")
    this.style = RNG.pickone(["Fluid", "Rough", "Blocky", "Gothic", ""])

    this.type = RNG.pickone(FACTIONTYPES)

    //create the standard people of the region 
    this.thralls = threat == 't' ? _.fromN(3, ()=>RandomPeople(RNG)) : []

    this._ob = RNG.bool()
  }
  get app () {
    return this.parent.app
  }
  get name() {
    return this._name ? `${this._name}${['Ancient','The Free'].includes(this.people) ? ` [${this.people}]` : ""}` : this.people
  }
  get about() {
    let s = this.stats 
    return [this.alignment.toLowerCase(), "$ " + ECONOMY[s.Wealth], "⚔ " + MILITARY[s.Force], "☺ " + this.populace]
  }
  get stats () {
    return _.fromEntries(["Force","Cunning","Wealth"].map((s,i)=>[s,this._stats[i]]))
  }
  get mayAttack () {
    return this.isAI || this.isAncient || ['Dominion', 'Tyrants', 'Hegemony', 'Hordes', 'Myr', 'Syndicate', 'Worms'].includes(this.people)
  }
  get settlementTypes() {
    if (['Ikarya', 'Hordes'].includes(this.people))
      return "Planet/1";
    if (['Tyrants', 'Red Dawn', "Dominion", "Architects"].includes(this.people))
      return "Orbital,Planet/1,1";
    if (this.people == 'Gemeli')
      return "Planet,Moon,Space/1,2,4";
    if (this.people == 'Lyns')
      return "Planet,Space/3,1";
    if (this.people == 'Proto-Ancient')
      return "Orbital,Planet,Moon/3,3,1";
    if (this.isAncient)
      return "Planet,Moon,Space/3,1,1";
    if (this.isAI || ['Hegemony', 'Syndicate', 'Myr'].includes(this.people))
      return "Moon,Space/1,1";
    if (["Heralds", "Frontier"].includes(this.era))
      return "Planet,Moon,Space/3,1,1";
    if (this.era == "Firewall")
      return "Orbital,Planet,Moon/4,1,1";
    if (this.era == "ExFrame")
      return "Moon,Space/1,3"
    if (this.era == "Cosmic")
      return "Orbital,Space/4,1";
  }
  get isAI() {
    return ['Barren', 'Lyns', 'Reapers'].includes(this.people)
  }
  get isProtoAncient() {
    return this.people == "Ancient"
  }
  get isAncient() {
    return Ancients.includes(this.people)
  }
  get eraType() {
    return {
      a: "Ally",
      n: "Neutral",
      t: "Threat"
    }[this._eraType]
  }
  initialize (RNG) {
    this.setGoals(RNG)
  }
  setGoals(RNG) {
    let t = this._eraType
    const GOALS = ['Oppose', 'Spy On/Sabotage/Infiltrate', 'Hold Territory', 'Expand Territory', 'Establish Outpost', 'Exploit Resources', 'Maintain Trade', 'Seek Knowledge']
    //Hunt 
    
    this.goals = RNG.shuffle(GOALS).slice(0, 2).map(g=>{
      let hasT = ['Oppose', 'Spy On/Sabotage/Infiltrate'].includes(g)
      g = RNG.pickone(g.split("/"))

      let targets = t == "t" ? this.parent.factionsByEra[this.era].filter(f=>f.seed!=this.seed) : this.parent.factionsByEra[this.era].filter(f=>f._eraType=="t")
      let target = RNG.pickone(targets)

      let short = g+(hasT?` [${target.name}]`:"")

      return {
        goal: g,
        clock: RNG.pickone([8, 10, 12]),
        target,
        short
      }
    }
    )
  }
  get sectors () {
    return this.claims.map(c=>c.sid)
  }
  isWithinClaims(x, y) {
    return this.claims.map(c=>c.pr).flat().filter(pr=>{
      let[cx,cy,cr] = pr
      let dx = x - cx
        , dy = y - cy;
      return dx * dx + dy * dy <= cr * cr
    }
    ).length > 0
  }
  get gates () {
    return this.parent.pastFactions.filter(f=> f.id == this.id || f.people==this.people).map(f=> f.systemsInSector().filter(s=>s.type=="Gate")).flat()
  }
  systemsInSector(MS) {
    MS.refresh()
    return MS._fs.filter(s => s._f && s._f.id == this.id) 
  }
  /*
  UI
  */
  get UI () {
    const {html} = this.app
    let {name,_eraType,eraType,tier,about,values,style,tech,claims,goals=[]} = this 

    let color = _eraType == "t" ? "red" : _eraType == "n" ? "blue" : "green"

    const button = html`
    <div class="tc pointer dim bg-white flex items-center justify-between db ba br2 ma1 pa2" onClick=${()=>this.app.updateState("dialog","GalaxyFactionUI",this.parent.Faction = this)}>
      <div>
        <div class="d-circle-sm mh1" style="background:${this.color}"></div>
        ${name}
      </div>
      <div class="flex items-center">
        ${_.romanNumeral(tier-1)}
        <div class="d-circle-sm bg-${color} mh1" ></div>
      </div>
    </div>
    `

    const dialog = html`
    <div style="width: 26rem;">
      <h3 class="flex items-center justify-between mb0 mt2">
        ${name} 
        <span>[<span class="pointer dim underline-hover hover-orange" onClick=${()=>this.app.dialog = ""}>X</span>]</span>
      </h3>
      <div class="w-100">
        <div class="i mb1">${eraType}, ${about.join(", ")}</div>
        <div class="ph2">
  		  <div><b>Values:</b> ${values.join("/")}</div>
  		  <div><b>Tech:</b> ${style} ${tech}</div>
  	      <div class="flex"><b>Sectors:</b> ${claims.map(c=>html`<div class="pointer underline-hover hover-blue mh1">[${c.sid.join()}]</div>`)}</div>
  	      <div class="flex ${goals.length == 0 ? "dn-ns" : ""}">
  	        <span class="b">Goals: </span>
  			<div class="mh2">${goals.map(g=>html`<div>${g.short} [${g.clock}]</div>`)}</div>
  	      </div>
  	  </div>
      </div>
    </div>`

    return {button,dialog}
  }
}

export {Ancients, Faction}
