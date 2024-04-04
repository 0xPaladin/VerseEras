import {RandBetween, SumDice, BuildArray} from './random.js'
import*as Data from './data.js';

const Ancients = ['Crysik', 'Cthulhi', 'Deep Dwellers', 'Dholes', 'Echani', 'Hydra', 'Mi-go', 'Morkoth', 'Neh-thalggu', 'Rhukothi', 'Shk-mar', 'Shoggoth', 'Space Polyps', 'Worms', 'Xsur', 'Yellow Court', 'Yith']

const CreateAncient = (RNG)=>{
  let form = RNG.shuffle(['air', 'earth', 'water', 'air', 'earth', 'water']).slice(0, 2).map(t=>RNG.pickone(RNG.pickone(Data.Animals[t]).split("/")).capitalize()).join("/");

  return {
    form,
    oddity: RNG.pickone(Data.Oddities),
    element: RNG.pickone(Data.Elements),
    magic: RNG.pickone(Data.Magic)
  }
}

export {Ancients, CreateAncient}
