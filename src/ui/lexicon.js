import {About} from "./about.js"
import {AboutVerse} from "./verse-galaxy.js"
import {History} from "./history.js"
import {Glossary} from "./glossary.js"
import {Factions} from "./factions.js"

let Chapters = {
  AboutVerse,
  About,
  History,
  Glossary,
  Factions
}

export const Lexicon = () => {
  let[what,id] = App.state.show.split(".")

  return _.html`
<div class="fixed z-5" style="inset:0px;width: 800px;max-width: 100vw;max-height: 75dvh;margin: auto;">
  <div class="h-100 overflow-y-auto br2 mv2" style="background-color:rgba(255, 255, 255, 0.95);">
    <div class="fr b white btn bg-blue br2 ma2 pa2" onClick=${()=> App.show = "galaxy"}>X</div>
    ${Chapters[id]()}
  </div>
</div>`
}
