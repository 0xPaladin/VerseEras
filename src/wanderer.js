class WandererSector {
  constructor (G,id) {
    this.app = G.app
    this.galaxy = G
    this.id = id 

    this.seed = [G.seed,"WandererSector",id].join(".")
  }
}