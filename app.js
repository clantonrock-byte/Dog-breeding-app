const STORE_KEY = "breederPro_msv_v7001";
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
    inventory: [],
    invMeta: { lastUpdateText: "Last update: none" }
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
    if(!s.invMeta) s.invMeta = { lastUpdateText: "Last update: none" };
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

/* Emergency 2s hold */
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
function inventoryLow(item){
  return (item.thresholdLow !== null && item.thresholdLow !== undefined && item.thresholdLow !== "" &&
          Number(item.qty) <= Number(item.thresholdLow));
}

function setLastUpdate(text){
  state.invMeta.lastUpdateText = text;
  save();
  const el = $("#invLastUpdate");
  if(el) el.textContent = text;
}

let undoTimer = null;
let undoPayload = null; // {kind, itemId, beforeItem, beforeIndex, addedItem, timestampISO, displayText}

function showUndo(displayText){
  const btn = $("#btnInvUndo");
  if(!btn) return;

  btn.classList.remove("hide");
  btn.textContent = `Undo`;
  btn.dataset.undoText = displayText;

  if(undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(()=>{
    btn.classList.add("hide");
    undoPayload = null;
  }, 10000);
}

function applyUndo(){
  if(!undoPayload) return;

  // Undo logic is snapshot-based for safety.
  const { kind, itemId, beforeItem, beforeIndex, addedItem, displayText } = undoPayload;

  if(kind === "add"){
    // remove the added item
    state.inventory = state.inventory.filter(i=>i.itemId !== addedItem.itemId);
    setLastUpdate(`Last update: Undo — removed added item`);
  } else if(kind === "update"){
    // restore the whole item snapshot
    const idx = state.inventory.findIndex(i=>i.itemId===itemId);
    if(idx >= 0 && beforeItem){
      state.inventory[idx] = beforeItem;
      setLastUpdate(`Last update: Undo — restored previous state`);
    }
  }

  // Record an undo event in history to keep the record honest.
  // (Append-only with compensating entry.)
  const idx2 = state.inventory.findIndex(i=>i.itemId===itemId);
  if(idx2 >= 0){
    state.inventory[idx2].history = state.inventory[idx2].history || [];
    state.inventory[idx2].history.push({ ts: nowISO(), action:"Undo", qtyDelta:0, note: displayText || "Undo applied" });
  }

  save();
  renderInventory();
  renderReview(); // if review open, refresh
  // hide undo button
  $("#btnInvUndo")?.classList.add("hide");
  undoPayload = null;
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
              ${i.thresholdLow!==null && i.thresholdLow!=="" ? ` • Low: ${esc(i.thresholdLow)}` : ""}
            </div>
            <div class="inv-meta">
              ${i.identifierType && i.identifierType!=="None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue||"")}` : "Identifier: none"}
            </div>
          </div>
        </div>
        <div class="inv-actions">
          <button class="btn" onclick="window.__invUpdate('${i.itemId}')">Update</button>
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
            <div class="inv-meta">
              ${i.identifierType && i.identifierType!=="None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue||"")}` : "Identifier: none"}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No archived inventory items.</div>`;
}

/* Add inventory (prompt-based for now) */
function addInventoryItem(){
  const name = prompt("Item name/label:",""); if(!name) return;

  const category = prompt("Category (Food/Treat/Topper/Supplement/Toy/Blanket/Coat/Equipment/Other):","Food") || "Other";
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
  setLastUpdate(`Last update: Added · ${item.name} · ${fmt(nowISO())}`);

  // Undo payload
  undoPayload = {
    kind: "add",
    itemId: item.itemId,
    addedItem: item,
    displayText: `Undo: Added ${item.name}`
  };
  showUndo(`Undo: Added ${item.name}`);

  save();
  renderInventory();
}

/* Update inventory item (prompt-based for now) */
function adjustInventoryItem(itemId){
  const item = state.inventory.find(x=>x.itemId===itemId);
  if(!item) return;

  // snapshot before change for undo
  const beforeItem = JSON.parse(JSON.stringify(item));

  const action = prompt("Action (Added/Used/Discarded/Retired/Transferred):","Used");
  if(!action) return;

  if(action === "Retired" || action === "Transferred"){
    const note = prompt("Note (optional):","") || "";
    item.archived = true;
    item.history.push({ ts: nowISO(), action, qtyDelta: 0, note });
    setLastUpdate(`Last update: ${action} · ${item.name} · ${fmt(nowISO())}`);

    undoPayload = {
      kind: "update",
      itemId: item.itemId,
      beforeItem,
      displayText: `Undo: ${action} ${item.name}`
    };
    showUndo(`Undo: ${action} ${item.name}`);

    save();
    renderInventory();
    return;
  }

  const deltaStr = prompt("Quantity change (number):", "1") || "0";
  const delta = Number(deltaStr) || 0;
  const signed = (action==="Added") ? Math.abs(delta) : -Math.abs(delta);
  const note = prompt("Note (optional):","") || "";

  item.qty = Math.max(0, (Number(item.qty) || 0) + signed);
  item.history.push({ ts: nowISO(), action, qtyDelta: signed, note });

  setLastUpdate(`Last update: ${action} · ${item.name} · ${fmt(nowISO())}`);

  undoPayload = {
    kind: "update",
    itemId: item.itemId,
    beforeItem,
    displayText: `Undo: ${action} ${item.name}`
  };
  showUndo(`Undo: ${action} ${item.name}`);

  save();
  renderInventory();
}

/* Review list (compiled) */
function normalizeName(n){
  return String(n||"").trim().toLowerCase();
}
function normalizeId(type, value){
  if(!type || type==="None") return "";
  return `${String(type).trim().toLowerCase()}::${String(value||"").trim()}`;
}

function buildExactDuplicateMap(items){
  const nameMap = new Map();
  const idMap = new Map();

  items.forEach(i=>{
    const n = normalizeName(i.name);
    if(n){
      nameMap.set(n, (nameMap.get(n)||0) + 1);
    }
    const idKey = normalizeId(i.identifierType, i.identifierValue);
    if(idKey){
      idMap.set(idKey, (idMap.get(idKey)||0) + 1);
    }
  });

  return { nameMap, idMap };
}

function isExactDuplicate(item, maps){
  const n = normalizeName(item.name);
  const idKey = normalizeId(item.identifierType, item.identifierValue);
  const nameDup = n && (maps.nameMap.get(n) || 0) > 1;
  const idDup = idKey && (maps.idMap.get(idKey) || 0) > 1;
  return nameDup || idDup;
}

function renderReview(){
  const reviewWrap = $("#inventoryReview");
  if(!reviewWrap || reviewWrap.classList.contains("hide")) return;

  const listEl = $("#inventoryReviewList");
  const ctx = $("#invReviewContext");
  if(!listEl || !ctx) return;

  const active = state.inventory.filter(i=>!i.archived);

  // sort: low first, then category, then name
  const sorted = [...active].sort((a,b)=>{
    const al = inventoryLow(a) ? 0 : 1;
    const bl = inventoryLow(b) ? 0 : 1;
    if(al !== bl) return al - bl;
    const ac = String(a.category||"").localeCompare(String(b.category||""));
    if(ac !== 0) return ac;
    return String(a.name||"").localeCompare(String(b.name||""));
  });

  const maps = buildExactDuplicateMap(sorted);

  ctx.textContent = `Active items: ${sorted.length} • Low items appear in yellow • Exact duplicates are highlighted`;

  listEl.innerHTML = sorted.length ? sorted.map(i=>{
    const low = inventoryLow(i);
    const dup = isExactDuplicate(i, maps);

    const labels = [
      low ? `<span class="inv-flag">Low</span>` : "",
      dup ? `<span class="inv-flag">Duplicate</span>` : ""
    ].filter(Boolean).join(" ");

    // yellow cue for low OR duplicate
    const yellow = (low || dup) ? "low" : "";

    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name ${yellow}">${esc(i.name)} ${labels}</div>
            <div class="inv-meta">
              ${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • Qty: ${esc(i.qty)}
              ${i.thresholdLow!==null && i.thresholdLow!=="" ? ` • Low: ${esc(i.thresholdLow)}` : ""}
            </div>
            <div class="inv-meta">
              ${i.identifierType && i.identifierType!=="None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue||"")}` : "Identifier: none"}
            </div>
          </div>
        </div>
        <div class="inv-actions">
          <button class="btn" onclick="window.__invUpdate('${i.itemId}')">Update</button>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No active inventory items recorded.</div>`;
}

/* Minimal other sections */
function renderSelect(){ /* optional, not required for inventory pack */ }
function renderSummary(){ /* optional */ }
function renderTimeline(){ /* optional */ }
function renderPins(){ /* optional */ }

function bind(){
  document.querySelectorAll("[data-nav]").forEach(b=> b.onclick = ()=> show(b.dataset.nav));

  bindInfoButtons();
  bindEmergencyHold();

  // Inventory buttons
  $("#btnAddInventory")?.addEventListener("click", addInventoryItem);

  $("#btnToggleArchived")?.addEventListener("click", ()=>{
    $("#inventoryArchived")?.classList.toggle("hide");
  });

  $("#btnReviewInventory")?.addEventListener("click", ()=>{
    // swap view
    $("#inventoryList")?.classList.add("hide");
    $("#inventoryArchived")?.classList.add("hide");
    $("#inventoryReview")?.classList.remove("hide");
    renderReview();
  });

  $("#btnBackToInventory")?.addEventListener("click", ()=>{
    $("#inventoryReview")?.classList.add("hide");
    $("#inventoryList")?.classList.remove("hide");
    // archived stays hidden unless toggled
  });

  // Undo button
  $("#btnInvUndo")?.addEventListener("click", ()=>{
    applyUndo();
  });

  // Restore last update line on load
  $("#invLastUpdate") && ($("#invLastUpdate").textContent = state.invMeta.lastUpdateText || "Last update: none");

  // Talk
  $("#btnTalk")?.addEventListener("click", ()=> alert("Voice may be used at any time."));
}

window.__invUpdate = (id)=> adjustInventoryItem(id);

document.addEventListener("DOMContentLoaded", ()=>{
  bind();
  renderInventory();
});
