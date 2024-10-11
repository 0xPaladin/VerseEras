export const Dialog = (app) => {
  let[what,id,ui] = app.state.dialog.split(".")

  return app.html`
  <div class="fixed z-2 top-1 left-1 bottom-1 right-1 flex items-center justify-center">
    <div class="overflow-y-auto o-90 bg-washed-blue br3 shadow-5 pa2" style="max-height:75vh;">
      ${app[what] ? app[what][id][ui] : D[what] ? D[what](app) : ""}
    </div>
  </div>`
}