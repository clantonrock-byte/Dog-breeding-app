const STORE_KEY = "breederPro_msv_v1";
const $ = (s)=>document.querySelector(s);

function nowISO(){ return new Date().toISOString(); }
function fmt(ts){ return new Date(ts).toLocaleString(); }
function uid(p="id"){ return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

function seed(){
  const s = {
    animals:[{id:uid("a"),type:"Dog",name:"Aina",breed:"German Shorthaired Pointer"}],
    selected:null,
    timeline:[],
    helpers:[{id:uid("h"),name:"Alex",color:"#2d7ff9",zone:"Kennel A"}]
  };
  s.selected = s.animals[0].id;
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}

function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return seed();
    const s = JSON.parse(raw);
    if(!s?.animals?.length) return seed();
    if(!s.selected) s.selected = s.animals[0].id;
    return s;
  }catch{ return seed(); }
}

let state = load();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function show(view){
  ["dogs","care","helpers","records"].forEach(v=>{
    const el = document.getElementById(`view${cap(v)}`);
    if(el) el.classList.toggle("hide", v!==view);
  });
}

function getAnimal(){
  return state.animals.find(a=>a.id===state.selected) || state.animals[0];
}

function esc(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderSelect(){
  const sel = $("#selAnimal");
  if(!sel) return;
  sel.innerHTML = "";
  state.animals.forEach(a=>{
    const o=document.createElement("option");
    o.value=a.id;
    o.textContent=`${a.name} (${a.type})`;
    if(a.id===state.selected) o.selected=true;
    sel.appendChild(o);
  });
  sel.onchange = ()=>{ state.selected = sel.value; save(); renderAll(); };
}

function renderSummary(){
  const a=getAnimal();
  const box=$("#animalSummary");
  if(!box) return;
  box.innerHTML = `<div><strong>${esc(a.name)}</strong> · ${esc(a.breed||"")}</div><div class="muted small">${esc(a.type)}</div>`;
}

function addEntry(kind, action, obs, actor){
  state.timeline.push({
    id: uid("t"),
    animalId: state.selected,
    kind, action, obs, actor,
    ts: nowISO()
  });
  save();
  renderTimeline();
}

function renderTimeline(){
  const wrap=$("#timeline");
  if(!wrap) return;
  const a=getAnimal();
  const items = state.timeline
    .filter(e=>e.animalId===a.id)
    .sort((x,y)=>new Date(x.ts)-new Date(y.ts));

  if(!items.length){
    wrap.innerHTML = `<div class="muted small">No entries yet.</div>`;
    return;
  }

  wrap.innerHTML = items.map(e=>`
    <div class="timeline-item">
      <div class="muted small"><strong>${esc(e.kind)}</strong> • ${fmt(e.ts)} • ${esc(e.actor)}</div>
      ${e.action?`<div><strong>Action:</strong> ${esc(e.action)}</div>`:""}
      ${e.obs?`<div><strong>Observed:</strong> ${esc(e.obs)}</div>`:""}
    </div>
  `).join("");
}

function renderPins(){
  const wrap=$("#pins");
  if(!wrap) return;
  wrap.innerHTML = state.helpers.map(h=>`
    <div class="timeline-item">
      <div class="muted small"><strong>${esc(h.name)}</strong> <span style="color:${h.color};font-weight:900;">●</span></div>
      <div class="muted small">Zone: ${esc(h.zone||"Not set")}</div>
    </div>
  `).join("");
}

function exportJSON(){
  const a=getAnimal();
  const out=$("#exportOut");
  if(!out) return;
  out.textContent = JSON.stringify({
    exportedAt: nowISO(),
    animal: a,
    timeline: state.timeline.filter(e=>e.animalId===a.id)
  }, null, 2);
}

function addDog(){
  const type = prompt("Dog or Pup?","Dog");
  if(!type) return;
  const name = prompt("Name:","");
  if(!name) return;
  const breed = prompt("Breed (optional):","") || "";
  const a={id:uid("a"),type:type.trim(),name:name.trim(),breed:breed.trim()};
  state.animals.push(a);
  state.selected=a.id;
  save();
  addEntry("care",`Added ${a.type}: ${a.name}`,"","owner");
  renderAll();
}

function addCare(){
  const action = prompt("Action (what you did):","") || "";
  const obs = prompt("Observed (what you saw):","") || "";
  if(!action && !obs) return;
  addEntry("care",action,obs,"owner");
  show("care");
}

function addHelper(){
  const name = prompt("Helper name:","");
  if(!name) return;
  const zone = prompt("Zone (optional):","") || "";
  const colors=["#2d7ff9","#28c16f","#f2c94c","#f24b4b","#9b51e0","#56ccf2","#f2994a"];
  const color=colors[Math.floor(Math.random()*colors.length)];
  state.helpers.push({id:uid("h"),name:name.trim(),color,zone:zone.trim()});
  save();
  renderPins();
}

/* ✅ 2-second hold behavior for Emergency */
function bindEmergencyHold(){
  const btn = $("#btnEmergency");
  if(!btn) return;

  let timer = null;
  let holding = false;

  const startHold = (e) => {
    e.preventDefault();
    if (holding) return;
    holding = true;

    // Visual cue on the button text
    const original = btn.textContent;
    btn.textContent = "Hold 2 seconds…";

    timer = setTimeout(() => {
      btn.textContent = original;
      holding = false;
      timer = null;
      // Trigger emergency action
      alert("Emergency Quick Card placeholder.\n\n(Next: wire stored vet/microchip/insurance.)");
    }, 2000);
  };

  const cancelHold = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    holding = false;
    btn.textContent = "Emergency";
  };

  // Touch + mouse support
  btn.addEventListener("touchstart", startHold, { passive:false });
  btn.addEventListener("touchend", cancelHold);
  btn.addEventListener("touchcancel", cancelHold);

  btn.addEventListener("mousedown", startHold);
  btn.addEventListener("mouseup", cancelHold);
  btn.addEventListener("mouseleave", cancelHold);
}

function bind(){
  // Goal navigation
  document.querySelectorAll("[data-nav]").forEach(b=>{
    b.onclick = ()=> show(b.dataset.nav);
  });

  $("#btnAddDog").onclick = addDog;
  $("#btnAddCareEntry").onclick = addCare;
  $("#btnAddHelper").onclick = addHelper;
  $("#btnExport").onclick = exportJSON;

  // Talk stays normal click
  const talk = $("#btnTalk");
  if (talk) talk.onclick = ()=> alert("Voice comes next.");

  // Emergency is press-and-hold
  bindEmergencyHold();

  // Helper request buttons (Phase 1 record only)
  const b1=$("#btnHelpAnotherPerson");
  const b2=$("#btnHelpUnsafe");

  if(b1) b1.onclick = ()=> addEntry("incident","Helper requested another person","", "helper");
  if(b2) b2.onclick = ()=> addEntry("incident","Helper flagged: feels unsafe","", "helper");
}

function renderAll(){
  renderSelect();
  renderSummary();
  renderTimeline();
  renderPins();
}

(function boot(){
  if(!state.selected && state.animals[0]) state.selected = state.animals[0].id;
  save();
  bind();
  show("dogs");
  renderAll();
})();    
