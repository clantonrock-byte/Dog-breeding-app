/**
 * inventory_settings_kindfix.js
 *
 * Fixes:
 * - Transfer "Saved sources/destinations" dropdown shows combined Inventory+Stock lists
 *   (forces per-kind lists based on window.rcInvKind, and refreshes whenever kind/view changes)
 *
 * Adds:
 * - A Settings dialog (no new view required) where user can define:
 *   - Saved Sources (Inventory / Stock)
 *   - Saved Destinations (Inventory / Stock)
 *   - Default Source label (e.g., "On hand")
 *
 * Storage:
 * - breederPro_transfer_locations_presets_v1:
 *     { defaultSource: "On hand", edible:{sources:[],dests:[]}, inedible:{sources:[],dests:[]} }
 *
 * Install: load AFTER your inventory patches, ideally last.
 */
(() => {
  "use strict";

  const PRESETS_KEY = "breederPro_transfer_locations_presets_v1";

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

  function uniqLines(text) {
    const seen = new Set();
    const out = [];
    String(text || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        const k = s.toLowerCase();
        if (seen.has(k)) return;
        seen.add(k);
        out.push(s);
      });
    return out;
  }

  function ensurePresets() {
    const p = loadJson(PRESETS_KEY, null) || {};
    if (!p.defaultSource) p.defaultSource = "On hand";
    if (!p.edible) p.edible = { sources: [], dests: [] };
    if (!p.inedible) p.inedible = { sources: [], dests: [] };

    if (!Array.isArray(p.edible.sources)) p.edible.sources = [];
    if (!Array.isArray(p.edible.dests)) p.edible.dests = [];
    if (!Array.isArray(p.inedible.sources)) p.inedible.sources = [];
    if (!Array.isArray(p.inedible.dests)) p.inedible.dests = [];

    // Keep defaults minimal; user can edit in settings
    if (!p.edible.sources.length) p.edible.sources = [p.defaultSource, "Freezer", "Fridge"];
    if (!p.inedible.sources.length) p.inedible.sources = [p.defaultSource, "Truck", "Storage"];
    if (!p.edible.dests.length) p.edible.dests = ["Freezer", "Fridge", "Pantry", "Kennel"];
    if (!p.inedible.dests.length) p.inedible.dests = ["Truck", "Kennel", "Storage", "Laundry"];

    // De-dupe
    p.edible.sources = uniqLines(p.edible.sources.join("\n"));
    p.edible.dests = uniqLines(p.edible.dests.join("\n"));
    p.inedible.sources = uniqLines(p.inedible.sources.join("\n"));
    p.inedible.dests = uniqLines(p.inedible.dests.join("\n"));

    saveJson(PRESETS_KEY, p);
    return p;
  }

  function getDefaultSource() {
    return ensurePresets().defaultSource || "On hand";
  }

  // --------------------
  // Transfer UI helpers
  // --------------------
  function ensureModePill() {
    const form = document.getElementById("transferForm");
    if (!form) return;

    if (document.getElementById("transferKindPill")) {
      document.getElementById("transferKindPill").textContent = kindNow();
      return;
    }

    const pill = document.createElement("div");
    pill.className = "transfer-kind-pill";
    pill.innerHTML = `Mode: <span class="pill" id="transferKindPill">${esc(kindNow())}</span>`;

    // Insert at top of transfer form
    form.insertAdjacentElement("afterbegin", pill);
  }

  function populatePresetSelects() {
    const p = ensurePresets();
    const k = kindNow();

    const srcSel = document.getElementById("transferSourceSelect");
    const destSel = document.getElementById("transferDestSelect");

    if (srcSel) {
      srcSel.innerHTML = "";
      const o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = `Saved sources (${k})…`;
      srcSel.appendChild(o0);
      (p[k].sources || [])
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .forEach((v) => {
          const o = document.createElement("option");
          o.value = v;
          o.textContent = v;
          srcSel.appendChild(o);
        });
    }

    if (destSel) {
      destSel.innerHTML = "";
      const o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = `Saved destinations (${k})…`;
      destSel.appendChild(o0);
      (p[k].dests || [])
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .forEach((v) => {
          const o = document.createElement("option");
          o.value = v;
          o.textContent = v;
          destSel.appendChild(o);
        });
    }

    // Actual source dropdown should include default + existing buckets + saved sources
    const src = document.getElementById("transferSource");
    if (src) {
      // Preserve current selection if possible
      const prev = String(src.value || "").trim();

      const def = getDefaultSource();
      const merged = [def, ...(p[k].sources || [])];
      const uniq = [];
      const seen = new Set();
      merged.forEach((v) => {
        const s = String(v || "").trim();
        if (!s) return;
        const key = s.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        uniq.push(s);
      });

      src.innerHTML = "";
      uniq.forEach((name) => {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = name;
        src.appendChild(o);
      });

      if (prev && uniq.some((x) => x.toLowerCase() === prev.toLowerCase())) src.value = prev;
      else src.value = def;
    }

    ensureModePill();
  }

  // --------------------
  // Settings dialog UI
  // --------------------
  function ensureSettingsDialog() {
    if (document.getElementById("dlgBpSettings")) return;

    const dlg = document.createElement("dialog");
    dlg.id = "dlgBpSettings";
    dlg.innerHTML = `
      <form method="dialog" class="dlg-card">
        <div class="dlg-h">
          <h3>Settings</h3>
          <button class="btn" value="cancel">✕</button>
        </div>

        <div class="timeline-item" style="margin-top:10px;">
          <strong>Transfer presets</strong>
          <div class="muted small" style="margin-top:6px;">Inventory and Stock are separate, but the UI behaves the same.</div>

          <label class="label">Default source label</label>
          <input id="bpDefaultSource" placeholder="e.g., On hand" />

          <div class="grid2" style="margin-top:10px;">
            <div>
              <strong>Inventory (edible)</strong>
              <label class="label">Saved sources (one per line)</label>
              <textarea id="bpEdibleSources" rows="6"></textarea>
              <label class="label">Saved destinations (one per line)</label>
              <textarea id="bpEdibleDests" rows="6"></textarea>
            </div>
            <div>
              <strong>Stock (inedible)</strong>
              <label class="label">Saved sources (one per line)</label>
              <textarea id="bpInedibleSources" rows="6"></textarea>
              <label class="label">Saved destinations (one per line)</label>
              <textarea id="bpInedibleDests" rows="6"></textarea>
            </div>
          </div>
        </div>

        <div class="dlg-f">
          <button class="btn" value="cancel">Close</button>
          <button class="btn primary" id="btnBpSaveSettings" value="ok">Save</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);

    document.getElementById("btnBpSaveSettings").addEventListener("click", (e) => {
      e.preventDefault();
      const p = ensurePresets();
      p.defaultSource = String(document.getElementById("bpDefaultSource").value || "").trim() || "On hand";
      p.edible.sources = uniqLines(document.getElementById("bpEdibleSources").value);
      p.edible.dests = uniqLines(document.getElementById("bpEdibleDests").value);
      p.inedible.sources = uniqLines(document.getElementById("bpInedibleSources").value);
      p.inedible.dests = uniqLines(document.getElementById("bpInedibleDests").value);

      // Ensure default source is present in both source lists
      const def = p.defaultSource;
      if (!p.edible.sources.some((x) => x.toLowerCase() === def.toLowerCase())) p.edible.sources.unshift(def);
      if (!p.inedible.sources.some((x) => x.toLowerCase() === def.toLowerCase())) p.inedible.sources.unshift(def);

      saveJson(PRESETS_KEY, p);

      // Refresh dropdowns if user is on transfer
      try { populatePresetSelects(); } catch (_) {}

      dlg.close();
      alert("Saved settings.");
    });
  }

  function fillSettingsDialog() {
    const p = ensurePresets();
    document.getElementById("bpDefaultSource").value = p.defaultSource || "On hand";
    document.getElementById("bpEdibleSources").value = (p.edible.sources || []).join("\n");
    document.getElementById("bpEdibleDests").value = (p.edible.dests || []).join("\n");
    document.getElementById("bpInedibleSources").value = (p.inedible.sources || []).join("\n");
    document.getElementById("bpInedibleDests").value = (p.inedible.dests || []).join("\n");
  }

  function injectSettingsButton() {
    // Add to topbar next to Talk button if possible
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    if (document.getElementById("btnBpSettings")) return;

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.id = "btnBpSettings";
    btn.type = "button";
    btn.textContent = "⚙️ Settings";

    topbar.appendChild(btn);

    btn.addEventListener("click", () => {
      ensureSettingsDialog();
      fillSettingsDialog();
      document.getElementById("dlgBpSettings").showModal();
    });
  }

  // Hook view changes so transfer dropdowns refresh on Inventory vs Stock context changes
  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpSettingsWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}
      if (view === "InventoryTransfer") {
        setTimeout(() => {
          try { populatePresetSelects(); } catch (_) {}
        }, 0);
      }
    };

    window.__afterShow._bpSettingsWrapped = true;
  }

  // Also hook rcSetKind so switching Inventory/Stock forces dropdown refresh
  function hookRcSetKind() {
    const fn = window.rcSetKind;
    if (typeof fn !== "function" || fn._bpSettingsWrapped) return;

    window.rcSetKind = function (kind) {
      const res = fn.apply(this, arguments);
      // If transfer UI is present, refresh selects to the active kind
      setTimeout(() => {
        try { populatePresetSelects(); } catch (_) {}
      }, 0);
      return res;
    };

    window.rcSetKind._bpSettingsWrapped = true;
  }

  function install() {
    ensurePresets();
    injectSettingsButton();
    ensureSettingsDialog();
    hookAfterShow();
    hookRcSetKind();

    // If already on transfer view, force refresh
    try { populatePresetSelects(); } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
