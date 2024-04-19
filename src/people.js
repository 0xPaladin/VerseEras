import {RandBetween, SumDice, Likely, WeightedString, BuildArray} from './random.js'
import*as Data from './data.js';

const ECONOMY = ['struggling', 'poor', 'comfortable', 'wealthy', 'booming']
const MILITARY = ['pathetic', 'weak', 'capable', 'strong', 'mighty']
const POPULACE = ['rebellious', 'restive', 'resigned', 'content', 'exuberant']

const HUMANOIDS = 'Humanoid,Orc|Hobgoblin|Gnoll,Goblin|Kobold,Halfling,Ogre|Troll,Anthro,Lizardfolk|Merfolk,Dwarf|Gnome,Elf,Chimera/30,8,8,7,2,3,2,2,4,3'

const VALUES = {
  Good : "empathy,generosity,valor,trust,cooperation,love,Lawful,Neutral",
  Lawful : "truth,justice,discipline,loyalty,order,honor,Good,Neutral",
  Neutral : "knowledge,balance,advancement,independence,investment,fate,Lawful,Chaotic",
  Chaotic : "satisfaction,impulse,conflict,celebration,disruption,passion,Evil,Neutral",
  Evil : "ignorance,control,subjugation,greed,power,hatred,Chaotic,Neutral"
}

const RandomPeople = (RNG=chance,_form = null)=>{
  let form = RNG.weighted(['humanoid', 'animal', 'robotic'], [4, 2, 1])
  form = _form ? _form : form 

  let Animal = () => {
    let a = RNG.pickone(Data.Animals[RNG.weighted(['air', 'earth', 'water'],[3,7,2])])
    return RNG.pickone(a.split("/")).capitalize()
  }

  let type = '', body='';
  if (form == 'animal') {
    let n = RNG.weighted([1,2],[6,4])
    type = BuildArray(n,()=> Animal()).join("/")    
  } else if (form == 'robotic') {
    body = RNG.pickone(['Humanoid','Animal','Blocky','Spherical','Geometric','Trilateral','Radial','Asymmetrical','Swarm'])
    body = body == 'Animal' ? Animal() : body
    type = `Robot [${body}]`
  } else {
    //"Fighter,Ranger,Barbarian,Monk/5,4,2,2"
    type = RNG.pickone(WeightedString(HUMANOIDS,RNG).split("|"))
    type = type == 'Anthro' ? Animal().capitalize()+"-folk" : type == 'Chimera' ? [Animal(),Animal()].join("/")+" folk"  : type
  }

  let size = RNG.weighted(["tiny","small","medium","large","huge"],[1,2,6,2,1])
  size = ['Gnome','Goblin','Kobold','Halfling'].includes(type) ? "small" : ['Ogre','Troll'].includes(type) ? "large" : HUMANOIDS.includes(type) ? "medium" : size

  let text = form == 'robotic' ? `Robot [${body}, ${size}]` : type+(size!='medium' ? ` [${size}]`: "")
  
  return {
    seed : RNG.seed,
    form,
    type,
    size,
    text
  }
}

class Faction {
  constructor(system, color) {
    let hi = system._habitability
    let sector = system.parent

    let id = this.id = system.i
    this.color = color
    let RNG = new Chance([sector._seed, "Faction", id].join("."))

    this._s = hi == 1 ? RNG.weighted([0, 1, 2, 3, 4, 5], [2, 2, 3, 3, 1, 1]) : 0
    let size = this._s == 0 ? 1 : SumDice([1, '1d4', '2d6', '3d8', '4d10', '5d12'][this._s], RNG)
    //features 
    this._f = [1, 1, 2, 3, 5, 7][this._s]

    //keep track of all claims 
    let allClaims = sector.factions.map(f=>f._claims).flat()
    //get claims 
    let _claims = sector.systems.map((s,j)=>[s, system.distance(s)]).filter(s=>!allClaims.includes(s[0].i)).sort((a,b)=>a[1] - b[1]).slice(0, size)
    _claims.forEach(c=>c[0].claim = id)
    this._claims = _claims.map(c=>c[0].i)

    let SAncients = sector._ancients
    let GAncients = sector.parent._ancients
    //lifeform and people 
    let form = this.form = RNG.weighted(['people', 'alien'],[3,1])
    let people = {}
    if (form == 'alien') {
      if (hi == 1) {
        people = RNG.weighted(SAncients, [3, 1])
      } else {
        people = RNG.bool() ? RNG.pickone(SAncients) : RNG.pickone(GAncients)
      }
    } else {
      people = RandomPeople(RNG)
      people.ancient = RNG.weighted(SAncients, [2, 1])
    }
    this._people = people

    let ALIGNMENTS = ['Evil', 'Chaotic', 'Neutral', 'Lawful', 'Good']
    this.aligment = form == "alien" ? RNG.weighted(ALIGNMENTS, [6, 2, 2, 2, 0]) : RNG.weighted(ALIGNMENTS, [1, 2, 6, 2, 1])

    this.economy = RNG.weighted(ECONOMY, [1, 2, 6, 2, 1])
    this.military = RNG.weighted(MILITARY, [1, 2, 6, 2, 1])
    this.populace = RNG.weighted(POPULACE, [1, 2, 6, 2, 1])

    this.values = BuildArray(2,()=>{
      let val = RNG.pickone(VALUES[this.aligment].split(","))
      return VALUES[val] ? VALUES[val].split(",")[RNG.d10()-1] : val 
    })

    this.designator = [this.aligment.charAt(0), ECONOMY.indexOf(this.economy), MILITARY.indexOf(this.military), POPULACE.indexOf(this.populace)]
    form == 'alien' ? this.designator.unshift("☠") : null

    let tech = RNG.shuffle(["Standard","Organic","Arcane"])
    this.tech = tech.slice(0,RNG.pickone([1,2])).join("/")
    this.style = RNG.pickone(["Fluid","Rough","Blocky","Gothic",""])

    this.thralls = BuildArray(3,()=> RandomPeople(RNG))

    this.sector = sector
    sector.factions.push(this)
  }
  get name() {
    return this.claims[0].name
  }
  get about() {
    return [this.aligment, "$ " + this.economy, "⚔ " + this.military, "☺ " + this.populace]
  }
  get people() {
    return this.form == 'alien' ? (this._people.form ? this._people.form : this._people) + " [Ancient]" : this._people.text
  }
  get claims() {
    return this._claims.map(c=>this.sector.systems.find(s=>s.i == c))
  }
  mission () {
    let missions = ["Aid & Relief","Conspiracy","Deep Space Exploration","Defense","Diplomacy","Escort & Evacuation","Espionage","First Contact","Medical","Near Space Exploration","Patrol","Planetary Exploration","Political","Research & Development","Show the Flag","Spiritual","Justice","Tactical"]
    return chance.pickone(missions)
  }
}

export {Faction,RandomPeople}
