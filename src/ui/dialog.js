export const Dialog = () => {
  let[what,id,ui] = App.state.dialog.split(".")

  return _.html`
  <div class="fixed z-2 top-1 left-1 bottom-1 right-1 flex items-center justify-center">
    <div class="overflow-y-auto o-90 bg-washed-blue br3 shadow-5 pa2" style="max-height:75vh;">
      ${App[what] ? App[what][id][ui] : D[what] ? D[what](app) : ""}
    </div>
  </div>`
}