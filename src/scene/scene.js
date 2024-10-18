import*as Scenarios from "../scenarios/index.js"

/*
  Scene Object Definition 

  "id" : {
    header : `html` OR (data) => `html`,
    text : `html` OR f(data) => `html`,
    options : `option|link/option|link...` OR [option, option...],
    lexicon : `html` OR (data) => `html`,
    data : {key : val},
    defs : {key: deepLink},
    onEnter () {},
    onExit () {},
  }

  option: {
    text: `html` OR (data) => `html`,
    data : {key:val},
    link: "chapter.id"
  }
*/

export class Scene {
  constructor(id) {
    this.id = id

    let[chapter,_id] = id.split(",")
    let _scene = this._scene = Scenarios[chapter][_id]

    //start data, options 
    let D = this.data = {}
    let O = this.options = []

    //first get definitions 
    Object.entries(_scene.defs || {}).forEach( ([key,path]) => D[key] = _.deepGet(App, path, null))

    //make option function 
    let makeOption = ({text, f, link, data, _data}) => {
      O.push({
        text: _.wrapToHTML(text, data),
        f,
        link,
        data: _data || data
      })
    }

    //run gen 
    Object.entries(_scene.gen || {}).forEach( ([key,{what, n=1, state={}, option={}}]) => {
      //function per generate 
      let gen = () => {
        let data = new app.gen[what](app,Object.apply({}, state))
        if (option.text) {
          option.data = data
          option._data = option._data ? Object.fromEntries(Object.entries(option._data).map( ([key,id]) => [key, data[id]])) : null
          makeOption(option)
        }
        return data
      }
      //set data run gen 
      D[key] = n == 1 ? gen() : _.fromN(n, () => gen())
    }
    )

    //get data functions 
    Object.entries(_scene.get || {}).forEach( ([key,{what, f, option={}}]) => {
      //set data run gen 
      D[key] = f(what == "data" ? D : Object.values(app.activeState).filter(obj => obj.what == what))
      //create options 
      if (option.text) {
        [D[key]].flat().forEach(obj => {
          option.data = obj
          option._data = option._data ? Object.fromEntries(Object.entries(option._data).map( ([key,id]) => [key, obj[id]])) : null
          makeOption(option)
        }
        )
      }
    }
    )

    //do text & header 
    this.header = _.wrapToHTML(_scene.header || "", D)
    this.text = _.wrapToHTML(_scene.text || "", D)

    const OptionFromString = (str) => {
      return _scene.options.split('\\').map(opt => {
        let[txt,link] = opt.split("|")

        return {
          text: _.wrapToHTML(txt, {}),
          link: link.includes(",") ? link : [chapter, link].join()
        }
      }
      )
    }

    //options 
    let opts = _scene.options ? typeof _scene.options == "string" ? OptionFromString(_scene.options) : _scene.options : []
    opts.forEach(o => makeOption(Object.assign({
      data: D
    }, o)))
  }
  static async enter(id="", from) {
    localStorage.setItem("activeScene", id)

    if (id == "") {
      App.dialog = ""
    } else {
      //unlock the id 
      let [chapter,_id] = id.split(",")
      //create
      let scene = App.scene = new Scene(id)
      scene._scene.onEnter ? scene._scene.onEnter(scene) : null
      //unlock 
      App.setUnlock([id,...(scene._scene.unlock || [])])
      //show dialog 
      App.show = "scene"
    }
  }
  async exit(o) {
    //run option function 
    o.f ? o.f(this) : null 
    //run on exit functions 
    this._scene.onExit ? this._scene.onExit(this) : null 

    //change scene 
    await Scene.enter(o.link, this)
  }
  get UI() {
    let {id, header="", text, options=[]} = this
    let[chapter,_id] = id.split(",")
    let images = this._scene.img || []

    const boxes = {
      "top": [],
      "right": [],
      "bottom": [],
      "left": []
    }

    //place images 
    images.forEach( ([src,loc,w,h]) => boxes[loc].push(_.html`<img src=${"src/scenarios/" + chapter + "/" + src} width=${w} height=${h}></img>`)) 

    return _.html`
    <div class="fixed z-2" style="inset:0px;width: 800px;height: 20rem;max-width: 100vw;max-height: 100dvh;margin: auto;">
      <div class="br2 mv2" style="background-color:rgba(255, 255, 255, 0.95);">
        <h2 class="ma0">${header}</h2>
        <div class="pa2">
          <div></div>
          <div class="flex mv1">
            <div class="flex justify-center w-20">${boxes.left.map(d=> _.html`${d}`)}</div>
            <div class="w-60 pa2 mh2">${text}</div>
            <div class="flex justify-center w-20">${boxes.right.map(d=> _.html`${d}`)}</div>
          </div>
          <div></div>
        </div>
      </div>
      <div class="br2 pa2" style="width:250px;margin:auto;background-color:rgba(255, 255, 255, 0.85);">
          ${options.map(o => _.html`<div class="btn bg-light-gray br2 ma1 pa2" onClick=${ () => this.exit(o)}>${o.text}</div>`)}
      </div>
    </div>`
  }
}
