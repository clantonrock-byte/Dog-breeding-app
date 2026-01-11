/**
 * inventory_a_to_d_patch.js
 *
 * A) Seed/clear test tools (per kind: edible/inedible)
 * B) True transfer with location buckets (default source: "On hand")
 * C) Export/Import backups (Dogs + Inventory + Activity)
 * D) Scanner fallback (ZXing) when BarcodeDetector is missing
 *
 * Designed as a runtime patch for your current single-page app.
 *
 * Keys used by your app (from earlier code):
 * - Dogs: breederPro_dogs_store_v3
 * - Inventory: breederPro_inventory_store_v1
 * - Activity: breederPro_inventory_activity_v1 (from inventory_ui_patch)
 *
 * IMPORTANT: Load this script AFTER your app scripts and AFTER inventory_ui_patch.js.
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const INV_KEY = "breederPro_inventory_store_v1";
  const ACT_KEY = "breederPro_inventory_activity_v1";

  const SOURCE_LOC = "On hand";

  const nowISO = () => new Date().toISOString();

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

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

  function loadDogs() {
    const o = loadJson(DOG_KEY, { dogs: [] });
    if (!Array.isArray(o.dogs)) o.dogs = [];
    return o;
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

  // -----------------------------
  // A) Seed / Clear tools
  // -----------------------------
  function seedItemsForKind(kind) {
    const store = loadInv();
    const suffix = kind === "inedible" ? "stock" : "inv";
    const items = kind === "inedible"
      ? [
          { name: "Leash", id: "333333" },
          { name: "Dog Bowls", id: "444444" },
          { name: "Paper Towels", id: "555555" },
        ]
      : [
          { name: "Kibble – Puppy", id: "111111" },
          { name: "Canned Food", id: "222222" },
          { name: "Rice", id: "666666" },
        ];

    items.forEach((it) => {
      store.inventory.push({
        itemId: `inv_${suffix}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: it.name,
        identifierType: "Barcode",
        identifierValue: it.id,
        kind,
        qty: kind === "inedible" ? 5 : 10,
        archived: false,
        // location buckets: initialize on seed so transfer can be real immediately
        locs: { [SOURCE_LOC]: kind === "inedible" ? 5 : 10 },
      });
    });

    saveInv(store);

    recordActivity({
      type: "Seed sample items",
      kind,
      at: nowISO(),
      note: `Added ${items.length} items`,
    });

    refreshInventoryUI();
  }

  function clearItemsForKind(kind) {
    const store = loadInv();
    store.inventory = (store.inventory || []).filter((i) => (i.kind || "edible") !== kind);
    saveInv(store);

    // clear activity for kind too
    const act = loadAct();
    act.events = (act.events || []).filter((e) => e.kind !== kind);
    saveAct(act);

    refreshInventoryUI();
  }

  // -----------------------------
  // C) Export / Import
  // -----------------------------
  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportAllData() {
    const payload = {
      exportedAt: nowISO(),
      dogs: loadDogs(),
      inventory: loadInv(),
      activity: loadAct(),
      // future-proof: keep kind
      rcInvKind: kindNow(),
      version: 1,
    };
    downloadText(`breederpro_export_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
  }

  function ensureImportInput() {
    if (document.getElementById("bpImportFile")) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.id = "bpImportFile";
    input.className = "hide";
    input.addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;

      try {
        const txt = await f.text();
        const obj = JSON.parse(txt);

        if (!obj || typeof obj !== "object") throw new Error("Invalid file");

        if (obj.dogs) saveJson(DOG_KEY, obj.dogs);
        if (obj.inventory) saveJson(INV_KEY, obj.inventory);
        if (obj.activity) saveJson(ACT_KEY, obj.activity);

        alert("Import complete.");
        refreshInventoryUI();
        try { if (typeof window.renderDogs === "function") window.renderDogs(); } catch (_) {}
      } catch (err) {
        alert("Import failed: " + (err?.message || err));
      }
    });
    document.body.appendChild(input);
  }

  function importAllData() {
    ensureImportInput();
    document.getElementById("bpImportFile").click();
  }

  // -----------------------------
  // B) True transfer with location buckets
  // -----------------------------
  function normalizeLocs(it) {
    if (!it) return it;
    if (!it.locs || typeof it.locs !== "object") {
      const qty = Number(it.qty || 0);
      it.locs = { [SOURCE_LOC]: qty };
    }
    if (typeof it.locs[SOURCE_LOC] !== "number") {
      it.locs[SOURCE_LOC] = Number(it.locs[SOURCE_LOC] || 0);
    }
    // keep qty in sync as sum of locs
    it.qty = Object.values(it.locs).reduce((a, b) => a + (Number(b) || 0), 0);
    return it;
  }

  function getTransferDestination() {
    return String(document.getElementById("transferDest")?.value || "").trim();
  }

  function wrapInventoryOpsForLocs() {
    // Wrap applyAddStock => add to SOURCE_LOC
    const addFn = window.applyAddStock;
    if (typeof addFn === "function" && !addFn._bpLocWrapped) {
      window.applyAddStock = function () {
        // capture intent
        const qty = Math.abs(Number(document.getElementById("addStockQty")?.value || 0) || 0);
        const itemId = window.addStockItemId || "";
        const res = addFn.apply(this, arguments);

        try {
          if (qty > 0 && itemId) {
            const store = loadInv();
            const it = store.inventory.find((x) => x.itemId === itemId);
            if (it) {
              normalizeLocs(it);
              it.locs[SOURCE_LOC] = Number(it.locs[SOURCE_LOC] || 0) + qty;
              normalizeLocs(it);
              saveInv(store);
              recordActivity({ type: "Add quantity", kind: kindNow(), itemId, itemName: it.name, qty, at: nowISO(), note: `To: ${SOURCE_LOC}` });
            }
          }
        } catch (_) {}

        refreshInventoryUI();
        return res;
      };
      window.applyAddStock._bpLocWrapped = true;
    }

    // Wrap applyReduce => subtract from SOURCE_LOC
    const redFn = window.applyReduce;
    if (typeof redFn === "function" && !redFn._bpLocWrapped) {
      window.applyReduce = function () {
        const qty = Math.abs(Number(document.getElementById("reduceQty")?.value || 0) || 0);
        const action = String(document.getElementById("reduceAction")?.value || "Used");
        const itemId = window.reduceItemId || "";
        const res = redFn.apply(this, arguments);

        try {
          if (qty > 0 && itemId) {
            const store = loadInv();
            const it = store.inventory.find((x) => x.itemId === itemId);
            if (it) {
              normalizeLocs(it);
              it.locs[SOURCE_LOC] = Math.max(0, Number(it.locs[SOURCE_LOC] || 0) - qty);
              normalizeLocs(it);
              saveInv(store);
              recordActivity({ type: action === "Discarded" ? "Discard quantity" : "Use quantity", kind: kindNow(), itemId, itemName: it.name, qty, at: nowISO(), note: `From: ${SOURCE_LOC}` });
            }
          }
        } catch (_) {}

        refreshInventoryUI();
        return res;
      };
      window.applyReduce._bpLocWrapped = true;
    }

    // Wrap applyTransfer => move between loc buckets (On hand -> dest). Total stays same.
    const trFn = window.applyTransfer;
    if (typeof trFn === "function" && !trFn._bpLocWrapped) {
      window.applyTransfer = function () {
        const qty = Math.abs(Number(document.getElementById("transferQty")?.value || 0) || 0);
        const itemId = window.transferItemId || "";
        const dest = getTransferDestination();
        const res = trFn.apply(this, arguments);

        try {
          if (qty > 0 && itemId && dest) {
            const store = loadInv();
            const it = store.inventory.find((x) => x.itemId === itemId);
            if (it) {
              normalizeLocs(it);
              const fromQty = Number(it.locs[SOURCE_LOC] || 0);
              const move = Math.min(fromQty, qty);
              it.locs[SOURCE_LOC] = Math.max(0, fromQty - move);
              it.locs[dest] = Number(it.locs[dest] || 0) + move;
              normalizeLocs(it);
              saveInv(store);
              recordActivity({ type: "Transfer quantity", kind: kindNow(), itemId, itemName: it.name, qty: move, at: nowISO(), note: `From: ${SOURCE_LOC} → To: ${dest}` });
            }
          } else if (qty > 0 && itemId && !dest) {
            // still record transfer without destination (legacy behavior)
            const it = itemById(itemId);
            recordActivity({ type: "Transfer quantity", kind: kindNow(), itemId, itemName: it?.name || "", qty, at: nowISO(), note: "No destination" });
          }
        } catch (_) {}

        refreshInventoryUI();
        return res;
      };
      window.applyTransfer._bpLocWrapped = true;
    }

    function itemById(itemId) {
      const s = loadInv();
      return (s.inventory || []).find((x) => x.itemId === itemId) || null;
    }
  }

  function enrichAvailableCardsWithLocs() {
    // If inventory_ui_patch is installed, it renders cards in #invList with .inv-card
    // We'll append a small locations line after the identifier line.
    const list = document.getElementById("invList");
    if (!list) return;

    const store = loadInv();
    const k = kindNow();

    list.querySelectorAll(".inv-card").forEach((card) => {
      const itemId = card.getAttribute("data-item-id") || "";
      if (!itemId) return;
      const it = (store.inventory || []).find((x) => x.itemId === itemId);
      if (!it) return;
      if ((it.kind || "edible") !== k) return;

      normalizeLocs(it);

      // Remove existing loc line if re-rendered
      const existing = card.querySelector(".inv-locs");
      if (existing) existing.remove();

      const entries = Object.entries(it.locs || {}).filter(([, v]) => Number(v) > 0);
      if (!entries.length) return;

      const locHtml = entries
        .slice(0, 3)
        .map(([name, v]) => `<span class="inv-loc-chip">${esc(name)}: ${esc(Number(v))}</span>`)
        .join(" ");

      const more = entries.length > 3 ? `<span class="inv-loc-more">+${entries.length - 3} more</span>` : "";

      const line = document.createElement("div");
      line.className = "inv-locs muted small";
      line.innerHTML = `Locations: ${locHtml} ${more}`;

      // insert after the first ".muted.small" line (identifier line)
      const muted = card.querySelector(".muted.small");
      if (muted) muted.insertAdjacentElement("afterend", line);
      else card.appendChild(line);
    });
  }

  // -----------------------------
  // D) Scanner fallback (ZXing)
  // -----------------------------
  function ensureZXingLoaded() {
    return new Promise((resolve) => {
      if (window.ZXingBrowser || window.ZXing) return resolve(true);

      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/index.min.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function wrapStartScanWithFallback() {
    const fn = window.startScan;
    if (typeof fn !== "function" || fn._bpWrappedZXing) return;

    window.startScan = async function () {
      // If native BarcodeDetector exists, use original
      if ("BarcodeDetector" in window) return fn.apply(this, arguments);

      // Otherwise, try ZXing
      const ok = await ensureZXingLoaded();
      if (!ok) return fn.apply(this, arguments); // will show "unsupported" but manual works

      const video = document.getElementById("scanVideo");
      const help = document.getElementById("scanHelp");
      const box = document.getElementById("scanResultBox");
      const val = document.getElementById("scanValue");

      if (!video) return fn.apply(this, arguments);

      // Request camera
      try {
        window.scanStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        video.srcObject = window.scanStream;
        await video.play();
      } catch (e) {
        if (help) help.textContent = "Camera unavailable. Manual entry works.";
        return;
      }

      if (help) help.textContent = "Scanning… (fallback)";
      if (box) box.classList.add("hide");
      if (val) val.textContent = "";

      // Use ZXingBrowser if available
      const Browser = window.ZXingBrowser || window.ZXing;
      const ReaderCtor =
        Browser.BrowserMultiFormatReader || Browser.BrowserBarcodeReader || null;

      if (!ReaderCtor) {
        if (help) help.textContent = "Scanner unsupported. Manual entry works.";
        return;
      }

      const reader = new ReaderCtor();
      window.__bpZXingReader = reader;

      if (typeof reader.decodeFromVideoElementContinuously === "function") {
        reader.decodeFromVideoElementContinuously(video, (result) => {
          const text = result?.getText?.() ? String(result.getText()).trim() : "";
          if (!text) return;

          window.lastScanValue = text;
          if (box) box.classList.remove("hide");
          if (val) val.textContent = text;
          if (help) help.textContent = "Captured.";

          try {
            if (typeof window.stopScan === "function") window.stopScan();
          } catch (_) {}
        });
      } else if (typeof reader.decodeOnceFromVideoElement === "function") {
        try {
          const result = await reader.decodeOnceFromVideoElement(video);
          const text = result?.getText?.() ? String(result.getText()).trim() : "";
          if (text) {
            window.lastScanValue = text;
            if (box) box.classList.remove("hide");
            if (val) val.textContent = text;
            if (help) help.textContent = "Captured.";
            try { if (typeof window.stopScan === "function") window.stopScan(); } catch (_) {}
          }
        } catch (_) {}
      }
    };

    window.startScan._bpWrappedZXing = true;

    // Also wrap stopScan to stop ZXing
    const stop = window.stopScan;
    if (typeof stop === "function" && !stop._bpWrappedZXing) {
      window.stopScan = function () {
        try { window.__bpZXingReader?.stop?.(); } catch (_) {}
        window.__bpZXingReader = null;
        return stop.apply(this, arguments);
      };
      window.stopScan._bpWrappedZXing = true;
    }
  }

  // -----------------------------
  // UI injection for tools
  // -----------------------------
  function injectToolsIntoMenu(viewId, title) {
    const view = document.getElementById(viewId);
    if (!view) return;

    if (view.querySelector(".bp-test-tools")) return;

    const box = document.createElement("div");
    box.className = "bp-test-tools timeline-item";
    box.innerHTML = `
      <div class="row" style="justify-content:space-between; gap:10px;">
        <strong>${esc(title)} • Test tools</strong>
        <span class="pill">${esc(kindNow())}</span>
      </div>
      <div class="muted small" style="margin-top:6px;">Use these while testing the pipes. Safe to delete later.</div>
      <div class="row" style="margin-top:10px;">
        <button class="btn primary" type="button" data-bp="seed">Seed sample items</button>
        <button class="btn danger" type="button" data-bp="clear">Clear ALL for this kind</button>
      </div>
      <div class="row" style="margin-top:10px;">
        <button class="btn" type="button" data-bp="export">Export backup</button>
        <button class="btn" type="button" data-bp="import">Import backup</button>
      </div>
      <div class="muted small" style="margin-top:10px;">
        Seed barcodes: <span class="big-code">111111, 222222, 333333, 444444, 555555, 666666</span>
      </div>
    `;

    // Add to end of menu view
    view.appendChild(box);

    box.addEventListener("click", (e) => {
      const btn = e.target.closest?.("button[data-bp]");
      if (!btn) return;

      const action = btn.getAttribute("data-bp");
      const k = kindNow();

      if (action === "seed") {
        seedItemsForKind(k);
        alert("Seeded sample items.");
      }
      if (action === "clear") {
        const ok = confirm(`Clear ALL ${k} items + activity?`);
        if (!ok) return;
        clearItemsForKind(k);
        alert("Cleared.");
      }
      if (action === "export") exportAllData();
      if (action === "import") importAllData();
    });
  }

  function refreshInventoryUI() {
    try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
    try { if (typeof window.populateInvSelects === "function") window.populateInvSelects(); } catch (_) {}
    // If inventory_ui_patch is installed, it hooks into renderInv and has activity; let it rerender naturally.
    setTimeout(() => {
      try { enrichAvailableCardsWithLocs(); } catch (_) {}
    }, 50);
  }

  function install() {
    ensureImportInput();

    // Tools UI on both menus (they both exist in your root index.html)
    injectToolsIntoMenu("viewInventoryMenu", "Inventory");
    injectToolsIntoMenu("viewStockMenu", "Stock");

    // Make transfer destination work with "true transfer" if destination is provided
    wrapInventoryOpsForLocs();

    // Enrich cards with loc chips after each renderInv (best effort)
    if (!window.__bpInvLocObserver) {
      window.__bpInvLocObserver = setInterval(() => {
        try { enrichAvailableCardsWithLocs(); } catch (_) {}
      }, 1200);
    }

    // Scanner fallback
    wrapStartScanWithFallback();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
