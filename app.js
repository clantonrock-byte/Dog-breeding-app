// Restore stable navigation + Inventory Add dialog save (minimal, reliable)

const $ = (s) => document.querySelector(s);

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function show(view){
  ["dogs","care","feeding","inventory","helpers","records"].forEach(v=>{
    const el = document.getElementById(`view${cap(v)}`);
    if(el) el.classList.toggle("hide", v !== view);
  });
}

// ---- Inventory storage (minimal) ----
const INV_KEY = "bp_inventory_v1";

function loadInv(){
  try { return JSON.parse(localStorage.getItem(INV_KEY) || "[]"); }
  catch { return []; }
}
function saveInv(items){
  localStorage.setItem(INV_KEY, JSON.stringify(items));
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderInventory(){
  const list = document.getElementById("inventoryList");
  if(!list) return;

  const items = loadInv();
  if(!items.length){
    list.innerHTML = `<div class="muted small">No inventory items recorded yet.</div>`;
    return;
  }

  list.innerHTML = items.map(it=>`
    <div class="timeline-item">
      <div><strong>${escapeHtml(it.name)}</strong></div>
      <div class="muted small">
        ${escapeHtml(it.category)} • ${escapeHtml(it.source)} • ${escapeHtml(it.unit)} • Qty: ${escapeHtml(String(it.qty))}
        ${it.weightPerUnit ? ` • W/unit: ${escapeHtml(it.weightPerUnit)}` : ""}
      </div>
      <div class="muted small">
        ${it.idType && it.idType !== "None" ? `${escapeHtml(it.idType)}: ${escapeHtml(it.idValue||"")}` : "Identifier: none"}
      </div>
    </div>
  `).join("");
}

// ---- Dialog-based Add Inventory ----
function openAddInvDialog(){
  const dlg = document.getElementById("dlgInv");
  if(!dlg){
    alert("Inventory dialog not found.");
    return;
  }

  // reset fields
  $("#invName").value = "";
  $("#invCategory").value = "Food";
  $("#invSource").value = "Other";
  $("#invIdType").value = "None";
  $("#invIdValue").value = "";
  $("#invUnit").value = "count";
  $("#invQty").value = "";
  $("#invThresh").value = "";
  $("#invNotes").value = "";
  const w = document.getElementById("invWeightPerUnit");
  if(w) w.value = "";

  dlg.showModal();
}

function saveInvFromDialog(){
  const name = ($("#invName").value || "").trim();
  if(!name){
    alert("Item name is required.");
    return;
  }

  const category = $("#invCategory").value || "Other";
  const source = $("#invSource").value || "Other";
  const idType = $("#invIdType").value || "None";
  const idValue = ($("#invIdValue").value || "").trim();
  const unit = $("#invUnit").value || "count";
  const qty = Number($("#invQty").value || "0") || 0;

  const weightPerUnitEl = document.getElementById("invWeightPerUnit");
  const weightPerUnit = weightPerUnitEl ? (weightPerUnitEl.value || "").trim() : "";

  // threshold + notes currently stored but not used yet (kept for later expansion)
  const thresholdLow = ($("#invThresh").value || "").trim();
  const notes = ($("#invNotes").value || "").trim();

  const items = loadInv();
  items.push({
    name, category, source, unit, qty,
    idType,
    idValue: (idType === "None" ? "" : idValue),
    weightPerUnit,
    thresholdLow,
    notes,
    ts: new Date().toISOString()
  });
  saveInv(items);

  // close dialog
  document.getElementById("dlgInv")?.close();

  // ensure Inventory view is visible and refreshed
  show("inventory");
  renderInventory();
}

// ---- Bindings ----
function bindNav(){
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const view = btn.dataset.nav;
      show(view);
      if(view === "inventory") renderInventory();
    });
  });
}

function bindInventory(){
  const addBtn = document.getElementById("btnAddInventory");
  if(addBtn){
    addBtn.addEventListener("click", ()=>{
      openAddInvDialog();
    });
  }

  const saveBtn = document.getElementById("btnSaveInv");
  if(saveBtn){
    saveBtn.addEventListener("click", (e)=>{
      // stop dialog auto-close so we can validate
      e.preventDefault();
      saveInvFromDialog();
    });
  }

  // If archived toggle exists, just toggles the container (doesn't populate yet)
  const archToggle = document.getElementById("btnToggleArchived");
  if(archToggle){
    archToggle.addEventListener("click", ()=>{
      document.getElementById("inventoryArchived")?.classList.toggle("hide");
    });
  }

  // Review list button: if present, show a simple compiled view using same list (minimal)
  const reviewBtn = document.getElementById("btnReviewInventory");
  if(reviewBtn){
    reviewBtn.addEventListener("click", ()=>{
      const review = document.getElementById("inventoryReview");
      const list = document.getElementById("inventoryList");
      const reviewList = document.getElementById("inventoryReviewList");
      if(review && reviewList && list){
        review.classList.remove("hide");
        list.classList.add("hide");
        reviewList.innerHTML = list.innerHTML;
      }
    });
  }

  const backBtn = document.getElementById("btnBackToInventory");
  if(backBtn){
    backBtn.addEventListener("click", ()=>{
      document.getElementById("inventoryReview")?.classList.add("hide");
      document.getElementById("inventoryList")?.classList.remove("hide");
    });
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  bindNav();
  bindInventory();
  show("dogs");
});
