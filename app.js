const STORE_KEY = "breederPro_msv_v6001";
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
    inventory: []
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

/* Inventory helpers */
function inventoryLow(item){
  return (item.thresholdLow !== null && item.thresholdLow !== undefined && item.thresholdLow !== "" &&
          Number(item.qty) <= Number(item.thresholdLow));
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

/* Dialog state */
let editingItemId = null;
let scanTargetInputId = "invIdValue";
let scanStream = null;
let lastScanValue = "";

function openInvDialog(item){
  const dlg = $("#dlgInv");
  if(!dlg) return;

  $("#invName").value = item?.name || "";
  $("#invCategory").value = item?.category || "Food";
  $("#invSource").value = item?.source || "Other";
  $("#invIdType").value = item?.identifierType || "None";
  $("#invIdValue").value = item?.identifierValue || "";
  $("#invUnit").value = item?.unit || "count";
  $("#invQty").value = item?.qty ?? "";
  $("#invThresh").value = (item?.thresholdLow ?? "");
  $("#invNotes").value = item?.notes || "";

  dlg.showModal();
}

function closeInvDialog(){
  $("#dlgInv")?.close();
  editingItemId = null;
}

function saveInvFromDialog(){
  const name = ($("#invName").value || "").trim();
  if(!name) return alert("Item name is required.");

  const category = $("#invCategory").value;
  const source = $("#invSource").value;
  const identifierType = $("#invIdType").value;
  const identifierValue = ($("#invIdValue").value || "").trim();
  const unit = $("#invUnit").value;

  const qty = Number($("#invQty").value || "0") || 0;
  const threshRaw = ($("#invThresh").value || "").trim();
  const thresholdLow = threshRaw === "" ? null : (Number(threshRaw) || null);
  const notes = ($("#invNotes").value || "").trim();

  if(editingItemId){
    const it = state.inventory.find(x=>x.itemId===editingItemId);
    if(!it) return;
    it.name = name;
    it.category = category;
    it.source = source;
    it.identifierType = identifierType;
    it.identifierValue = identifierType==="None" ? "" : identifierValue;
    it.unit = unit;
    it.qty = qty;
    it.thresholdLow = thresholdLow;
    it.notes = notes;
    it.history.push({ ts: nowISO(), action:"Edited", qtyDelta:0, note:"Record updated" });
  } else {
    state.inventory.push({
      itemId: uid("inv"),
      name, category, source,
      identifierType,
      identifierValue: identifierType==="None" ? "" : identifierValue,
      unit,
      qty,
      thresholdLow,
      notes,
      archived:false,
      history:[{ ts: nowISO(), action:"Added", qtyDelta: qty, note:"Initial record" }]
    });
  }

  save();
  renderInventory();
  closeInvDialog();
}

function openUpdateDialog(itemId){
  const item = state.inventory.find(x=>x.itemId===itemId);
  if(!item) return;

  // Dropdown action via prompt-free mini flow using dialogs is heavier; keep as simple confirm step here.
  // For now: a small prompt with constrained values.
  const action = prompt("Action (Added/Used/Discarded/Retired/Transferred):","Used");
  if(!action) return;

  if(action === "Retired" || action === "Transferred"){
    const note = prompt("Note (optional):","") || "";
    item.archived = true;
    item.history.push({ ts: nowISO(), action, qtyDelta:0, note });
    save();
    renderInventory();
    return;
  }

  const deltaStr = prompt("Quantity change (number):", "1") || "0";
  const delta = Number(deltaStr) || 0;
  const signed = (action==="Added") ? Math.abs(delta) : -Math.abs(delta);
  const note = prompt("Note (optional):","") || "";

  item.qty = Math.max(0, (Number(item.qty)||0) + signed);
  item.history.push({ ts: nowISO(), action, qtyDelta:signed, note });
  save();
  renderInventory();
}

/* Scanner */
async function startScan(){
  const dlg = $("#dlgScan");
  const video = $("#scanVideo");
  const help = $("#scanHelp");
  const box = $("#scanResultBox");
  const val = $("#scanValue");

  lastScanValue = "";
  box.classList.add("hide");
  val.textContent = "";
  help.textContent = "";

  try{
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"environment" }, audio:false });
    video.srcObject = scanStream;
    await video.play();
  }catch(e){
    help.textContent = "Camera access unavailable. Manual entry remains available.";
    return;
  }

  // BarcodeDetector if available
  if(!("BarcodeDetector" in window)){
    help.textContent = "Scanner not supported on this browser. Manual entry remains available.";
    return;
  }

  const formats = ["qr_code","code_128","ean_13","ean_8","upc_a","upc_e","itf","code_39","codabar"];
  let detector;
  try{
    detector = new BarcodeDetector({ formats });
  }catch{
    detector = new BarcodeDetector();
  }

  help.textContent = "Point camera at code. Confirm is required after a scan.";

  const scanLoop = async () => {
    if(!scanStream) return;
    try{
      const codes = await detector.detect(video);
      if(codes && codes.length){
        lastScanValue = codes[0].rawValue || "";
        if(lastScanValue){
          box.classList.remove("hide");
          val.textContent = lastScanValue;
          stopScanStream();
          return;
        }
      }
    }catch{ /* ignore */ }
    requestAnimationFrame(scanLoop);
  };

  requestAnimationFrame(scanLoop);
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
  const dlg = $("#dlgScan");
  if(!dlg) return;
  dlg.showModal();
  startScan();
}

function closeScanDialog(){
  stopScanStream();
  $("#dlgScan")?.close();
}

function confirmScan(){
  if(!lastScanValue) return;
  const input = document.getElementById(scanTargetInputId);
  if(input){
    input.value = lastScanValue;
  }
  closeScanDialog();
}

/* Simple stubs for other sections */
function renderDogs(){ /* minimal for now */ }
function renderTimeline(){ /* minimal for now */ }
function addFeeding(){ /* minimal for now */ alert("Feeding entry placeholder"); }

/* Bind */
function bind(){
  document.querySelectorAll("[data-nav]").forEach(b=> b.onclick = ()=> show(b.dataset.nav));

  bindInfoButtons();
  bindEmergencyHold();

  $("#btnAddInventory")?.addEventListener("click", ()=>{
    editingItemId = null;
    openInvDialog(null);
  });

  $("#btnToggleArchived")?.addEventListener("click", ()=>{
    $("#inventoryArchived")?.classList.toggle("hide");
  });

  $("#btnSaveInv")?.addEventListener("click", (e)=>{
    e.preventDefault();
    saveInvFromDialog();
  });

  $("#btnScanId")?.addEventListener("click", ()=>{
    // Scan is assumed when selected; camera prompt is handled by browser.
    openScanDialog();
  });

  $("#btnClearId")?.addEventListener("click", ()=>{
    $("#invIdValue").value = "";
  });

  $("#btnRescan")?.addEventListener("click", ()=>{
    startScan();
  });

  $("#btnConfirmScan")?.addEventListener("click", ()=>{
    confirmScan();
  });

  $("#btnCloseScan")?.addEventListener("click", ()=>{
    closeScanDialog();
  });

  $("#dlgScan")?.addEventListener("close", ()=>{
    stopScanStream();
  });

  $("#btnTalk")?.addEventListener("click", ()=> alert("Voice may be used at any time."));

  $("#btnExport")?.addEventListener("click", ()=>{
    $("#exportOut").textContent = JSON.stringify({ inventory: state.inventory }, null, 2);
  });
}

/* Inventory edit hooks */
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
