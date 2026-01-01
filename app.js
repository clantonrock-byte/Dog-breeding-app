const STORE_KEY = "breederPro_msv_v9991";
const $ = (s)=>document.querySelector(s);

function nowISO(){ return new Date().toISOString(); }
function fmt(ts){ return new Date(ts).toLocaleString(); }
function uid(p="id"){ return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

function seed(){
  const s = {
    inventory: [],
    invMeta: { lastUpdateText: "Last update: none" }
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}

function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return seed();
    const s = JSON.parse(raw);
    if(!Array.isArray(s.inventory)) s.inventory = [];
    if(!s.invMeta) s.invMeta = { lastUpdateText: "Last update: none" };
    return s;
  }catch{ return seed(); }
}

let state = load();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

/* Navigation */
function show(view){
  ["dogs","care","feeding","inventory","helpers","records"].forEach(v=>{
    const el = document.getElementById(`view${cap(v)}`);
    if(el) el.classList.toggle("hide", v!==view);
  });
}

/* Emergency hold (kept simple) */
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
      alert("Emergency Quick Card placeholder.");
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

/* Info tier toggles (if present) */
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

/* Inventory helpers */
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

/* Undo (10s) */
let undoTimer = null;
let undoPayload = null; // {kind:"add"|"update", addedItemId, itemId, beforeItem, label}

function showUndo(label){
  const btn = $("#btnInvUndo");
  if(!btn) return;

  btn.classList.remove("hide");

  if(undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(()=>{
    btn.classList.add("hide");
    undoPayload = null;
  }, 10000);

  if(undoPayload) undoPayload.label = label;
}

function applyUndo(){
  if(!undoPayload) return;

  if(undoPayload.kind === "add"){
    state.inventory = state.inventory.filter(i=>i.itemId !== undoPayload.addedItemId);
    setLastUpdate("Last update: Undo recorded");
  } else if(undoPayload.kind === "update"){
    const idx = state.inventory.findIndex(i=>i.itemId===undoPayload.itemId);
    if(idx >= 0 && undoPayload.beforeItem){
      state.inventory[idx] = undoPayload.beforeItem;
      setLastUpdate("Last update: Undo recorded");
    }
  }

  const it = state.inventory.find(i=>i.itemId === (undoPayload.itemId || undoPayload.addedItemId));
  if(it){
    it.history = it.history || [];
    it.history.push({ ts: nowISO(), action:"Undo", qtyDelta:0, note: undoPayload.label || "Undo applied" });
  }

  save();
  renderInventory();
  renderReview();

  $("#btnInvUndo")?.classList.add("hide");
  undoPayload = null;
}

/* Inventory rendering */
function esc(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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
          <button class="btn" onclick="window.__invEdit('${i.itemId}')">Edit</button>
          <button class="btn" onclick="window.__invUpdate('${i.itemId}')">Update</button>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No active inventory items recorded.</div>`;

  arch.innerHTML = archived.length ? archived.map(i=>`
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
  `).join("") : `<div class="muted small">No archived inventory items.</div>`;
}

/* Review list + exact duplicates (name exact case-insensitive/trim OR identifier exact) */
function normalizeName(n){ return String(n||"").trim().toLowerCase(); }
function normalizeId(type,value){
  if(!type || type==="None") return "";
  return `${String(type).trim().toLowerCase()}::${String(value||"").trim()}`;
}
function buildDupMaps(items){
  const nameMap = new Map();
  const idMap = new Map();
  items.forEach(i=>{
    const n = normalizeName(i.name);
    if(n) nameMap.set(n, (nameMap.get(n)||0)+1);
    const idKey = normalizeId(i.identifierType, i.identifierValue);
    if(idKey) idMap.set(idKey, (idMap.get(idKey)||0)+1);
  });
  return {nameMap,idMap};
}
function isDupExact(item,maps){
  const n = normalizeName(item.name);
  const idKey = normalizeId(item.identifierType, item.identifierValue);
  const nameDup = n && (maps.nameMap.get(n)||0) > 1;
  const idDup = idKey && (maps.idMap.get(idKey)||0) > 1;
  return nameDup || idDup;
}

function renderReview(){
  const wrap = $("#inventoryReview");
  if(!wrap || wrap.classList.contains("hide")) return;

  const listEl = $("#inventoryReviewList");
  const ctx = $("#invReviewContext");
  if(!listEl || !ctx) return;

  const active = state.inventory.filter(i=>!i.archived);

  const sorted = [...active].sort((a,b)=>{
    const al = inventoryLow(a) ? 0 : 1;
    const bl = inventoryLow(b) ? 0 : 1;
    if(al!==bl) return al-bl;
    const ac = String(a.category||"").localeCompare(String(b.category||""));
    if(ac!==0) return ac;
    return String(a.name||"").localeCompare(String(b.name||""));
  });

  const maps = buildDupMaps(sorted);
  ctx.textContent = `Active items: ${sorted.length} • Low items appear in yellow • Exact duplicates highlighted`;

  listEl.innerHTML = sorted.length ? sorted.map(i=>{
    const low = inventoryLow(i);
    const dup = isDupExact(i,maps);
    const yellow = (low || dup) ? "low" : "";
    const labels = [
      low ? `<span class="inv-flag">Low</span>` : "",
      dup ? `<span class="inv-flag">Duplicate</span>` : ""
    ].filter(Boolean).join(" ");

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
      </div>
    `;
  }).join("") : `<div class="muted small">No active inventory items recorded.</div>`;
}

/* Add/Edit modal */
let editingItemId = null;

function openInvDialog(item){
  $("#invDlgTitle").textContent = "Inventory item";
  $("#invName").value = item?.name || "";
  $("#invCategory").value = item?.category || "Food";
  $("#invSource").value = item?.source || "Other";
  $("#invIdType").value = item?.identifierType || "None";
  $("#invIdValue").value = item?.identifierValue || "";
  $("#invUnit").value = item?.unit || "count";
  $("#invQty").value = (item?.qty ?? "");
  $("#invThresh").value = (item?.thresholdLow ?? "");
  $("#invNotes").value = item?.notes || "";
  $("#dlgInv")?.showModal();
}

function saveInvFromDialog(){
  const name = ($("#invName").value||"").trim();
  if(!name) return alert("Item name is required.");

  const category = $("#invCategory").value;
  const source = $("#invSource").value;
  const idType = $("#invIdType").value;
  const idValue = ($("#invIdValue").value||"").trim();
  const unit = $("#invUnit").value;

  const qty = Number($("#invQty").value || "0") || 0;
  const threshRaw = ($("#invThresh").value||"").trim();
  const thresholdLow = threshRaw==="" ? null : (Number(threshRaw) || null);
  const notes = ($("#invNotes").value||"").trim();

  if(editingItemId){
    const it = state.inventory.find(x=>x.itemId===editingItemId);
    if(!it) return;
    const beforeItem = JSON.parse(JSON.stringify(it));

    it.name = name;
    it.category = category;
    it.source = source;
    it.identifierType = idType;
    it.identifierValue = idType==="None" ? "" : idValue;
    it.unit = unit;
    it.qty = qty;
    it.thresholdLow = thresholdLow;
    it.notes = notes;

    it.history = it.history || [];
    it.history.push({ ts: nowISO(), action:"Edited", qtyDelta:0, note:"Record updated" });

    undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Edited ${it.name}` };
    showUndo(`Undo: Edited ${it.name}`);
    setLastUpdate(`Last update: Edited · ${it.name} · ${fmt(nowISO())}`);
  } else {
    const itemId = uid("inv");
    state.inventory.push({
      itemId,
      name, category, source,
      identifierType: idType,
      identifierValue: idType==="None" ? "" : idValue,
      unit, qty, thresholdLow, notes,
      archived:false,
      history:[{ ts: nowISO(), action:"Added", qtyDelta: qty, note:"Initial record" }]
    });

    undoPayload = { kind:"add", addedItemId: itemId, label:`Undo: Added ${name}` };
    showUndo(`Undo: Added ${name}`);
    setLastUpdate(`Last update: Added · ${name} · ${fmt(nowISO())}`);
  }

  save();
  renderInventory();
  renderReview();
  $("#dlgInv")?.close();
  editingItemId = null;
}

/* Update modal */
let currentUpdateId = null;

function openUpdateDialog(itemId){
  const it = state.inventory.find(x=>x.itemId===itemId);
  if(!it) return;

  currentUpdateId = itemId;
  $("#invUpdateItemName").textContent = `Item: ${it.name}`;
  $("#invUpdateAction").value = "Used";
  $("#invUpdateQty").value = "1";
  $("#invUpdateNote").value = "";
  $("#invUpdateQtyWrap").classList.remove("hide");
  $("#dlgInvUpdate")?.showModal();
}

function saveUpdateFromDialog(){
  const it = state.inventory.find(x=>x.itemId===currentUpdateId);
  if(!it) return;

  const beforeItem = JSON.parse(JSON.stringify(it));
  const action = $("#invUpdateAction").value;
  const note = ($("#invUpdateNote").value||"").trim();

  if(action==="Retired" || action==="Transferred"){
    it.archived = true;
    it.history = it.history || [];
    it.history.push({ ts: nowISO(), action, qtyDelta:0, note });

    undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: ${action} ${it.name}` };
    showUndo(`Undo: ${action} ${it.name}`);
    setLastUpdate(`Last update: ${action} · ${it.name} · ${fmt(nowISO())}`);

    save(); renderInventory(); renderReview();
    $("#dlgInvUpdate")?.close();
    currentUpdateId = null;
    return;
  }

  const deltaRaw = Number($("#invUpdateQty").value || "0") || 0;
  const signed = (action==="Added") ? Math.abs(deltaRaw) : -Math.abs(deltaRaw);

  it.qty = Math.max(0, (Number(it.qty)||0) + signed);
  it.history = it.history || [];
  it.history.push({ ts: nowISO(), action, qtyDelta:signed, note });

  undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: ${action} ${it.name}` };
  showUndo(`Undo: ${action} ${it.name}`);
  setLastUpdate(`Last update: ${action} · ${it.name} · ${fmt(nowISO())}`);

  save(); renderInventory(); renderReview();
  $("#dlgInvUpdate")?.close();
  currentUpdateId = null;
}

/* Scanner (Confirm required) */
let scanStream = null;
let lastScanValue = "";

async function startScan(){
  const video = $("#scanVideo");
  const help = $("#scanHelp");
  const box = $("#scanResultBox");
  const val = $("#scanValue");

  lastScanValue = "";
  box.classList.add("hide");
  val.textContent = "";
  help.textContent = "";

  try{
    scanStream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
    video.srcObject = scanStream;
    await video.play();
  }catch{
    help.textContent = "Camera access unavailable. Manual entry remains available.";
    return;
  }

  if(!("BarcodeDetector" in window)){
    help.textContent = "Scanner not supported on this browser. Manual entry remains available.";
    return;
  }

  let detector;
  try{
    detector = new BarcodeDetector({ formats:["qr_code","code_128","ean_13","ean_8","upc_a","upc_e"] });
  }catch{
    detector = new BarcodeDetector();
  }

  help.textContent = "Point camera at code. Confirm is required after a scan.";

  const loop = async ()=>{
    if(!scanStream) return;
    try{
      const codes = await detector.detect(video);
      if(codes && codes.length){
        const raw = codes[0].rawValue || "";
        if(raw){
          lastScanValue = raw;
          box.classList.remove("hide");
          val.textContent = raw;
          stopScanStream();
          return;
        }
      }
    }catch{}
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function stopScanStream(){
  const video = $("#scanVideo");
  if(video) video.pause();
  if(scanStream){
    scanStream.getTracks().forEach(t=>t.stop());
    scanStream = null;
  }
}

function openScanDialog(){
  $("#dlgScan")?.showModal();
  startScan();
}

function closeScanDialog(){
  stopScanStream();
  $("#dlgScan")?.close();
}

function confirmScan(){
  if(!lastScanValue) return;
  $("#invIdValue").value = lastScanValue;

  // cuz human: ensure type isn't None once a scan is confirmed
  if($("#invIdType").value === "None") $("#invIdType").value = "Barcode";

  closeScanDialog();
}

/* Bind */
function bind(){
  document.querySelectorAll("[data-nav]").forEach(b=> b.onclick = ()=> show(b.dataset.nav));

  bindInfoButtons();
  bindEmergencyHold();

  // Inventory UI
  $("#btnAddInventory")?.addEventListener("click", ()=>{
    editingItemId = null;
    openInvDialog(null);
  });

  $("#btnSaveInv")?.addEventListener("click", (e)=>{
    e.preventDefault();
    saveInvFromDialog();
  });

  $("#btnScanId")?.addEventListener("click", ()=> openScanDialog());
  $("#btnClearId")?.addEventListener("click", ()=> { $("#invIdValue").value=""; });

  $("#btnRescan")?.addEventListener("click", ()=> startScan());
  $("#btnConfirmScan")?.addEventListener("click", ()=> confirmScan());
  $("#btnCloseScan")?.addEventListener("click", ()=> closeScanDialog());
  $("#dlgScan")?.addEventListener("close", ()=> stopScanStream());

  $("#btnInvUndo")?.addEventListener("click", ()=> applyUndo());

  $("#btnReviewInventory")?.addEventListener("click", ()=>{
    $("#inventoryList")?.classList.add("hide");
    $("#inventoryArchived")?.classList.add("hide");
    $("#inventoryReview")?.classList.remove("hide");
    renderReview();
  });

  $("#btnBackToInventory")?.addEventListener("click", ()=>{
    $("#inventoryReview")?.classList.add("hide");
    $("#inventoryList")?.classList.remove("hide");
  });

  $("#btnToggleArchived")?.addEventListener("click", ()=> $("#inventoryArchived")?.classList.toggle("hide"));

  $("#invUpdateAction")?.addEventListener("change", ()=>{
    const a = $("#invUpdateAction").value;
    if(a==="Retired" || a==="Transferred") $("#invUpdateQtyWrap").classList.add("hide");
    else $("#invUpdateQtyWrap").classList.remove("hide");
  });

  $("#btnInvUpdateSave")?.addEventListener("click", (e)=>{
    e.preventDefault();
    saveUpdateFromDialog();
  });

  // Last update restore
  $("#invLastUpdate") && ($("#invLastUpdate").textContent = state.invMeta.lastUpdateText || "Last update: none");

  $("#btnTalk")?.addEventListener("click", ()=> alert("Voice may be used at any time."));
}

/* Hook buttons */
window.__invEdit = (id)=>{
  const it = state.inventory.find(x=>x.itemId===id);
  if(!it) return;
  editingItemId = id;
  openInvDialog(it);
};
window.__invUpdate = (id)=> openUpdateDialog(id);

document.addEventListener("DOMContentLoaded", ()=>{
  bind();
  renderInventory();
  show("dogs");
});
