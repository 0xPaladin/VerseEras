export const Intro = {
  "welcome": {
    "text": `<span class="fqr">Welcome to the Verse Wanderer.</span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Who are you?|whoIsDawn\\What is the verse?|initAboutVerse\\What am I doing here?|whyNewHere`
  },
  "whyNewHere": {
    "text": `<span class="fqr">I cannot speak for you... But I would assume you are here to learn, and maybe help. I am glad you are here! I wil be your guide and companion while you are here.</span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Back|welcome`
  },
  "whoIsDawn": {
    "text": `<span class="fqr">Dawn the southern ocean of Izanti on a gentle morning. But you may call me Dawn.</span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Ok, Dawn, what are you?|whatIsDawn\\Back|welcome`
  },
  "whatIsDawn": {
    "text": `<span class="fqr"><p>*shimmers through a number of colors quickly*</p> This is why I do this... I am an Archon, a Lantern, a guide.</span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `A guide for what?|welcomeGuide\\What is an Archon?|initWelcomeArchon\\Back|welcome`
  },
  "welcomeGuide": {
    "text": `<span class="fqr">A guide for you as you explore the Verse. Consider me your helper and companion as long as you are here. </span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Back|welcome`
  },
  "initWelcomeArchon": {
    "text": `<span class="fqr">The Archons are a faction of the Verse. An interstellar nation, but more about belief than territory or the number of stars claimed.</span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Ok, so what is the Verse?|initAboutVerse`
  },
  "initAboutVerse": {
    "text": `
    <span class="fqr">The Verse is the local name for our galaxy. Astronomically, it is a spiral galaxy around 100,000 light years wide and has around 300 billion stars. You can see it behind me. 
    <p>The spacefaring civilizations divide the galaxy into 1000 light-year cubic sectors. Sectors and further divide into 100 light-year cubic subsectors (1000 subsectors per sector).</p>
    </span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "unlock": ["Intro,AboutVerse"],
    "options": `Next|initAboutVerse2`
  },
  "initAboutVerse2": {
    "text": `<span class="fqr">It is highly populated, with countless interstellar civilizations. The major powers of the Verse are galactic scale organizations called factions. And the largest of those are the Free League, The Architects, the Dominion, and the Red Dawn.</span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Ok, that's a lot to take in, should I be taking notes?|takeNotes\\Tell me more about the factions.|initAboutFactions`
  },
  "takeNotes": {
    "text": `
    <span class="fqr">*shimmers through a number of colors quickly* 
    <div>No! I will be recording everything we talk about. It will be stored in the lexicon for you to access later. </div>
    </span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Back|initAboutVerse2`
  },
  initAboutFactions: {
    text: `<span class='fqr'>There isn’t one government throughout the Verse but a great number of factions that vary in how they govern (or dominate) their populace. Many factions are ones of ideology and not actual nation states. Currently the Verse is in balance, factions do push and pull against each other - every useful resource within the galaxy is under some faction's control. But the cosmics remember the AI/Cosmic War. No one is eager to upset the equilibrium.</span>`,
    options: `Next|initAboutFactions2`,
    img: [['lantern.png', 'left', 100, 93]]
  },
  "initAboutFactions2": {
    "text": `<span class="fqr">
    In the current era, the Free League guards roughly a quarter of the galaxy, while the Architects, Dominion, and Red Dawn each claim a sixth of it. Which leaves a quarter of the Verse as the Outlands - a lawless expanse in the hands of the Ancient, AI, and Outsider factions. 
    <p>The Free League and Architects are composed of smaller factions that are led by a pantheon of Cosmics and all the systems under their control are called a Realm. The systems of a realm are noncontiguous - they are not necessarily near each other thanks to the presence of conduits and gates.</p>
    </span>`,
    "img": [["lantern.png", "left", 100, 93]],
    "options": `Next|initAboutFactions2`
  },
}
