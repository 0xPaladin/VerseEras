import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {RandomPeople} from './people.js';
import {Elements,Magic} from './data.js';

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
    let RNG = new Chance([R.seed,'feature',i].join("."))
    let animal = RandomPeople(RNG,'animal')
    let purpose = RNG.weighted(['wild','sport','livestock','military','industrial','labor'],[3,1,1,1,1,1])
    
    let data = {
      i,
      'what' : 'creature',
      purpose,
      data : animal,
      text : `${animal.type} [${animal.size}, ${purpose}]`
    }
    return data 
  },
  'hazard'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed,'feature',i].join("."))

    let mp = RNG.pickone(RNG.pickone([...Elements,...Magic]).split("/"))
    let type = RNG.weighted([`magical [${mp}]`,'techtonic','chasm,crevasse,abyss,rift','bog,mire,tarpit,quicksand','defensive trap','blizzard,thunderstorm,sandstorm','fire,flood,avalanche','mist,fog,murk,gloom,miasma'],[1,1,2,2,1,3,1,1])
    type = RNG.pickone(type.split(","))
    
    let data = {
      i,
      'what' : 'hazard',
      type,
      text: `Hazard: ${type}`
    }
    return data 
  },
  'obstacle'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed,'feature',i].join("."))

    let mp = RNG.pickone(RNG.pickone([...Elements,...Magic]).split("/"))
    let type = RNG.weighted([`magical [${mp}]`,'defensive barrier','cliff,escarpment,crag,bluff','dense forest,bog,swamp','river,ravine,crevasse,chasm,abyss'],[1,2,3,3,3])
    type = RNG.pickone(type.split(","))
    
    let data = {
      i,
      'what' : 'obstacle',
      type,
      text: `Obstacle: ${type}`
    }
    return data 
  },
  'area'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed,'feature',i].join("."))

    let mp = RNG.pickone(RNG.pickone([...Elements,...Magic]).split("/"))
    let h = this.hazard(R)
    let o = this.obstacle(R)
    let type = RNG.weighted([`magical [${mp}]`,h.type,o.type,'territory','icefield,rocky land,dense forest,bog,swamp'],[1,2,2,3,4])
    type = RNG.pickone(type.split(","))
    
    let data = {
      i,
      'what' : 'area',
      type,
      text : `Area: ${type}`
    }
    return data 
  },
  'ruin'(RNG) {
    
  },
  'site'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed,'feature',i].join("."))
    let type = RNG.weighted(['ruin','dwelling','outpost','landmark','resource'],[3,2,1,1,2])
    let data = {
      i,
      'what' : 'site',
      type,
      text : `${type.capitalize()}`
    }

    if(type == 'ruin'){
      data[type] = RNG.pickone(['Caverns','Ruined Settlement','Prison','Mine','Tomb','Hideout','Stronghold','Temple','Archive','Laboratory','Gate'])
      data.text += ` [${data[type]}]`
    }
    else if(type == 'dwelling'){
      data[type] = RNG.pickone(FACTIONTYPES)
      data.who = ""
      data.text += ` [${data[type]}]`
    }
    else if(type == 'outpost'){
      data[type] = RNG.pickone(RNG.pickone(['tollhouse/checkpoint','trading house','inn','tower/fort/base']).split("/"))
      data.text += ` [${data[type]}]`
    }
    else if(type == 'landmark'){
      data[type] = RNG.weighted(['Plant/Tree','Rock/Earth','Water','faction','Statue'],[3,3,2,1,2])
      data.text += ` [${data[type]}]`
    }
    else if(type == 'resource'){
      data[type] = RNG.weighted(['rare earth elements','quantum materials','hyper materials'],[3,3,1])
      data.text += ` [${data[type]}]`
    }
    
    return data 
  },
  'factionOutpost'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed,'feature',i].join("."))
    let data = {
      i,
      'what' : 'factionOutpost',
      text: `Faction Outpost`
    }
    return data 
  },
  'settlement'(R) {
    let i = R.features.length
    let RNG = new Chance([R.seed,'feature',i].join("."))
    let data = {
      i,
      'what' : 'settlement',
      text: `Settlement`
    }
    return data 
  },
}

/*
  Sector Class 
*/

const SIZE = 5000  // sector size in LY 

class MajorSector {
  constructor(app, G={}, id=[3,6]) {
    this.app = app
    this.galaxy = G

    this._seed = G.seed || chance.natural()
    this.id = id

    this.seed = [G.seed,'MajorSector',id.join()].join(".")

    //establish random gen 
    let RNG = new Chance(this.seed)

    let alignment = this.alignment = "neutral"
    let alMod = 0 
    let sR = RNG.d12() + alMod 
    let safety = this.safety = sR <= 1 ? ["safe",3] : sR <= 3 ? ["unsafe",2] : sR <= 9 ? ["dangerous",1] : ["perilous",0]

    //function to create a random point in the sector
    const PointInSector = () => [...BuildArray(2,()=>RandBetween(1,5000,RNG)),RandBetween(1,1000,RNG)]
    
    //features 
    let nF = SumDice('4d4+9', RNG)
    let fbc = this._features ={
      'Creatures' : [],
      'Areas' : [],
      'Sites' : []
    }
    let _feature = (r)=>r <= 1 ? 'creature' : r == 2 ? 'hazard' : r == 3 ? 'obstacle' : r == 4 ? 'area' : r <= 11 ? 'site' : r <= 12 ? 'factionOutpost' : 'settlement'
    BuildArray(nF, ()=> {
      //first is creature 
      let f = this.features.length == 0 ? _feature(1) : _feature(RNG.d12() + safety[1])
      //get point and data  struct 
      let data = {
        p : PointInSector(),
        color : "red",
        what : f 
      }
      
      let what = f=='creature' ? fbc.Creatures : ['hazard','obstacle','area'].includes(f) ? fbc.Areas : fbc.Sites
      what.push(Object.assign(data,FEATURES[f](this))) 
    })

    console.log(this)
  }
  get features () {
    return Object.values(this._features).flat()
  }
  get wormhole () {
    return null
  }
  get withinClaim() {
    let F = this.galaxy.wandererClaims
    //top left position 
    let [sx,sy] = this.id.map(p => p*SIZE)
    let check = BuildArray(3,(_,i)=>BuildArray(3,(_,j)=> [sx+SIZE*i/2,sy+SIZE*j/2])).flat()
    return check.map(([px,py])=> {
      let _f = F.filter(f => {
        let {x,y} = f.position
        let dx = px-x, dy = py-y;
        return Math.sqrt(dx**2+dy**2) <= f.radius
      })
      return {
        px,py,f:_f
      }
    })
  }
  async display() {
    let app = this.app
    await app.setState({selection:''})
    
    let svg = SVG().addTo('.container').size('800', '800')
    svg.css('background-color','black')
    
    let isometric = app.state.isometric == 'Isometric'

    let n = 5 
    let grid = SIZE/n 
    let _z = 500
    //create the grid 
    let gridmap = svg.group().attr('id', 'gridmap')
    BuildArray(n,(_,i)=>BuildArray(n,(_,j)=>{
      let xyz = [[i * grid, j * grid, _z], [i * grid + grid, j * grid, _z], [i * grid + grid, j * grid + grid, _z], [i * grid, j * grid + grid, _z]].map(_xyz=>{
          let {x, y} = isometric ? toIsometric(..._xyz) : {
            x: _xyz[0],
            y: _xyz[1]
          }
          return [x, y].join(",")
        }
        ).join(" ")
        gridmap.add(svg.polygon(xyz).addClass('grid'))
    }))

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

    //size 
    let {x, y, height, width} = gridmap.bbox()
    //viewbox
    svg.attr('viewBox', [x, y, width, height].join(" "))
  }
}

export {MajorSector}
