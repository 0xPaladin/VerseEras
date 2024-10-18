import*as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

import {GnerateConduits} from "./conduits-three.js"

const RNG = new Chance("VerseGalaxy")
const canvas = document.querySelector("canvas.webgl");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export const scene = new THREE.Scene();

const GR = 100000 / 2;
const parameters = {
  size: 0.01,
  count: 100000,
  branches: 2,
  spinFactor: 0.5,
  radius: 6,
  armRadius: 0.1,
  twist: 0.3,
  spin: 1,
  randomness: 0.45,
  randomnessPower: 2.5,
  insideColor: 0xff6030,
  outsideColor: 0x391eb9,
};

const sectorScale = 1.20;
export let sectors = {};
let MS = [];

export let points;
let pointGeometry;
let pointMaterial;

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean=0, stdev=1) {
  const u = 1 - RNG.random();
  // Converting [0,1) to (0,1]
  const v = RNG.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

function getPoint(r) {
  const randomX = Math.pow(RNG.random(), parameters.randomnessPower) * (RNG.random() < 0.5 ? 1 : -1) * r * parameters.randomness;
  const randomY = (r / 50) * Math.pow(RNG.random(), parameters.randomnessPower) * (RNG.random() < 0.5 ? 1 : -1) * parameters.randomness;
  const randomZ = Math.pow(RNG.random(), parameters.randomnessPower) * (RNG.random() < 0.5 ? 1 : -1) * r * parameters.randomness;

  return [randomX, randomY, randomZ];
}

function generateGalaxy() {
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  if (points) {
    scene.remove(points);
    pointGeometry.dispose();
    pointMaterial.dispose();
  }

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // const radius = Math.random() * parameters.radius;
    let _r = parameters.radius;
    const radius = Math.pow(Math.random(), parameters.randomnessPower) * parameters.radius;
    //const radius = Math.abs((_r * gaussianRandom()) / 2);

    //get point function
    let corei = parameters.count / 10;
    if (i < 2 * corei) {
      positions[i3] = (_r * gaussianRandom()) / 20;
      positions[i3 + 1] = (_r * gaussianRandom()) / 40;
      positions[i3 + 2] = (_r * gaussianRandom()) / 20;
    } else if (i < 3 * corei) {
      positions[i3] = (_r * gaussianRandom()) / 4;
      positions[i3 + 1] = (_r * gaussianRandom()) / 50;
      positions[i3 + 2] = (_r * gaussianRandom()) / 4;
    } else {
      const [randomX,randomY,randomZ] = getPoint(radius);

      const branchAngle = ((i % parameters.branches) / parameters.branches) * (Math.PI * 2);
      const spin = radius + parameters.spin;

      positions[i3] = Math.cos(branchAngle + spin) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spin) * radius + randomZ;
    }
    //sectors are 1000x1000
    let sid = [Math.floor((positions[i3] * GR) / (sectorScale * _r * 1000)), Math.floor((positions[i3 + 2] * GR) / (sectorScale * _r * 1000)), ]
    sectors[sid.join()] ? sectors[sid.join()].push(i3) : (sectors[sid.join()] = [i3]);
    //major sectors are 10000 x 10000 
    let msid = sid.map(p => Math.floor(p / 10)).join()
    MS.includes(msid) ? null : MS.push(msid)

    const currentColor = colorInside.clone();
    currentColor.lerp(colorOutside, radius / parameters.radius);

    colors[i3] = currentColor.r;
    colors[i3 + 1] = currentColor.g;
    colors[i3 + 2] = currentColor.b;
  }

  pointGeometry = new THREE.BufferGeometry();
  pointMaterial = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions,3));
  pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors,3));

  points = new THREE.Points(pointGeometry,pointMaterial);

  scene.add(points);
}
generateGalaxy();

console.log(Object.keys(sectors).length, MS, sectors);

/*
  const Factions = ["None", "Free League", "Dominion", "Architects", "Red Dawn"]
*/
export const FactionThree = {
  "Free League": ["lightBlue", ["-2,1", "-1,1", "-1,2", "0,1", "0,2", "0,3", "0,4", "1,1", "1,2", "2,-1", "2,0", "2,1", "2,2", "2,3", "3,2"], []],
  "Dominion": ["orange", ["-2,0", "-3,0", "-1,-1", "-2,-1", "-1,-2", "-2,-2", "-2,-3", "-3,-3", "-3,-4"], []],
  "Architects": ["yellow", ["-1,3", "-2,2", "-2,3", "-2,4", "-3,1", "-3,2", "-3,3", "-4,0", "-4,1", "-4,2"], []],
  "Red Dawn": ["red", ["-1,-3", "0,-3", "0,-4", "1,-3", "1,-4", "2,-2", "2,-3", "3,-1", "3,-2", "3,-3"], []]
}
let Claimed = Object.values(FactionThree).map(F => F[1]).flat()
FactionThree.Outlands = ["gray", MS.reduce( (s, sid) => {
  Claimed.includes(sid) ? null : s.push(sid)
  return s
}
, []), []]

/*
	Sector Cubes
*/
let M = (parameters.radius * sectorScale) / 5;
const geometry = new THREE.BoxGeometry(M,M / 5,M);
//factions 
for (let f in FactionThree) {
  let[color,sids,cubes] = FactionThree[f]
  let mtl = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
  });

  sids.forEach(id => {
    let[_z,_x] = id.split(",").map(Number);
    let cube = new THREE.Mesh(geometry,mtl);
    cubes.push(cube)
    cube.translateX(_x * M);
    cube.translateX(-M / 20);
    cube.translateZ(_z * M);
    cube.visible = false;
    scene.add(cube);
  }
  )
}

/*
  Conduits
*/
GnerateConduits((parameters.radius * sectorScale) * 1000 / GR);

/*
	Camera
*/

const camera = new THREE.PerspectiveCamera(75,sizes.width / sizes.height,0.1,100);
camera.position.set(0, 3, 4);
scene.add(camera);

export const RotateView = (deg) => {
  let _r = 4
  let rad = deg * Math.PI / 180
  let x = _r * Math.cos(rad)
  let y = _r * Math.sin(rad)

  camera.position.set(x, 3, y);
}

const controls = new OrbitControls(camera,canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const time = new THREE.Clock();

const tick = () => {
  const elapsedTime = time.getElapsedTime();

  controls.update();

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
}
;
tick();

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
);
