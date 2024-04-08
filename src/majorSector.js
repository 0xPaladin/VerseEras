import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {random_name, isBadWord} from './random_name.js';

import {System} from './starSystem.js';

import {RandomPeople} from './people.js';

import {Elements, Magic} from './data.js';

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
  Feature generation 
*/
const FACTIONTYPES = ['common', 'criminal', 'revolutionary', 'military', 'religious', 'craft', 'trade', 'industrial', 'academic', 'arcane']

const FEATURES = {
  'creature'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))
    let animal = RandomPeople(RNG, 'animal')
    let purpose = RNG.weighted(['wild', 'sport', 'livestock', 'military', 'industrial', 'labor'], [3, 1, 1, 1, 1, 1])

    let data = {
      i,
      'what': 'creature',
      purpose,
      data: animal,
      text: `${animal.type} [${animal.size}, ${purpose}]`
    }
    return data
  },
  'hazard'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))

    let mp = RNG.pickone(RNG.pickone([...Elements, ...Magic]).split("/"))
    let type = RNG.weighted([`magical [${mp}]`, 'techtonic', 'chasm,crevasse,abyss,rift', 'bog,mire,tarpit,quicksand', 'defensive trap', 'blizzard,thunderstorm,sandstorm', 'fire,flood,avalanche', 'mist,fog,murk,gloom,miasma'], [1, 1, 2, 2, 1, 3, 1, 1])
    type = RNG.pickone(type.split(","))

    let data = {
      i,
      'what': 'hazard',
      type,
      text: `Hazard: ${type}`
    }
    return data
  },
  'obstacle'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))

    let mp = RNG.pickone(RNG.pickone([...Elements, ...Magic]).split("/"))
    let type = RNG.weighted([`magical [${mp}]`, 'defensive barrier', 'cliff,escarpment,crag,bluff', 'dense forest,bog,swamp', 'river,ravine,crevasse,chasm,abyss'], [1, 2, 3, 3, 3])
    type = RNG.pickone(type.split(","))

    let data = {
      i,
      'what': 'obstacle',
      type,
      text: `Obstacle: ${type}`
    }
    return data
  },
  'area'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))

    let mp = RNG.pickone(RNG.pickone([...Elements, ...Magic]).split("/"))
    let h = this.hazard(R)
    let o = this.obstacle(R)
    let type = RNG.weighted([`magical [${mp}]`, h.type, o.type, 'territory', 'icefield,rocky land,dense forest,bog,swamp'], [1, 2, 2, 3, 4])
    type = RNG.pickone(type.split(","))

    let data = {
      i,
      'what': 'area',
      type,
      text: `Area: ${type}`
    }
    return data
  },
  'ruin'(RNG) {
  },
  'site'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))
    let type = RNG.weighted(['ruin', 'dwelling', 'outpost', 'landmark', 'resource'], [3, 2, 1, 1, 2])
    let data = {
      i,
      'what': 'site',
      type,
      text: `${type.capitalize()}`
    }

    if (type == 'ruin') {
      data[type] = RNG.pickone(['Caverns', 'Ruined Settlement', 'Prison', 'Mine', 'Tomb', 'Hideout', 'Stronghold', 'Temple', 'Archive', 'Laboratory', 'Gate'])
      data.text += ` [${data[type]}]`
    } else if (type == 'dwelling') {
      data[type] = RNG.pickone(FACTIONTYPES)
      data.who = ""
      data.text += ` [${data[type]}]`
    } else if (type == 'outpost') {
      data[type] = RNG.pickone(RNG.pickone(['tollhouse/checkpoint', 'trading house', 'inn', 'tower/fort/base']).split("/"))
      data.text += ` [${data[type]}]`
    } else if (type == 'landmark') {
      data[type] = RNG.weighted(['Plant/Tree', 'Rock/Earth', 'Water', 'faction', 'Statue'], [3, 3, 2, 1, 2])
      data.text += ` [${data[type]}]`
    } else if (type == 'resource') {
      data[type] = RNG.weighted(['rare earth elements', 'quantum materials', 'hyper materials'], [3, 3, 1])
      data.text += ` [${data[type]}]`
    }

    return data
  },
  'factionOutpost'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))
    let data = {
      i,
      'what': 'factionOutpost',
      text: `Faction Outpost`
    }
    return data
  },
  'settlement'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed, 'feature', i].join("."))
    let data = {
      i,
      'what': 'settlement',
      text: `Settlement`
    }
    return data
  },
}

/*
  Sector Class 
*/

const MAJORSECTOR = 5000
// sector size in LY 

class MajorSector {
  constructor(app, G={}, id=[3, 6]) {
    this.app = app
    this.galaxy = G

    this._seed = G.seed || chance.natural()
    this.id = id

    this.seed = [G.seed, 'MajorSector', id.join()].join(".")

    //establish random gen 
    let RNG = new Chance(this.seed)

    let alignment = this.alignment = "neutral"
    let alMod = 0
    let sR = RNG.d12() + alMod
    let safety = this.safety = sR <= 1 ? ["safe", 3] : sR <= 3 ? ["unsafe", 2] : sR <= 9 ? ["dangerous", 1] : ["perilous", 0]

    //function to create a random point in the sector
    const PointInSector = ()=>[...BuildArray(2, (_,i)=>id[i] * MAJORSECTOR + RandBetween(1, 5000, RNG)), RandBetween(1, 1000, RNG)]

    //features 
    let nF = SumDice('4d4+9', RNG)
    let fbc = this._features = {
      'Creatures': [],
      'Areas': [],
      'Sites': []
    }
    let _feature = (r)=>r <= 1 ? 'creature' : r == 2 ? 'hazard' : r == 3 ? 'obstacle' : r == 4 ? 'area' : r <= 11 ? 'site' : r <= 12 ? 'factionOutpost' : 'settlement'
    BuildArray(nF, ()=>{
      //first is creature 
      let f = this.features.length == 0 ? _feature(1) : _feature(RNG.d12() + safety[1])
      //get point and data  struct 
      let data = {
        p: PointInSector(),
        color: "red",
        what: f
      }

      let what = f == 'creature' ? fbc.Creatures : ['hazard', 'obstacle', 'area'].includes(f) ? fbc.Areas : fbc.Sites
      what.push(Object.assign(data, FEATURES[f](this)))
    }
    )

    //make a name and reject badwords
    this._names = []
    let makeName = ()=>{
      var number_of_syllables = Math.floor(RNG.random() * 2 + 2), new_name;
      //generate a unique name without badwords
      while (true) {
        new_name = random_name(RNG, number_of_syllables);
        if (this._names.indexOf(new_name) >= 0 || isBadWord(new_name)) {} else {
          break;
        }
      }
      this._names.push(new_name)
    }

    //systems 
    this._loc = []
    this.systems = []
    //number of systems 
    let ns = 333
    for (let i = 0; i < ns; i++) {
      this._loc.push([...id.map((p)=>p*MAJORSECTOR+RandBetween(1,5000,RNG)),RandBetween(1,1000,RNG)])
      makeName()
      this.systems.push(new System(this,i))
    }

    console.log(BuildArray(5,(_,i)=>new System(this,500+i,'G')))

    console.log(this)
  }
  get xy () {
    return this.id.map(p=>p * MAJORSECTOR)
  }
  //get habitable systems
  get habitable () {
    let hi = [1,2,3,4]
    return hi.map(i => this.systems.filter(s=> s._habitability == i))
  }
  get features() {
    return Object.values(this._features).flat()
  }
  get wormhole() {
    return null
  }
  get withinClaim() {
    let F = this.galaxy.era.factions
    //top left position 
    let[sx,sy] = this.id.map(p=>p * MAJORSECTOR)
    let check = BuildArray(3, (_,i)=>BuildArray(3, (_,j)=>[sx + MAJORSECTOR * i / 2, sy + MAJORSECTOR * j / 2])).flat()
    return check.map(([px,py])=>{
      let _f = F.filter(f=>{
        let [x,y] = f.p
        let dx = px-x
          , dy = py-y;
          return Math.sqrt(dx*dx + dy*dy) < f.radius
      }
      )
      return {
        px,
        py,
        f: _f
      }
    }
    )
  }
  async display() {
    let app = this.app
    await app.setState({
      selection: ''
    })

    let svg = SVG('svg')
    //set background color 
    svg.css('background-color', 'black')

    let isometric = app.state.isometric == 'Isometric'

    let[sx,sy] = [...this.id.map(p=>p * MAJORSECTOR)]
    let n = 5
    let grid = MAJORSECTOR / n
    let _z = 500
    //create the grid 
    let gridmap = svg.group().attr('id', 'gridmap')
    BuildArray(n, (_,i)=>BuildArray(n, (_,j)=>{
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
    let POI = svg.group().attr('id', 'POI')
    this.features.forEach((f)=>{
      let {x, y} = isometric ? toIsometric(...f.p) : {
        x: f.p[0],
        y: f.p[1]
      }

      let poi = svg.circle(30).attr({
        cx: x,
        cy: y
      }).fill(f.color).addClass('poi').data({
        f
      }).click(async function() {
        let _f = this.data("f")

        console.log(_f)
      })

      POI.add(poi)
    }
    )

    //create the stars 
    let stars = svg.group().attr('id', 'stars')
    this.systems.forEach((s)=>{
      let sector = this
      let _p = s.point
      let {x, y} = isometric ? toIsometric(..._p) : {
        x: _p[0],
        y: _p[1]
      }

      let _star = svg.circle(s._r * 5).attr({
        cx: x,
        cy: y
      }).fill(s._color).addClass('star').data({
        id : s.id
      }).click(async function() {
        let id = this.data("id")

        console.log(sector.systems[id])
        //app.dialog = "System." + _i
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
}

export {MajorSector}
