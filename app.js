const STORE_KEY = "breederPro_bulk1";
const $ = (s)=>document.querySelector(s);

function nowISO(){ return new Date().toISOString(); }
function fmt(ts){ return new Date(ts).toLocaleString(); }
function uid(p="id"){ return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function esc(s){
  return String(s||"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function seed(){
  const s = { inventory: [], invMeta: { lastUpdateText:"Last update: none" } };
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return seed();
    const s = JSON.parse(raw);
    if(!Array.isArray(s.inventory)) s.inventory=[];
    if(!s.invMeta) s.invMeta={ lastUpdateText:"Last update: none" };
    s.inventory.forEach(it=>{
      if(it.weightPerUnit===undefined) it.weightPerUnit="";
      if(it.notes===undefined) it.notes="";
      if(it.identifierType===undefined) it.identifierType="None";
      if(it.identifierValue===undefined) it.identifierValue="";
      if(it.history===undefined) it.history=[];
    });
    return s;
  }catch{ return seed(); }
}
let state = load();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function show(view){
  ["dogs","care","feeding","inventory","helpers","records"].forEach(v=>{
    const el=document.getElementById(`view${cap(v)}`);
    if(el) el.classList.toggle("hide", v!==view);
  });
}

function bindInfoButtons(){
  document.querySelectorAll(".info-btn").forEach(btn=>{
    btn.onclick=()=>{
      const key=btn.getAttribute("data-info");
      const panel=document.getElementById(`info-${key}`);
      if(panel) panel.classList.toggle("hide");
    };
  });
  document.querySelectorAll(".info-more-btn").forEach(btn=>{
    btn.onclick=()=>{
      const key=btn.getAttribute("data-more");
      const more=document.getElementById(`info-${key}-more`);
      if(more) more.classList.toggle("hide");
    };
  });
  document.querySelectorAll(".info-full-btn").forEach(btn=>{
    btn.onclick=()=>{
      const key=btn.getAttribute("data-full");
      const full=document.getElementById(`info-${key}-full`);
      if(full) full.classList.toggle("hide");
    };
  });
}

function bindEmergencyHold(){
  const btn=$("#btnEmergency");
  if(!btn) return;
  let timer=null, holding=false;
  const original=btn.textContent;
  const start=(e)=>{
    e.preventDefault();
    if(holding) return;
    holding=true;
    btn.textContent="Hold 2 seconds…";
    timer=setTimeout(()=>{
      holding=false; timer=null;
      btn.textContent=original;
      alert("Emergency Quick Card placeholder.");
    },2000);
  };
  const cancel=()=>{
    if(timer) clearTimeout(timer);
    timer=null; holding=false;
    btn.textContent=original;
  };
  btn.addEventListener("touchstart", start, {passive:false});
  btn.addEventListener("touchend", cancel);
  btn.addEventListener("touchcancel", cancel);
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", cancel);
  btn.addEventListener("mouseleave", cancel);
}

function inventoryLow(it){
  return (it.thresholdLow!==null && it.thresholdLow!==undefined && it.thresholdLow!=="" &&
    Number(it.qty) <= Number(it.thresholdLow));
}
function setLastUpdate(text){
  state.invMeta.lastUpdateText=text;
  save();
  const el=$("#invLastUpdate");
  if(el) el.textContent=text;
}

/* Undo */
let undoTimer=null;
let undoPayload=null;
function showUndo(label){
  const btn=$("#btnInvUndo");
  if(!btn) return;
  btn.classList.remove("hide");
  if(undoTimer) clearTimeout(undoTimer);
  undoTimer=setTimeout(()=>{ btn.classList.add("hide"); undoPayload=null; },10000);
  if(undoPayload) undoPayload.label=label;
}
function applyUndo(){
  if(!undoPayload) return;
  if(undoPayload.kind==="add"){
    state.inventory = state.inventory.filter(i=>i.itemId!==undoPayload.addedItemId);
    setLastUpdate("Last update: Undo recorded");
  } else if(undoPayload.kind==="update"){
    const idx=state.inventory.findIndex(i=>i.itemId===undoPayload.itemId);
    if(idx>=0 && undoPayload.beforeItem){
      state.inventory[idx]=undoPayload.beforeItem;
      setLastUpdate("Last update: Undo recorded");
    }
  }
  save();
  renderInventory();
  renderReview();
  $("#btnInvUndo")?.classList.add("hide");
  undoPayload=null;
}

/* Render */
function renderInventory(){
  const list=$("#inventoryList");
  const arch=$("#inventoryArchived");
  if(!list || !arch) return;

  const active=state.inventory.filter(i=>!i.archived);
  const archived=state.inventory.filter(i=>i.archived);

  list.innerHTML = active.length ? active.map(i=>{
    const low=inventoryLow(i);
    const w=i.weightPerUnit?` • W/unit: ${esc(i.weightPerUnit)}`:"";
    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name ${low?"low":""}">${esc(i.name)}</div>
            <div class="inv-meta">${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • Qty: ${esc(i.qty)}${i.thresholdLow!==null&&i.thresholdLow!==""?` • Low: ${esc(i.thresholdLow)}`:""}${w}</div>
            <div class="inv-meta">${i.identifierType!=="None"?`${esc(i.identifierType)}: ${esc(i.identifierValue||"")}`:"Identifier: none"}</div>
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
    const w=i.weightPerUnit?` • W/unit: ${esc(i.weightPerUnit)}`:"";
    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name">${esc(i.name)}</div>
            <div class="inv-meta">Archived • ${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • Qty: ${esc(i.qty)}${w}</div>
            <div class="inv-meta">${i.identifierType!=="None"?`${esc(i.identifierType)}: ${esc(i.identifierValue||"")}`:"Identifier: none"}</div>
          </div>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No archived inventory items.</div>`;
}

/* Review + exact duplicates */
function normalizeName(n){ return String(n||"").trim().toLowerCase(); }
function normalizeId(t,v){
  if(!t || t==="None") return "";
  return `${String(t).trim().toLowerCase()}::${String(v||"").trim()}`;
}
function buildDupMaps(items){
  const nameMap=new Map();
  const idMap=new Map();
  items.forEach(i=>{
    const n=normalizeName(i.name);
    if(n) nameMap.set(n,(nameMap.get(n)||0)+1);
    const k=normalizeId(i.identifierType,i.identifierValue);
    if(k) idMap.set(k,(idMap.get(k)||0)+1);
  });
  return {nameMap,idMap};
}
function isDupExact(i,m){
  const n=normalizeName(i.name);
  const k=normalizeId(i.identifierType,i.identifierValue);
  return (n && (m.nameMap.get(n)||0)>1) || (k && (m.idMap.get(k)||0)>1);
}
function renderReview(){
  const wrap=$("#inventoryReview");
  if(!wrap || wrap.classList.contains("hide")) return;
  const listEl=$("#inventoryReviewList");
  const ctx=$("#invReviewContext");
  if(!listEl || !ctx) return;

  const active=state.inventory.filter(i=>!i.archived);
  const sorted=[...active].sort((a,b)=>{
    const al=inventoryLow(a)?0:1, bl=inventoryLow(b)?0:1;
    if(al!==bl) return al-bl;
    const ac=String(a.category||"").localeCompare(String(b.category||""));
    if(ac!==0) return ac;
    return String(a.name||"").localeCompare(String(b.name||""));
  });
  const maps=buildDupMaps(sorted);
  ctx.textContent=`Active items: ${sorted.length} • Low items appear in yellow • Exact duplicates highlighted`;

  listEl.innerHTML = sorted.length ? sorted.map(i=>{
    const low=inventoryLow(i);
    const dup=isDupExact(i,maps);
    const yellow=(low||dup)?"low":"";
    const labels=[low?`<span class="inv-flag">Low</span>`:"",dup?`<span class="inv-flag">Duplicate</span>`:""].filter(Boolean).join(" ");
    const w=i.weightPerUnit?` • W/unit: ${esc(i.weightPerUnit)}`:"";
    return `
      <div class="inv-item">
        <div class="inv-top">
          <div>
            <div class="inv-name ${yellow}">${esc(i.name)} ${labels}</div>
            <div class="inv-meta">${esc(i.category)} • ${esc(i.source)} • ${esc(i.unit)} • Qty: ${esc(i.qty)}${w}</div>
            <div class="inv-meta">${i.identifierType!=="None"?`${esc(i.identifierType)}: ${esc(i.identifierValue||"")}`:"Identifier: none"}</div>
          </div>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted small">No active inventory items recorded.</div>`;
}

/* Add/Edit modal */
let editingItemId=null;
function openInvDialog(item){
  $("#invName").value=item?.name||"";
  $("#invCategory").value=item?.category||"Food";
  $("#invSource").value=item?.source||"Other";
  $("#invIdType").value=item?.identifierType||"None";
  $("#invIdValue").value=item?.identifierValue||"";
  $("#invUnit").value=item?.unit||"count";
  $("#invQty").value=(item?.qty??"");
  $("#invThresh").value=(item?.thresholdLow??"");
  $("#invNotes").value=item?.notes||"";
  $("#invWeightPerUnit").value=item?.weightPerUnit||"";
  $("#dlgInv")?.showModal();
}

function saveInvFromDialog(){
  const name=($("#invName").value||"").trim();
  if(!name) return alert("Item name is required.");
  const category=$("#invCategory").value;
  const source=$("#invSource").value;
  const idType=$("#invIdType").value;
  const idValue=($("#invIdValue").value||"").trim();
  const unit=$("#invUnit").value;
  const qty=Number($("#invQty").value||"0")||0;
  const threshRaw=($("#invThresh").value||"").trim();
  const thresholdLow=threshRaw===""?null:(Number(threshRaw)||null);
  const notes=($("#invNotes").value||"").trim();
  const weightPerUnit=($("#invWeightPerUnit").value||"").trim();

  if(editingItemId){
    const it=state.inventory.find(x=>x.itemId===editingItemId);
    if(!it) return;
    const beforeItem=JSON.parse(JSON.stringify(it));
    it.name=name; it.category=category; it.source=source;
    it.identifierType=idType; it.identifierValue=(idType==="None"?"":idValue);
    it.unit=unit; it.qty=qty; it.thresholdLow=thresholdLow;
    it.notes=notes; it.weightPerUnit=weightPerUnit;
    it.history=it.history||[];
    it.history.push({ts:nowISO(),action:"Edited",qtyDelta:0,note:"Record updated"});
    undoPayload={kind:"update",itemId:it.itemId,beforeItem,label:`Undo: Edited ${it.name}`};
    showUndo(`Undo: Edited ${it.name}`);
    setLastUpdate(`Last update: Edited · ${it.name} · ${fmt(nowISO())}`);
  } else {
    const itemId=uid("inv");
    state.inventory.push({
      itemId,name,category,source,
      identifierType:idType,identifierValue:(idType==="None"?"":idValue),
      unit,qty,thresholdLow,notes,weightPerUnit,
      archived:false,
      history:[{ts:nowISO(),action:"Added",qtyDelta:qty,note:"Initial record"}]
    });
    undoPayload={kind:"add",addedItemId:itemId,label:`Undo: Added ${name}`};
    showUndo(`Undo: Added ${name}`);
    setLastUpdate(`Last update: Added · ${name} · ${fmt(nowISO())}`);
  }
  save(); renderInventory(); renderReview();
  $("#dlgInv")?.close(); editingItemId=null;
}

/* Update modal */
let currentUpdateId=null;
function openUpdateDialog(itemId){
  const it=state.inventory.find(x=>x.itemId===itemId);
  if(!it) return;
  currentUpdateId=itemId;
  $("#invUpdateItemName").textContent=`Item: ${it.name}`;
  $("#invUpdateAction").value="Used";
  $("#invUpdateQty").value="1";
  $("#invUpdateNote").value="";
  $("#invUpdateQtyWrap").classList.remove("hide");
  $("#dlgInvUpdate")?.showModal();
}
function saveUpdateFromDialog(){
  const it=state.inventory.find(x=>x.itemId===currentUpdateId);
  if(!it) return;
  const beforeItem=JSON.parse(JSON.stringify(it));
  const action=$("#invUpdateAction").value;
  const note=($("#invUpdateNote").value||"").trim();

  if(action==="Retired"||action==="Transferred"){
    it.archived=true;
    it.history=it.history||[];
    it.history.push({ts:nowISO(),action,qtyDelta:0,note});
    undoPayload={kind:"update",itemId:it.itemId,beforeItem,label:`Undo: ${action} ${it.name}`};
    showUndo(`Undo: ${action} ${it.name}`);
    setLastUpdate(`Last update: ${action} · ${it.name} · ${fmt(nowISO())}`);
    save(); renderInventory(); renderReview();
    $("#dlgInvUpdate")?.close(); currentUpdateId=null;
    return;
  }

  const deltaRaw=Number($("#invUpdateQty").value||"0")||0;
  const signed=(action==="Added")?Math.abs(deltaRaw):-Math.abs(deltaRaw);
  it.qty=Math.max(0,(Number(it.qty)||0)+signed);
  it.history=it.history||[];
  it.history.push({ts:nowISO(),action,qtyDelta:signed,note});
  undoPayload={kind:"update",itemId:it.itemId,beforeItem,label:`Undo: ${action} ${it.name}`};
  showUndo(`Undo: ${action} ${it.name}`);
  setLastUpdate(`Last update: ${action} · ${it.name} · ${fmt(nowISO())}`);
  save(); renderInventory(); renderReview();
  $("#dlgInvUpdate")?.close(); currentUpdateId=null;
}

/* Scanner + match logic */
let scanStream=null;
let lastScanValue="";
let assumeSessionIdKey=""; // if set, auto-add +1 for same id (this session only)

function findItemByIdentifier(type,value){
  const t=String(type||"").trim();
  const v=String(value||"").trim();
  if(!t || t==="None" || !v) return null;
  return state.inventory.find(it=>it.identifierType===t && String(it.identifierValue||"").trim()===v) || null;
}

async function startScan(){
  const video=$("#scanVideo");
  const help=$("#scanHelp");
  const box=$("#scanResultBox");
  const val=$("#scanValue");
  lastScanValue=""; box.classList.add("hide"); val.textContent=""; help.textContent="";
  try{
    scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
    video.srcObject=scanStream; await video.play();
  }catch{
    help.textContent="Camera access unavailable. Manual entry remains available.";
    return;
  }
  if(!("BarcodeDetector" in window)){
    help.textContent="Scanner not supported on this browser. Manual entry remains available.";
    return;
  }
  let detector;
  try{ detector=new BarcodeDetector({formats:["qr_code","code_128","ean_13","ean_8","upc_a","upc_e"]}); }
  catch{ detector=new BarcodeDetector(); }
  help.textContent="Point camera at code. Confirm is required after a scan.";
  const loop=async()=>{
    if(!scanStream) return;
    try{
      const codes=await detector.detect(video);
      if(codes && codes.length){
        const raw=codes[0].rawValue||"";
        if(raw){
          lastScanValue=raw;
          box.classList.remove("hide");
          val.textContent=raw;
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
  const video=$("#scanVideo");
  if(video) video.pause();
  if(scanStream){
    scanStream.getTracks().forEach(t=>t.stop());
    scanStream=null;
  }
}
function openScanDialog(){ $("#dlgScan")?.showModal(); startScan(); }
function closeScanDialog(){ stopScanStream(); $("#dlgScan")?.close(); }

let pendingMatchedItem=null;

function confirmScan(){
  if(!lastScanValue) return;

  // Assume barcode unless user set QR manually
  const scannedType = ($("#invIdType").value && $("#invIdType").value !== "None") ? $("#invIdType").value : "Barcode";
  const idKey = normalizeId(scannedType, lastScanValue);

  // If session-assume is active and matches, auto-add +1 with a quiet update and keep dialog closed
  if(assumeSessionIdKey && assumeSessionIdKey === idKey){
    const it = findItemByIdentifier(scannedType, lastScanValue);
    if(it){
      const beforeItem = JSON.parse(JSON.stringify(it));
      it.qty = (Number(it.qty)||0) + 1;
      it.history.push({ ts: nowISO(), action:"Added", qtyDelta:1, note:"Scan add (session)" });
      undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Added 1 unit to ${it.name}` };
      showUndo(`Undo: Added 1 unit to ${it.name}`);
      setLastUpdate(`Last update: Added · ${it.name} · ${fmt(nowISO())}`);
      save(); renderInventory(); renderReview();
    }
    closeScanDialog();
    return;
  }

  // Normal: look for exact match
  const match = findItemByIdentifier(scannedType, lastScanValue);
  if(match){
    pendingMatchedItem = match;

    // Auto-populate the form fields from the match (so the user sees it’s the same item)
    $("#invName").value = match.name || "";
    $("#invCategory").value = match.category || "Food";
    $("#invSource").value = match.source || "Other";
    $("#invUnit").value = match.unit || "count";
    $("#invQty").value = match.qty ?? "";
    $("#invThresh").value = match.thresholdLow ?? "";
    $("#invNotes").value = match.notes || "";
    $("#invWeightPerUnit").value = match.weightPerUnit || "";
    $("#invIdType").value = match.identifierType || scannedType;
    $("#invIdValue").value = match.identifierValue || lastScanValue;

    // Show match dialog
    $("#scanMatchName").textContent = `This matches: ${match.name}`;
    $("#scanMatchMulti").value = "";
    $("#scanMatchAssumeSession").checked = false;
    closeScanDialog();
    $("#dlgScanMatch")?.showModal();
    return;
  }

  // No match: populate identifier fields for new entry
  $("#invIdType").value = scannedType;
  $("#invIdValue").value = lastScanValue;
  closeScanDialog();
}

/* Match dialog actions */
function addUnitsToMatched(count){
  if(!pendingMatchedItem) return;
  const it = state.inventory.find(x=>x.itemId===pendingMatchedItem.itemId);
  if(!it) return;

  const beforeItem = JSON.parse(JSON.stringify(it));
  const add = Math.max(0, Number(count)||0);
  if(add<=0) return;

  it.qty = (Number(it.qty)||0) + add;
  it.history.push({ ts: nowISO(), action:"Added", qtyDelta:add, note:"Scan match add" });

  undoPayload = { kind:"update", itemId: it.itemId, beforeItem, label:`Undo: Added ${add} units to ${it.name}` };
  showUndo(`Undo: Added ${add} units to ${it.name}`);
  setLastUpdate(`Last update: Added · ${it.name} · ${fmt(nowISO())}`);

  save(); renderInventory(); renderReview();
}

/* Bind */
function bind(){
  document.querySelectorAll("[data-nav]").forEach(b=> b.onclick=()=> show(b.dataset.nav));
  bindInfoButtons();
  bindEmergencyHold();

  // Inventory dialogs
  $("#btnAddInventory")?.addEventListener("click", ()=>{ editingItemId=null; openInvDialog(null); });
  $("#btnSaveInv")?.addEventListener("click", (e)=>{ e.preventDefault(); saveInvFromDialog(); });

  $("#btnInvUndo")?.addEventListener("click", ()=> applyUndo());
  $("#invLastUpdate") && ($("#invLastUpdate").textContent = state.invMeta.lastUpdateText || "Last update: none");

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

  // Update dialog
  $("#invUpdateAction")?.addEventListener("change", ()=>{
    const a=$("#invUpdateAction").value;
    if(a==="Retired"||a==="Transferred") $("#invUpdateQtyWrap").classList.add("hide");
    else $("#invUpdateQtyWrap").classList.remove("hide");
  });
  $("#btnInvUpdateSave")?.addEventListener("click", (e)=>{ e.preventDefault(); saveUpdateFromDialog(); });

  // Scanner
  $("#btnScanId")?.addEventListener("click", ()=> openScanDialog());
  $("#btnClearId")?.addEventListener("click", ()=>{ $("#invIdValue").value=""; });
  $("#btnRescan")?.addEventListener("click", ()=> startScan());
  $("#btnConfirmScan")?.addEventListener("click", ()=> confirmScan());
  $("#btnCloseScan")?.addEventListener("click", ()=> closeScanDialog());
  $("#dlgScan")?.addEventListener("close", ()=> stopScanStream());

  // Match dialog buttons
  $("#btnScanAddOne")?.addEventListener("click", ()=>{
    const assume = $("#scanMatchAssumeSession").checked;
    addUnitsToMatched(1);
    if(assume && pendingMatchedItem){
      assumeSessionIdKey = normalizeId(pendingMatchedItem.identifierType, pendingMatchedItem.identifierValue);
    }
    pendingMatchedItem = null;
    $("#dlgScanMatch")?.close();
  });

  $("#btnScanAddMulti")?.addEventListener("click", ()=>{
    const assume = $("#scanMatchAssumeSession").checked;
    const n = Number(($("#scanMatchMulti").value||"").trim() || "0") || 0;
    if(n>0) addUnitsToMatched(n);
    if(assume && pendingMatchedItem){
      assumeSessionIdKey = normalizeId(pendingMatchedItem.identifierType, pendingMatchedItem.identifierValue);
    }
    pendingMatchedItem = null;
    $("#dlgScanMatch")?.close();
  });

  $("#btnScanNotNow")?.addEventListener("click", ()=>{
    const assume = $("#scanMatchAssumeSession").checked;
    if(assume && pendingMatchedItem){
      assumeSessionIdKey = normalizeId(pendingMatchedItem.identifierType, pendingMatchedItem.identifierValue);
    }
    pendingMatchedItem = null;
    $("#dlgScanMatch")?.close();
  });

  $("#btnTalk")?.addEventListener("click", ()=> alert("Voice may be used at any time."));
}

window.__invEdit = (id)=>{
  const it=state.inventory.find(x=>x.itemId===id);
  if(!it) return;
  editingItemId=id;
  openInvDialog(it);
};
window.__invUpdate = (id)=> openUpdateDialog(id);

document.addEventListener("DOMContentLoaded", ()=>{
  bind();
  renderInventory();
  show("dogs");
});
