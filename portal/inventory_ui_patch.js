/**
 * inventory_ui_patch.js
 *
 * Inventory/Stock polish + activity log.
 *
 * Features
 * - "Available" list becomes actionable cards: Add / Use / Transfer quick buttons
 * - Search box on Available list (filters by name + identifier)
 * - Recent activity log (per kind: edible vs inedible), stored in localStorage
 * - Auto-refreshes activity + list after add/reduce/transfer/scan/create
 *
 * Assumptions (matches your current app)
 * - Views: InventoryAvailable, InventoryAddStock, InventoryReduceStock, InventoryTransfer
 * - Containers: #invList, #invMeta, #invArchived, #viewInventoryAvailable
 * - Selects: #addStockSelect, #reduceSelect, #transferSelect
 * - Forms: #addStockForm/#reduceForm/#transferForm and showAddStock/showReduce/showTransfer exist
 * - Navigation: __go(viewName) exists
 * - Data store key: breederPro_inventory_store_v1 with shape { inventory: [...] }
 * - Current kind: window.rcInvKind ('edible'|'inedible') enforced elsewhere
 *
 * Install: load this script LAST (after your main app scripts).
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const ACT_KEY = "breederPro_inventory_activity_v1";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const nowISO = () => new Date().toISOString();

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

  function loadInvStore() {
    try {
      const raw = localStorage.getItem(INV_KEY);
      const o = raw ? JSON.parse(raw) : { inventory: [] };
      if (!Array.isArray(o.inventory)) o.inventory = [];
      return o;
    } catch {
      return { inventory: [] };
    }
  }

  function saveInvStore(o) {
    localStorage.setItem(INV_KEY, JSON.stringify(o));
  }

  function loadActivity() {
    try {
      const raw = localStorage.getItem(ACT_KEY);
      const o = raw ? JSON.parse(raw) : { events: [] };
      if (!Array.isArray(o.events)) o.events = [];
      return o;
    } catch {
      return { events: [] };
    }
  }

  function saveActivity(o) {
    localStorage.setItem(ACT_KEY, JSON.stringify(o));
  }

  function recordEvent(evt) {
    const store = loadActivity();
    store.events.unshift(evt);
    // keep last 200
    store.events = store.events.slice(0, 200);
    saveActivity(store);
  }

  function fmt(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "";
    }
  }

  function itemById(itemId) {
    const s = loadInvStore();
    return (s.inventory || []).find((x) => x.itemId === itemId) || null;
  }

  function itemLabel(it) {
    const id = (it?.identifierValue || "").trim();
    return `${it?.name || "(item)"}${id ? ` • ${id}` : ""}`;
  }

  function ensureUI() {
    const view = document.getElementById("viewInventoryAvailable");
    if (!view) return;

    if (!document.getElementById("invSearchBox")) {
      const wrap = document.createElement("div");
      wrap.className = "inv-tools";

      wrap.innerHTML = `
        <label class="label">Search</label>
        <input id="invSearchBox" placeholder="Type to filter…" />
        <div class="inv-activity cardish">
          <div class="inv-activity-h">
            <strong>Recent activity</strong>
            <button class="btn ghost" type="button" id="btnInvClearActivity">Clear</button>
          </div>
          <div id="invActivityMeta" class="muted small"></div>
          <div id="invActivityList"></div>
        </div>
      `;

      // Insert after the existing Refresh/Archived buttons row (first .row under view)
      const rows = view.querySelectorAll(".row");
      if (rows && rows.length) rows[0].insertAdjacentElement("afterend", wrap);
      else view.insertAdjacentElement("afterbegin", wrap);
    }

    const search = document.getElementById("invSearchBox");
    if (search && !search._invBound) {
      search.addEventListener("input", () => {
        try { renderInvPatched(); } catch (_) {}
      });
      search._invBound = true;
    }

    const clear = document.getElementById("btnInvClearActivity");
    if (clear && !clear._invBound) {
      clear.addEventListener("click", () => {
        const o = loadActivity();
        const k = kindNow();
        o.events = o.events.filter((e) => e.kind !== k);
        saveActivity(o);
        renderActivity();
      });
      clear._invBound = true;
    }
  }

  function renderActivity() {
    const meta = document.getElementById("invActivityMeta");
    const list = document.getElementById("invActivityList");
    if (!meta || !list) return;

    const k = kindNow();
    const o = loadActivity();
    const events = (o.events || []).filter((e) => e.kind === k).slice(0, 20);

    meta.textContent = events.length ? `Showing last ${events.length} actions (${k}).` : `No activity yet (${k}).`;

    list.innerHTML = events.length
      ? events
          .map((e) => {
            const qty = e.qty != null ? Number(e.qty) : null;
            const qtyTxt = qty != null ? ` • Qty: ${qty}` : "";
            const note = e.note ? ` • ${esc(e.note)}` : "";
            return `
              <div class="inv-activity-item">
                <div><strong>${esc(e.type)}</strong>${qtyTxt}</div>
                <div class="muted small">${esc(e.itemName || "")}${note}</div>
                <div class="muted small">${esc(fmt(e.at))}</div>
              </div>
            `;
          })
          .join("")
      : `<div class="muted small">No recent actions.</div>`;
  }

  function quickGo(viewName, itemId) {
    if (typeof window.__go === "function") window.__go(viewName);
    // Delay until view is visible and selects exist
    setTimeout(() => {
      try {
        if (typeof window.populateInvSelects === "function") window.populateInvSelects();
      } catch (_) {}

      if (viewName === "InventoryAddStock") {
        const sel = document.getElementById("addStockSelect");
        if (sel) sel.value = itemId;
        try { if (typeof window.showAddStock === "function") window.showAddStock(itemId); } catch (_) {}
      }
      if (viewName === "InventoryReduceStock") {
        const sel = document.getElementById("reduceSelect");
        if (sel) sel.value = itemId;
        try { if (typeof window.showReduce === "function") window.showReduce(itemId); } catch (_) {}
      }
      if (viewName === "InventoryTransfer") {
        const sel = document.getElementById("transferSelect");
        if (sel) sel.value = itemId;
        try { if (typeof window.showTransfer === "function") window.showTransfer(itemId); } catch (_) {}
      }
    }, 50);
  }

  function invVisibleActive() {
    const store = loadInvStore();
    const k = kindNow();
    // Respect archived false only; kind separation is enforced elsewhere but we filter here too (safe)
    const active = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === k));
    const q = String(document.getElementById("invSearchBox")?.value || "").trim().toLowerCase();
    if (!q) return active;
    return active.filter((i) =>
      String((i.name || "") + " " + (i.identifierValue || "")).toLowerCase().includes(q)
    );
  }

  function renderInvPatched() {
    ensureUI();

    // keep existing meta if present
    const meta = document.getElementById("invMeta");
    const listEl = document.getElementById("invList");
    if (!meta || !listEl) return;

    const store = loadInvStore();
    const k = kindNow();
    const activeAll = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === k));
    const archivedAll = (store.inventory || []).filter((i) => i.archived && ((i.kind || "edible") === k));
    const items = invVisibleActive();

    meta.textContent = `Active: ${activeAll.length}. Archived: ${archivedAll.length}.`;

    listEl.innerHTML = items.length
      ? items
          .slice()
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
          .map((i) => {
            const qty = Number(i.qty || 0);
            const idv = (i.identifierValue || "").trim();
            return `
              <div class="timeline-item inv-card" data-item-id="${esc(i.itemId)}">
                <div class="inv-card-top">
                  <div class="inv-card-title">${esc(i.name || "")}</div>
                  <div class="inv-qty">${esc(qty)}</div>
                </div>
                <div class="muted small">${idv ? `ID: ${esc(idv)}` : "No identifier"}</div>
                <div class="inv-actions">
                  <button class="btn primary inv-act" data-act="add">Add</button>
                  <button class="btn inv-act" data-act="use">${k === "inedible" ? "Reduce" : "Use"}</button>
                  <button class="btn inv-act" data-act="move">Transfer</button>
                </div>
              </div>
            `;
          })
          .join("")
      : `<div class="muted small">${document.getElementById("invSearchBox")?.value ? "No matches." : "No active items."}</div>`;

    renderActivity();
  }

  function bindListActions() {
    const listEl = document.getElementById("invList");
    if (!listEl || listEl._invDelegated) return;

    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest?.("button.inv-act");
      if (!btn) return;
      const card = e.target.closest?.(".inv-card");
      const itemId = card?.getAttribute?.("data-item-id") || "";
      if (!itemId) return;

      const act = btn.getAttribute("data-act");
      if (act === "add") quickGo("InventoryAddStock", itemId);
      if (act === "use") quickGo("InventoryReduceStock", itemId);
      if (act === "move") quickGo("InventoryTransfer", itemId);
    });

    listEl._invDelegated = true;
  }

  function wrapFn(name, after) {
    const fn = window[name];
    if (typeof fn !== "function" || fn._invWrapped) return;
    window[name] = function () {
      const res = fn.apply(this, arguments);
      try { after(name, arguments); } catch (_) {}
      return res;
    };
    window[name]._invWrapped = true;
  }

  function installWrappers() {
    // After create item definition
    wrapFn("saveInvDef", () => {
      const s = loadInvStore();
      const last = (s.inventory || [])[s.inventory.length - 1];
      if (!last) return;
      recordEvent({
        type: "Create item",
        kind: kindNow(),
        itemId: last.itemId,
        itemName: last.name,
        at: nowISO(),
        note: last.identifierValue ? `ID ${last.identifierValue}` : "",
      });
      refreshAllSoon();
    });

    // After add qty
    wrapFn("applyAddStock", () => {
      const id = window.addStockItemId || null;
      const it = id ? itemById(id) : null;
      const qty = Number(document.getElementById("addStockQty")?.value || 0) || null;
      recordEvent({
        type: "Add quantity",
        kind: kindNow(),
        itemId: it?.itemId || "",
        itemName: it?.name || "",
        qty,
        at: nowISO(),
      });
      refreshAllSoon();
    });

    // After reduce qty
    wrapFn("applyReduce", () => {
      const id = window.reduceItemId || null;
      const it = id ? itemById(id) : null;
      const qty = Number(document.getElementById("reduceQty")?.value || 0) || null;
      const action = String(document.getElementById("reduceAction")?.value || "Used");
      recordEvent({
        type: action === "Discarded" ? "Discard quantity" : "Use quantity",
        kind: kindNow(),
        itemId: it?.itemId || "",
        itemName: it?.name || "",
        qty,
        at: nowISO(),
      });
      refreshAllSoon();
    });

    // After transfer qty
    wrapFn("applyTransfer", () => {
      const id = window.transferItemId || null;
      const it = id ? itemById(id) : null;
      const qty = Number(document.getElementById("transferQty")?.value || 0) || null;
      recordEvent({
        type: "Transfer quantity",
        kind: kindNow(),
        itemId: it?.itemId || "",
        itemName: it?.name || "",
        qty,
        at: nowISO(),
      });
      refreshAllSoon();
    });

    // After scan confirm (when it matches an item and opens a form)
    wrapFn("confirmScan", () => {
      // We don't know which item matched from here reliably; still record scan context.
      recordEvent({
        type: "Scan",
        kind: kindNow(),
        itemId: "",
        itemName: "",
        at: nowISO(),
        note: `Context: ${String(window.scanContext || "")}`,
      });
      refreshAllSoon();
    });
  }

  function refreshAllSoon() {
    setTimeout(() => {
      try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
      try { if (typeof window.populateInvSelects === "function") window.populateInvSelects(); } catch (_) {}
      try { renderInvPatched(); } catch (_) {}
    }, 0);
  }

  function install() {
    // Keep original renderInv around if needed
    if (!window.__origRenderInv && typeof window.renderInv === "function") {
      window.__origRenderInv = window.renderInv;
    }

    // Override renderInv to our polished version
    window.renderInv = renderInvPatched;

    ensureUI();
    bindListActions();
    installWrappers();

    // Render immediately (if view is visible, this updates; if not, harmless)
    try { renderInvPatched(); } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    // win load-order races
    setTimeout(install, 400);
    setTimeout(install, 1200);
    setInterval(bindListActions, 1200);
  });
})();
