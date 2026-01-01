const STORE_KEY = "breederPro_menu1";
const $ = (s) => document.querySelector(s);

function nowISO() { return new Date().toISOString(); }
function fmt(ts) { return new Date(ts).toLocaleString(); }
function uid(p = "id") { return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function seed() {
  const s = {
    inventory: [],
    invMeta: { lastUpdateText: "Last update: none" }
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seed();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.inventory)) s.inventory = [];
    if (!s.invMeta) s.invMeta = { lastUpdateText: "Last update: none" };
    s.inventory.forEach(it => {
      if (it.weightPerUnit === undefined) it.weightPerUnit = "";
      if (it.notes === undefined) it.notes = "";
      if (it.identifierType === undefined) it.identifierType = "None";
      if (it.identifierValue === undefined) it.identifierValue = "";
      if (it.history === undefined) it.history = [];
      if (it.archived === undefined) it.archived = false;
      if (it.qty === undefined) it.qty = 0;
      if (it.thresholdLow === undefined) it.thresholdLow = null;
      if (it.unit === undefined) it.unit = "count";
    });
    return s;
  } catch {
    return seed();
  }
}

let state = load();
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

/* -------------------------
   View navigation (3 levels)
-------------------------- */

const VIEWS = [
  "Home",
  "InventoryMenu",
  "InventoryCurrent",
  "InventoryAdd",
  "InventoryTransfer",
  "InventoryReview",
  "Dogs",
  "Care",
  "Feeding",
  "Helpers",
  "Records",
];

function showView(id) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view${v}`);
    if (el) el.classList.toggle("hide", v !== id);
  });
}

function goHome() { showView("Home"); }
function goInventoryMenu() { showView("InventoryMenu"); }

function bindHomeNavigation() {
  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dest = btn.dataset.go;
      if (dest === "inventory") {
        goInventoryMenu();
        renderInventoryArchivedMenu();
      } else if (dest === "dogs") showView("Dogs");
      else if (dest === "care") showView("Care");
      else if (dest === "feeding") showView("Feeding");
      else if (dest === "helpers") showView("Helpers");
      else if (dest === "records") showView("Records");
    });
  });

  document.querySelectorAll("[data-home]").forEach(btn => {
    btn.addEventListener("click", () => goHome());
  });

  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      const backTo = btn.dataset.back;
      if (backTo === "home") goHome();
      else if (backTo === "inventoryMenu") goInventoryMenu();
      else goHome();
    });
  });
}

/* -------------------------
   Inventory core helpers
-------------------------- */

function inventoryLow(it) {
  return (it.thresholdLow !== null && it.thresholdLow !== undefined && it.thresholdLow !== "" &&
    Number(it.qty) <= Number(it.thresholdLow));
}

function setLastUpdate(text) {
  state.invMeta.lastUpdateText = text;
  save();
}

function normalizeId(t, v) {
  if (!t || t === "None") return "";
  return `${String(t).trim()}::${String(v || "").trim()}`;
}

function findItemByIdentifier(type, value) {
  const t = String(type || "").trim();
  const v = String(value || "").trim();
  if (!t || t === "None" || !v) return null;
  return state.inventory.find(it => it.identifierType === t && String(it.identifierValue || "").trim() === v) || null;
}

/* Undo (10 seconds) */
let undoTimer = null;
let undoPayload = null; // {kind:"add"|"update", addedItemId, itemId, beforeItem, label}

function showUndo(label) {
  const btn = document.getElementById("btnInvUndo");
  if (!btn) return;
  btn.classList.remove("hide");

  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    btn.classList.add("hide");
    undoPayload = null;
  }, 10000);

  if (undoPayload) undoPayload.label = label;
}

function applyUndo() {
  if (!undoPayload) return;

  if (undoPayload.kind === "add") {
    state.inventory = state.inventory.filter(i => i.itemId !== undoPayload.addedItemId);
    setLastUpdate("Last update: Undo recorded");
  } else if (undoPayload.kind === "update") {
    const idx = state.inventory.findIndex(i => i.itemId === undoPayload.itemId);
    if (idx >= 0 && undoPayload.beforeItem) {
      state.inventory[idx] = undoPayload.beforeItem;
      setLastUpdate("Last update: Undo recorded");
    }
  }

  save();
  renderInventoryList();
  renderInventoryReview();
  renderInventoryArchivedMenu();

  const btn = document.getElementById("btnInvUndo");
  if (btn) btn.classList.add("hide");
  undoPayload = null;
}

/* -------------------------
   Inventory rendering
-------------------------- */

function renderInventoryList() {
  const list = document.getElementById("inventoryList");
  if (!list) return;

  const active = state.inventory.filter(i => !i.archived);

  if (!active.length) {
    list.innerHTML = `<div class="muted small">No active inventory items recorded.</div>`;
    return;
  }

  list.innerHTML = active.map(i => {
    const low = inventoryLow(i);
    const w = i.weightPerUnit ? ` • W/unit: ${esc(i.weightPerUnit)}` : "";
    const stock = `On hand: ${esc(i.qty)}${i.thresholdLow !== null && i.thresholdLow !== "" ? ` • Low: ${esc(i.thresholdLow)}` : ""}`;

    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name ${low ? "low" : ""}">${esc(i.name)}</div>
            <div class="inv-meta">${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • ${stock}${w}</div>
            <div class="inv-meta">${i.identifierType !== "None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue || "")}` : "Identifier: none"}</div>
          </div>
        </div>
        <div class="inv-actions">
          <button class="btn" onclick="window.__invEdit('${i.itemId}')">Edit</button>
          <button class="btn" onclick="window.__invUpdate('${i.itemId}')">Update</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderInventoryArchivedCurrent() {
  const arch = document.getElementById("inventoryArchived");
  if (!arch) return;

  const archived = state.inventory.filter(i => i.archived);
  if (!archived.length) {
    arch.innerHTML = `<div class="muted small">No archived inventory items.</div>`;
    return;
  }

  arch.innerHTML = archived.map(i => {
    const w = i.weightPerUnit ? ` • W/unit: ${esc(i.weightPerUnit)}` : "";
    const stock = `On hand: ${esc(i.qty)}${i.thresholdLow !== null && i.thresholdLow !== "" ? ` • Low: ${esc(i.thresholdLow)}` : ""}`;
    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name">${esc(i.name)}</div>
            <div class="inv-meta">Archived • ${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • ${stock}${w}</div>
            <div class="inv-meta">${i.identifierType !== "None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue || "")}` : "Identifier: none"}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderInventoryArchivedMenu() {
  const box = document.getElementById("inventoryArchivedMenu");
  if (!box) return;

  const archived = state.inventory.filter(i => i.archived);
  if (!archived.length) {
    box.innerHTML = `<div class="muted small">No archived inventory items.</div>`;
    return;
  }
  box.innerHTML = archived.map(i => `
    <div class="timeline-item">
      <div><strong>${esc(i.name)}</strong></div>
      <div class="muted small">Archived • On hand: ${esc(i.qty)}</div>
    </div>
  `).join("");
}

function normalizeName(n){ return String(n||"").trim().toLowerCase(); }

function buildDupMaps(items){
  const nameMap=new Map(); const idMap=new Map();
  items.forEach(i=>{
    const n=normalizeName(i.name); if(n) nameMap.set(n,(nameMap.get(n)||0)+1);
    const k=normalizeId(i.identifierType,i.identifierValue); if(k) idMap.set(k,(idMap.get(k)||0)+1);
  });
  return {nameMap,idMap};
}
function isDupExact(i,m){
  const n=normalizeName(i.name);
  const k=normalizeId(i.identifierType,i.identifierValue);
  return (n && (m.nameMap.get(n)||0)>1) || (k && (m.idMap.get(k)||0)>1);
}

function renderInventoryReview() {
  const listEl = document.getElementById("inventoryReviewList");
  const ctx = document.getElementById("invReviewContext");
  if (!listEl || !ctx) return;

  const active = state.inventory.filter(i => !i.archived);
  const sorted = [...active].sort((a, b) => {
    const al = inventoryLow(a) ? 0 : 1;
    const bl = inventoryLow(b) ? 0 : 1;
    if (al !== bl) return al - bl;
    const ac = String(a.category || "").localeCompare(String(b.category || ""));
    if (ac !== 0) return ac;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const maps = buildDupMaps(sorted);
  ctx.textContent = `Active items: ${sorted.length} • Low items appear in yellow • Exact duplicates highlighted`;

  if (!sorted.length) {
    listEl.innerHTML = `<div class="muted small">No active inventory items recorded.</div>`;
    return;
  }

  listEl.innerHTML = sorted.map(i => {
    const low = inventoryLow(i);
    const dup = isDupExact(i, maps);
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
            <div class="inv-meta">${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • On hand: ${esc(i.qty)}</div>
            <div class="inv-meta">${i.identifierType !== "None" ? `${esc(i.identifierType)}: ${esc(i.identifierValue || "")}` : "Identifier: none"}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* -------------------------
   Inventory dialogs
-------------------------- */

/** Definition only */
let editingItemId = null;

function openInvDialog(item) {
  $("#invName").value = item?.name || "";
  $("#invCategory").value = item?.category || "Food";
  $("#invSource").value = item?.source || "Other";
  $("#invIdType").value = item?.identifierType || "None";
  $("#invIdValue").value = item?.identifierValue || "";
  $("#invUnit").value = item?.unit || "count";
  $("#invNotes").value = item?.notes || "";
  $("#invWeightPerUnit").value = item?.weightPerUnit || "";
  document.getElementById("dlgInv")?.showModal();
}

let pendingMatchedItem = null;
let assumeSessionIdKey = "";

function saveInvFromDialog() {
  const name = ($("#invName").value || "").trim();
  if (!name) return alert("Item name is required.");

  const category = $("#invCategory").value;
  const source = $("#invSource").value;
  const idType = $("#invIdType").value;
  const idValue = ($("#invIdValue").value || "").trim();
  const unit = $("#invUnit").value;
  const notes = ($("#invNotes").value || "").trim();
  const weightPerUnit = ($("#invWeightPerUnit").value || "").trim();

  // Prevent duplicate records for exact identifier match
  if (!editingItemId && idType !== "None" && idValue) {
    const match = findItemByIdentifier(idType, idValue);
    if (match) {
      pendingMatchedItem = match;
      document.getElementById("scanMatchName").textContent = `This matches: ${match.name}`;
      $("#scanMatchMulti").value = "";
      $("#scanMatchAssumeSession").checked = false;
      document.getElementById("dlgInv")?.close();
      document.getElementById("dlgScanMatch")?.showModal();
      return;
    }
  }

  if (editingItemId) {
    const it = state.inventory.find(x => x.itemId === editingItemId);
    if (!it) return;
    const beforeItem = JSON.parse(JSON.stringify(it));

    it.name = name;
    it.category = category;
    it.source = source;
    it.identifierType = idType;
    it.identifierValue = (idType === "None" ? "" : idValue);
    it.unit = unit;
    it.notes = notes;
    it.weightPerUnit = weightPerUnit;

    it.history.push({ ts: nowISO(), action: "Edited", qtyDelta: 0, note: "Definition updated" });

    undoPayload = { kind: "update", itemId: it.itemId, beforeItem, label: `Undo: Edited ${it.name}` };
    showUndo(`Undo: Edited ${it.name}`);
    setLastUpdate(`Last update: Edited · ${it.name} · ${fmt(nowISO())}`);
  } else {
    const itemId = uid("inv");
    state.inventory.push({
      itemId,
      name, category, source,
      identifierType: idType,
      identifierValue: (idType === "None" ? "" : idValue),
      unit,
      qty: 0,
      thresholdLow: null,
      notes,
      weightPerUnit,
      archived: false,
      history: [{ ts: nowISO(), action: "Created", qtyDelta: 0, note: "Definition recorded" }]
    });

    undoPayload = { kind: "add", addedItemId: itemId, label: `Undo: Created ${name}` };
    showUndo(`Undo: Created ${name}`);
    setLastUpdate(`Last update: Created · ${name} · ${fmt(nowISO())}`);
  }

  save();
  renderInventoryList();
  renderInventoryReview();
  renderInventoryArchivedMenu();

  document.getElementById("dlgInv")?.close();
  editingItemId = null;
}

/** Update = stock+threshold+transfer */
let currentUpdateId = null;

function openUpdateDialog(itemId, presetAction) {
  const it = state.inventory.find(x => x.itemId === itemId);
  if (!it) return;

  currentUpdateId = itemId;

  $("#invUpdateItemName").textContent = `Item: ${it.name}`;
  $("#invUpdateCurrentQty").textContent = `Current on hand: ${it.qty} ${it.unit}`;
  $("#invUpdateAction").value = presetAction || "Added";
  $("#invUpdateQty").value = "1";
  $("#invUpdateNote").value = "";
  $("#invUpdateThreshold").value = (it.thresholdLow ?? "");

  // show transfer fields if needed
  document.getElementById("transferWrap").classList.toggle("hide", (presetAction || "Added") !== "Transferred");

  document.getElementById("dlgInvUpdate")?.showModal();
}

function saveUpdateFromDialog() {
  const it = state.inventory.find(x => x.itemId === currentUpdateId);
  if (!it) return;

  const beforeItem = JSON.parse(JSON.stringify(it));
  const action = $("#invUpdateAction").value;
  const note = ($("#invUpdateNote").value || "").trim();

  const threshRaw = ($("#invUpdateThreshold").value || "").trim();
  it.thresholdLow = threshRaw === "" ? null : (Number(threshRaw) || null);

  // Transfer payload
  let transfer = null;
  if (action === "Transferred") {
    transfer = {
      destinationType: ($("#transferType").value || "").trim(),
      destinationDetail: ($("#transferDetail").value || "").trim(),
      contactPerson: ($("#transferContactPerson").value || "").trim(),
      contactMethod: ($("#transferContactMethod").value || "").trim(),
      contactDetails: ($("#transferContactDetails").value || "").trim()
    };
  }

  if (action === "Retired") {
    const dec = Math.abs(Number($("#invUpdateQty").value || "0") || it.qty || 0);
    it.qty = Math.max(0, (Number(it.qty) || 0) - dec);
    it.archived = true;
    it.history.push({ ts: nowISO(), action: "Retired", qtyDelta: -dec, note, transfer: null });

    undoPayload = { kind: "update", itemId: it.itemId, beforeItem, label: `Undo: Retired ${it.name}` };
    showUndo(`Undo: Retired ${it.name}`);
    setLastUpdate(`Last update: Retired · ${it.name} · ${fmt(nowISO())}`);

    save();
    renderInventoryList();
    renderInventoryReview();
    renderInventoryArchivedMenu();
    renderInventoryArchivedCurrent();

    document.getElementById("dlgInvUpdate")?.close();
    currentUpdateId = null;
    return;
  }

  if (action === "Transferred") {
    const dec = Math.abs(Number($("#invUpdateQty").value || "0") || 0);
    it.qty = Math.max(0, (Number(it.qty) || 0) - dec);
    it.history.push({ ts: nowISO(), action: "Transferred", qtyDelta: -dec, note, transfer });

    undoPayload = { kind: "update", itemId: it.itemId, beforeItem, label: `Undo: Transferred ${it.name}` };
    showUndo(`Undo: Transferred ${it.name}`);
    setLastUpdate(`Last update: Transferred · ${it.name} · ${fmt(nowISO())}`);

    save();
    renderInventoryList();
    renderInventoryReview();
    renderInventoryArchivedMenu();
    renderInventoryArchivedCurrent();

    document.getElementById("dlgInvUpdate")?.close();
    currentUpdateId = null;
    return;
  }

  // Added / Used / Discarded
  const deltaRaw = Number($("#invUpdateQty").value || "0") || 0;
  const signed = (action === "Added") ? Math.abs(deltaRaw) : -Math.abs(deltaRaw);
  it.qty = Math.max(0, (Number(it.qty) || 0) + signed);
  it.history.push({ ts: nowISO(), action, qtyDelta: signed, note, transfer: null });

  undoPayload = { kind: "update", itemId: it.itemId, beforeItem, label: `Undo: ${action} ${it.name}` };
  showUndo(`Undo: ${action} ${it.name}`);
  setLastUpdate(`Last update: ${action} · ${it.name} · ${fmt(nowISO())}`);

  save();
  renderInventoryList();
  renderInventoryReview();
  renderInventoryArchivedMenu();
  renderInventoryArchivedCurrent();

  document.getElementById("dlgInvUpdate")?.close();
  currentUpdateId = null;
}

/* -------------------------
   Scan + bulk match + transfer scan mode
-------------------------- */

let scanStream = null;
let lastScanValue = "";
let transferScanMode = false;

async function startScan() {
  const video = $("#scanVideo");
  const help = $("#scanHelp");
  const box = $("#scanResultBox");
  const val = $("#scanValue");

  lastScanValue = "";
  box.classList.add("hide");
  val.textContent = "";
  help.textContent = "";

  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = scanStream;
    await video.play();
  } catch {
    help.textContent = "Camera access unavailable. Manual entry remains available.";
    return;
  }

  if (!("BarcodeDetector" in window)) {
    help.textContent = "Scanner not supported on this browser. Manual entry remains available.";
    return;
  }

  let detector;
  try {
    detector = new BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "ean_8", "upc_a", "upc_e"] });
  } catch {
    detector = new BarcodeDetector();
  }

  help.textContent = "Point camera at code. Confirm is required after a scan.";

  const loop = async () => {
    if (!scanStream) return;
    try {
      const codes = await detector.detect(video);
      if (codes && codes.length) {
        const raw = codes[0].rawValue || "";
        if (raw) {
          lastScanValue = raw;
          box.classList.remove("hide");
          val.textContent = raw;
          stopScanStream();
          return;
        }
      }
    } catch { /* ignore */ }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function stopScanStream() {
  const video = $("#scanVideo");
  if (video) video.pause();
  if (scanStream) {
    scanStream.getTracks().forEach(t => t.stop());
    scanStream = null;
  }
}

function openScanDialog() {
  document.getElementById("dlgScan")?.showModal();
  startScan();
}

function closeScanDialog() {
  stopScanStream();
  document.getElementById("dlgScan")?.close();
}

function addUnitsToMatched(count){
  if(!pendingMatchedItem) return;
  const it = state.inventory.find(x=>x.itemId===pendingMatchedItem.itemId);
  if(!it) return;

  const beforeItem = JSON.parse(JSON.stringify(it));
  const add = Math.max(0, Number(count)||0);
  if(add<=0) return;

  it.qty = (Number(it.qty)||0) + add;
  it.history.push({ ts: nowISO(), action:"Added", qtyDelta:add, note:"Scan match add", transfer:null });

  undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Added ${add} units to ${it.name}` };
  showUndo(`Undo: Added ${add} units to ${it.name}`);
  setLastUpdate(`Last update: Added · ${it.name} · ${fmt(nowISO())}`);

  save();
  renderInventoryList();
  renderInventoryReview();
  renderInventoryArchivedMenu();
  renderInventoryArchivedCurrent();
}

function confirmScan() {
  if (!lastScanValue) return;

  const scannedType = ($("#invIdType").value && $("#invIdType").value !== "None") ? $("#invIdType").value : "Barcode";

  // Transfer scan mode routes to Update -> Transferred
  if (transferScanMode) {
    transferScanMode = false;
    const it = findItemByIdentifier(scannedType, lastScanValue);
    closeScanDialog();
    if (!it) {
      alert("No matching item found for this identifier. Create the item definition first.");
      return;
    }
    // Go straight to transfer update page/view
    showView("InventoryTransfer");
    openUpdateDialog(it.itemId, "Transferred");
    return;
  }

  // Bulk match
  const match = findItemByIdentifier(scannedType, lastScanValue);
  if (match) {
    pendingMatchedItem = match;
    document.getElementById("scanMatchName").textContent = `This matches: ${match.name}`;
    $("#scanMatchMulti").value = "";
    $("#scanMatchAssumeSession").checked = false;
    closeScanDialog();
    document.getElementById("dlgScanMatch")?.showModal();
    return;
  }

  // New identifier just fills the definition dialog fields
  $("#invIdType").value = scannedType;
  $("#invIdValue").value = lastScanValue;
  closeScanDialog();
}

/* -------------------------
   Inventory menu actions
-------------------------- */

function invShowCurrent(){
  showView("InventoryCurrent");
  renderInventoryList();
  renderInventoryArchivedCurrent();
}

function invShowAdd(){
  showView("InventoryAdd");
}

function invShowTransfer(){
  showView("InventoryTransfer");
}

function invShowReview(){
  showView("InventoryReview");
  renderInventoryReview();
}

function toggleArchivedMenu(){
  const box = document.getElementById("inventoryArchivedMenu");
  if(!box) return;
  box.classList.toggle("hide");
  renderInventoryArchivedMenu();
}

/* -------------------------
   Bindings
-------------------------- */

function bind() {
  bindHomeNavigation();

  // Inventory menu buttons
  document.querySelectorAll("[data-inv]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const action = btn.dataset.inv;
      if(action === "current") invShowCurrent();
      if(action === "add") invShowAdd();
      if(action === "transfer") invShowTransfer();
      if(action === "review") invShowReview();
    });
  });

  // Archived toggle in menu
  $("#btnToggleArchivedMenu")?.addEventListener("click", toggleArchivedMenu);

  // Current page archived toggle
  $("#btnToggleArchivedCurrent")?.addEventListener("click", ()=>{
    document.getElementById("inventoryArchived")?.classList.toggle("hide");
    renderInventoryArchivedCurrent();
  });

  // Add page action
  $("#btnOpenAddDialog")?.addEventListener("click", ()=>{
    editingItemId = null;
    openInvDialog(null);
  });

  // Transfer page action
  $("#btnTransferScan")?.addEventListener("click", ()=>{
    transferScanMode = true;
    openScanDialog();
  });

  // Definition dialog buttons
  $("#btnSaveInv")?.addEventListener("click", (e) => {
    e.preventDefault();
    saveInvFromDialog();
  });

  $("#btnScanId")?.addEventListener("click", () => openScanDialog());
  $("#btnClearId")?.addEventListener("click", () => { $("#invIdValue").value = ""; });

  // Scan dialog buttons
  $("#btnRescan")?.addEventListener("click", () => startScan());
  $("#btnConfirmScan")?.addEventListener("click", () => confirmScan());
  $("#btnCloseScan")?.addEventListener("click", () => closeScanDialog());
  document.getElementById("dlgScan")?.addEventListener("close", ()=> stopScanStream());

  // Update dialog controls
  $("#invUpdateAction")?.addEventListener("change", ()=>{
    const a = $("#invUpdateAction").value;
    document.getElementById("transferWrap").classList.toggle("hide", a !== "Transferred");
  });

  $("#btnInvUpdateSave")?.addEventListener("click", (e)=>{
    e.preventDefault();
    saveUpdateFromDialog();
  });

  // Match dialog
  $("#btnScanAddOne")?.addEventListener("click", ()=>{
    addUnitsToMatched(1);
    document.getElementById("dlgScanMatch")?.close();
    pendingMatchedItem = null;
  });
  $("#btnScanAddMulti")?.addEventListener("click", ()=>{
    const n = Number(($("#scanMatchMulti").value||"").trim() || "0") || 0;
    if(n>0) addUnitsToMatched(n);
    document.getElementById("dlgScanMatch")?.close();
    pendingMatchedItem = null;
  });
  $("#btnScanNotNow")?.addEventListener("click", ()=>{
    document.getElementById("dlgScanMatch")?.close();
    pendingMatchedItem = null;
  });

  // Undo
  $("#btnInvUndo")?.addEventListener("click", ()=> applyUndo());

  // Export (simple)
  $("#btnExport")?.addEventListener("click", ()=>{
    $("#exportOut").textContent = JSON.stringify({ inventory: state.inventory }, null, 2);
  });

  // Restore last update label
  const lu = document.getElementById("invLastUpdate");
  if(lu) lu.textContent = state.invMeta.lastUpdateText || "Last update: none";

  // Voice
  $("#btnTalk")?.addEventListener("click", ()=> alert("Voice may be used at any time."));
}

/* Inventory edit/update hooks used in list */
window.__invEdit = (id)=>{
  const it = state.inventory.find(x=>x.itemId===id);
  if(!it) return;
  editingItemId = id;
  openInvDialog(it);
};

window.__invUpdate = (id)=>{
  openUpdateDialog(id, "Added");
};

/* Update modal implementation (stock semantics + transfer) */
function openUpdateDialog(itemId, presetAction){
  const it = state.inventory.find(x=>x.itemId===itemId);
  if(!it) return;

  currentUpdateId = itemId;
  $("#invUpdateItemName").textContent = `Item: ${it.name}`;
  $("#invUpdateCurrentQty").textContent = `Current on hand: ${it.qty} ${it.unit}`;
  $("#invUpdateAction").value = presetAction || "Added";
  $("#invUpdateQty").value = "1";
  $("#invUpdateNote").value = "";
  $("#invUpdateThreshold").value = (it.thresholdLow ?? "");

  document.getElementById("transferWrap").classList.toggle("hide", (presetAction||"Added") !== "Transferred");
  document.getElementById("dlgInvUpdate")?.showModal();
}

let currentUpdateId = null;

function saveUpdateFromDialog(){
  const it = state.inventory.find(x=>x.itemId===currentUpdateId);
  if(!it) return;

  const beforeItem = JSON.parse(JSON.stringify(it));
  const action = $("#invUpdateAction").value;
  const note = ($("#invUpdateNote").value||"").trim();

  const threshRaw = ($("#invUpdateThreshold").value||"").trim();
  it.thresholdLow = threshRaw==="" ? null : (Number(threshRaw) || null);

  let transfer = null;
  if(action === "Transferred"){
    transfer = {
      destinationType: ($("#transferType").value||"").trim(),
      destinationDetail: ($("#transferDetail").value||"").trim(),
      contactPerson: ($("#transferContactPerson").value||"").trim(),
      contactMethod: ($("#transferContactMethod").value||"").trim(),
      contactDetails: ($("#transferContactDetails").value||"").trim()
    };
  }

  if(action === "Retired"){
    const dec = Math.abs(Number($("#invUpdateQty").value||"0") || it.qty || 0);
    it.qty = Math.max(0, it.qty - dec);
    it.archived = true;
    it.history.push({ ts: nowISO(), action: "Retired", qtyDelta: -dec, note, transfer: null });

    undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Retired ${it.name}` };
    showUndo(`Undo: Retired ${it.name}`);
    setLastUpdate(`Last update: Retired · ${it.name} · ${fmt(nowISO())}`);

    save();
    renderInventoryList();
    renderInventoryReview();
    renderInventoryArchivedMenu();
    renderInventoryArchivedCurrent();
    document.getElementById("dlgInvUpdate")?.close();
    currentUpdateId = null;
    return;
  }

  if(action === "Transferred"){
    const dec = Math.abs(Number($("#invUpdateQty").value||"0") || 0);
    it.qty = Math.max(0, it.qty - dec);
    it.history.push({ ts: nowISO(), action: "Transferred", qtyDelta: -dec, note, transfer });

    undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Transferred ${it.name}` };
    showUndo(`Undo: Transferred ${it.name}`);
    setLastUpdate(`Last update: Transferred · ${it.name} · ${fmt(nowISO())}`);

    save();
    renderInventoryList();
    renderInventoryReview();
    renderInventoryArchivedMenu();
    renderInventoryArchivedCurrent();
    document.getElementById("dlgInvUpdate")?.close();
    currentUpdateId = null;
    return;
  }

  const deltaRaw = Number($("#invUpdateQty").value||"0") || 0;
  const signed = (action === "Added") ? Math.abs(deltaRaw) : -Math.abs(deltaRaw);
  it.qty = Math.max(0, it.qty + signed);
  it.history.push({ ts: nowISO(), action, qtyDelta: signed, note, transfer: null });

  undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: ${action} ${it.name}` };
  showUndo(`Undo: ${action} ${it.name}`);
  setLastUpdate(`Last update: ${action} · ${it.name} · ${fmt(nowISO())}`);

  save();
  renderInventoryList();
  renderInventoryReview();
  renderInventoryArchivedMenu();
  renderInventoryArchivedCurrent();
  document.getElementById("dlgInvUpdate")?.close();
  currentUpdateId = null;
}

/* Dialog scan-to-match already defined above */
function openInvDialog(item){
  $("#invName").value = item?.name || "";
  $("#invCategory").value = item?.category || "Food";
  $("#invSource").value = item?.source || "Other";
  $("#invIdType").value = item?.identifierType || "None";
  $("#invIdValue").value = item?.identifierValue || "";
  $("#invUnit").value = item?.unit || "count";
  $("#invNotes").value = item?.notes || "";
  $("#invWeightPerUnit").value = item?.weightPerUnit || "";
  document.getElementById("dlgInv")?.showModal();
}

function saveInvFromDialog(){
  const name = ($("#invName").value||"").trim();
  if(!name) return alert("Item name is required.");

  const category = $("#invCategory").value;
  const source = $("#invSource").value;
  const idType = $("#invIdType").value;
  const idValue = ($("#invIdValue").value||"").trim();
  const unit = $("#invUnit").value;
  const notes = ($("#invNotes").value||"").trim();
  const weightPerUnit = ($("#invWeightPerUnit").value||"").trim();

  if(!editingItemId && idType !== "None" && idValue){
    const match = findItemByIdentifier(idType, idValue);
    if(match){
      pendingMatchedItem = match;
      document.getElementById("scanMatchName").textContent = `This matches: ${match.name}`;
      $("#scanMatchMulti").value = "";
      $("#scanMatchAssumeSession").checked = false;
      document.getElementById("dlgInv")?.close();
      document.getElementById("dlgScanMatch")?.showModal();
      return;
    }
  }

  if(editingItemId){
    const it = state.inventory.find(x=>x.itemId===editingItemId);
    if(!it) return;
    const beforeItem = JSON.parse(JSON.stringify(it));
    it.name = name; it.category = category; it.source = source;
    it.identifierType = idType; it.identifierValue = (idType==="None"?"":idValue);
    it.unit = unit; it.notes = notes; it.weightPerUnit = weightPerUnit;
    it.history.push({ ts: nowISO(), action:"Edited", qtyDelta:0, note:"Definition updated" });

    undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Edited ${it.name}` };
    showUndo(`Undo: Edited ${it.name}`);
    setLastUpdate(`Last update: Edited · ${it.name} · ${fmt(nowISO())}`);
  } else {
    const itemId = uid("inv");
    state.inventory.push({
      itemId,
      name, category, source,
      identifierType: idType,
      identifierValue: (idType==="None"?"":idValue),
      unit,
      qty: 0,
      thresholdLow: null,
      notes,
      weightPerUnit,
      archived: false,
      history: [{ ts: nowISO(), action:"Created", qtyDelta:0, note:"Definition recorded" }]
    });

    undoPayload = { kind:"add", addedItemId: itemId, label:`Undo: Created ${name}` };
    showUndo(`Undo: Created ${name}`);
    setLastUpdate(`Last update: Created · ${name} · ${fmt(nowISO())}`);
  }

  save();
  renderInventoryList();
  renderInventoryReview();
  renderInventoryArchivedMenu();
  renderInventoryArchivedCurrent();
  document.getElementById("dlgInv")?.close();
  editingItemId = null;
}

/* Scanner close handler */
document.addEventListener("DOMContentLoaded", ()=>{
  bind();
  // Start at Home
  showView("Home");
});
