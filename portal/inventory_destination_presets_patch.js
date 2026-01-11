/**
 * inventory_destination_presets_patch.js
 *
 * User-defined Destination dropdown for Transfer (and optional reuse elsewhere).
 *
 * Goals
 * - Destination remains an open text field (works for any app)
 * - Adds a dropdown of "Saved destinations" that the user defines
 * - One-tap: pick destination from dropdown -> fills text field
 * - Manage destinations (add/remove) via an injected dialog
 *
 * Storage
 * - localStorage key: breederPro_transfer_destinations_v1
 * - Shape: { edible: string[], inedible: string[] }
 *
 * Assumes:
 * - Transfer form exists: #transferForm
 * - Destination input exists: #transferDest (if not, we inject it)
 * - Optional Source select exists: #transferSource (if you installed source patch)
 * - View lifecycle hook exists: window.__afterShow(view)
 *
 * Install: load AFTER your inventory transfer patches.
 */
(() => {
  "use strict";

  const KEY = "breederPro_transfer_destinations_v1";
  const DEFAULTS = {
    edible: ["Freezer", "Fridge", "Pantry", "Kennel"],
    inedible: ["Truck", "Kennel", "Storage", "Laundry"],
  };

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      const obj = raw ? JSON.parse(raw) : null;
      const out = obj && typeof obj === "object" ? obj : {};
      if (!Array.isArray(out.edible)) out.edible = [];
      if (!Array.isArray(out.inedible)) out.inedible = [];
      return out;
    } catch {
      return { edible: [], inedible: [] };
    }
  }

  function saveStore(obj) {
    localStorage.setItem(KEY, JSON.stringify(obj));
  }

  function uniqClean(arr) {
    const seen = new Set();
    const out = [];
    for (const v of arr) {
      const s = String(v || "").trim();
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }

  function ensureSeeded() {
    const s = loadStore();
    if (!s.edible.length) s.edible = DEFAULTS.edible.slice();
    if (!s.inedible.length) s.inedible = DEFAULTS.inedible.slice();
    saveStore({ edible: uniqClean(s.edible), inedible: uniqClean(s.inedible) });
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

  function ensureDialog() {
    if (document.getElementById("dlgDestinations")) return;

    const dlg = document.createElement("dialog");
    dlg.id = "dlgDestinations";
    dlg.innerHTML = `
      <form method="dialog" class="dlg-card">
        <div class="dlg-h">
          <h3>Saved destinations</h3>
          <button class="btn" value="cancel">✕</button>
        </div>

        <div class="muted small" style="margin-top:8px;">
          These destinations are user-defined and vary by setup.
        </div>

        <div class="grid2" style="margin-top:12px;">
          <div>
            <strong>Inventory (edible)</strong>
            <div id="destListEdible" class="dest-list"></div>
            <div class="row" style="margin-top:10px;">
              <input id="destAddEdible" placeholder="Add destination…" />
              <button type="button" class="btn primary" id="btnAddEdible">Add</button>
            </div>
          </div>

          <div>
            <strong>Stock (inedible)</strong>
            <div id="destListInedible" class="dest-list"></div>
            <div class="row" style="margin-top:10px;">
              <input id="destAddInedible" placeholder="Add destination…" />
              <button type="button" class="btn primary" id="btnAddInedible">Add</button>
            </div>
          </div>
        </div>

        <div class="dlg-f">
          <button class="btn" value="cancel">Close</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);

    function renderLists() {
      const s = loadStore();
      const edible = document.getElementById("destListEdible");
      const inedible = document.getElementById("destListInedible");
      if (!edible || !inedible) return;

      const pill = (text, kind) => `
        <span class="dest-pill">
          ${text}
          <button type="button" class="dest-x" data-kind="${kind}" data-name="${encodeURIComponent(text)}">✕</button>
        </span>`;

      edible.innerHTML = s.edible.length ? s.edible.map((d) => pill(d, "edible")).join("") : `<div class="muted small">None yet.</div>`;
      inedible.innerHTML = s.inedible.length ? s.inedible.map((d) => pill(d, "inedible")).join("") : `<div class="muted small">None yet.</div>`;
    }

    dlg.addEventListener("click", (e) => {
      const x = e.target.closest?.("button.dest-x");
      if (!x) return;
      const kind = x.getAttribute("data-kind");
      const name = decodeURIComponent(x.getAttribute("data-name") || "");
      const s = loadStore();
      s[kind] = uniqClean((s[kind] || []).filter((v) => String(v).trim().toLowerCase() !== name.toLowerCase()));
      saveStore(s);
      renderLists();
      populateSelect(); // keep dropdowns current
    });

    document.getElementById("btnAddEdible").addEventListener("click", () => {
      const inp = document.getElementById("destAddEdible");
      const v = String(inp.value || "").trim();
      if (!v) return;
      const s = loadStore();
      s.edible = uniqClean([...(s.edible || []), v]);
      saveStore(s);
      inp.value = "";
      renderLists();
      populateSelect();
    });

    document.getElementById("btnAddInedible").addEventListener("click", () => {
      const inp = document.getElementById("destAddInedible");
      const v = String(inp.value || "").trim();
      if (!v) return;
      const s = loadStore();
      s.inedible = uniqClean([...(s.inedible || []), v]);
      saveStore(s);
      inp.value = "";
      renderLists();
      populateSelect();
    });

    // Expose for open handler
    window.__bpRenderDestinationLists = renderLists;
  }

  function populateSelect() {
    const sel = document.getElementById("transferDestSelect");
    if (!sel) return;

    ensureSeeded();
    const s = loadStore();
    const k = kindNow();
    const list = (s[k] || []).slice().sort((a, b) => a.localeCompare(b));

    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Saved destinations…";
    sel.appendChild(opt0);

    for (const d of list) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      sel.appendChild(opt);
    }
  }

  function injectDestinationDropdown() {
    const form = document.getElementById("transferForm");
    if (!form) return;

    ensureDestinationField(form);
    ensureDialog();

    // Don't duplicate
    if (document.getElementById("transferDestSelect")) {
      populateSelect();
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "transfer-dest-select-wrap";
    wrap.style.marginTop = "10px";
    wrap.innerHTML = `
      <label class="label">Saved destinations</label>
      <div class="row" style="gap:10px;">
        <select id="transferDestSelect"></select>
        <button type="button" class="btn" id="btnManageDests">Manage</button>
      </div>
      <div class="muted small" style="margin-top:6px;">Pick from dropdown to fill the Destination field.</div>
    `;

    // Insert dropdown ABOVE Destination text field (preferred)
    const destWrap = form.querySelector(".transfer-dest-wrap");
    if (destWrap) destWrap.insertAdjacentElement("beforebegin", wrap);
    else form.insertAdjacentElement("afterbegin", wrap);

    populateSelect();

    const sel = document.getElementById("transferDestSelect");
    const dest = document.getElementById("transferDest");

    sel.addEventListener("change", () => {
      const v = String(sel.value || "").trim();
      if (!v) return;
      dest.value = v;
      sel.value = ""; // reset
    });

    document.getElementById("btnManageDests").addEventListener("click", () => {
      const dlg = document.getElementById("dlgDestinations");
      try {
        window.__bpRenderDestinationLists?.();
        dlg.showModal();
      } catch (_) {}
    });
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpDestWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}
      if (view === "InventoryTransfer") {
        setTimeout(() => {
          try { injectDestinationDropdown(); } catch (_) {}
        }, 0);
      }
    };
    window.__afterShow._bpDestWrapped = true;
  }

  function install() {
    injectDestinationDropdown();
    hookAfterShow();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
