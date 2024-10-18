export const TOC = () => {
  return _.html`
<div class="dropdown mb2" style="direction: rtl;">
	<div class="f3 btn bg-light-gray br2 pa2">📖</div>
	<div class="tc dropdown-content mw4 bg-white ba bw1 pa1">
		<div class="f4 pointer underline-hover hover-blue mv1" onClick=${ () => App.show = "Lexicon.About"}>About</div>
		<div class="f4 pointer underline-hover hover-blue mv1 ${_.show("Intro,AboutVerse") ? '' : "dn"}" onClick=${ () => App.show = "Lexicon.AboutVerse"}>The Galaxy</div>
		<div class="f4 pointer underline-hover hover-blue mv1 ${_.show("Intro,Glossary") ? '' : "dn"}" onClick=${ () => App.show = "Lexicon.Glossary"}>Glossary</div>
		<div class="f4 pointer underline-hover hover-blue mv1 ${_.show("Intro,History") ? '' : "dn"}" onClick=${ () => App.show = "Lexicon.History"}>History</div>
		<div class="f4 pointer underline-hover hover-blue mv1 ${_.show("Intro,Factions") ? '' : "dn"}" onClick=${ () => App.show = "Lexicon.Factions"}>Factions</div>
	</div>
</div>
`
}
