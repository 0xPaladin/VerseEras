const Abilities = [
  ["New Ability",0,"any"],["Test Ability",1,"any"],
]
const Playbooks = {
  "Cutter" : ""
}

/*
  Characters
*/
class Character {
  constructor(G,opts) {
    this.what ="Character"
    
    let o = this.opts = opts
    this.parent = G

    o.id = opts.id  || chance.natural()
    o.name = opts.name  || "New Character (Alias)"
    o.heritage = opts.heritage  || "Heritage/Background"
    o.est = opts.est || G.time[1].slice()
    o.playbook = opts.playbook || "" 
    o.xp = opts.xp || 0 
    o.contacts = opts.contacts || []
    o.abilities = opts.abilities || []
    
    o.notes = opts.notes || ""

    this._edit = ""
    this._select = {}

    console.log(this)
  }
  get app() {
    return this.parent.app
  }
  get galaxy() {
    return this.parent
  }
  get abilities () {
    return this.opts.abilities.map(id=>Abilities.find(c=>c[1]==id))
  }
  get availableContacts () {
    return []
  }
  /*
    May Be changed 
  */
  mod(what,d=null){
    this.opts[what] = d == null ? this.opts[what] : d
    return this.opts[what]
  }
  show () {
    this.galaxy.character = this
    this.app.dialog = "galaxy.character.UI"
  }
  get UI () {
    let width = window.innerWidth < 1000 ? window.innerWidth-4 : 1000
    let {abilities,_select} = this 
    //manage modifications to stats 
    let mod = (what,d) => this.mod(what,d)

    //helper UI pieces 
    let _input = (edit,css="") => _.html`<input class=${css} type="text" value=${mod(edit)} onInput=${(e)=>mod(edit,e.target.value)}></input>`
    let _inputSelect = (master,what) => master.length == 0 ? "" : _.html`
    <div class="mv2">
      <h3 class="ma0">${what.toUpperCase()}</h3>
      ${this[what].map((c,i)=>_.html`
        <div class="flex items-center justify-between mv1 ph1">
          ${c[0]}
          <div class="tc b bg-red white pointer dim underline-hover pa2" onClick=${()=>this.opts[what].splice(i,1)}>✗</div>
        </div>`)}
      <div class="flex">
        ${_.UISelect(master,master[what],(e)=>_select[what] = Number(e.target.value.split(",")[1]),"w-100")}
        <div class="tc b bg-light-green pointer dim underline-hover hover-green ba pa2" onClick=${()=>this.opts[what].push(_select[what]||0)}>✚</div>
      </div>
    </div>`

    //modify resources 
    let modRes = (res,steps,val) => {
      let t = _.sum(steps)+val+1
      t = t==1 && this.opts.res[res] > 1 ? 0 : t
      this.opts.res[res] = t 
      console.log(this.opts.res)
    }
    
    return _.html`
    <div style="width:${width}px;max-height:75vh;">
      <div class="fl w-50 ph1">
        <div>${_input("name","w-100")}</div>
        <div>${_input("heritage","w-100")}</div>
        <div class="flex items-center justify-between mv1">
        </div>
        <div class="flex justify-between mv2">
        </div>
        <textarea class="w-100" rows="6" cols="50" value=${mod("notes")} onInput=${(e)=>mod("notes",e.target.value)}></textarea>
        <div class="flex">
          <div class="w-50 tc b bg-light-green pointer dim underline-hover hover-green ba pa2" onClick=${()=>this.save()}>Save</div>
          <div class="w-50 tc b bg-light-gray pointer dim underline-hover hover-orange ba pa2" onClick=${()=>this.app.dialog = ""}>Cancel</div>
        </div>
      </div>
      <div class="fl w-50 ph1">
        <div class="fl w-two-thirds ph2">
          <div class="dropdown" style="direction: ltr;">
			<div class="pointer dim underline-hover hover-blue"><h1 class="ma0">${mod("playbook") || "Playbook"}</h1></div>
			<div class="dropdown-content bg-white ba bw1 pa1">
				${Object.keys(Playbooks).map(p=>_.html`
				<div class="f4 link pointer underline-hover" onClick=${()=>mod("playbook",p)}>${p}</div>`)}
			</div>
          </div>
          ${_inputSelect(Abilities,"abilities")}
          <div class="flex items-center justify-between bg-light-gray">
            <div class="b">XP</div>
            <div>${_.fromN(8,(i)=>_.html`<div class="blades-rep ${i<mod("xp")?"bg-black":""}" onClick=${()=>i==0 && mod("xp")>1 ? mod("xp",0) : mod("xp",i+1)}></div>`)}</div>
          </div>
          <div class="f6">
            <p>At the end of each mission, for each item below, mark 1 xp (or 2 xp instead if that item occurred multiple times).</p>
            <ul class="i pl3">
              <li>You executed a successful ... operation.</li>
              <li>You contended with challenges above your current station.</li>
              <li>You bolstered the organization's reputation or developed a new one.</li>
              <li>You expressed the goals, drives, inner conflict, or essential nature of the organization.</li>
            </ul>
          </div>
        </div>
        <div class="fl w-third">
          ${_inputSelect(this.availableContacts,"contacts")}
        </div>
      </div>
    </div>`
  }
  save () {
    this.app.dialog = ""
    this.galaxy.save()
    console.log(this)
  }
}

export {Character}