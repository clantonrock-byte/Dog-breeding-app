// BP Portal v1 — reads nav-35-ish localStorage, exports/imports snapshots.
//
// IMPORTANT: This is a browser-only dashboard. It does not require build tools.
// It reads from localStorage of THIS origin. If hosted at /portal/ on same domain,
// it will read the same localStorage as the app.
//
// Data keys vary by vintage; we detect the best available.

const KEY_CANDIDATES = {
  dogs: [
    "breederPro_dogs_store_v3",
    "breeder_dogs_v1",
    "breederPro_dogs_store_v1",
  ],
  inventory: [
    "breederPro_inventory_store_v1",
    "breederPro_inventory_store_v3",
    "breeder_inventory_v1",
  ],
  events: [
    "rc_events_v1",
    "breeder_events_v1",
  ],
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function findKey(cands) {
  for (const k of cands) {
    if (localStorage.getItem(k)) return k;
  }
  return null;
}

function normSex(v) {
  v = String(v || "").toLowerCase();
  if (v.startsWith("male")) return "male";
  if (v.startsWith("female")) return "female";
  if (v === "m") return "male";
  if (v === "f") return "female";
  return "unknown";
}

function dogStatus(d) {
  // Different builds store status differently; prefer explicit.
  const s = String(d.status || "").toLowerCase();
  if (["active","archived","transferred","deceased"].includes(s)) return s;
  if (d.archived) return "archived";
  return "active";
}

function invKind(i) {
  const k = String(i.kind || "").toLowerCase();
  if (k === "inedible") return "inedible";
  if (k === "edible") return "edible";
  // Default: edible
  return "edible";
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

let state = {
  keys: { dogs:null, inventory:null, events:null },
  dogs: [],
  inventory: [],
  events: [],
  tab: "dogs",
};

function refresh() {
  state.keys.dogs = findKey(KEY_CANDIDATES.dogs);
  state.keys.inventory = findKey(KEY_CANDIDATES.inventory);
  state.keys.events = findKey(KEY_CANDIDATES.events);

  const dogsObj = state.keys.dogs ? loadJson(state.keys.dogs, {dogs: []}) : {dogs: []};
  const invObj  = state.keys.inventory ? loadJson(state.keys.inventory, {inventory: []}) : {inventory: []};
  const evList  = state.keys.events ? loadJson(state.keys.events, []) : [];

  state.dogs = Array.isArray(dogsObj) ? dogsObj : (dogsObj.dogs || dogsObj || []);
  state.inventory = Array.isArray(invObj) ? invObj : (invObj.inventory || invObj || []);
  state.events = Array.isArray(evList) ? evList : [];

  render();
}

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.getElementById("viewDogs").classList.toggle("hide", tab !== "dogs");
  document.getElementById("viewInvEdible").classList.toggle("hide", tab !== "inv_edible");
  document.getElementById("viewStockInedible").classList.toggle("hide", tab !== "stock_inedible");
  document.getElementById("viewHistory").classList.toggle("hide", tab !== "history");
  document.getElementById("viewAbout").classList.toggle("hide", tab !== "about");
  render(); // re-render meta + current view
}

function filteredDogs() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const sf = document.getElementById("statusFilter").value;
  const xf = document.getElementById("sexFilter").value;

  return state.dogs
    .map(d => ({...d, _sex: normSex(d.sex), _status: dogStatus(d)}))
    .filter(d => {
      if (sf !== "all" && d._status !== sf) return false;
      if (xf !== "all" && d._sex !== xf) return false;
      if (q) {
        const hay = (d.callName || d.name || d.dogId || "").toString().toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
}

function renderDogs() {
  const list = filteredDogs();
  document.getElementById("viewDogs").innerHTML = `
    <div class="list">
      ${list.map(d => `
        <div class="item">
          <div class="row">
            <div>
              <div class="h">${esc(d.callName || d.name || "(unnamed)")}</div>
              <div class="sub">Sex: ${esc(d.sex || "Unknown")} • Status: ${esc(d._status)} • ID: <code>${esc(d.dogId || d.id || "")}</code></div>
            </div>
            <span class="pill">${esc(d._status)}</span>
          </div>
        </div>
      `).join("") || `<div class="sub">No dogs found.</div>`}
    </div>
  `;
  return list.length;
}

function renderInventory(kind) {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const list = state.inventory
    .filter(i => invKind(i) === kind)
    .filter(i => {
      if (!q) return true;
      const hay = `${i.name||""} ${i.identifierValue||""} ${i.identifierType||""}`.toLowerCase();
      return hay.includes(q);
    });

  const html = `
    <div class="list">
      ${list.map(i => `
        <div class="item">
          <div class="row">
            <div>
              <div class="h">${esc(i.name || "(unnamed item)")}</div>
              <div class="sub">On hand: <b>${Number(i.qty||0)}</b> • ${esc(i.identifierType||"")} <code>${esc(i.identifierValue||"")}</code></div>
              <div class="sub">Kind: ${esc(invKind(i))} • Archived: ${i.archived ? "yes" : "no"}</div>
            </div>
            ${i.archived ? `<span class="pill warn">archived</span>` : `<span class="pill">active</span>`}
          </div>
        </div>
      `).join("") || `<div class="sub">No items found.</div>`}
    </div>
  `;
  return { html, count: list.length };
}

function renderHistory() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const list = (state.events || []).slice().reverse().filter(ev => {
    if (!q) return true;
    const hay = `${ev.type||""} ${ev.note||""} ${ev.entityType||""} ${ev.entityId||""}`.toLowerCase();
    return hay.includes(q);
  }).slice(0, 200);

  document.getElementById("viewHistory").innerHTML = `
    <div class="list">
      ${list.map(ev => `
        <div class="item">
          <div class="row">
            <div>
              <div class="h">${esc(ev.type || "event")}</div>
              <div class="sub">${esc(ev.atLocal || ev.atUtc || "")} • ${esc(ev.tz || "")}</div>
              <div class="sub">${esc(ev.entityType||"")} ${ev.entityId ? "• "+esc(ev.entityId) : ""} ${ev.note ? "• "+esc(ev.note) : ""}</div>
            </div>
            <span class="pill">${esc(ev.view||"")}</span>
          </div>
        </div>
      `).join("") || `<div class="sub">No events found.</div>`}
    </div>
  `;
  return list.length;
}

function renderAbout() {
  document.getElementById("viewAbout").innerHTML = `
    <div class="item">
      <div class="h">How this portal works</div>
      <div class="sub">
        This portal reads localStorage from the same domain as your app.
        Host this folder at <code>/portal/</code> in the same repo to share data.
      </div>
      <div class="sub" style="margin-top:10px;">
        <b>Detected keys</b><br>
        Dogs: <code>${esc(state.keys.dogs || "(none)")}</code><br>
        Inventory: <code>${esc(state.keys.inventory || "(none)")}</code><br>
        Events: <code>${esc(state.keys.events || "(none)")}</code>
      </div>
    </div>
  `;
}

function render() {
  const tab = state.tab;

  // Show/hide toolbar filters based on tab
  const statusFilter = document.getElementById("statusFilter");
  const sexFilter = document.getElementById("sexFilter");
  if (tab === "dogs") {
    statusFilter.disabled = false;
    sexFilter.disabled = false;
  } else {
    statusFilter.disabled = true;
    sexFilter.disabled = true;
  }

  let count = 0;
  if (tab === "dogs") count = renderDogs();
  if (tab === "inv_edible") {
    const r = renderInventory("edible");
    document.getElementById("viewInvEdible").innerHTML = r.html;
    count = r.count;
  }
  if (tab === "stock_inedible") {
    const r = renderInventory("inedible");
    document.getElementById("viewStockInedible").innerHTML = r.html;
    count = r.count;
  }
  if (tab === "history") count = renderHistory();
  if (tab === "about") renderAbout();

  document.getElementById("meta").textContent = `Items: ${count}`;
}

function exportSnapshot() {
  const snap = {
    exportedAt: new Date().toISOString(),
    keys: state.keys,
    dogs: state.dogs,
    inventory: state.inventory,
    events: state.events,
  };
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bp_portal_export.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importSnapshot(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const snap = JSON.parse(String(reader.result || "{}"));
      // Write into whichever keys we detect, else default to first candidates.
      const dogsKey = state.keys.dogs || KEY_CANDIDATES.dogs[0];
      const invKey  = state.keys.inventory || KEY_CANDIDATES.inventory[0];
      const evKey   = state.keys.events || KEY_CANDIDATES.events[0];

      // Persist back to localStorage (opt-in restore)
      if (snap.dogs) localStorage.setItem(dogsKey, JSON.stringify(Array.isArray(snap.dogs) ? {dogs:snap.dogs} : snap.dogs));
      if (snap.inventory) localStorage.setItem(invKey, JSON.stringify(Array.isArray(snap.inventory) ? {inventory:snap.inventory} : snap.inventory));
      if (snap.events) localStorage.setItem(evKey, JSON.stringify(snap.events));

      refresh();
      alert("Import complete.");
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

// Wire UI
document.getElementById("btnRefresh").addEventListener("click", refresh);
document.getElementById("btnExport").addEventListener("click", exportSnapshot);
document.getElementById("fileImport").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) importSnapshot(f);
  e.target.value = "";
});

document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setTab(t.dataset.tab)));
document.getElementById("q").addEventListener("input", render);
document.getElementById("statusFilter").addEventListener("change", render);
document.getElementById("sexFilter").addEventListener("change", render);

refresh();
setTab("dogs");
