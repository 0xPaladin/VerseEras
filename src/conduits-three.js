import*as THREE from "three";
import {scene} from "./galaxy-three.js";

const RNG = new Chance("VerseGalaxy")

const CONDUITS = {
  "A": [[-30, -5], [-10, -30], [0, -20], [20, -28]],
  "B": [[-25, -25], [-15, 10], [-5, -5], [-5, 25], [6, 35]],
  //"B" : [[-25,-25],[-5,-5],[-15,10],[-5,25],[6,35]],
  "C": [[-20, 30], [0, 20], [5, 10], [15, 15], [25, 0], [35, -5]],
  "D": [[-10, -35], [15, 0], [5, 25]],
  "E": [[-30, -15], [-25, 5], [-15, -5], [5, 5]],
  "F": [[0, -10], [20, 0], [25, 20]],
  "G": [[15, -15], [25, -20], [35, 5]],
  "H": [[-5, -15], [10, -35]],
  "J": [[-35, 15], [-10, 35], [15, 25]],
  "K": [[-35, 5], [5, -5]],
}

const sectors = {}

const POINTS = {
  "A": [],
  "B": [],
  "C": [],
  "D": [],
  "E": [],
  "F": [],
  "G": [],
  "H": [],
  "J": [],
  "K": [],
}

/*
  Make ThreeJS line 
*/
const MakeLine = (c, pts, M) => {
  //create a blue LineBasicMaterial
  const material = new THREE.LineBasicMaterial({
    color: 0x0000ff
  });

  let geometry = new THREE.BufferGeometry().setFromPoints(pts);
  let line = new THREE.Line(geometry,material);
  scene.add(line);
}

/*
  conduit data for sector 
*/
const SetSector = (x, z, c, lv) => {
  //placement 
  const _xyz = _.fromN(3, i => RNG.randBetween(100, 900))
  //conduit data 
  let data = {
    c,
    lv,
    _xyz
  }
  //sector id 
  let id = [x, z].join()

  //push to sector 
  sectors[id] ? sectors[id].push(data) : sectors[id] = [data]

  //placement 
  return _xyz
}

//Base Line to sectors - create a line between points - get sector points 
const LineToSectors = ([x1,z1], [x2,z2]) => {
  if (x2 != x1) {
    let slope = (z2 - z1) / (x2 - x1);
    let intercept = z1 - slope * x1;

    return _.fromN(Math.abs(x2 - x1), i => {
      let _x = x1 + i
      let _z = slope * _x + intercept
      let _sz = Math.floor(_z)

      return [_x, _sz]
    }
    )
  } else {
    return _.fromN(Math.abs(z2 - z1), i => [x1, z1 + i])
  }
}

export const GnerateConduits = (M) => {
  for (let C in CONDUITS) {
    //swap x and z axis 
    let points = CONDUITS[C].map( (p, i) => {
      //define each sector that the conduit runs through 
      if (i > 0) {
        let _sectors = LineToSectors(CONDUITS[C][i - 1], p)
        POINTS[C] = POINTS[C].concat(_sectors)
      }
      //return ThreeJS point //
      return new THREE.Vector3(p[1] * M,500 * M / 1000,p[0] * M)
    }
    );
    //threads 
    POINTS[C] = POINTS[C].map(p => {
      //number of connecting threads 
      let nt = RNG.weighted([0, 1, 2], [2, 6, 2])
      let _xyz = SetSector(...p, C, nt > 0 ? 1 : 2)

      //create thread lines 
      let _threads = _.fromN(nt,i=> {
        //end of thread 
        let end = [RNG.randBetween(p[0] - 5, p[0] + 5), RNG.randBetween(p[1] - 5, p[1] + 5)]
        //map to sectors 
        let ts = LineToSectors(p,end)
        //set relays 
        ts.slice(1).forEach(tp => SetSector(...tp, C, 3))
        //push to main 
        return ts
      })
      
      return [...p,_threads]
    }
    )

    MakeLine(C, points, M)
  }

  console.log(POINTS)
}
