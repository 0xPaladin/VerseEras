// Chance is loaded globally from CDN in browser environment
// import Chance from 'chance';

class SolarSystemGenerator {
    constructor(options = {}) {
        const {
            seed = null,
            starType = "random",
            isBinary = "random",
            isHabitable = "random",
        } = options;

        this.seed = seed || Date.now();
        this.chance = new Chance(this.seed);
        console.log(`Verse system seed: ${this.seed}`);

        this.userStarType = starType.toUpperCase();
        this.userBinary = isBinary;
        this.userHabitable = isHabitable;

        this.config = {
            starTypes: this.#defaultStarTypes(),
            planetTypeChances: { terrestrial: 40, "super-earth": 25, "mini-neptune": 15, "ice giant": 10, "gas giant": 10 },
            hzFlux: { inner: 1.1, outer: 0.53 },
            celestialFactions: ["Archilects", "Archons", "Elysians", "Solari"],
        };

        this.system = {
            seed: this.seed,
            star: null,
            isBinary: false,
            secondary: null,
            binary: null,
            habitableZone: null,
            claim: "Unclaimed",
            techLevel: 0,
            panhumanStatus: "Unknown",
            features: [],
            planets: [],
            moons: new Map(),
            asteroidBelts: [],
            forcedHabitable: false,
            get habitablePlanets() {
                return this.planets.filter(p => p.habitabilityScore >= 3);
            }
        };
    }

    generate() {
        this.#generateStarSystem();
        this.#determineClaim();
        this.#calculateHabitableZone();
        this.#generatePlanets();
        this.#generateSystemFeatures();
        this.#generateAsteroidBelts();
        this.#generateMoons();
        return this.system;
    }

    #defaultStarTypes() {
        return [
            { type: "M", color: "orangered", mass: [0.08, 0.45], radius: [0.2, 0.7], luminosityRange: [0.001, 0.08], rarity: 76 },
            { type: "K", color: "orange", mass: [0.45, 0.8], radius: [0.7, 0.96], luminosityRange: [0.08, 0.6], rarity: 12 },
            { type: "G", color: "Yellow", mass: [0.8, 1.04], radius: [0.96, 1.15], luminosityRange: [0.6, 2], rarity: 7.6 },
            { type: "F", color: "lightgoldenrodyellow", mass: [1.04, 1.4], radius: [1.15, 1.4], luminosityRange: [2, 5], rarity: 3 },
            { type: "A", color: "White", mass: [1.4, 2.1], radius: [1.4, 1.8], luminosityRange: [10, 40], rarity: 0.6 },
        ];
    }

    #generateStarSystem() {
        let starList = this.system.userHabitable ? this.config.starTypes.slice(1,4) : this.config.starTypes;
        
        let typeData = this.userStarType !== "RANDOM"
            ? this.config.starTypes.find(t => t.type === this.userStarType) || this.chance.pickone(starList)
            : this.chance.weighted(starList, starList.map(t => t.rarity));

        const mass = this.chance.floating({ min: typeData.mass[0], max: typeData.mass[1], fixed: 2 });
        const lum = this.chance.floating({ min: typeData.luminosityRange[0], max: typeData.luminosityRange[1] * 1.3, fixed: 3 });

        this.system.star = { color: typeData.color, type: typeData.type, mass, luminosity: lum, name: this.#generateName("star") };

        this.system.isBinary = this.userBinary === "random" ? this.chance.bool({ likelihood: 35 }) : !!this.userBinary;
        if (this.system.isBinary) {
            const secMass = mass * this.chance.floating({ min: 0.1, max: 0.9 });
            this.system.secondary = { type: "M", mass: secMass, luminosity: this.chance.floating({ min: 0.01, max: 0.4, fixed: 2 }), name: this.#generateName("companion") };
            this.system.binary = { separation: this.chance.floating({ min: 1, max: 500, fixed: 1 }) };
        }
    }

    #determineClaim() {
        const forceFree = this.userHabitable === true || (this.userHabitable === "random" && this.chance.bool({ likelihood: 50 }));
        if (forceFree) this.system.forcedHabitable = true;

        this.system.claim = forceFree
            ? this.chance.weighted(["Celestial", "Independent", "Feral (rebelled)", "Unclaimed"], [40, 30, 20, 10])
            : this.chance.weighted(["Ancient - Primary", "Ancient - Managed", "Ancient - Feral", "Celestial", "Independent", "Unclaimed/Contested"], [25, 30, 15, 10, 10, 10]);

        if (this.system.claim.startsWith("Ancient")) {
            this.system.techLevel = this.system.claim.includes("Primary") ? 4 : 2;
            this.system.panhumanStatus = "Enslaved / Suppressed";
        } else if (this.system.claim.startsWith("Celestial") || this.system.claim === "Independent") {
            this.system.techLevel = 5;
            this.system.panhumanStatus = "Free / Thriving";
        } else if (this.system.claim.includes("Feral")) {
            this.system.techLevel = this.chance.integer({ min: 1, max: 3 });
            this.system.panhumanStatus = "Chaotic / Mixed";
        } else {
            this.system.techLevel = this.chance.integer({ min: 0, max: 3 });
            this.system.panhumanStatus = "Isolated / Primitive";
        }

        if (this.system.claim === "Celestial") this.system.claim += ` (${this.chance.pickone(this.config.celestialFactions)})`;
    }

    #calculateHabitableZone() {
        let L = this.system.star.luminosity;
        if (this.system.isBinary) L += this.system.secondary?.luminosity || 0;
        const inner = Math.sqrt(L / this.config.hzFlux.inner);
        const outer = Math.sqrt(L / this.config.hzFlux.outer);
        this.system.habitableZone = { inner: Number(inner.toFixed(2)), outer: Number(outer.toFixed(2)) };
    }

    #generatePlanets() {
        let count = this.chance.integer({ min: 3, max: 8 });
        if (this.system.forcedHabitable) count = Math.max(count, 5);

        let a = 0.35;
        let placedGoodWorld = false;

        for (let i = 1; i <= count; i++) {
            let noGiants = false;
            //check if in habitable zone
            let inHabitableZone= a >= this.system.habitableZone.inner && a <= this.system.habitableZone.outer;

            if (this.system.forcedHabitable && !placedGoodWorld && inHabitableZone) {
                a = this.chance.floating({ min: this.system.habitableZone.inner * 0.9, max: this.system.habitableZone.outer * 1.1 });
                placedGoodWorld = true;
                noGiants = true;
            }

            let isGiant = this.chance.bool({ likelihood: a > 3 ? 70 : 10 });
                if (noGiants) isGiant = false;
            const type = isGiant ? this.chance.pickone(["gas giant", "ice giant"])
                : this.chance.weighted(Object.keys(this.config.planetTypeChances), Object.values(this.config.planetTypeChances));

            const mass = isGiant ? this.chance.floating({ min: 30, max: 400 })
                : this.chance.floating({ min: 0.4, max: 15 });

            const planet = {
                name: `${this.system.star.name.split("-")[0]}${String.fromCharCode(96 + i)}`,
                type,
                semiMajorAxis: Number(a.toFixed(2)),
                mass,
                inHabitableZone,
            };

            this.#enrichPlanetWithEnvironment(planet, placedGoodWorld && planet.inHabitableZone);
            this.system.planets.push(planet);

            a *= this.chance.floating({ min: 1.5, max: 2.5 });
        }
    }

    #enrichPlanetWithEnvironment(planet, forcePerfect = false) {
        const a = planet.semiMajorAxis;
        const inHZ = planet.inHabitableZone;

        // Gravity
        let gravity;
        if (planet.type.includes("giant")) gravity = "none";
        else if (planet.mass < 0.3) gravity = "minor";
        else if (planet.mass < 0.7) gravity = "light";
        else if (planet.mass <= 2.5) gravity = "standard";
        else if (planet.mass <= 8) gravity = "heavy";
        else gravity = "crushing";
        planet.gravity = gravity;

        // Avg Temp (-3 to 3)
        let tempScore;
        if (forcePerfect) tempScore = this.chance.weighted([0, 1, -1], [70, 20, 10]);
        else if (inHZ) tempScore = this.chance.weighted([-2, -1, 0, 1, 2], [5, 15, 60, 15, 5]);
        else if (a < this.system.habitableZone.inner * 0.8) tempScore = this.chance.integer({ min: 1, max: 3 });
        else tempScore = this.chance.integer({ min: -3, max: -1 });
        planet.avgTemp = tempScore;

        // Atmosphere & breathability
        let isBreathable = false;
        let atmDesc = "None";
        if (planet.type.includes("giant")) {
            atmDesc = "Dense H/He";
        } else if (planet.mass < 0.2 || gravity === "minor") {
            atmDesc = "Trace / none";
        } else {
            if (forcePerfect || (inHZ && this.chance.bool({ likelihood: 75 }))) {
                isBreathable = true;
                atmDesc = this.chance.pickone(["N₂-O₂ (Earth-like)", "N₂-O₂ (thin)", "N₂-O₂ (dense)"]);
            } else {
                atmDesc = this.chance.pickone(["CO₂ thick", "CO₂ thin", "Toxic mix", "Methane", "Sulfuric", "Ammonia"]);
            }
        }

        // Atmosphere color
        let atmColor = "None";
        if (planet.type === "gas giant" || planet.type === "ice giant" || atmDesc.includes("thick")) {
            const colorThemes = [
                { name: "Bands of tan, brown & cream", chance: 30 },
                { name: "Pale yellow-cream with red-brown belts", chance: 20 },
                { name: "Deep orange-rust with white zones", chance: 15 },
                { name: "Blue-gray with subtle banding", chance: 10 },
                { name: "Pale cyan-aqua", chance: 10 },
                { name: "Deep azure blue", chance: 8 },
                { name: "Violet-purple haze", chance: 3 },
                { name: "Emerald green with crimson storms", chance: 2 },
                { name: "Metallic silver-gray", chance: 2 },
            ];
            const picked = this.chance.weighted(colorThemes, colorThemes.map(c => c.chance));
            atmColor = picked.name;
        } else if (isBreathable) {
            atmColor = "Pale blue (from orbit)";
        } else if (atmDesc.includes("CO₂") || atmDesc.includes("thick")) {
            atmColor = "Yellowish-orange haze";
        }

        planet.atmosphere = { description: atmDesc, isBreathable, color: atmColor };

        // Water % (rocky planets)
        let waterPercent = 0;
        if (["terrestrial", "super-earth"].includes(planet.type)) {
            if (forcePerfect || (inHZ && planet.habitabilityScore >= 3)) {
                waterPercent = this.chance.weighted([30, 40, 50, 60, 70, 80, 90], [5, 10, 15, 25, 20, 15, 10]);
            } else if (inHZ) {
                waterPercent = this.chance.integer({ min: 10, max: 85 });
            } else if (a < this.system.habitableZone.inner * 0.7) {
                waterPercent = this.chance.integer({ min: 0, max: 20 });
            } else {
                waterPercent = this.chance.integer({ min: 0, max: 100 });
            }
            if (inHZ && waterPercent >= 40 && waterPercent <= 85) {
                planet.habitabilityScore = Math.min(4, planet.habitabilityScore + 1);
            }
        }
        planet.waterPercent = waterPercent;

        // Dominant biome (rocky planets)
        let dominantBiome = "Barren Rock";
        if (["terrestrial", "super-earth"].includes(planet.type) && planet.habitabilityScore >= 1) {
            const temp = planet.avgTemp;
            const water = planet.waterPercent;
            const isHZ = planet.inHabitableZone;

            if (forcePerfect || (isHZ && planet.habitabilityScore >= 3 && water >= 50)) {
                dominantBiome = this.chance.weighted([
                    "Temperate Forest / Grassland", "Ocean World (archipelagos)",
                    "Lush Jungle / Rainforest", "Savanna / Steppe", "Mixed Continental"
                ], [25, 25, 20, 15, 15]);
            } else if (isHZ) {
                if (water > 70) dominantBiome = this.chance.pickone(["Ocean World", "Tropical Archipelago", "Coastal Wetlands"]);
                else if (water > 40) dominantBiome = this.chance.pickone(["Temperate Forest", "Grassland Plains", "Mixed Continental"]);
                else if (water > 15) dominantBiome = this.chance.pickone(["Savanna", "Semi-Arid Steppe", "Mediterranean Scrub"]);
                else dominantBiome = this.chance.pickone(["Dry Desert", "Cold Desert", "Tundra Fringe"]);
            } else if (temp <= -2) {
                dominantBiome = this.chance.pickone(["Frozen Tundra", "Ice Sheet", "Cryogenic Barren"]);
            } else if (temp >= 2) {
                dominantBiome = this.chance.pickone(["Scorched Desert", "Volcanic Badlands", "Inferno Wastes"]);
            } else {
                dominantBiome = this.chance.pickone(["Barren Rock", "Dust Wastes", "Sparse Xerophytic", "Fungal Mire (exotic)"]);
            }

            // Ancient oppression flavor
            if (this.system.claim.startsWith("Ancient") && planet.habitabilityScore >= 3 && this.chance.bool({ likelihood: 60 })) {
                dominantBiome = this.chance.pickone([
                    "Strip-Mined Wasteland", "Slave Labor Agri-Desert",
                    "Thrall-Modified Monoculture", "Polluted Industrial Swamp"
                ]);
            }

            // Exotic Verse twist
            if (this.chance.bool({ likelihood: 8 })) {
                dominantBiome = this.chance.pickone([
                    "Crystal Forest (Precursor ruins)", "Bioluminescent Mycofields",
                    "Floating Aerostat Jungles", "Ancient Terraform Remnant"
                ]);
            }

            // Biome influence on habitability
            if (["Ocean World", "Temperate Forest", "Lush Jungle", "Mixed Continental"].some(b => dominantBiome.includes(b))) {
                planet.habitabilityScore = Math.min(4, planet.habitabilityScore + 1);
            } else if (dominantBiome.includes("Desert") || dominantBiome.includes("Frozen") || dominantBiome.includes("Barren")) {
                planet.habitabilityScore = Math.max(1, planet.habitabilityScore - 1);
            }
        }
        planet.dominantBiome = dominantBiome;

        // Habitability score (final calculation)
        let score = 1;
        if (gravity === "none") score = 0;
        else if (gravity === "minor" || gravity === "crushing") score = Math.min(score, 1);
        else if (gravity === "light" || gravity === "heavy") score = Math.max(score, 2);

        if (Math.abs(tempScore) > 1) score = Math.min(score, 2);
        if (Math.abs(tempScore) > 2) score = Math.min(score, 1);

        if (isBreathable) {
            score = Math.max(score, 3);
            if (gravity === "standard" && tempScore === 0) score = 4;
        }
        if (forcePerfect) score = this.chance.weighted([3, 4], [20, 80]);

        if (this.system.claim.startsWith("Ancient") && score >= 3) {
            score = this.chance.bool({ likelihood: 70 }) ? 2 : score;
        }

        planet.habitabilityScore = score;
    }

    #generateSystemFeatures() {
        const f = [];
        if (this.system.claim.includes("Celestial")) {
            if (this.chance.bool({ likelihood: 70 })) f.push("Orbital habitat(s)");
            if (this.chance.bool({ likelihood: 50 })) f.push("Waystation");
        }
        if (this.system.claim.startsWith("Ancient")) {
            if (this.chance.bool({ likelihood: 60 })) f.push("Ancient gate");
            if (this.chance.bool({ likelihood: 40 })) f.push("Flesh factory");
        }
        this.system.features = f;
    }

    #generateAsteroidBelts() {
        if (this.system.planets.length < 3) return;
        if (this.chance.bool({ likelihood: 60 })) {
            this.system.asteroidBelts.push({
                name: "Main Belt",
                inner: this.system.planets[1].semiMajorAxis * 1.35,
                outer: this.system.planets[2].semiMajorAxis * 0.7,
            });
        }
    }

    #generateMoons() {
        this.system.planets.forEach((p, idx) => {
            if (!p.type.includes("giant")) return;
            const count = this.chance.integer({ min: 4, max: 35 });
            const moons = Array.from({ length: count }, (_, i) => ({
                name: `${p.name} ${String.fromCharCode(97 + i)}`,
                radius: this.chance.integer({ min: 40, max: 3200 }),
            }));
            this.system.moons.set(idx, moons);
        });
    }

    #generateName(type) {
        const prefixes = ["Alpha", "Zoth", "Elys", "Arch", "Sol", "Xoth", "Rhuk"];
        return `${this.chance.pickone(prefixes)}-${this.chance.integer({ min: 100, max: 9999 })}`;
    }

    toString() {
        let out = `System: ${this.system.star.name} (${this.system.star.type}-type)\n`;
        out += `Claim: ${this.system.claim} | TL${this.system.techLevel} | ${this.system.panhumanStatus}\n`;
        if (this.system.features.length) out += `Features: ${this.system.features.join(", ")}\n`;
        out += `Habitable Zone: ${this.system.habitableZone.inner} – ${this.system.habitableZone.outer} AU\n\n`;
        out += `Planets:\n`;

        this.system.planets.forEach(p => {
            const hz = p.inHabitableZone ? " [HZ]" : "";
            const hab = `Hab:${p.habitabilityScore}`;
            const grav = p.gravity.padEnd(10);
            const temp = (p.avgTemp >= 0 ? "+" : "") + p.avgTemp;
            const atm = p.atmosphere.isBreathable ? "Breathable" : "Unbreathable";
            const water = p.waterPercent > 0 ? `Water: ${p.waterPercent}%` : "";

            out += `  ${p.name.padEnd(8)} ${p.type.padEnd(14)} ${p.semiMajorAxis.toString().padEnd(6)} AU${hz}\n`;
            out += `     Gravity: ${grav} Temp: ${temp.padEnd(4)} Atm: ${atm.padEnd(12)} ${p.atmosphere.description.padEnd(18)} Color: ${p.atmosphere.color}\n`;
            if (water) out += `     ${water}\n`;
            if (p.dominantBiome) out += `     Biome: ${p.dominantBiome}\n`;
            out += `     ${hab}\n`;
        });
        return out;
    }
}

// Example usage
const system = new SolarSystemGenerator({
    seed: "nathan-verse-2026",
    starType: "G",
    isBinary: false,
    isHabitable: true,
}).generate();

console.log(system.toString());

export { SolarSystemGenerator };