/**
 * inventory_transfer_source_patch.js
 *
 * Adds a SOURCE location dropdown to Transfer, alongside Destination text field.
 *
 * Works with the A–D patch's location buckets (item.locs) and/or basic qty items.
 *
 * Behavior
 * - Injects:
 *   - Source (dropdown): defaults to "On hand"
 *   - Destination (text): uses existing #transferDest if present, else injects it
 * - Wraps applyTransfer() to MOVE qty from Source -> Destination bucket
 * - If Destination is blank: falls back to legacy behavior (subtract qty via original applyTransfer)
 *
 * Install
 * - Load AFTER:
 *   - inventory_transfer_destination_patch.js (optional)
 *   - inventory_a_to_d_patch.js (recommended)
 *   - and after your app scripts
 *
 * Notes
 * - Does NOT require console.
 * - Safe: if elements aren't present yet, re-injects on view show.
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const ACT_KEY = "breederPro_inventory_activity_v1";
  const DEFAULT_SOURCE = "On hand";

  const nowISO = () => new Date().toISOString();

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

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

  function loadAct() {
    const o = loadJson(ACT_KEY, { events: [] });
    if (!Array.isArray(o.events)) o.events = [];
    return o;
  }

  function saveAct(o) {
    saveJson(ACT_KEY, o);
  }

  function recordActivity(evt) {
    const store = loadAct();
    store.events.unshift(evt);
    store.events = store.events.slice(0, 300);
    saveAct(store);
  }

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

  function getTransferSource() {
    const sel = document.getElementById("transferSource");
    const v = String(sel?.value || "").trim();
    return v || DEFAULT_SOURCE;
  }

  function getTransferDest() {
    const v = String(document.getElementById("transferDest")?.value || "").trim();
    return v;
  }

  function ensureDestinationField(form) {
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

  function injectSourceField() {
    const form = document.getElementById("transferForm");
    if (!form) return;

    ensureDestinationField(form);

    if (document.getElementById("transferSource")) return;

    const wrap = document.createElement("div");
    wrap.className = "transfer-source-wrap";
    wrap.style.marginTop = "10px";
    wrap.innerHTML = `
      <label class="label">Source location</label>
      <select id="transferSource"></select>
      <div class="muted small" style="margin-top:6px;">Default source is "${DEFAULT_SOURCE}".</div>
    `;

    // Place source above destination if possible
    const destWrap = form.querySelector(".transfer-dest-wrap") || document.getElementById("transferDest")?.parentElement;
    if (destWrap) destWrap.insertAdjacentElement("beforebegin", wrap);
    else form.insertAdjacentElement("afterbegin", wrap);

    // Populate options now (and later in showTransfer)
    populateSourceOptions();
  }

  function populateSourceOptions() {
    const sel = document.getElementById("transferSource");
    if (!sel) return;

    const itemId = window.transferItemId || "";
    const store = loadInv();
    const it = (store.inventory || []).find((x) => x.itemId === itemId);

    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = DEFAULT_SOURCE;
    opt0.textContent = DEFAULT_SOURCE;
    sel.appendChild(opt0);

    if (!it) return;

    normalizeLocs(it);
    const entries = Object.entries(it.locs || {})
      .filter(([, v]) => Number(v) > 0)
      .map(([k]) => k)
      .filter((k) => k !== DEFAULT_SOURCE)
      .sort((a, b) => a.localeCompare(b));

    for (const k of entries) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      sel.appendChild(opt);
    }

    // Keep default selected
    sel.value = DEFAULT_SOURCE;
  }

  function wrapShowTransfer() {
    const fn = window.showTransfer;
    if (typeof fn !== "function" || fn._bpSourceWrapped) return;

    window.showTransfer = function () {
      const res = fn.apply(this, arguments);
      try {
        injectSourceField();
        populateSourceOptions();
        const dest = document.getElementById("transferDest");
        if (dest) dest.value = "";
      } catch (_) {}
      return res;
    };

    window.showTransfer._bpSourceWrapped = true;
  }

  function wrapApplyTransfer() {
    const fn = window.applyTransfer;
    if (typeof fn !== "function" || fn._bpSourceWrapped) return;

    window.applyTransfer = function () {
      const qty = Math.abs(Number(document.getElementById("transferQty")?.value || 0) || 0);
      const itemId = window.transferItemId || "";
      const src = getTransferSource();
      const dest = getTransferDest();

      // If no destination, keep legacy behavior.
      if (!dest) return fn.apply(this, arguments);

      const store = loadInv();
      const it = (store.inventory || []).find((x) => x.itemId === itemId);

      if (!it || qty <= 0) return fn.apply(this, arguments);

      // Ensure loc buckets exist
      normalizeLocs(it);

      const fromQty = Number(it.locs[src] || 0);
      const move = Math.min(fromQty, qty);

      // If selected source doesn't have stock, do nothing but show a status line.
      if (move <= 0) {
        try {
          const st = document.getElementById("transferStatus");
          if (st) st.textContent = `No quantity available in "${src}".`;
        } catch (_) {}
        return;
      }

      it.locs[src] = Math.max(0, fromQty - move);
      it.locs[dest] = Number(it.locs[dest] || 0) + move;
      normalizeLocs(it);

      saveInv(store);

      recordActivity({
        type: "Transfer quantity",
        kind: kindNow(),
        itemId,
        itemName: it.name || "",
        qty: move,
        at: nowISO(),
        note: `From: ${src} → To: ${dest}`,
      });

      try {
        const st = document.getElementById("transferStatus");
        if (st) st.textContent = `Moved ${move} from "${src}" to "${dest}".`;
      } catch (_) {}

      // Refresh existing UI hooks
      try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
      try { if (typeof window.populateInvSelects === "function") window.populateInvSelects(); } catch (_) {}

      return;
    };

    window.applyTransfer._bpSourceWrapped = true;
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpSourceWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}

      if (view === "InventoryTransfer") {
        setTimeout(() => {
          try { injectSourceField(); populateSourceOptions(); } catch (_) {}
        }, 0);
      }
    };

    window.__afterShow._bpSourceWrapped = true;
  }

  function install() {
    injectSourceField();
    wrapShowTransfer();
    wrapApplyTransfer();
    hookAfterShow();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 500);
    setTimeout(install, 1500);
  });
})();
