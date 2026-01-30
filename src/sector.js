import { MakeName } from './randomName.js';

import { SolarSystemGenerator } from './starSystem.js';


/*
  Isometric 
*/

const toIsometric = (_x, _y, _z) => {
    return {
        x: (_x - _y) * 0.866025,
        y: _z + (_x + _y) * 0.5
    }
}

/*
  Sector Class 
*/

class Sector {
    constructor(opts = {}) {
        this.what = "Sector"
        this.filter = "All"

        //sector id - x,y
        this.id = opts.id || [0, 0, 0];
        let _id = this.id.join();

        //seed for randomization 
        this._seed = opts.seed || 0;
        //seed for RNG 
        this.seed = [App.galaxy.seed, _id, this._seed].join(".");

        //establish random gen 
        let RNG = new Chance(this.seed)

        let alignment = this.alignment = "neutral"
        let alMod = [5, 3, 0, -3, -5][['chaotic', 'evil', 'neutral', 'good', 'lawful'].indexOf(alignment)]
        let sR = RNG.d12() + alMod
        this.safety = sR <= 1 ? ["safe", 3] : sR <= 3 ? ["unsafe", 2] : sR <= 9 ? ["dangerous", 1] : ["perilous", 0]

        //core systems 
        // Check if it's a claimed sector (Ancient, Celestial, or Independent)
        const claim = this.claim = opts.claim || "Unclaimed";
        let cG = ["Xothian", "Gray Syndicate", "Echani Reach", "Hegemony", "Mi-Go Primacy"].includes(claim) ? "Ancient" : null;
        cG = cG || (["Archilect", "Archon", "Elysian", "Solari"].includes(claim) ? "Celestial" : null);
        cG = cG || (["Ascendancy", "Collective", "Dominion", "Mazani", "Venar"].includes(claim) ? "Independent" : null);
        this.claimGroup = cG || "Unclaimed";

        //color based on faction
        this.color = App.FactionColors[claim] || "white";
        // Claimed sectors: 20-100 core systems
        // Unclaimed sectors: half of claimed sectors
        this.nCore = cG != "Unclaimed" ? RNG.integer({ min: 20, max: 100 }) : RNG.integer({ min: 10, max: 50 });

        // Generate core systems
        this.#generateCoreSystems();
    }

    /**
     * Generate core systems using SolarSystemGenerator
     * Implements Core Systems rules from sectors.md
     */
    #generateCoreSystems() {
        const systems = [];
        const { claim, claimGroup, nCore } = this;

        //establish random gen 
        let RNG = new Chance(`${this.seed}-systems`)

        this._names = [];
        this._systems = [];

        //number of Core systems 
        for (let i = 0; i < this.nCore; i++) {
            MakeName(this._names, RNG);
            let name = this._names[i];

            // Create a unique seed for each system
            const systemSeed = `${this.seed}-system-${i}`;

            // Generate x,y,z position within sector (-500.0 to +500.0 ly)
            const position = {
                x: RNG.floating({ min: -500.0, max: 500.0, fixed: 2 }),
                y: RNG.floating({ min: -500.0, max: 500.0, fixed: 2 }),
                z: RNG.floating({ min: -500.0, max: 500.0, fixed: 2 })
            };

            // Determine system type and claim based on sector claim
            let systemClaim = claim;
            let systemType = "primary";
            let isHabitable = true;
            let techLevel = 4;
            let panhumanStatus = "Free / Thriving";

            if (claim !== "Unclaimed") {
                // In claimed sectors, all core systems belong to claiming faction
                systemClaim = claim;
                if (claimGroup === "Ancient") {
                    // In ancient sectors, determine primary vs managed
                    systemType = this.chance.bool({ likelihood: 20 }) ? "primary" : "managed";
                    techLevel = 4; // Ancients TL5, thralls TL4
                    panhumanStatus = "Enslaved / Suppressed";
                } else if (claimGroup === "Celestial") {
                    systemType = "primary";
                    techLevel = 5;
                    panhumanStatus = "Free / Thriving";
                } else if (claimGroup === "Independent") {
                    systemType = "primary";
                    techLevel = 4;
                    panhumanStatus = "Free / Thriving";
                }
            } else if (claim === "Unclaimed") {
                // Unclaimed sector: use percentages from sectors.md
                const roll = RNG.integer({ min: 1, max: 100 });

                if (roll <= 30) {
                    // 30% Ancient settlement
                    systemClaim = RNG.pickone(["Xothian", "Gray Syndicate", "Echani Reach", "Hegemony", "Mi-Go Primacy"]);
                    systemType = RNG.bool({ likelihood: 10 }) ? "primary" : "managed";
                    techLevel = 4;
                    panhumanStatus = "Enslaved / Suppressed";
                } else if (roll <= 35) {
                    // 5% - 2+ Ancient settlements (we'll mark as multi-ancient)
                    systemClaim = RNG.pickone(["Xothian", "Gray Syndicate", "Echani Reach", "Hegemony", "Mi-Go Primacy"]);
                    systemType = "multi-ancient";
                    techLevel = 4;
                    panhumanStatus = "Contested / Suppressed";
                } else if (roll <= 40) {
                    // 5% - open conflict between 2-3 Ancient factions
                    systemClaim = "Ancient Conflict";
                    systemType = "conflict";
                    techLevel = 4;
                    panhumanStatus = "War-torn";
                } else if (roll <= 50) {
                    // 10% Celestial settlement
                    systemClaim = RNG.pickone(["Archilect", "Archon", "Elysian", "Solari"]);
                    systemType = "primary";
                    techLevel = 5;
                    panhumanStatus = "Free / Thriving";
                } else if (roll <= 60) {
                    // 10% feral/independent + Celestial guardian
                    systemClaim = "Celestial Guardian";
                    systemType = "guarded";
                    techLevel = 3;
                    panhumanStatus = "Free but Monitored";
                } else {
                    // 40% feral/independent settlement
                    systemClaim = "Independent";
                    systemType = "feral";
                    techLevel = RNG.pickone([0, 1, 2, 3]);
                    panhumanStatus = "Free / Feral";
                }
            }

            // Generate the system
            const systemGenerator = new SolarSystemGenerator({
                seed: systemSeed,
                starType: "random",
                isBinary: "random",
                isHabitable: isHabitable,
            });

            const system = systemGenerator.generate();

            // Add sector-specific metadata
            system.name = name;
            system.position = position;
            system.sectorIndex = i;
            system.isCoreSystem = true;
            system.claim = systemClaim;
            system.systemType = systemType; // primary, managed, feral, guarded, multi-ancient, conflict
            system.techLevel = techLevel;
            system.panhumanStatus = panhumanStatus;

            this._systems.push(system);
        }
    }

    /*
      add a system to the sector
      TODO: Used for non-core systems like outposts, ruins, etc.
      */
    addSystem(opts = {}) { }

    //get habitable systems
    get habitable() {
        return this.systems.map(s => s.habitablePlanets);
    }

    get systems() {
        return Object.values(this._systems);
    }

    showSystems(filter) {
        //["All","Earthlike", "Survivable", "Factions", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]

        let hab = ["Earthlike", "Survivable"]
        let poi = ["Settlements", "Ruins", "Gates", "Resources", "Outposts", "Dwellings", "Landmarks"]
        let res = []

        if (filter == "Modded") {
            res = this.systems.filter(s => this._mods[s.id])
        }
        else if (hab.includes(filter)) {
            res = this.systems.filter(s => s.HI == hab.indexOf(filter) + 1)
        } else if (filter == "Factions") {
            res = this.systems.filter(s => s.POI && s.POI.reduce((state, poi) => {
                return state || poi.f || poi.creator
            }
                , false))
        } else if (filter == "Ruins") {
            res = this.systems.filter(s => s.POI && s.POI.reduce((state, poi) => {
                return state || poi.what == "Ruin" || poi.isRuin
            }
                , false))
        } else if (poi.includes(filter)) {
            let what = filter.slice(0, -1)
            res = this.systems.filter(s => s.POI && s.POI.reduce((state, poi) => {
                return state || poi.what == what || poi.type == what
            }
                , false))
        } else {
            res = this.systems
        }

        return res.sort((a, b) => a.name < b.name ? -1 : 1)
    }
    get system() {
        return this.systems[this._system]
    }
    get features() {
        return Object.values(this._features).flat()
    }
    /*
      Sector Data lookup 
    */
    distance(x, y) {
        let [sx, sy] = this.id
        let dx = x - sx
            , dy = y - sy;
        let d = Math.sqrt(dx * dx + dy * dy)
        return d
    }

    //check for same sector 
    isSameSector(x, y) {
        return this.id[0] == x && this.id[1] == y
    }

    addCrosshair(x, y) {
        let crosshairs = SVG.find("#crosshairs");
        crosshairs.clear();
        //styles 
        let s = { color: "white", width: 0.5 };
        let xl = crosshairs.line(x, 0, x, 100).stroke(s);
        let yl = crosshairs.line(0, y, 100, y).stroke(s);
    }

    async display(opts = {}) {
        if (SVG('svg')) {
            SVG.find('svg').remove();
        }
        SVG.find('#starryHost').hide();

        //gui 
        this.selectedSystem = this.selectedSystem || this.systems[0];

        //svg display
        let app = App
        const SECTOR = 1000;
        let svg = SVG().addTo('#map').size('100%', '100%');
        let crosshairs = svg.group().attr('id', 'crosshairs');

        //get display options 
        let { filter = this.filter, isometric = false } = opts

        //create the grid 
        let gridmap = svg.group().attr('id', 'gridmap')
        gridmap.back()

        // Create a simple grid for visual reference
        const gridSize = 100;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const x = i * gridSize - 500;
                const y = j * gridSize - 500;
                const points = [
                    [x, y],
                    [x + gridSize, y],
                    [x + gridSize, y + gridSize],
                    [x, y + gridSize]
                ];
                const pointsStr = points.map(p => p.join(",")).join(" ");
                gridmap.add(svg.polygon(pointsStr).addClass('grid'));
            }
        }

        //create the stars 
        let stars = svg.group().attr('id', 'stars')
        let systems = this.showSystems(filter)

        systems.forEach((system) => {
            let sector = this
            let G = App.galaxy
            let _p = system.position
            let x, y;

            if (isometric) {
                const iso = toIsometric(_p.x, _p.y, _p.z);
                x = iso.x;
                y = iso.y;
            } else {
                x = _p.x;
                y = _p.y;
            }

            //STAR SIZE BASED ON LUMINOSITY
            let s_r = Math.max(Math.min(Math.log(system.star.luminosity) + 8, 20), 2);

            let _star = svg.circle(s_r * 2.5).attr({
                cx: x,
                cy: y
            }).fill(system.star.color || 'white').addClass('star').data({
                seed: system.seed
            }).click(async function () {
                let seed = this.data("seed")

                let _s = sector.systems.find(sys => sys.seed == seed)
                let _POI = _s.POI || []
                console.log(_s)

                //update gui - show system info in top left
                App.updateState("systemInfo", _s);
                sector.addCrosshair(x, y);
                sector.selectedSystem = _s;
            })

            stars.add(_star)
        }
        )

        //adjust viewbox to see sector 
        svg.attr('viewBox', [-500, -500, SECTOR, SECTOR].join(" "));

        // Update sector info for the UI box
        App.updateState("sectorInfo", {
            sector: this.id.join(),
            claim: this.claim,
            color: this.color,
        });
    }
    /*
      UI
    */
    get UI() {
    }
}

export { Sector };