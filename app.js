const STORE_KEY = "breederPro_msv_v5001";
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
    helpers:[{id:uid("h"),name:"Alex",color:"#2d7ff9",zone:"Kennel A"}],
    inventory: [] // {itemId,name,category,source,identifierType,identifierValue,qty,unit,thresholdLow,archived,history[]}
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
    if(!Array.isArray(s.inventory)) s.inventory = [];
    return s;
  }catch{ return seed(); }
}

let state = load();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function show(view){
  ["dogs","care","feeding","inventory","helpers","records"].forEach(v=>{
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

/* Tiered info system */
function bindInfoButtons(){
  document.querySelectorAll(".info-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.getAttribute("data-info");
      const panel = document.getElementById(`info-${key}`);
      if(panel) panel.classList.toggle("hide");
    };
  });

  document.querySelectorAll(".info-more-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.getAttribute("data-more");
      const more = document.getElementById(`info-${key}-more`);
      if(more) more.classList.toggle("hide");
    };
  });

  document.querySelectorAll(".info-full-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.getAttribute("data-full");
      const full = document.getElementById(`info-${key}-full`);
      if(full) full.classList.toggle("hide");
    };
  });
}

/* Emergency hold */
function bindEmergencyHold(){
  const btn = $("#btnEmergency");
  if(!btn) return;

  let timer = null;
  let holding = false;
  const originalText = btn.textContent;

  const startHold = (e) => {
    e.preventDefault();
    if (holding) return;
    holding = true;
    btn.textContent = "Hold 2 seconds…";

    timer = setTimeout(() => {
      holding = false;
      timer = null;
      btn.textContent = originalText;
      alert("Emergency Quick Card placeholder.\n\nNext: wire stored vet/microchip/insurance.");
    }, 2000);
  };

  const cancelHold = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    holding = false;
    btn.textContent = originalText;
  };

  btn.addEventListener("touchstart", startHold, { passive:false });
  btn.addEventListener("touchend", cancelHold);
  btn.addEventListener("touchcancel", cancelHold);
  btn.addEventListener("mousedown", startHold);
  btn.addEventListener("mouseup", cancelHold);
  btn.addEventListener("mouseleave", cancelHold);
}

/* Inventory core */
function addInventoryItem(){
  const name = prompt("Item name/label:",""); if(!name) return;

  const category = prompt("Category (Food/Treat/Topper/Toy/Blanket/Coat/Equipment/Other):","Food") || "Other";
  const source = prompt("Source (Purchased/Donated/Other):","Other") || "Other";

  const identifierType = prompt("Identifier type (Barcode/QR/None):","None") || "None";
  const identifierValue = (identifierType.toLowerCase() === "none") ? "" : (prompt("Identifier value:","") || "");

  const unit = prompt("Unit (count/weight/volume):","count") || "count";
  const qtyStr = prompt("Quantity on hand:","0") || "0";
  const qty = Number(qtyStr) || 0;

  const threshStr = prompt("Low threshold (optional):","") || "";
  const thresholdLow = threshStr.trim()==="" ? null : (Number(threshStr) || null);

  const item = {
    itemId: uid("inv"),
    name: name.trim(),
    category: category.trim(),
    source: source.trim(),
    identifierType: identifierType.trim(),
    identifierValue: identifierValue.trim(),
    qty,
    unit: unit.trim(),
    thresholdLow,
    archived: false,
    history: [{ ts: nowISO(), action:"Added", qtyDelta: qty, note:"Initial record" }]
  };

  state.inventory.push(item);
  save();
  renderInventory();
}

function adjustInventoryItem(itemId){
  const item = state.inventory.find(x=>x.itemId===itemId);
  if(!item) return;

  const action = prompt("Action (Added/Used/Discarded/Retired/Transferred):","Used");
  if(!action) return;

  // For retired/transferred: archive
  if(action === "Retired" || action === "Transferred"){
    const note = prompt("Note (optional):","") || "";
    item.archived = true;
    item.history.push({ ts: nowISO(), action, qtyDelta: 0, note });
    save();
    renderInventory();
    return;
  }

  const deltaStr = prompt("Quantity change (number):", action==="Added" ? "1" : "1") || "0";
  const delta = Number(deltaStr) || 0;
  const signed = (action==="Added") ? Math.abs(delta) : -Math.abs(delta);

  const note = prompt("Note (optional):","") || "";

  item.qty = Math.max(0, (Number(item.qty) || 0) + signed);
  item.history.push({ ts: nowISO(), action, qtyDelta: signed, note });
  save();
  renderInventory();
}

function inventoryLow(item){
  return (item.thresholdLow !== null && item.thresholdLow !== undefined && Number(item.qty) <= Number(item.thresholdLow));
}

function renderInventory(){
  const list = $("#inventoryList");
  const arch = $("#inventoryArchived");
  if(!list || !arch) return;

  const active = state.inventory.filter(i=>!i.archived);
  const archived = state.inventory.filter(i=>i.archived);

  list.innerHTML = active.length ? active.map(i=>{
    const low = inventoryLow(i);
    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name ${low ? "low":""}">${esc(i.name)}</div>
            <div class="inv-meta">
              ${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • Qty: ${esc(i.qty)}
              ${i.thresholdLow!==null ? ` • Low: ${esc(i.thresholdLow)}` : ""}
            </div>
            <div class="inv-meta">
              ${i.identifierType && i.identifierType!=="None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue)}` : "Identifier: none"}
            </div>
          </div>
        </div>
        <div class="inv-actions">
          <button class="btn" onclick="window.__invAdjust('${i.itemId}')">Update</button>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No active inventory items recorded.</div>`;

  arch.innerHTML = archived.length ? archived.map(i=>{
    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name">${esc(i.name)}</div>
            <div class="inv-meta">Archived • ${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • Qty: ${esc(i.qty)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No archived inventory items.</div>`;
}

/* Dogs/Care baseline (kept minimal here) */
function renderSelect(){
  const sel = $("#selAnimal");
  if(!sel) return;
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
  const box=$("#animalSummary");
  if(!box) return;
  box.innerHTML = `<div><strong>${esc(a.name)}</strong> · ${esc(a.breed||"")}</div><div class="muted small">${esc(a.type)}</div>`;
}

function renderTimeline(){
  const wrap=$("#timeline");
  if(!wrap) return;
  const items = state.timeline.filter(e=>e.animalId===state.selected).sort((a,b)=>new Date(a.ts)-new Date(b.ts));
  if(!items.length){ wrap.innerHTML = `<div class="muted small">No entries yet.</div>`; return; }
  wrap.innerHTML = items.map(e=>`
    <div class="timeline-item">
      <div class="muted small">${fmt(e.ts)} • ${esc(e.kind||"Care")}</div>
      <div>${esc(e.text||"")}</div>
    </div>
  `).join("");
}

function addCare(){
  const text = prompt("Action or observation:","");
  if(!text) return;
  state.timeline.push({ id:uid("t"), animalId:state.selected, kind:"Care", text:text.trim(), ts:nowISO() });
  save();
  renderTimeline();
  show("care");
}

function addFeeding(){
  const text = prompt("Feeding note:","");
  if(!text) return;
  state.timeline.push({ id:uid("t"), animalId:state.selected, kind:"Feeding", text:text.trim(), ts:nowISO() });
  save();
  renderTimeline();
  show("care");
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

function bind(){
  document.querySelectorAll("[data-nav]").forEach(b=> b.onclick = ()=> show(b.dataset.nav));

  bindInfoButtons();
  bindEmergencyHold();

  $("#btnAddCareEntry")?.addEventListener("click", addCare);
  $("#btnAddFeeding")?.addEventListener("click", addFeeding);

  $("#btnAddInventory")?.addEventListener("click", addInventoryItem);

  $("#btnToggleArchived")?.addEventListener("click", ()=>{
    const arch = $("#inventoryArchived");
    if(arch) arch.classList.toggle("hide");
  });

  $("#btnExport")?.addEventListener("click", ()=>{
    $("#exportOut").textContent = JSON.stringify({ timeline: state.timeline, inventory: state.inventory }, null, 2);
  });

  $("#btnTalk")?.addEventListener("click", ()=> alert("Voice may be used at any time."));

  $("#btnHelpAnotherPerson")?.addEventListener("click", ()=> {
    state.timeline.push({ id:uid("t"), animalId:state.selected, kind:"Helper", text:"Request recorded: another person", ts:nowISO() });
    save(); renderTimeline();
  });

  $("#btnHelpUnsafe")?.addEventListener("click", ()=> {
    state.timeline.push({ id:uid("t"), animalId:state.selected, kind:"Helper", text:"Request recorded: feels unsafe", ts:nowISO() });
    save(); renderTimeline();
  });
}

function renderAll(){
  renderSelect();
  renderSummary();
  renderTimeline();
  renderPins();
  renderInventory();
}

window.__invAdjust = (id)=> adjustInventoryItem(id);

document.addEventListener("DOMContentLoaded", ()=>{
  if(!state.selected && state.animals[0]) state.selected = state.animals[0].id;
  save();
  bind();
  show("dogs");
  renderAll();
});
