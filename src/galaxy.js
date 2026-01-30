//https://andrewdcampbell.github.io/galaxy-sim/assets/cubemaps/BlueNebular_back.jpg

import { FillGalaxy, BBox, Display as ShowStars } from './starryHost.js';

// Faction colors for visualization
const FactionColors = {
  // Ancient factions
  'Xothian': '#8B0000',        // Dark red
  'Gray Syndicate': '#808080',  // Gray
  'Echani Reach': '#4B0082',    // Indigo
  'Hegemony': '#2F4F4F',        // Dark slate gray
  'Mi-Go Primacy': '#006400',   // Dark green
  // Celestial factions
  'Archilect': '#00CED1',       // Dark turquoise
  'Archon': '#4169E1',          // Royal blue
  'Elysian': '#FFD700',         // Gold
  'Solari': '#FFA500',          // Orange
  // Independent factions
  'Ascendancy': '#8B4513',      // Saddle brown
  'Collective': '#228B22',      // Forest green
  'Dominion': '#800080',        // Purple
  'Mazani': '#xDC143C',          // Crimson
  'Venar': '#4B0082',           // Indigo
  // Other
  'Unclaimed': 'white',       // Dark gray
  'default': 'white',         // White
};

//Factions
const factions = [
  // p is percent of galaxy
  { name: 'Xothian', p: 9 },
  { name: 'Hegemony', p: 9 },
  { name: 'Archilect', p: 2 },
];

/*
  Voronoi
*/
const voronoiClaims = (seed, radius = 500) => {
  let RNG = new Chance(seed)

  const nPoints = 373;

  let idx = [];
  const points = d3.range(nPoints).map(() => {
    idx.push(idx.length);
    //randomly distribute points in an ellipse 
    const _u = Math.sqrt(Math.random());
    const θ = Math.random() * 2 * Math.PI;
    return [radius * 0.88 * _u * Math.cos(θ), radius * _u * Math.sin(θ)];
  });

  //assign faction to each point
  let owners = d3.range(nPoints).map(() => "Unclaimed")
  RNG.shuffle(idx);
  let claims = factions.map(f => {
    let n = Math.floor(nPoints * f.p / 100);
    //assign faction to each point
    let ids = idx.splice(0, n);
    ids.forEach(i => owners[i] = f.name)

    return {
      name: f.name,
      ids
    }
  })

  const delaunay = d3.Delaunay.from(points);
  const voronoi = delaunay.voronoi([-radius, -radius, radius, radius]);

  return {
    points,
    owners,
    voronoi,
    claims
  }
}

/*
  Galaxy Dimensions 
  Light years
*/
const MAJORSECTOR = 1000

/*
  Galaxy Class 
*/
class Galaxy {
  constructor(opts = {}) {
    App.FactionColors = FactionColors;
    //object info 
    this.what = "Galaxy"

    //seed for rng 
    this.seed = opts.seed || chance.string({
      alpha: true,
      length: 10,
      casing: 'upper'
    })

    this._sectors = new Map()

    //start generation 
    let RNG = new Chance(this.seed)

    //Radius and twist 
    let _R = RNG.randBetween(40, 60);
    this._R = (opts.radius || _R) * 1000;
    let _twist = RNG.randBetween(30, 150);
    this._twist = (opts.twist || _twist) / 10;

    //voronoi claims
    console.time('Voronoi Claims')
    this.claims = voronoiClaims(this.seed, this._R / 100);
    console.timeEnd('Voronoi Claims')

    //create star backdrop 
    console.time('Starry Host')
    FillGalaxy(this)
    console.timeEnd('Starry Host')
    this._bounds = [BBox[2] - BBox[0], BBox[3] - BBox[1]];

    this._factions = [];
    this._show = 'Galaxy'
    this._option = []
  }

  get data() {
    return {
      seed: this.seed,
      radius: this._R / 1000,
      twist: this._twist * 10,
    }
  }

  //sectors
  get allSectors() {
    let r = this._R / MAJORSECTOR;
    let AS = []
    //push ids 
    for (let x = -r; x < r; x++) {
      for (let y = -r; y < r; y++) {
        let _r2 = x * x + y * y;
        //create a new cell if distance less than r 
        _r2 < r * r ? AS.push([x, y]) : null;
      }
    }

    return AS
  }

  ellipse(v, isX = false) {
    //ellipse eq x^2/a^2+y^2/b^2 = 1
    let [a2, b2] = this._bounds.map(p => p * p / 4);
    let r2 = (1 - v * v / (isX ? a2 : b2)) * (isX ? b2 : a2);
    return Math.floor(Math.sqrt(r2));
  }

  /*
  SVG
  */
  addCrosshair(x, y) {
    let r = this._R;
    let crosshairs = SVG.find("#crosshairs");
    crosshairs.clear();
    //styles 
    let s = { color: "white", width: 1 };
    let xl = crosshairs.line(x, -r, x, 2 * r).stroke(s);
    let yl = crosshairs.line(-2 * r, y, 2 * r, y).stroke(s);
  }

  display() {
    let G = this;
    if (SVG('svg')) {
      SVG.find('svg').remove()
    }

    App.refresh();
    App.updateState("info", "");

    //show 
    SVG.find('#starryHost').show();
    ShowStars();

    let mapBBox = document.querySelector("#starryHost").getBoundingClientRect()
    let [w, h] = [mapBBox.width, mapBBox.height];

    // ────────────────────────────────────────────────
    // Voronoi Circle
    // ────────────────────────────────────────────────
    const _r = this._R / 100;
    SVG().addTo('#map').size(w, h).id('claims')
    const dsvg = d3.select("#claims")
      .attr("viewBox", "-500 -500 1000 1000")

    //crosshairs
    dsvg.append("g").attr("id", "crosshairs")

    let { points, owners, voronoi } = this.claims

    // Clip path for Voronoi cells
    d3.select("svg").append("defs")
      .append("clipPath")
      .attr("id", "circle-clip")
      .append("circle")
      .attr("cx", 0).attr("cy", 0).attr("r", _r);

    // ────────────────────────────────────────────────
    // 100×100 grid parameters (invisible – used only for calculation)
    // ────────────────────────────────────────────────
    const gridStep = 10;   // each square = 10 units × 10 units

    // ────────────────────────────────────────────────
    // Voronoi cells – hover shows fill, click logs x,y + faction + grid square
    // ────────────────────────────────────────────────
    let gClaim = dsvg.append("g")
      .attr("clip-path", "url(#circle-clip)")

    gClaim.selectAll("path")
      .data(points)
      .join("path")
      .attr("d", (d, i) => {
        const cell = voronoi.cellPolygon(i);
        return cell ? "M" + cell.map(p => p.join(",")).join("L") + "Z" : null;
      })
      .classed("claim", true)
      .attr("fill", (d, i) => FactionColors[owners[i]] || "white")
      .attr("fill-opacity", (d, i) => owners[i] == "Unclaimed" ? 0 : 0.5)
      .attr("pointer-events", "all")
      .on("click", function (event, d) {
        // Exact click position in viewBox coordinates
        const [clickX, clickY] = d3.pointer(event, dsvg.node());

        G.addCrosshair(clickX, clickY)

        // Voronoi cell faction
        const siteIndex = points.indexOf(d);
        const faction = owners[siteIndex] || "unclaimed";

        // Compute grid square (row 0–99 top-to-bottom, col 0–99 left-to-right)
        const col = Math.floor(clickX / gridStep);
        const row = Math.floor(clickY / gridStep);

        // Update App state with sector info
        if (window.App) {
          window.App.updateState("sectorInfo", {
            x: clickX.toFixed(1),
            y: clickY.toFixed(1),
            claim: faction,
            color: FactionColors[faction] || "white",
            sector: [col, row].join()
          });
        }

        console.log({
          x: clickX.toFixed(1),
          y: clickY.toFixed(1),
          faction,
          sector: [col, row].join()
        });
      });

    /*

    let r = this._R;
    svg.click(e => {
      //DETERMINE bounds
      let isH = h > w;
      let bound = w < h ? w : h;
      //adjust to sector scale 
      let m = this._R * 2 / bound / 100;
      //adjust for padding 
      let remadj = 8;
      //get position and adjust to sector 
      let [x, y] = [e.pageX, e.pageY];
      let [gx, gy] = [x - w / 2 - remadj, y - h / 2 - remadj].map(v => v * m);
      //is the point within the galaxy 
      let [maxx, maxy] = this._bounds.map(v => v / 2);
      let isWithin = Math.abs(gx) < maxx && Math.abs(gy) < maxy;

      if (isWithin) {
        //update crosshairs and options 
        this.addCrosshair(gx * 100, gy * 100)
        let sxy = [Math.round(gx), Math.round(gy)];

        //pull culture cell - adjust by 10, culture cells are 1000 ly 
        let cell = this._cultures._cells.get(sxy.slice(0, 2).map(v => v < 0 ? Math.ceil(v / 10) : Math.floor(v / 10)).join());
        console.log(sxy, cell)
      }
    })

    //viewbox
    svg.attr('viewBox', [-r, -r, 2 * r, 2 * r].join(" "))
    */
  }
}

export { Galaxy, FactionColors }
