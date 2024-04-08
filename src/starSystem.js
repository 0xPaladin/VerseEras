import {RandBetween, SumDice, Likely, BuildArray} from './random.js'

import {starTypeData, gravity, blackbody, planetTypeData} from './astrophysics.js';


/*
  Planets 
*/

class Planet {
  constructor(seed, i, orbitalRadius, insolation) {
    this.seed = seed
    this.i = i
    //romanNumeral(i + 1)
    this._orbitalRadius = orbitalRadius;
    // AU
    this._insolation = insolation;
    // Earth incident radiation from Sol == 1

    let RNG = new Chance(seed)
    RNG.range = (min,max)=>min + RNG.random() * (max - min)

    //planet template 
    let template = this.template = RNG.weighted(planetTypeData, [insolation * 100, 10, 1]);

    //calculations 
    this.classification = template.classification;
    this.radius = RNG.range(template.radius[0], template.radius[1]);
    this.density = RNG.range(template.density[0], template.density[1]);
    this.hydrographics = template.hydrographics(RNG, insolation, this.radius, this.density);
    this.atmosphere = template.atmosphere(RNG, insolation, this.radius, this.density, this.hydrographics);

    Object.assign(this, this.template.HI(this._insolation, this.radius, this.density, this.hydrographics, this.atmosphere))

    return this;
  }
  get gravity() {
    return gravity(this.radius, this.density)
  }

  detail() {
    detail.orbitalRadius = this.orbitalRadius.toFixed(2);
    detail.insolation = this.insolation.toFixed(2);
    detail.blackbodyK = blackbody(this.insolation);
  }
}

//generating a system based upon a seed 
class System {
  constructor(parent, i, sC = null) {
    this.parent = parent
    this.seed = [parent.seed,'System',i].join(".")
    this.id = i
    this.claim = -1

    let RNG = new Chance(this.seed)

    //star detail 
    let star = {}
      , spectralClass = sC ? sC : RNG.weighted(["O", "B", "A", "F", "G", "K", "M"], [0.0001, 0.2, 1, 3, 8, 12, 20])
      , spectralIndex = RandBetween(0, 9, RNG)
      , stellarTemplate = starTypeData[spectralClass];

    star.spectralType = spectralClass + spectralIndex;
    star.luminosity = stellarTemplate.luminosity * (4 / (spectralIndex + 2));
    star.template = stellarTemplate;
    this.star = star

    //radius 
    var s = Math.log(star.luminosity) + 8;
    s = Math.max(Math.min(s, 20), 2);
    this._r = s;

    //color 
    this._color = star.template.color

    let range = (min,max)=>min + RNG.random() * (max - min)

    //planets 
    let numberOfPlanets = RandBetween(...stellarTemplate.planets, RNG)
      , radius_min = 0.4 * range(0.5, 2)
      , radius_max = 50 * range(0.5, 2)
      , total_weight = (Math.pow(numberOfPlanets, 2) + numberOfPlanets) * 0.5
      , pr = radius_min
      , _planets = [];

    for (var i = 0; i < numberOfPlanets; i++) {
      pr += i / total_weight * range(0.5, 1) * (radius_max - radius_min);
      _planets.push(new Planet([this.seed, i].join("."),i,pr,star.luminosity / Math.pow(pr, 2)))
    }
    this._planets = _planets;

    let list = _planets.map(p=>p.HI).sort();
    this._habitability = list.length ? list.shift() : 5;
  }
  get point() {
    return this.parent._loc[this.id]
  }
  distance(s) {
    let pi = this.point
    let pj = s.point

    let d2 = pj.map((p,i)=>(p - pi[i]) * (p - pi[i])).reduce((s,v)=>s + v, 0)
    return Math.sqrt(d2)
  }
  get faction() {
    return this.claim > -1 ? this.parent.factions.find(f=>f.id == this.claim) : null
  }
  get nearestFactionSystem() {
    return this.parent.systems.filter(s=>s.claim > -1).map(s=>[s, this.distance(s)]).sort((a,b)=>a[1] - b[1])[0][0]
  }
  get POI() {
    return this._POI ? this[this._POI] : this._POI
  }
  get name() {
    return this.parent._names[this.id]
  }
  get UIColor() {
    return ["green", "blue", "yellow", "red", "black"][this._habitability - 1]
  }
  randomEvent() {
  }
}

export {System}
