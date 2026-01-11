
/**
 * inventory_locations_ui_patch.js
 *
 * Implements:
 * A) User-defined SOURCE dropdown (separate for Inventory vs Stock, same UX)
 * B) Remember "last used" Source/Destination per kind
 * C) Locations view per item (edit location buckets)
 *
 * Works with existing patches:
 * - inventory_ui_patch.js (cards + activity)
 * - inventory_transfer_source_patch.js (source dropdown) [optional]
 * - inventory_destination_presets_patch.js (destination presets) [optional]
 * - inventory_a_to_d_patch.js (loc buckets) [optional but recommended]
 *
 * This patch is self-contained:
 * - Injects Source + Destination preset dropdowns with Manage dialog (per kind)
 * - Adds "Locations" button on each Available card; opens editor dialog for loc buckets
 *
 * Storage keys:
 * - breederPro_transfer_locations_presets_v1: { edible:{sources:[], dests:[]}, inedible:{sources:[], dests:[]} }
 * - breederPro_transfer_last_v1: { edible:{src:"",dest:""}, inedible:{src:"",dest:""} }
 *
 * Inventory store key (your app): breederPro_inventory_store_v1
 *
 * Install: load AFTER your inventory patches; ideally last.
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const PRESETS_KEY = "breederPro_transfer_locations_presets_v1";
  const LAST_KEY = "breederPro_transfer_last_v1";
  const DEFAULT_SOURCE = "On hand";

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const nowISO = () => new Date().toISOString();

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  }

  function loadInv() {
    const o = loadJson(INV_KEY, { inventory: [] });
    if (!Array.isArray(o.inventory)) o.inventory = [];
    return o;
  }

  function saveInv(o) {
    saveJson(INV_KEY, o);
  }

  function uniqClean(arr) {
    const seen = new Set();
    const out = [];
    for (const v of arr || []) {
      const s = String(v || "").trim();
      if (!s) continue;
      const k = s.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    return out;
  }

  function ensurePresets() {
    const p = loadJson(PRESETS_KEY, null) || {};
    if (!p.edible) p.edible = { sources: [], dests: [] };
    if (!p.inedible) p.inedible = { sources: [], dests: [] };

    // Seed a few sensible defaults, user can remove them
    if (!p.edible.sources.length) p.edible.sources = [DEFAULT_SOURCE, "Freezer", "Fridge"];
    if (!p.inedible.sources.length) p.inedible.sources = [DEFAULT_SOURCE, "Truck", "Storage"];
    if (!p.edible.dests.length) p.edible.dests = ["Freezer", "Fridge", "Pantry", "Kennel"];
    if (!p.inedible.dests.length) p.inedible.dests = ["Truck", "Kennel", "Storage", "Laundry"];

    p.edible.sources = uniqClean(p.edible.sources);
    p.inedible.sources = uniqClean(p.inedible.sources);
    p.edible.dests = uniqClean(p.edible.dests);
    p.inedible.dests = uniqClean(p.inedible.dests);

    saveJson(PRESETS_KEY, p);
    return p;
  }

  function loadLast() {
    const o = loadJson(LAST_KEY, { edible: { src: "", dest: "" }, inedible: { src: "", dest: "" } });
    if (!o.edible) o.edible = { src: "", dest: "" };
    if (!o.inedible) o.inedible = { src: "", dest: "" };
    return o;
  }

  function saveLast(o) {
    saveJson(LAST_KEY, o);
  }

  // ----------------------------
  // Location buckets
  // ----------------------------
  function normalizeLocs(it) {
    if (!it) return it;
    if (!it.locs || typeof it.locs !== "object") {
      const qty = Number(it.qty || 0);
      it.locs = { [DEFAULT_SOURCE]: qty };
    }
    if (typeof it.locs[DEFAULT_SOURCE] !== "number") it.locs[DEFAULT_SOURCE] = Number(it.locs[DEFAULT_SOURCE] || 0);
    it.qty = Object.values(it.locs).reduce((a, b) => a + (Number(b) || 0), 0);
    return it;
  }

  // ----------------------------
  // Transfer UI injection (Source/Dest presets + last used)
  // ----------------------------
  function ensureDestField(form) {
    if (document.getElementById("transferDest")) return;
    const wrap = document.createElement("div");
    wrap.className = "transfer-dest-wrap";
    wrap.style.marginTop = "10px";
    wrap.innerHTML = `
      <label class="label">Destination (optional)</label>
      <input id="transferDest" placeholder="e.g., Freezer, Kennel A, Truck 2…" />
      <div class="muted small" style="margin-top:6px;">Saved to activity log.</div>
    `;
    const buttons = form.querySelector(".row");
    if (buttons) buttons.insertAdjacentElement("beforebegin", wrap);
    else form.appendChild(wrap);
  }

  function ensureSourceField(form) {
    if (document.getElementById("transferSource")) return;
    const wrap = document.createElement("div");
    wrap.className = "transfer-source-wrap";
    wrap.style.marginTop = "10px";
    wrap.innerHTML = `
      <label class="label">Source location</label>
      <select id="transferSource"></select>
      <div class="muted small" style="margin-top:6px;">Pick where you're moving FROM.</div>
    `;
    // Insert before destination if possible
    const destWrap = form.querySelector(".transfer-dest-wrap");
    if (destWrap) destWrap.insertAdjacentElement("beforebegin", wrap);
    else form.insertAdjacentElement("afterbegin", wrap);
  }

  function ensurePresetDropdowns(form) {
    if (document.getElementById("transferDestSelect")) return;

    const wrap = document.createElement("div");
    wrap.className = "transfer-presets-wrap";
    wrap.style.marginTop = "10px";
    wrap.innerHTML = `
      <div class="grid2">
        <div>
          <label class="label">Saved sources</label>
          <select id="transferSourceSelect"></select>
        </div>
        <div>
          <label class="label">Saved destinations</label>
          <select id="transferDestSelect"></select>
        </div>
      </div>
      <div class="row" style="margin-top:10px;">
        <button type="button" class="btn" id="btnManageLocPresets">Manage locations</button>
      </div>
      <div class="muted small" style="margin-top:6px;">
        Pick from dropdowns to fill Source/Destination. Lists are user-defined per Inventory vs Stock.
      </div>
    `;

    // Place above the actual fields
    const srcWrap = form.querySelector(".transfer-source-wrap") || form;
    srcWrap.insertAdjacentElement("beforebegin", wrap);

    document.getElementById("transferSourceSelect").addEventListener("change", () => {
      const v = String(document.getElementById("transferSourceSelect").value || "").trim();
      if (!v) return;
      const src = document.getElementById("transferSource");
      if (src) src.value = v;
      document.getElementById("transferSourceSelect").value = "";
    });

    document.getElementById("transferDestSelect").addEventListener("change", () => {
      const v = String(document.getElementById("transferDestSelect").value || "").trim();
      if (!v) return;
      const dest = document.getElementById("transferDest");
      if (dest) dest.value = v;
      document.getElementById("transferDestSelect").value = "";
    });

    document.getElementById("btnManageLocPresets").addEventListener("click", () => {
      ensureManageDialog();
      renderManageDialog();
      document.getElementById("dlgLocPresets").showModal();
    });
  }

  function populateTransferFieldsFromLast() {
    const last = loadLast();
    const k = kindNow();
    const src = document.getElementById("transferSource");
    const dest = document.getElementById("transferDest");
    if (src && last[k]?.src) src.value = last[k].src;
    if (dest && last[k]?.dest) dest.value = last[k].dest;
  }

  function populatePresetSelects() {
    const p = ensurePresets();
    const k = kindNow();
    const srcSel = document.getElementById("transferSourceSelect");
    const destSel = document.getElementById("transferDestSelect");
    const src = document.getElementById("transferSource");
    if (srcSel) {
      srcSel.innerHTML = "";
      const o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = "Saved sources…";
      srcSel.appendChild(o0);
      for (const v of (p[k].sources || []).slice().sort((a,b)=>a.localeCompare(b))) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        srcSel.appendChild(o);
      }
    }
    if (destSel) {
      destSel.innerHTML = "";
      const o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = "Saved destinations…";
      destSel.appendChild(o0);
      for (const v of (p[k].dests || []).slice().sort((a,b)=>a.localeCompare(b))) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        destSel.appendChild(o);
      }
    }

    // Also populate actual Source dropdown with (a) loc buckets for item + (b) saved sources
    if (src) {
      const itemId = window.transferItemId || "";
      const inv = loadInv();
      const it = (inv.inventory || []).find((x) => x.itemId === itemId);
      const bucketNames = it ? Object.keys(normalizeLocs(it).locs || {}) : [];
      const merged = uniqClean([DEFAULT_SOURCE, ...bucketNames, ...(p[k].sources || [])]);
      src.innerHTML = "";
      for (const name of merged) {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = name;
        src.appendChild(o);
      }
    }
  }

  function rememberLastFromTransferForm() {
    const src = String(document.getElementById("transferSource")?.value || "").trim();
    const dest = String(document.getElementById("transferDest")?.value || "").trim();
    const o = loadLast();
    const k = kindNow();
    if (src) o[k].src = src;
    if (dest) o[k].dest = dest;
    saveLast(o);
  }

  function injectTransferEnhancements() {
    const form = document.getElementById("transferForm");
    if (!form) return;

    ensureSourceField(form);
    ensureDestField(form);
    ensurePresetDropdowns(form);
    populatePresetSelects();
    populateTransferFieldsFromLast();
  }

  // Wrap applyTransfer to remember last used (and not fight other patches)
  function wrapApplyTransferRememberLast() {
    const fn = window.applyTransfer;
    if (typeof fn !== "function" || fn._bpRememberWrapped) return;
    window.applyTransfer = function () {
      rememberLastFromTransferForm();
      return fn.apply(this, arguments);
    };
    window.applyTransfer._bpRememberWrapped = true;
  }

  // Hook afterShow to ensure transfer UI is present
  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpLocUiWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}
      if (view === "InventoryTransfer") {
        setTimeout(() => {
          try { injectTransferEnhancements(); } catch (_) {}
        }, 0);
      }
      // When kind changes and user returns to Transfer, we'll re-populate.
    };
    window.__afterShow._bpLocUiWrapped = true;
  }

  // ----------------------------
  // Manage presets dialog
  // ----------------------------
  function ensureManageDialog() {
    if (document.getElementById("dlgLocPresets")) return;

    const dlg = document.createElement("dialog");
    dlg.id = "dlgLocPresets";
    dlg.innerHTML = `
      <form method="dialog" class="dlg-card">
        <div class="dlg-h">
          <h3>Locations presets</h3>
          <button class="btn" value="cancel">✕</button>
        </div>
        <div class="muted small" style="margin-top:8px;">
          These are user-defined. Inventory and Stock are separate but behave the same.
        </div>

        <div class="grid2" style="margin-top:12px;">
          <div>
            <strong>Sources • Inventory</strong>
            <div id="srcListEdible" class="loc-list"></div>
            <div class="row" style="margin-top:10px;">
              <input id="srcAddEdible" placeholder="Add source…" />
              <button type="button" class="btn primary" id="btnSrcAddEdible">Add</button>
            </div>

            <div style="height:12px;"></div>

            <strong>Destinations • Inventory</strong>
            <div id="dstListEdible" class="loc-list"></div>
            <div class="row" style="margin-top:10px;">
              <input id="dstAddEdible" placeholder="Add destination…" />
              <button type="button" class="btn primary" id="btnDstAddEdible">Add</button>
            </div>
          </div>

          <div>
            <strong>Sources • Stock</strong>
            <div id="srcListInedible" class="loc-list"></div>
            <div class="row" style="margin-top:10px;">
              <input id="srcAddInedible" placeholder="Add source…" />
              <button type="button" class="btn primary" id="btnSrcAddInedible">Add</button>
            </div>

            <div style="height:12px;"></div>

            <strong>Destinations • Stock</strong>
            <div id="dstListInedible" class="loc-list"></div>
            <div class="row" style="margin-top:10px;">
              <input id="dstAddInedible" placeholder="Add destination…" />
              <button type="button" class="btn primary" id="btnDstAddInedible">Add</button>
            </div>
          </div>
        </div>

        <div class="dlg-f">
          <button class="btn" value="cancel">Close</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);

    dlg.addEventListener("click", (e) => {
      const x = e.target.closest?.("button.loc-x");
      if (!x) return;
      const kind = x.getAttribute("data-kind");
      const type = x.getAttribute("data-type"); // sources|dests
      const name = decodeURIComponent(x.getAttribute("data-name") || "");
      const p = ensurePresets();
      p[kind][type] = uniqClean((p[kind][type] || []).filter((v) => String(v).trim().toLowerCase() !== name.toLowerCase()));
      saveJson(PRESETS_KEY, p);
      renderManageDialog();
      populatePresetSelects();
    });

    function add(kind, type, inputId) {
      const inp = document.getElementById(inputId);
      const v = String(inp.value || "").trim();
      if (!v) return;
      const p = ensurePresets();
      p[kind][type] = uniqClean([...(p[kind][type] || []), v]);
      saveJson(PRESETS_KEY, p);
      inp.value = "";
      renderManageDialog();
      populatePresetSelects();
    }

    document.getElementById("btnSrcAddEdible").addEventListener("click", () => add("edible", "sources", "srcAddEdible"));
    document.getElementById("btnDstAddEdible").addEventListener("click", () => add("edible", "dests", "dstAddEdible"));
    document.getElementById("btnSrcAddInedible").addEventListener("click", () => add("inedible", "sources", "srcAddInedible"));
    document.getElementById("btnDstAddInedible").addEventListener("click", () => add("inedible", "dests", "dstAddInedible"));
  }

  function pill(name, kind, type) {
    return `
      <span class="loc-pill">
        ${esc(name)}
        <button type="button" class="loc-x" data-kind="${esc(kind)}" data-type="${esc(type)}" data-name="${encodeURIComponent(name)}">✕</button>
      </span>
    `;
  }

  function renderManageDialog() {
    const p = ensurePresets();
    const setHtml = (id, arr, kind, type) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = arr.length ? arr.map((n) => pill(n, kind, type)).join("") : `<div class="muted small">None yet.</div>`;
    };

    setHtml("srcListEdible", (p.edible.sources || []).slice().sort((a,b)=>a.localeCompare(b)), "edible", "sources");
    setHtml("dstListEdible", (p.edible.dests || []).slice().sort((a,b)=>a.localeCompare(b)), "edible", "dests");
    setHtml("srcListInedible", (p.inedible.sources || []).slice().sort((a,b)=>a.localeCompare(b)), "inedible", "sources");
    setHtml("dstListInedible", (p.inedible.dests || []).slice().sort((a,b)=>a.localeCompare(b)), "inedible", "dests");
  }

  // ----------------------------
  // C) Locations view per item (edit buckets)
  // ----------------------------
  function ensureLocEditorDialog() {
    if (document.getElementById("dlgItemLocs")) return;

    const dlg = document.createElement("dialog");
    dlg.id = "dlgItemLocs";
    dlg.innerHTML = `
      <form method="dialog" class="dlg-card">
        <div class="dlg-h">
          <h3 id="locsTitle">Locations</h3>
          <button class="btn" value="cancel">✕</button>
        </div>

        <div class="muted small" id="locsSub" style="margin-top:8px;"></div>

        <div id="locsGrid" style="margin-top:12px;"></div>

        <div class="row" style="margin-top:12px;">
          <input id="locsAddName" placeholder="New location name…" />
          <input id="locsAddQty" placeholder="Qty" inputmode="decimal" />
          <button type="button" class="btn primary" id="btnLocsAdd">Add</button>
        </div>

        <div class="dlg-f">
          <button class="btn" value="cancel">Close</button>
          <button class="btn primary" id="btnLocsSave" value="ok">Save</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
  }

  function renderLocEditor(itemId) {
    const store = loadInv();
    const it = (store.inventory || []).find((x) => x.itemId === itemId);
    if (!it) return;

    normalizeLocs(it);

    document.getElementById("locsTitle").textContent = `Locations • ${it.name || ""}`;
    document.getElementById("locsSub").textContent = `Total on hand: ${Number(it.qty || 0)} • Edit buckets below.`;

    const grid = document.getElementById("locsGrid");
    const entries = Object.entries(it.locs || {}).sort((a,b)=>a[0].localeCompare(b[0]));

    grid.innerHTML = entries.map(([name, qty]) => `
      <div class="loc-row" data-name="${encodeURIComponent(name)}">
        <div class="loc-name">${esc(name)}</div>
        <input class="loc-qty" inputmode="decimal" value="${esc(Number(qty || 0))}" />
        <button type="button" class="btn danger loc-del">✕</button>
      </div>
    `).join("");

    // Deleting a row
    grid.onclick = (e) => {
      const del = e.target.closest?.(".loc-del");
      if (!del) return;
      const row = e.target.closest?.(".loc-row");
      row?.remove();
    };

    // Add row
    document.getElementById("btnLocsAdd").onclick = () => {
      const name = String(document.getElementById("locsAddName").value || "").trim();
      const qty = Math.abs(Number(document.getElementById("locsAddQty").value || 0) || 0);
      if (!name) return;
      const exists = grid.querySelector(`.loc-row[data-name="${encodeURIComponent(name)}"]`);
      if (exists) return;
      const div = document.createElement("div");
      div.className = "loc-row";
      div.setAttribute("data-name", encodeURIComponent(name));
      div.innerHTML = `
        <div class="loc-name">${esc(name)}</div>
        <input class="loc-qty" inputmode="decimal" value="${esc(qty)}" />
        <button type="button" class="btn danger loc-del">✕</button>
      `;
      grid.appendChild(div);
      document.getElementById("locsAddName").value = "";
      document.getElementById("locsAddQty").value = "";
    };

    // Save
    document.getElementById("btnLocsSave").onclick = (e) => {
      e.preventDefault();
      const newLocs = {};
      grid.querySelectorAll(".loc-row").forEach((row) => {
        const n = decodeURIComponent(row.getAttribute("data-name") || "");
        const q = Math.abs(Number(row.querySelector(".loc-qty")?.value || 0) || 0);
        if (!n) return;
        if (q <= 0) return; // omit 0 buckets
        newLocs[n] = q;
      });
      // Ensure at least default exists
      if (!Object.keys(newLocs).length) newLocs[DEFAULT_SOURCE] = 0;

      it.locs = newLocs;
      normalizeLocs(it);
      saveInv(store);

      // Refresh external UI if present
      try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
      try { if (typeof window.populateInvSelects === "function") window.populateInvSelects(); } catch (_) {}

      // Keep presets in sync by learning new bucket names (optional)
      const p = ensurePresets();
      const k = (it.kind || "edible") === "inedible" ? "inedible" : "edible";
      p[k].sources = uniqClean([...(p[k].sources || []), ...Object.keys(newLocs)]);
      saveJson(PRESETS_KEY, p);

      populatePresetSelects();

      document.getElementById("dlgItemLocs").close();
    };
  }

  function addLocationsButtonsToCards() {
    // Adds a small "Locations" button to each inv-card (Available view) if inventory_ui_patch is installed.
    const list = document.getElementById("invList");
    if (!list) return;

    list.querySelectorAll(".inv-card").forEach((card) => {
      if (card.querySelector(".btn-locs")) return;
      const actions = card.querySelector(".inv-actions");
      if (!actions) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-locs";
      btn.textContent = "Locations";
      actions.appendChild(btn);
    });
  }

  function bindLocationsClick() {
    const list = document.getElementById("invList");
    if (!list || list._bpLocDelegated) return;
    list.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".btn-locs");
      if (!btn) return;
      const card = e.target.closest?.(".inv-card");
      const itemId = card?.getAttribute?.("data-item-id") || "";
      if (!itemId) return;
      ensureLocEditorDialog();
      renderLocEditor(itemId);
      document.getElementById("dlgItemLocs").showModal();
    });
    list._bpLocDelegated = true;
  }

  // ----------------------------
  // Install
  // ----------------------------
  function install() {
    ensurePresets();
    ensureManageDialog();
    ensureLocEditorDialog();

    hookAfterShow();
    wrapApplyTransferRememberLast();

    // Inventory Available enhancements
    addLocationsButtonsToCards();
    bindLocationsClick();

    // keep cards enhanced as list rerenders
    if (!window.__bpLocCardTimer) {
      window.__bpLocCardTimer = setInterval(() => {
        try { addLocationsButtonsToCards(); } catch (_) {}
      }, 1200);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
