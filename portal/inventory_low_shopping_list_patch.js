
/**
 * inventory_low_shopping_list_patch.js
 *
 * Adds "Shopping list" export/share for LOW items (per kind).
 *
 * Uses on-hand low logic:
 * - default source label from breederPro_transfer_locations_presets_v1.defaultSource (fallback "On hand")
 * - per-item threshold: item.minOnHand
 * - per-kind default: breederPro_inventory_settings_v2.defaultMinOnHand
 *
 * UI
 * - Adds buttons on InventoryAvailable view:
 *   - "Export LOW list" (downloads .txt)
 *   - "Share LOW list" (uses Web Share API if available)
 *
 * Install: load AFTER inventory_lowstock_onhand_settings_patch.js.
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const PRESETS_KEY = "breederPro_transfer_locations_presets_v1";
  const SETTINGS_KEY = "breederPro_inventory_settings_v2";

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function num(v, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }

  function getDefaultSource() {
    const p = loadJson(PRESETS_KEY, {}) || {};
    return String(p.defaultSource || "").trim() || "On hand";
  }

  function loadInv() {
    const o = loadJson(INV_KEY, { inventory: [] });
    if (!Array.isArray(o.inventory)) o.inventory = [];
    return o;
  }

  function loadSettings() {
    const o = loadJson(SETTINGS_KEY, null) || {};
    if (!o.edible) o.edible = { defaultMinOnHand: 0, enableLowAlerts: true };
    if (!o.inedible) o.inedible = { defaultMinOnHand: 0, enableLowAlerts: true };
    return o;
  }

  function onHandQty(it) {
    const defSrc = getDefaultSource();
    if (it && it.locs && typeof it.locs === "object" && it.locs[defSrc] != null) {
      return num(it.locs[defSrc], 0);
    }
    return num(it?.qty, 0);
  }

  function minOnHand(it) {
    const s = loadSettings();
    const k = (it?.kind === "inedible") ? "inedible" : "edible";
    return num(it?.minOnHand, num(s[k]?.defaultMinOnHand, 0));
  }

  function isLow(it) {
    const thr = minOnHand(it);
    if (thr <= 0) return false;
    return onHandQty(it) <= thr;
  }

  function lowItems(kind) {
    const store = loadInv();
    const items = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === kind));
    return items.filter(isLow).sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }

  function makeChecklistText(kind) {
    const defSrc = getDefaultSource();
    const items = lowItems(kind);
    const now = new Date();
    const title = kind === "edible" ? "Inventory (Edible) LOW Shopping List" : "Stock (Inedible) LOW Shopping List";

    const lines = [];
    lines.push(title);
    lines.push(`Date: ${now.toLocaleString()}`);
    lines.push(`On-hand bucket: "${defSrc}"`);
    lines.push("");
    if (!items.length) {
      lines.push("No LOW items right now.");
      return lines.join("\n");
    }

    lines.push("Checklist:");
    for (const it of items) {
      const oh = onHandQty(it);
      const thr = minOnHand(it);
      const idv = String(it.identifierValue || "").trim();
      lines.push(`- [ ] ${it.name}  (${defSrc}: ${oh} • Low prompt: ${thr}${idv ? ` • ID: ${idv}` : ""})`);
    }
    lines.push("");
    lines.push("Notes:");
    lines.push("- Low prompt is user-defined per item.");
    lines.push("- This list is generated from current on-hand counts.");
    return lines.join("\n");
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function shareText(title, text) {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }

  function ensureButtons() {
    const view = document.getElementById("viewInventoryAvailable");
    if (!view) return;
    if (document.getElementById("btnExportLowList")) return;

    const row = document.createElement("div");
    row.className = "row";
    row.style.marginTop = "10px";
    row.innerHTML = `
      <button class="btn" type="button" id="btnExportLowList">Export LOW list</button>
      <button class="btn" type="button" id="btnShareLowList">Share LOW list</button>
    `;

    const rows = view.querySelectorAll(".row");
    if (rows && rows.length) rows[0].insertAdjacentElement("afterend", row);
    else view.insertAdjacentElement("afterbegin", row);

    const exportBtn = document.getElementById("btnExportLowList");
    const shareBtn = document.getElementById("btnShareLowList");

    exportBtn.addEventListener("click", () => {
      const k = kindNow();
      const text = makeChecklistText(k);
      const name = k === "edible" ? "inventory_low_list.txt" : "stock_low_list.txt";
      downloadText(name, text);
    });

    shareBtn.addEventListener("click", async () => {
      const k = kindNow();
      const text = makeChecklistText(k);
      const title = k === "edible" ? "Inventory LOW list" : "Stock LOW list";
      const ok = await shareText(title, text);
      if (!ok) alert("Sharing isn't available here. Use Export instead.");
    });

    if (!navigator.share) {
      shareBtn.disabled = true;
      shareBtn.textContent = "Share (not supported)";
    }
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpLowListWrapped) return;

    window.__afterShow = function (viewName) {
      try { if (typeof prev === "function") prev(viewName); } catch (_) {}
      if (viewName === "InventoryAvailable") setTimeout(ensureButtons, 0);
    };

    window.__afterShow._bpLowListWrapped = true;
  }

  function install() {
    ensureButtons();
    hookAfterShow();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
