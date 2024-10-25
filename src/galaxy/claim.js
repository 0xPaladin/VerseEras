import {Faction, Ancients} from '../factions.js';

/*
	Colors  for factions 
*/
const COLORS = ["maroon", "salmon", "pink", "tan", "olive", "goldenrod", "lime", "green", "teal", "aquamarine", "navy", "steelblue", "fuchsia", "purple"]

/*
  Eras 
*/
//const ERAS = ["PreHistory", "Heralds", "Frontier", "Firewall", "ExFrame", "Cosmic"]

const ERAFACTIONS = {
  Heralds: {
    t: ['Crysik.1-6.1-3', 'Cthulhi.1-6.1-3', 'Deep Dwellers.1-6.1-3', 'Dholes.1-6.1-3', 'Elder Things.1-6.1-3', 'Hydra.1-6.1-3', 'Mi-go.1-6.1-3', 'Morkoth.1-6.1-3', 'Neh-thalggu.1-6.1-3', 'Rhukothi.1-6.1-3', 'Shk-mar.1-6.1-3', 'Space Polyps.1-6.1-3', 'Worms.1-6.1-3', 'Yellow Court.1-6.1-3', 'Yith.1-6.1-3'],
    n: ['Ikarya.2-3.1-2', 'Xsur.3-4.1-3', 'Shoggoth.2.1-3', 'The Free.3-5.1'],
    a: ['Solars.2.1-2', 'The Free.3-5.1']
  },
  Frontier: {
    t: ['Crysik.1-2.1-2', 'Cthulhi.1-2.1-3', 'Deep Dwellers.1-2.1-3', 'Dholes.1-2.1-2', 'Elder Things.1-2.1-3', 'Hydra.1-2.1-2', 'Mi-go.1-2.1-2', 'Morkoth.1-2.1-2', 'Neh-thalggu.1-2.1-2', 'Rhukothi.1-2.1-2', 'Shk-mar.1-2.1-2', 'Space Polyps.1-2.1-2', 'Worms.1-2.1-2', 'Yellow Court.1-2.1-2', 'Yith.1-2.1-2'],
    n: ['Gemeli.2-3.1-3', 'Crysik.1-2.1-2', 'Ikarya.2-3.1-2', 'Shoggoth.2.1-3', 'People.20.1-3', 'People.1.4'],
    a: ['People.20.1-3', 'People.1.4']
  },
  Firewall: {
    t: ['Barren.10-20.1', 'Lyns.10-20.1', 'Reapers.10-20.1'],
    n: ['Gemeli.3-6.1-3', 'Ikarya.2-3.1-2', 'People.8.2-4'],
    a: ['People.8.2-4']
  },
  ExFrame: {
    t: ['Barren.3-8.1-3', 'Lyns.3-8.1-3', 'Reapers.3-8.1-3', 'Deep Dwellers.2-4.1-2', 'Hegemony.1-3.1-2', 'Worms.2-4.1-2'],
    n: ['Gemeli.2-3.1-2', 'Ikarya.2-4.1-2', 'Alari.4-8.1-2', 'Independents.8-16.1'],
    a: ['Free Union.10-15.1']
  },
  Wanderer: {
    t: ['Barren.1-3.1-2', 'Lyns.1-3.1-2', 'Reapers.1-3.1-2', 'Deep Dwellers.1-3.1-2', 'Worms.1.1-2', 'Hegemony.1-3.1-2', 'Dominion.1.4', 'Tyrants.2-4.1-2', 'Hordes.2-4.1-2', 'Myr.2-4.1-3', 'Shadowsteel Syndicate.1.1-3', 'Rukhothi.1.1-2', 'The Circle.1.1-3', 'Clan Virin.1.1-2'],
    n: ['Gemeli.1-3.1-2', 'Ikarya.1-3.1-2', 'Cultivators.2.2-4', 'Myr.1-3.1-2', 'Red Dawn.1.4'],
    a: ['Archons.1-2,1-3', 'Forge Worlds.2-4.1-3', "Guardians.1.2", 'Houses of the Sun.1-3.1-3', 'Protectorate.1-3.2-3', 'Free Union.3.3']
  }
}

/*
  Sector IDS
*/
let AllSectorIDs = []
const NEIGHBOR = [[0, 1], [1, 0], [0, -1], [-1, 0]]

const RandomWalk = (RNG, n, free, start=null) => {
  let res = []
    , j = 0;

  const PushSplice = (id) => {
    res.push(id)
    free.splice(free.indexOf(id), 1)
  }

  //establish start 
  start == null ? PushSplice(RNG.pickone(free)) : res = [start]

  //loop to fill res 
  while (res.length < n && j < 10) {
    //random walk to neighboor 
    let pick = RNG.pickone(res).split(",").map(Number)
    let next = RNG.pickone(NEIGHBOR).map( (v, i) => pick[i] + v)
    next[RNG.pickone([0, 1])] += j * (RNG.pickone([-1, 1]))
    next = next.join()

    //if in free, push and splice 
    if (free.includes(next)) {
      PushSplice(next)
      j = 0
    } else {
      j++
    }
  }

  return res
}

/*
  Era Factions Functions 
*/

const addFaction = (G, era, people, threat, tier, color) => {
  let id = G._factions.length
  let seed = [G.seed, 'Faction', id].join(".")

  return new Faction(G,{
    id,
    seed,
    era,
    people,
    threat,
    tier,
    color
  })
}

//47 proto-ancients, 1d3 sectors 
const PreHistory = (G) => {
  let RNG = new Chance(G.seed + ".PreHistory")
  //free sectors 
  let free = AllSectorIDs.slice()

  //47 proto-ancients, 1d3 sectors 
  _.fromN(47, i => {
    let F = addFaction(G, "PreHistory", "Proto-Ancient", RNG.weighted(["t", "n", "a"], [2, 4, 1]), 0, RNG.pickone(COLORS))
    F.claims = RandomWalk(RNG, RNG.d3(), free)
    G._factions.push(F)
  }
  )
}

//elaborate progress per faction 
const Cosmic = (G) => {
  let RNG = new Chance(G.seed + ".Cosmic")
  //free sectors 
  let free = AllSectorIDs.slice()

  //Red Dawn
  let RD = addFaction(G, "Cosmic", "Red Dawn", "n", 5, "red")
  RD.claims = RandomWalk(RNG, 104, free, "20,55")
  G._factions.push(RD)

  //Dominion 
  let Dominion = addFaction(G, "Cosmic", "Dominion", "t", 5, "orange")
  Dominion.alignment = "Lawful"
  Dominion.claims = RandomWalk(RNG, 91, free, "30,35")
  G._factions.push(Dominion)

  //Free League, clumps centered around forgeworlds 
  let FL = addFaction(G, "Cosmic", "Free League", "a", 4, "aqua")
  FL.claims = [..._.fromN(7, i => RandomWalk(RNG, 16 + RNG.sumDice("2d4"), free)).flat(), ...RandomWalk(RNG, 16 + RNG.sumDice("2d4"), free, "25,45")]
  G._factions.push(FL)

  //Architects
  let Architects = addFaction(G, "Cosmic", "Architects", "n", 4, "yellow")
  Architects.alignment = "Neutral"
  Architects.claims = _.fromN(2, i => RandomWalk(RNG, 46 + RNG.sumDice("2d6"), free)).flat()
  G._factions.push(Architects)

  //Deep-Dwellers
  _.fromN(2, i => {
    let F = addFaction(G, "Cosmic", "Deep-Dwellers", "t", 2, "blue")
    F.claims = RandomWalk(RNG, 1 + RNG.d3(), free)
    G._factions.push(F)
  }
  )

  //Hegemony
  _.fromN(3, i => {
    let F = addFaction(G, "Cosmic", "Hegemony", "t", RNG.d3(), "purple")
    F.claims = RandomWalk(RNG, 2 + RNG.d3(), free)
    G._factions.push(F)
  }
  )

  //Hordes
  _.fromN(6, i => {
    let F = addFaction(G, "Cosmic", "Hordes", "t", RNG.d3() - 1, "Magenta")
    F.claims = RandomWalk(RNG, 1, free)
    G._factions.push(F)
  }
  )

  //Lynn
  _.fromN(3, i => {
    let F = addFaction(G, "Cosmic", "Lyn", "t", RNG.d3(), "Chartreuse")
    F.claims = RandomWalk(RNG, 1, free)
    G._factions.push(F)
  }
  )

  //Reapers
  _.fromN(2, i => {
    let F = addFaction(G, "Cosmic", "Reapers", "t", RNG.d3(), "Tomato")
    F.claims = RandomWalk(RNG, RNG.pickone([1, 2]), free)
    G._factions.push(F)
  }
  )

  //Sect
  _.fromN(2, i => {
    let F = addFaction(G, "Cosmic", "Sect", "t", RNG.d3(), "LightCoral")
    F.claims = RandomWalk(RNG, 1, free)
    G._factions.push(F)
  }
  )

  //Worms
  let W = addFaction(G, "Cosmic", "Worms", "t", 2, "Peru")
  W.claims = RandomWalk(RNG, 2, free)
  G._factions.push(W)
}

//summary 
const ERAS = {
  PreHistory,
  Cosmic
}

export const MakeClaims = (G) => {
  console.time('Galaxy Factions')

  //load sector ids 
  let _R = G._R / 1000
  _.fromN(2 * _R, (i) => _.fromN(2 * _R, (j) => {
    let dx = _R - i
      , dy = _R - j
      , d = dx * dx + dy * dy;
    if (d <= _R * _R * 0.95) {
      AllSectorIDs.push([i, j].join())
    }
  }
  ))

  //now run per era 
  const LoadEras = ["PreHistory", "Cosmic"]
  LoadEras.forEach(e => ERAS[e](G))

  //now initialize
  //G._factions.forEach(f => f.initialize(RNG))

  console.timeEnd('Galaxy Factions')
}
