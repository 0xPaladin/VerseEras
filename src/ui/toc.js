export const TOC = () => _.html`
<div class="dropdown" style="direction: rtl;">
	<div class="f3 bg-white btn pa2">☰</div>
	<div class="tc dropdown-content mw4 bg-white ba bw1 pa1">
		<div class="f4 pointer underline-hover hover-blue mv1" onClick=${()=> App.show="About"}>About</div>
		<div class="f4 pointer underline-hover hover-blue mv1" onClick=${()=> App.show="Glossary"}>Glossary</div>
		<div class="f4 pointer underline-hover hover-blue mv1" onClick=${()=> App.show="History"}>History</div>
		<div class="f4 pointer underline-hover hover-blue mv1" onClick=${()=> App.show="Factions"}>Factions</div>
		<div class="f4 pointer underline-hover hover-blue mv1" onClick=${()=> App.show="Galaxy"}>The Galaxy</div>
	</div>
</div>
`