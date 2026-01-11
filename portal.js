
// === Dog List Patch ===
// Adds profile photo thumbnails + clickable route pill
// Drop-in replacement helpers + renderDogs()

const DOG_KEY = window.DOG_KEY || "breederPro_dogs_store_v3";

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function loadDogsStore(){
  try{const r=localStorage.getItem(DOG_KEY);return r?JSON.parse(r):{dogs:[]};}
  catch{return {dogs:[]};}
}

function ensureDog(d){
  if(!d) return d;
  d.immunizationEvents ||= [];
  d.microchip ||= {value:"",locked:false,lockedAt:null};
  d.photoDataUrl ||= "";
  return d;
}

function getDogPhotoUrl(d){
  return typeof d?.photoDataUrl==="string"?d.photoDataUrl.trim():"";
}

function isPrintable(v){
  if(v==null) return false;
  if(typeof v==="string") return v.trim()&&v.length<80;
  if(typeof v==="number") return Number.isFinite(v);
  return false;
}

function detectRouteKey(dogs){
  if(window.__routeKey) return window.__routeKey;
  const score={};
  dogs.slice(0,200).forEach(d=>{
    Object.entries(d||{}).forEach(([k,v])=>{
      if(!isPrintable(v)) return;
      let s=0,kl=k.toLowerCase();
      if(/route|run|pen|truck|kennel|area|zone|location/.test(kl)) s+=5;
      if(/name|note|breed|sex|status|photo|id/.test(kl)) s-=2;
      score[k]=(score[k]||0)+s;
    });
  });
  let best="",bs=0;
  Object.entries(score).forEach(([k,s])=>{if(s>bs){bs=s;best=k}});
  window.__routeKey=bs>0?best:"";
  return window.__routeKey;
}

function openRoute(route){
  window.dogsRouteFilter=route;
  _go("Dogs");
  renderDogs();
}

function renderDogs(){
  const store=loadDogsStore();
  const all=(store.dogs||[]).map(ensureDog);
  let list=all.filter(d=>!d.archived);

  if(window.dogsViewMode==="Males") list=list.filter(d=>sexCategory(d.sex)==="male");
  if(window.dogsViewMode==="Females") list=list.filter(d=>sexCategory(d.sex)==="female");
  if(window.dogsViewMode==="Unassigned") list=list.filter(d=>sexCategory(d.sex)==="unknown");

  const rk=detectRouteKey(all);
  if(window.dogsRouteFilter)
    list=list.filter(d=>(d[rk]||"").toLowerCase()===window.dogsRouteFilter.toLowerCase());

  const el=document.getElementById("dogsList");
  if(!el) return;

  el.innerHTML=list.map(d=>{
    const photo=getDogPhotoUrl(d);
    const route=rk?d[rk]:"";
    return `
    <div class="timeline-item dog-row" onclick="_openDog('${esc(d.dogId)}')">
      <div>${photo?`<img class="dog-thumb" src="${esc(photo)}">`:`<div class="dog-thumb placeholder"></div>`}</div>
      <div class="dog-row-mid">
        <strong>${esc(d.callName||"")}</strong>
        <div class="muted small">${esc(d.breed||"")}</div>
      </div>
      <div>
        ${route?`<button class="route-pill" onclick="event.stopPropagation();openRoute('${esc(route)}')">${esc(route)}</button>`:`<span class="route-pill is-empty">No route</span>`}
      </div>
    </div>`;
  }).join("");
}
