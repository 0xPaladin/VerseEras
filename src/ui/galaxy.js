import {sectors, RotateView, FactionThree} from "../galaxy-three.js"

const Factions = ["None", "Free League", "Dominion", "Architects", "Red Dawn", "Outlands"]

const FactionClaim = (x,z) => {
  //get major sector id - 10 sectors per 
  let ms = [x,z].map(p=>Math.floor(p/10)).join()
  //search all factions for id 
  let f = Object.entries(FactionThree).reduce((res,e)=> {
    let [fid,data] = e 
    let _claim = data[1].includes(ms) ? e : null
    return res || _claim  
  },null)
  return [ms,f]
}

export const Galaxy = () => {
  let _deg = App.state.selection.get("galaxy-rotate") || 0 
  let cf = App.state.selection.get("galaxy-show-faction") || "None"
  let _sid = App.state.selection.get("galaxy-sector") || [0,0]
  let _claim = FactionClaim(..._sid)[1][0] 

  //make all cubes false 
  Object.values(FactionThree).forEach(F=> F[2].forEach(c=>c.visible=false))
  if(FactionThree[cf]){
    FactionThree[cf][2].forEach(c=>c.visible=true)
  }

  const checkSector = (x,y) => {
    let sid = [x,y].join()
    if(!sectors[sid]) {
      return;
    }

    _.AppSelect("galaxy-sector",[x,y])
  }

  const rotate = (deg) => {
    RotateView(deg)
    _.AppSelect("galaxy-rotate",deg)
  }

  return _.html`
<div class="pa2 br2 mw5" style="background-color: rgba(255,255,255,0.85);">
    <div class="flex items-center">
      <span>Rotate </span>
      <input class="mh2" type="range" min="0" max="360" step="5" onChange=${ (e) => rotate(e.currentTarget.value)}></input> 
      <span>${_deg}°</span>
    </div>
    <div class="flex">
      <span>Factions</span>
      <select class="w-100 mh2" value=${cf} onChange=${(e)=> _.AppSelect("galaxy-show-faction",e.currentTarget.value)}>
        ${Factions.map(f=> _.html`<option value="${f}">${f}</option>`)}
      </select>
    </div>
    <div class="flex items-center mv1">
      <span>Sector</span>
      <input class="tc w-50 mh2" type="number" value=${_sid[0]} onInput=${(e)=> checkSector(e.currentTarget.value,_sid[1])}></input>
      <span>x</span>
      <input class="tc w-50 mh2" type="number" value=${_sid[1]} onInput=${(e)=> checkSector(_sid[0],e.currentTarget.value)}></input>
      <span>y</span>
    </div>
    <div>Claim: ${_claim || "None"}</div>
</div>`
}
