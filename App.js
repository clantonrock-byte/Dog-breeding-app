// Breeder Pro MSV (Phase 1) — app.js for the Phase 1 shell
// Wires: Goal buttons -> views, Add dog/pup, Add care entry, Helpers, Export, Emergency alert.
// Storage: localStorage

const STORE_KEY = "breederPro_msv_v1";

function nowISO(){ return new Date().toISOString(); }
function fmt(ts){ return new Date(ts).toLocaleString(); }
function uid(p="id"){ return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
const $ = (s)=>document.querySelector(s);

function seed(){
  const s = {
    animals: [
      { id: uid("a"), type:"Dog", name:"Aina", breed:"German Shorthaired Pointer" }
    ],
    selectedAnimalId: null,
    timeline: [], // {id, animalId, kind, action, obs, actor, ts}
    helpers: [
      { id: uid("h"), name:"Alex", color:"#2d7ff9", zone:"Kennel A" }
    ]
  };
  s.selectedAnimalId = s.animals[0].id;
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}

function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return seed();
    const parsed = JSON.parse(raw);
    if(!parsed?.animals?.length) return seed();
    if(!parsed.selectedAnimalId) parsed.selectedAnimalId = parsed.animals[0].id;
    return parsed;
  }catch{
    return seed();
  }
}

let state = load();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function getAnimal(){
  return state.animals.find(a=>a.id===state.selectedAnimalId) || state.animals[0];
}

function show(view){
  // hide/show sections
  ["dogs","care","helpers","records"].forEach(v=>{
    const el = document.getElementById(`view${cap(v)}`);
    if(el) el.classList.toggle("hide", v!==view);
  });
}

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function renderAnimalSelect(){
  const sel = $("#selAnimal");
  sel.innerHTML = "";
  state.animals.forEach(a=>{
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.name} (${a.type})`;
    if(a.id === state.selectedAnimalId) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.onchange = ()=> {
    state.selectedAnimalId = sel.value;
    save();
    renderAll();
  };
}

function renderAnimalSummary(){
  const a = getAnimal();
  $("#animalSummary").innerHTML = `
    <div><strong>${escapeHtml(a.name)}</strong> · ${escapeHtml(a.breed||"")}</div>
    <div class="muted small">${escapeHtml(a.type)}</div>
  `;
}

function addEntry({kind="care", action="", obs="", actor="owner"}){
  const e = {
    id: uid("t"),
    animalId: state.selectedAnimalId,
    kind,
    action,
    obs,
    actor,
    ts: nowISO()
  };
  state.timeline.push(e);
  save();
  renderTimeline();
}

function renderTimeline(){
  const a = getAnimal();
  const wrap = $("#timeline");
  const items = state.timeline
    .filter(x=>x.animalId===a.id)
    .sort((x,y)=> new Date(x.ts)-new Date(y.ts));

  if(!items.length){
    wrap.innerHTML = `<div class="muted small">No entries yet. Add one to start your nursing-notes timeline.</div>`;
    return;
  }

  wrap.innerHTML = items.map(e=>`
    <div class="timeline-item">
      <div class="muted small"><strong>${escapeHtml(e.kind)}</strong> • ${fmt(e.ts)} • ${escapeHtml(e.actor)}</div>
      ${e.action ? `<div><strong>Action:</strong> ${escapeHtml(e.action)}</div>` : ""}
      ${e.obs ? `<div><strong>Observed:</strong> ${escapeHtml(e.obs)}</div>` : ""}
    </div>
  `).join("");
}

function renderPins(){
  const wrap = $("#pins");
  wrap.innerHTML = state.helpers.map(h=>`
    <div class="timeline-item">
      <div class="muted small"><strong>${escapeHtml(h.name)}</strong></div>
      <div class="muted small">Pin color: <span style="color:${h.color};font-weight:900;">●</span> • Zone: ${escapeHtml(h.zone||"Not set")}</div>
    </div>
  `).join("");
}

function exportJSON(){
  const a = getAnimal();
  const data = {
    exportedAt: nowISO(),
    animal: a,
    timeline: state.timeline.filter(x=>x.animalId===a.id)
  };
  $("#exportOut").textContent = JSON.stringify(data, null, 2);
}

function emergencyCard(){
  // vet-first quick card placeholder (Phase 1 shell; deeper integration later)
  alert("Emergency Quick Card (vet-first) — Phase 1 wiring is live.\n\nNext step: we’ll wire the stored vet contacts + microchip + insurance.");
}

function addDog(){
  const type = prompt("Dog or Pup?", "Dog");
  if(!type) return;
  const name = prompt("Name (e.g., Pup 3 / Willow):", "");
  if(!name) return;
  const breed = prompt("Breed (optional):", "") || "";
  const a = { id: uid("a"), type: type.trim(), name: name.trim(), breed: breed.trim() };
  state.animals.push(a);
  state.selectedAnimalId = a.id;
  save();
  addEntry({kind:"care", action:`Added ${a.type}: ${a.name}`, obs:"", actor:"owner"});
  renderAll();
}

function addCare(){
  const action = prompt("Action (what you did):", "") || "";
  const obs = prompt("Observed (what you saw):", "") || "";
  if(!action && !obs) return;
  addEntry({kind:"care", action, obs, actor:"owner"});
  show("care");
}

function addHelper(){
  const name = prompt("Helper name:", "");
  if(!name) return;
  const zone = prompt("Zone (optional):", "") || "";
  const colors=["#2d7ff9","#28c16f","#f2c94c","#f24b4b","#9b51e0","#56ccf2","#f2994a"];
  const color=colors[Math.floor(Math.random()*colors.length)];
  state.helpers.push({ id: uid("h"), name: name.trim(), color, zone: zone.trim() });
  save();
  renderPins();
}

function bind(){
  // goal navigation
  document.querySelectorAll("[data-nav]").forEach(b=>{
    b.addEventListener("click", ()=> show(b.dataset.nav));
  });

  // actions
  $("#btnAddDog").addEventListener("click", addDog);
  $("#btnAddCareEntry").addEventListener("click", addCare);
  $("#btnAddHelper").addEventListener("click", addHelper);
  $("#btnExport").addEventListener("click", exportJSON);

  $("#btnEmergency").addEventListener("click", emergencyCard);
  $("#btnTalk").addEventListener("click", ()=> alert("Voice capture comes next (SpeechRecognition)."));

  $("#btnHelpAnotherPerson").addEventListener("click", ()=>{
    addEntry({kind:"incident", action:"Helper requested another person", obs:"", actor:"helper"});
    alert("Logged. (Full build will send silent help alert.)");
  });
  $("#btnHelpUnsafe").addEventListener("click", ()=>{
    addEntry({kind:"incident", action:"Helper flagged: this feels unsafe", obs:"", actor:"helper"});
    alert("Logged. (Full build will notify manager/helpers silently.)");
  });
  $("#btnHelpNow").addEventListener("click", ()=>{
    addEntry({kind:"incident", action:"HELP NOW requested", obs:"Immediate assistance requested.", actor:"helper"});
    alert("Logged. (Full build will trigger injury flow + reassurance.)");
  });
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderAll(){
  renderAnimalSelect();
  renderAnimalSummary();
  renderTimeline();
  renderPins();
}

(function boot(){
  if(!state.selectedAnimalId && state.animals[0]) state.selectedAnimalId = state.animals[0].id;
  save();
  bind();
  show("dogs");
  renderAll();
})();
