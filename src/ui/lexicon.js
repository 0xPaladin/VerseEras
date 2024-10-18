import {About} from "./about.js"
import {AboutVerse} from "./verse-galaxy.js"

let Chapters = {AboutVerse,About}

export const Lexicon = () => {
  let [what, id] = App.state.show.split(".")

  return _.html`
<div class="fixed z-5" style="inset:0px;width: 800px;height: 20rem;max-width: 100vw;max-height: 75dvh;margin: auto;">
  <div class="br2 mv2" style="background-color:rgba(255, 255, 255, 0.95);">
    ${Chapters[id]()}
  </div>
</div>`
}