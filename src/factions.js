import {RandBetween, SumDice, Likely, BuildArray} from './random.js'
import {RandomPeople} from './people.js';
import*as Data from './data.js';

/*
  Ancients 
*/
const Ancients = ['Crysik', 'Cthulhi', 'Deep Dwellers', 'Dholes', 'Echani', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Shoggoth', 'Space Polyps', 'Worms', 'Xsur', 'Yellow Court', 'Yith']

const CreateAncient = (RNG)=>{
  let type = RNG.shuffle(['air', 'earth', 'water', 'air', 'earth', 'water']).slice(0, 2).map(t=>RNG.pickone(RNG.pickone(Data.Animals[t]).split("/")).capitalize()).join("/");

  return {
    form : 'Ancient',
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
  t: ['Crysik','Cthulhi','Deep Dwellers', 'Dholes', 'Elder Things', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Space Polyps', 'Worms', 'Yellow Court', 'Yith'],
  n: ['Ikarya','Xsur','Shoggoth','Independents'],
  a: ['Solars','The Free']
}
const Frontier = {
  t: ['Crysik','Cthulhi','Deep Dwellers', 'Dholes', 'Elder Things', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Space Polyps', 'Worms', 'Yellow Court', 'Yith'],
  n: ['Gemeli','Crysik','Ikarya','Shoggoth','People','People','People'],
  a: ['People']
}
const Firewall = {
  t: ['Barren','Lyns','Reapers'],
  n: ['Gemeli','Ikarya','People','People','People'],
  a: ['People']
}
const ExFrame = {
  t: ['Barren','Lyns','Reapers','Barren','Lyns','Reapers','Deep Dwellers','Hegemony','Worms'],
  n: ['Gemeli','Ikarya','Independents','Independents','Alari'],
  a: ['Free Union']
}
const Wanderer = {
  t: ['Barren','Lyns','Reapers','Deep Dwellers','Dominion','Tyrants','Hegemony','Hordes','Myr','Syndicate','Worms'],
  n: ['Gemeli','Ikarya','Cultivators','Myr','Red Dawn'],
  a: ['Archons','Forge Worlds',"Guardians",'Houses of the Sun','Protectorate']
}

const ERAS = {Heralds,Frontier,Firewall,ExFrame,Wanderer}

const TEMPLATES = {
  Ancient : {gen:CreateAncient},
  Independents : {gen:RandomPeople},
  'The Free': {gen:RandomPeople},
  People : {gen:RandomPeople},
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
  Good : "empathy,generosity,valor,trust,cooperation,love,Lawful,Neutral",
  Lawful : "truth,justice,discipline,loyalty,order,honor,Good,Neutral",
  Neutral : "knowledge,balance,advancement,independence,investment,fate,Lawful,Chaotic",
  Chaotic : "satisfaction,impulse,conflict,celebration,disruption,passion,Evil,Neutral",
  Evil : "ignorance,control,subjugation,greed,power,hatred,Chaotic,Neutral"
}

const PeopleByEra = (RNG, opts = {}) => {
  let {era = [],restricted = []} = opts 
  //if not present generate 
  let [_era = RNG.pickone(Object.keys(ERAS)),type=RNG.pickone(["t","n","a"])] = era
  return RNG.pickone(ERAS[_era][type].filter(p=> !restricted.includes(p)))
}

class Faction {
  constructor(opts = {}) {
    this.seed = opts.seed || chance.natural()
    this.id = opts.id || 0 
    
    let RNG = new Chance([this.seed,"Faction",this.id].join("."))

    //lifeform and people 
    let people = opts.people ? opts.people : PeopleByEra(RNG,opts)
    //get template 
    let template = TEMPLATES[people] || {}
    this.people = template.gen ? template.gen(RNG) : people

    let type = opts.era ? opts.era[1] : "n"
    this.alignment = type == "t" ? RNG.weighted(ALIGNMENTS, [4, 4, 2, 0, 2]) : type == "n" ? RNG.weighted(ALIGNMENTS, [0, 2, 7, 2, 1]) : RNG.weighted(ALIGNMENTS, [0, 1, 3, 4, 4])

    this.economy = RNG.weighted(ECONOMY, [1, 2, 6, 2, 1])
    this.military = RNG.weighted(MILITARY, [1, 2, 6, 2, 1])
    this.populace = RNG.weighted(POPULACE, [1, 2, 6, 2, 1])

    this.values = BuildArray(2,()=>{
      let val = RNG.pickone(VALUES[this.alignment].split(","))
      return VALUES[val] ? VALUES[val].split(",")[RNG.d10()-1] : val 
    })

    let tech = RNG.shuffle(["Standard","Organic","Arcane"])
    this.tech = tech.slice(0,RNG.pickone([1,2])).join("/")
    this.style = RNG.pickone(["Fluid","Rough","Blocky","Gothic",""])

    this.type = RNG.pickone(FACTIONTYPES)

    //create the standard people of the region 
    this.thralls = type == 't' ? BuildArray(3,()=> RandomPeople(RNG)) : []
  }
  get about() {
    return [this.alignment.toLowerCase(), "$ " + this.economy, "⚔ " + this.military, "☺ " + this.populace]
  }
  get isAncient () {
    return Ancients.includes(this.people)
  }
  setGoals (RNG) {
    const GOALS = ['Oppose','Hunt','Spy On/Sabotage','Hold Territory','Expand Territory','Establish Outpost','Exploit','Maintain Trade','Seek Knowledge']
    this.goals = RNG.shuffle(GOALS).slice(0,2).map(g=> {
      let what = null 
      
      if(['Oppose','Spy On/Sabotage'].includes(g)){
        g = RNG.pickone(g.split("/"))
        //what = RNG.pickone(foes.map(f=>f.people))
      }
      else if (g=='Exploit'){
        //what = RNG.pickone(resources)
      }
      else if (g=='Hunt'){
        //what = R.ancient.people == this.people ? RNG.pickone(_creatures.filter(c=> ["wild","sport"].includes(c.purpose)).map(c=>c.data.type)) : RNG.pickone(_creatures.map(c=>c.data.type))
      }
      
      return {
        goal : g,
        clock : RNG.pickone([8,10,12]),
        what
      }
    })
  }
}


export {Ancients,Heralds,Frontier,Firewall,ExFrame,Wanderer,Faction}