// app-v22.js — minimal MSV JS that matches the clean index below

const STORE_KEY = "breederPro_msv_v22";

function nowISO(){ return new Date().toISOString(); }
function fmt(ts){ return new Date(ts).toLocaleString(); }
function uid(p="id"){ return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
const $ = (s)=>document.querySelector(s);

function seed(){
  const s = {
    animals:[{id:uid("a"),type:"Dog",name:"Aina",breed:"German Shorthaired Pointer"}],
    selected:null,
    timeline:[],
    helpers:[{id:uid("h"),name:"Alex",color:"#2d7ff9",zone:"Kennel A"}],
    preparedness:{ vet:{primary:"",emergency:"",backup:""}, chip:{num:"",registry:""}, rabies:"", insurance:{provider:"",policy:""} }
  };
  s.selected = s.animals[0].id;
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}
function load(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)||"") }catch{ return null } }
let state = load() || seed();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function getAnimal(){ return state.animals.find(a=>a.id===state.selected) || state.animals[0]; }

function show(view){
  ["dogs","care","helpers","records"].forEach(v=>{
    const el = document.getElementById(`view${v[0].toUpperCase()+v.slice(1)}`);
    if (el) el.classList.toggle("hide", v!==view);
  });
}

function renderSelect(){
  const sel = $("#selAnimal");
  sel.innerHTML = "";
  state.animals.forEach(a=>{
    const o=document.createElement("option");
    o.value=a.id; o.textContent=`${a.name} (${a.type})`;
    if(a.id===state.selected) o.selected=true;
    sel.appendChild(o);
  });
  sel.onchange = ()=>{ state.selected = sel.value; save(); renderAll(); };
}
function renderSummary(){
  const a=getAnimal();
  $("#animalSummary").innerHTML = `<div><strong>${a.name}</strong> · ${a.breed||""}</div><div class="muted small">${a.type}</div>`;
}
function addEntry(kind, action, obs, actor){
  state.timeline.push({id:uid("t"), animalId:state.selected, kind, action, obs, actor, ts:nowISO()});
  save();
  renderTimeline();
}
function renderTimeline(){
  const a=getAnimal();
  const wrap=$("#timeline");
  const items=state.timeline.filter(e=>e.animalId===a.id).sort((x,y)=>new Date(x.ts)-new Date(y.ts));
  if(!items.length){ wrap.innerHTML=`<div class="muted small">No entries yet.</div>`; return; }
  wrap.innerHTML = items.map(e=>`
    <div class="timeline-item">
      <div class="muted small"><strong>${e.kind}</strong> • ${fmt(e.ts)} • ${e.actor}</div>
      ${e.action?`<div><strong>Action:</strong> ${e.action}</div>`:""}
      ${e.obs?`<div><strong>Observed:</strong> ${e.obs}</div>`:""}
    </div>
  `).join("");
}
function renderPins(){
  const wrap=$("#pins");
  wrap.innerHTML = state.helpers.map(h=>`
    <div class="pin-row">
      <div class="pin-dot" style="background:${h.color}"></div>
      <div><div><strong>${h.name}</strong></div><div class="muted small">Zone: ${h.zone||"Not set"}</div></div>
    </div>
  `).join("");
}

function exportJSON(){
  const a=getAnimal();
  $("#exportOut").textContent = JSON.stringify({
    exportedAt: nowISO(),
    animal: a,
    preparedness: state.preparedness,
    timeline: state.timeline.filter(e=>e.animalId===a.id)
  }, null, 2);
}

function emergencyCard(){
  const v = state.preparedness.vet;
  alert(
`EMERGENCY QUICK CARD (Vet first)

Primary Vet: ${v.primary||"(not set)"}
Emergency Vet: ${v.emergency||"(not set)"}
Backup Vet: ${v.backup||"(not set)"}

Tip: clinics can be closed/overrun. Backup options help.`
  );
}

function addDog(){
  const type = prompt("Dog or Pup?","Dog"); if(!type) return;
  const name = prompt("Name:",""); if(!name) return;
  const breed = prompt("Breed (optional):","")||"";
  const a={id:uid("a"),type:type.trim(),name:name.trim(),breed:breed.trim()};
  state.animals.push(a); state.selected=a.id; save();
  addEntry("care",`Added ${a.type}: ${a.name}`,"","owner");
  renderAll();
}
function addCare(){
  const action = prompt("Action (what you did):","")||"";
  const obs = prompt("Observed (what you saw):","")||"";
  if(!action && !obs) return;
  addEntry("care",action,obs,"owner");
}
function addHelper(){
  const name=prompt("Helper name:",""); if(!name) return;
  const zone=prompt("Zone (optional):","")||"";
  const colors=["#2d7ff9","#28c16f","#f2c94c","#f24b4b","#9b51e0","#56ccf2","#f2994a"];
  const color=colors[Math.floor(Math.random()*colors.length)];
  state.helpers.push({id:uid("h"),name:name.trim(),color,zone:zone.trim()}); save();
  renderPins();
}

function bind(){
  document.querySelectorAll("[data-nav]").forEach(b=>{
    b.onclick = ()=> show(b.dataset.nav);
  });

  $("#btnAddDog").onclick = addDog;
  $("#btnAddCareEntry").onclick = addCare;
  $("#btnAddHelper").onclick = addHelper;
  $("#btnExport").onclick = exportJSON;
  $("#btnEmergency").onclick = emergencyCard;

  $("#btnHelpAnotherPerson").onclick = ()=>{ addEntry("incident","Helper requested another person","", "helper"); alert("Logged."); };
  $("#btnHelpUnsafe").onclick = ()=>{ addEntry("incident","Helper flagged: feels unsafe","", "helper"); alert("Logged."); };
  $("#btnHelpNow").onclick = ()=>{ addEntry("incident","HELP NOW requested","", "helper"); alert("Logged."); };

  $("#btnTalk").onclick = ()=> alert("Voice capture can be added next. (MSV placeholder)");
}

function renderAll(){
  renderSelect();
  renderSummary();
  renderTimeline();
  renderPins();
}

bind();
show("dogs");
renderAll();
