export const About = () => {
  const _h = _.html
  const _show = App.state.selection.get("show-about") || "_verse"

  const _site = _h`
	<h3>This site is…</h3>
	<div class="ph2">
		  <div><b>A Guidebook.</b> Primarily it is an interactive guide to the Verse.</div> 
		  <div><b>Creative Experiment.</b> I built it as a tool to learn something new. I have learned HTML, javascript, procedural generation, and much more. </div>
		  <div><b>A RPG Tool.</b> My thought was initially to use this as a tool to play roleplaying games set within the Verse. Since I usually play solo, I like to have tools on hand to help and enrich the experience. </div>
		  <div><b>Interactive Fiction.</b> You don’t need to play RPGs to enjoy the site. There is a lot of fiction and the site is highly interactive, so it can be enjoyed as a piece of interactive fiction as well.   </div>
	</div>`

  const _inspiration = _h`
	<h3>My inspiration was…</h3>
	  <div class="ph2">
		<div><b><i>Planescape.</i></b> A RPG setting written by many authors published by Wizards of the Coast. Plane-hopping adventures with gods, angels, demons, and mythical locations.</div> 
		<div><b><i>The Culture.</i></b> A series of books by Iain M. Banks. Awesome science fiction about far-future transhumanity, godlike AI and galactic scale adventure.   </div>
		<div><b><i>Illium/Olympos.</i></b> Books by Dan Simmons. Far future, fake gods on Mars, post-apocalyptic Earth, and sentient machines in the outer solar system. </div>
		<div><b><i>Jupiter Ascending.</i></b> A space opera film by the Wachowskis. Not the best film, but definitely epic, cosmic and baroque. </div>
		<div><b><i>Stargate.</i></b> The whole franchise: movie and multiple TV series. World hopping aliens with far future tech playing gods with humans. </div>
		<div><b><i>Dune.</i></b> A series of books by Frank Herbert, and there are a couple of movie versions. The Dune setting is rich with the baroque atmosphere. The houses and factions and their plays for power are epic.</div> 
	  </div>`

  const _verse = _h`
	<h3>The Verse is…</h3>
	  <div class="ph2">
		  <div><b>Cosmic.</b> The Verse spans an entire galaxy. Powerful factions control numerous systems and worlds. Megastructures are common. Travel between worlds is prevalent and quick.</div>   
		  <div><b>Baroque.</b> Construction, clothes, and societies are extravagant.   </div>
		  <div><b>Science Fantasy.</b> Science has surpassed everything we can imagine making its effects indistinguishable from magic. It is omni-present and ingrained.  </div>
		  <div><b>Post-war.</b> The Great Cosmic War ended a century ago, but it left lasting marks on the Verse. All the powers, and much of the populace still remembers. </div>
		  <div><b>Optimistic.</b> This isn’t a grimdark future where there is only war. Factions are focused on rebuilding, expansion, exploration and discovery of past relics. Most conflicts are in defense and short lived.</div>
	  </div>`

  let text = {
    _site,
    _inspiration,
    _verse
  }

	let selections = "The Verse,_verse/The Site,_site/Inspiration,_inspiration"

  return _h`
  <div class="pa2 br2" style="background-color: rgba(255,255,255,0.85);">
	  <h1>Welcome to the Verse…</h1>
	  <div class="ph2">A far, far future science fiction setting where technology has progressed so far that it is indistinguishable from magic.</div>  
	  ${text[_show]}
	  <div class="flex justify-center ma1">
		  ${selections.split("/").map(btn => {
			  let [txt,what] = btn.split(",")
			  return what == _show ? "" : _h`<div class="white b btn bg-blue mh1 pa2" onClick=${()=>_.AppSelect("show-about",what)}>${txt}</div>`
		  })}
	  </div>
  </div>
  `
}