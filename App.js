alert("app.js is running ✅");
// Breeder Pro MSV (Phase 1) — minimal app.js that matches the minimal index.html
// - Tabs work (Dogs/Care/Helpers/Records)
// - Add dog/pup works
// - Care timeline entries (nursing notes) w/ timestamps
// - Emergency button shows vet-first card (basic)
// - Helper help buttons create timeline entries
// - Export timeline JSON
//
// Storage: localStorage (Phase 1 MSV)
// No modal dependencies. No missing element errors.

const STORE_KEY = "breederPro_msv_v2_1";

function nowISO() { return new Date().toISOString(); }
function fmt(ts){ return new Date(ts).toLocaleString(); }
function uid(prefix="id"){ return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }

function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return seedState();
  try { return JSON.parse(raw); } catch { return seedState(); }
}
function saveState(){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function seedState(){
  const s = {
    animals: [
      { id: uid("a"), type:"Dog", name:"Aina", breed:"German Shorthaired Pointer" }
    ],
    selectedAnimalId: null,
    timeline: [], // {id, animalId, kind, action, obs, actor, ts}
    helpers: [
      { id: uid("h"), name:"Alex", color:"#2d7ff9", zone:"Kennel A" }
    ],
    preparedness: {
      vet: { primary:"", emergency:"", backup:"" },
      chip: { num:"", registry:"" },
      rabies: "",
      insurance: { provider:"", policy:"" }
    }
  };
  s.selectedAnimalId = s.animals[0].id;
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}

let state = loadState();

const $ = (sel) => document.querySelector(sel);

function getAnimal(){
  return state.animals.find(a=>a.id===state.selectedAnimalId) || state.animals[0];
}

function showView(view){
  // tabs
  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("active", t.dataset.view === view);
  });
  // sections
  ["dogs","care","helpers","records"].forEach(v=>{
    const sec = document.getElementById(`view${cap(v)}`);
    if (sec) sec.classList.toggle("hide", v !== view);
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
    if (a.id === state.selectedAnimalId) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.onchange = () => {
    state.selectedAnimalId = sel.value;
    saveState();
    renderAll();
  };
}

function renderAnimalSummary(){
  const a = getAnimal();
  const box = $("#animalSummary");
  box.innerHTML = `
    <div><strong>${escapeHtml(a.name)}</strong> · ${escapeHtml(a.breed || "")}</div>
    <div class="muted small">${escapeHtml(a.type)}</div>
  `;
}

function addTimeline({kind="care", action="", obs="", actor="owner"}){
  const entry = {
    id: uid("t"),
    animalId: state.selectedAnimalId,
    kind,
    action,
    obs,
    actor,
    ts: nowISO()
  };
  state.timeline.push(entry);
  saveState();
  renderTimeline();
  return entry;
}

function renderTimeline(){
  const wrap = $("#timeline");
  const a = getAnimal();
  const items = state.timeline
    .filter(e=>e.animalId===a.id)
    .sort((x,y)=> new Date(x.ts) - new Date(y.ts));

  if (!items.length){
    wrap.innerHTML = `<div class="muted small">No entries yet. Add a care entry to start the nursing-notes timeline.</div>`;
    return;
  }

  wrap.innerHTML = items.map(e=>`
    <div class="timeline-item">
      <div class="timeline-top">
        <div class="muted small"><strong>${escapeHtml(e.kind)}</strong> • ${fmt(e.ts)} • ${escapeHtml(e.actor)}</div>
      </div>
      ${e.action ? `<div><strong>Action:</strong> ${escapeHtml(e.action)}</div>` : ""}
      ${e.obs ? `<div><strong>Observed:</strong> ${escapeHtml(e.obs)}</div>` : ""}
    </div>
  `).join("");
}

function renderPins(){
  const wrap = $("#pins");
  wrap.innerHTML = state.helpers.map(h=>`
    <div class="pin-row">
      <div class="pin-dot" style="background:${h.color}"></div>
      <div>
        <div><strong>${escapeHtml(h.name)}</strong></div>
        <div class="muted small">Zone: ${escapeHtml(h.zone || "Not set")}</div>
      </div>
    </div>
  `).join("");
}

function exportTimeline(){
  const a = getAnimal();
  const data = {
    exportedAt: nowISO(),
    animal: a,
    preparedness: state.preparedness,
    timeline: state.timeline.filter(e=>e.animalId===a.id)
  };
  $("#exportOut").textContent = JSON.stringify(data, null, 2);
}

function openEmergency(){
  // Vet-first, always.
  const vet = state.preparedness.vet;
  const chip = state.preparedness.chip;
  const rabies = state.preparedness.rabies;
  const ins = state.preparedness.insurance;

  const msg = [
    "EMERGENCY QUICK CARD (Vet first)",
    "",
    `Primary Vet: ${vet.primary || "(not set)"}`,
    `Emergency Vet: ${vet.emergency || "(not set)"}`,
    `Backup Vet: ${vet.backup || "(not set)"}`,
    "",
    `Microchip: ${chip.num || "(not set)"} (${chip.registry || "registry not set"})`,
    `Rabies: ${rabies || "(not set)"}`,
    `Insurance: ${ins.provider || "(not set)"} ${ins.policy ? `(${ins.policy})` : ""}`,
    "",
    "Tip: Keep emergency vet options on file. Clinics can be closed or over capacity."
  ].join("\n");

  alert(msg);
}

function addDogOrPup(){
  const type = prompt("Type: Dog or Pup?", "Dog");
  if (!type) return;
  const name = prompt("Name (e.g., Pup 3 / Willow):", "");
  if (!name) return;
  const breed = prompt("Breed (optional):", "");
  const a = { id: uid("a"), type: type.trim(), name: name.trim(), breed: (breed||"").trim() };
  state.animals.push(a);
  state.selectedAnimalId = a.id;
  saveState();
  addTimeline({kind:"care", action:`Added ${a.type}: ${a.name}`, obs:"", actor:"owner"});
  renderAll();
}

function addCareEntry(){
  const action = prompt("Action (what you did):", "");
  const obs = prompt("Observed (what you saw):", "");
  // both optional, but at least one should exist to be meaningful
  if (!action && !obs) return;
  addTimeline({kind:"care", action: action||"", obs: obs||"", actor:"owner"});
}

function addHelper(){
  const name = prompt("Helper name:", "");
  if (!name) return;
  const zone = prompt("Zone (optional):", "");
  const color = randomColor();
  state.helpers.push({ id: uid("h"), name: name.trim(), color, zone: (zone||"").trim() });
  saveState();
  renderPins();
}

function bindUI(){
  // Tabs
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=> showView(t.dataset.view));
  });

  // Goal buttons
  document.querySelectorAll("[data-nav]").forEach(b=>{
    b.addEventListener("click", ()=> showView(b.dataset.nav));
  });

  // Primary actions
  $("#btnAddDog").addEventListener("click", addDogOrPup);
  $("#btnAddCareEntry").addEventListener("click", addCareEntry);
  $("#btnAddHelper").addEventListener("click", addHelper);
  $("#btnExport").addEventListener("click", exportTimeline);
  $("#btnEmergency").addEventListener("click", openEmergency);

  // Helper help buttons log timeline entries
  $("#btnHelpAnotherPerson").addEventListener("click", ()=>{
    addTimeline({kind:"incident", action:"Helper requested another person", obs:"", actor:"helper"});
    alert("Logged. (In full build, this would send a silent help alert.)");
  });
  $("#btnHelpUnsafe").addEventListener("click", ()=>{
    addTimeline({kind:"incident", action:"Helper flagged: this feels unsafe", obs:"", actor:"helper"});
    alert("Logged. (In full build, this would notify manager/helpers silently.)");
  });
  $("#btnHelpNow").addEventListener("click", ()=>{
    addTimeline({kind:"incident", action:"HELP NOW requested", obs:"Helper stated urgent need.", actor:"helper"});
    alert("Help notified (MSV placeholder). In full build: silent alerts + reassurance + containment-first flow.");
  });

  // Talk button (basic support)
  $("#btnTalk").addEventListener("click", ()=>{
    alert("Voice capture is device-dependent. For MSV, you can use the prompts and notes. (We can add SpeechRecognition next.)");
  });

  // Animal selection
  renderAnimalSelect();
}

function renderAll(){
  renderAnimalSelect();
  renderAnimalSummary();
  renderTimeline();
  renderPins();
}

function randomColor(){
  const colors = ["#2d7ff9","#28c16f","#f2c94c","#f24b4b","#9b51e0","#56ccf2","#f2994a"];
  return colors[Math.floor(Math.random()*colors.length)];
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

(function boot(){
  // ensure we have a selected animal
  if (!state.selectedAnimalId && state.animals[0]) state.selectedAnimalId = state.animals[0].id;
  saveState();

  bindUI();
  showView("dogs");
  renderAll();
})();
