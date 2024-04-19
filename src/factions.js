import {RandBetween, SumDice, Likely, BuildArray, WeightedString} from './random.js'
import {RandomPeople} from './people.js';
import*as Data from './data.js';

/*
  Ancients 
*/
const Ancients = ['Crysik', 'Cthulhi', 'Deep Dwellers', 'Dholes', 'Elder Things', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Shoggoth', 'Space Polyps', 'Worms', 'Xsur', 'Yellow Court', 'Yith']

const CreateAncient = (RNG)=>{
  let type = RNG.shuffle(['air', 'earth', 'water', 'air', 'earth', 'water']).slice(0, 2).map(t=>RNG.pickone(RNG.pickone(Data.Animals[t]).split("/")).capitalize()).join("/");

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

const Heralds = {
  t: ['Crysik', 'Cthulhi', 'Deep Dwellers', 'Dholes', 'Elder Things', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Space Polyps', 'Worms', 'Yellow Court', 'Yith'],
  n: ['Ikarya', 'Xsur', 'Shoggoth', 'Independents*'],
  a: ['Solars', 'The Free']
}
const Frontier = {
  t: ['Crysik', 'Cthulhi', 'Deep Dwellers', 'Dholes', 'Elder Things', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Space Polyps', 'Worms', 'Yellow Court', 'Yith'],
  n: ['Gemeli', 'Crysik', 'Ikarya', 'Shoggoth', 'People', 'People', 'People'],
  a: ['People']
}
const Firewall = {
  t: ['Barren', 'Lyns', 'Reapers', 'Barren', 'Lyns', 'Reapers', 'Barren', 'Lyns', 'Reapers'],
  n: ['Gemeli', 'Ikarya', 'People', 'People', 'People'],
  a: ['People']
}
const ExFrame = {
  t: ['Barren', 'Lyns', 'Reapers', 'Barren', 'Lyns', 'Reapers', 'Deep Dwellers', 'Hegemony', 'Worms'],
  n: ['Gemeli', 'Ikarya', 'Independents', 'Independents', 'Alari', 'Independents', 'Alari'],
  a: ['Free Union']
}
const Wanderer = {
  t: ['Barren', 'Lyns', 'Reapers', 'Deep Dwellers', 'Dominion', 'Tyrants', 'Hegemony', 'Hordes', 'Myr', 'Syndicate', 'Worms'],
  n: ['Gemeli', 'Ikarya', 'Cultivators', 'Myr', 'Red Dawn'],
  a: ['Archons', 'Forge Worlds', "Guardians", 'Houses of the Sun', 'Protectorate', 'Free Union', 'Free Union', 'Free Union']
}

const ERAS = {
  Heralds,
  Frontier,
  Firewall,
  ExFrame,
  Wanderer
}

const TEMPLATES = {
  Ancient: {
    gen: CreateAncient
  },
  'Independents*': {
    gen: RandomPeople
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

    this.era = opts.era ? opts.era[0] : ""
    this._eraType = opts.era ? opts.era[1] : "n"

    let RNG = new Chance([this.seed, "Faction", this.id].join("."))

    //lifeform and people 
    let people = opts.people ? opts.people : PeopleByEra(RNG, opts)
    //get template 
    let template = TEMPLATES[people] || {}
    this.people = template.gen ? template.gen(RNG) : people

    let type = this._eraType
    //['Evil', 'Chaotic', 'Neutral', 'Lawful', 'Good']
    this.alignment = type == "t" ? RNG.pickone(['Evil', 'Chaotic']) : type == "n" ? RNG.weighted(['Chaotic', 'Neutral', 'Lawful'], [1, 4, 1]) : RNG.pickone(['Lawful', 'Good'])

    this.economy = RNG.weighted(ECONOMY, [1, 2, 6, 2, 1])
    this.military = RNG.weighted(MILITARY, [1, 2, 6, 2, 1])
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
    this.thralls = type == 't' ? BuildArray(3, ()=>RandomPeople(RNG)) : []

    this._ob = RNG.bool()

    //for faction add systems - max will be 30 : id, type, center of gravity, r, theta
    this._systems = BuildArray(50, (_,i)=>[1000000 + i + (this.id * 500), RNG.pickone(["Settlement", "Site"]), RNG.random(), Math.sqrt(RNG.random()), RNG.random() * 2 * Math.PI, RandBetween(1, 1000, RNG)])
    this._systems.forEach(s=>s[1] = s[1] == "Settlement" ? WeightedString(this.settlementTypes, RNG) : RNG.weighted(['Outpost', 'Resource', 'Gate', 'Infrastructure'], [2, 2, 1, 1]))
  }
  get name() {
    return this.people.type ? this.people.type : this.people
  }
  get about() {
    return [this.alignment.toLowerCase(), "$ " + this.economy, "⚔ " + this.military, "☺ " + this.populace]
  }
  get settlementTypes() {
    if (['Ikarya', 'Hordes'].includes(this.people))
      return "Planet/1";
    if (['Tyrants', 'Red Dawn'].includes(this.people))
      return "Orbital,Planet/1,1";
    if (this.people == 'Gemeli')
      return "Orbital,Moon,Asteroid/2,1,1";
    if (this.people == 'Lyns')
      return "Planet,Asteroid/3,1";
    if (this.isProtoAncient)
      return "Orbital,Planet,Moon/3,3,1";
    if (this.isAncient)
      return "Planet,Moon,Asteroid/3,1,1";
    if (this.isAI || ['Hegemony', 'Syndicate', 'Myr'].includes(this.people))
      return "Moon,Asteroid/1,1";
    if (["Heralds", "Frontier"].includes(this.era))
      return "Planet,Moon,Asteroid/3,1,1";
    if (this.era == "Firewall")
      return "Orbital,Planet,Moon/4,1,1";
    if (this.era == "ExFrame")
      return "Moon,Asteroid/1,3"
    if (this.era == "Wanderer")
      return "Orbital,Asteroid/4,1";
  }
  get isAI() {
    return ['Barren', 'Lyns', 'Reapers'].includes(this.people)
  }
  get isProtoAncient() {
    return this.people.form ? this.people.form == "Ancient" : false
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
  setGoals(RNG) {
    const GOALS = ['Oppose', 'Hunt', 'Spy On/Sabotage/Infiltrate', 'Hold Territory', 'Expand Territory', 'Establish Outpost', 'Exploit', 'Maintain Trade', 'Seek Knowledge']
    this.goals = RNG.shuffle(GOALS).slice(0, 2).map(g=>{
      let what = null

      if (['Oppose', 'Spy On/Sabotage'].includes(g)) {
        g = RNG.pickone(g.split("/"))
        //what = RNG.pickone(foes.map(f=>f.people))
      } else if (g == 'Exploit') {//what = RNG.pickone(resources)
      } else if (g == 'Hunt') {//what = R.ancient.people == this.people ? RNG.pickone(_creatures.filter(c=> ["wild","sport"].includes(c.purpose)).map(c=>c.data.type)) : RNG.pickone(_creatures.map(c=>c.data.type))
      }

      return {
        goal: g,
        clock: RNG.pickone([8, 10, 12]),
        what
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
  systemsInSector(MS=null) {
    //if no sector is provided it returns all systems 
    let G = this.parent
    let fei = G.eraList.indexOf(this.era)
    let ei = G.eraList.indexOf(G._era)
    let de = fei - ei
    //if era is less than the era of the faction 
    if (de > 0)
      return [];
    //claims 
    let claims = this.claims.map(c=>c.pr.map(pr=>Object.assign({
      pr
    }, {
      sid: c.sid
    }))).flat()
    let nc = this.claims.length
    //get systems based on tier - remove those not in sector 
    let systems = this._systems.slice(0, 10 * this.tier).map((s,i)=>{
      let ci = Math.floor(claims.length * s[2])
      let {pr, sid} = claims[ci]
      return {
        cp: pr,
        sid,
        s,
        i
      }
    }
    ).filter(s=> MS ? MS.isSameSector(...s.sid) : true)
    //return based on tier 
    return systems.map(({cp, s, i, sid})=>{
      //convert center, r, theta to p 
      let[r,theta,z] = s.slice(3, 6)
      let[cx,cy,cr] = cp
      let x = cx + (r * cr) * Math.cos(theta)
      let y = cy + (r * cr) * Math.sin(theta)

      //determine owner 
      let altFaction = MS ? MS.factions.filter(f=>f.isWithinClaims(x, y))[0] || null : null
      let f = de == 0 ? this : altFaction 
      let isCore = i < nc

      //id, type, center of gravity, r, theta
      return {
        _i : i,
        f: f,
        creator: this,
        ei: fei,
        isCore,
        i: s[0],
        sid,
        type: isCore? this.settlementTypes.split("/")[0].split(",")[0] : s[1],
        p: [Math.round(x), Math.round(y),z]
      }
    }
    )
  }
}

export {Ancients, ERAS as EraFactions, Faction}
