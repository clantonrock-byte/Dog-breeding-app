/**
 * inventory_low_shopping_list_allformats.js
 *
 * One file that adds LOW shopping list exports in 4 formats:
 * - TXT (download)
 * - Share (Web Share API, if available)
 * - DOCX (Word)
 * - PDF
 *
 * Inventory and Stock remain separate: uses current mode via window.rcInvKind.
 *
 * Uses your on-hand low logic:
 * - Inventory store: breederPro_inventory_store_v1
 * - Default source label: breederPro_transfer_locations_presets_v1.defaultSource (fallback "On hand")
 * - Per-item threshold: item.minOnHand
 * - Per-kind default: breederPro_inventory_settings_v2.defaultMinOnHand
 *
 * Install: load AFTER inventory_lowstock_onhand_settings_patch.js.
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const PRESETS_KEY = "breederPro_transfer_locations_presets_v1";
  const SETTINGS_KEY = "breederPro_inventory_settings_v2";

  const DOCX_SRC = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js";
  const PDF_SRC = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

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

  function buildChecklistText(kind) {
    const defSrc = getDefaultSource();
    const items = lowItems(kind);
    const now = new Date();
    const title = kind === "edible"
      ? "Inventory (Edible) LOW Shopping List"
      : "Stock (Inedible) LOW Shopping List";

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

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadText(filename, text) {
    downloadBlob(filename, new Blob([text], { type: "text/plain" }));
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

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some((s) => (s.src || "").includes(src))) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function exportDocx(kind) {
    try {
      await loadScriptOnce(DOCX_SRC);
      const docx = window.docx;
      if (!docx) return alert("DOCX library failed to load.");

      const { Document, Packer, Paragraph, TextRun } = docx;
      const textLines = buildChecklistText(kind).split("\n");

      const doc = new Document({
        sections: [{ children: textLines.map((line) => new Paragraph({ children: [new TextRun(line)] })) }],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(kind === "edible" ? "inventory_low_list.docx" : "stock_low_list.docx", blob);
    } catch {
      alert("DOCX export failed (network or browser issue).");
    }
  }

  async function exportPdf(kind) {
    try {
      await loadScriptOnce(PDF_SRC);
      const jsPDF = window.jspdf?.jsPDF;
      if (!jsPDF) return alert("PDF library failed to load.");

      const textLines = buildChecklistText(kind).split("\n");
      const pdf = new jsPDF({ unit: "pt", format: "letter" });

      let y = 40;
      for (const line of textLines) {
        pdf.text(String(line), 40, y);
        y += 14;
        if (y > 740) {
          pdf.addPage();
          y = 40;
        }
      }

      pdf.save(kind === "edible" ? "inventory_low_list.pdf" : "stock_low_list.pdf");
    } catch {
      alert("PDF export failed (network or browser issue).");
    }
  }

  function ensureButtons() {
    const view = document.getElementById("viewInventoryAvailable");
    if (!view) return;
    if (document.getElementById("btnExportLowTxt")) return;

    const row = document.createElement("div");
    row.className = "row";
    row.style.marginTop = "10px";
    row.innerHTML = `
      <button class="btn" type="button" id="btnExportLowTxt">Export TXT</button>
      <button class="btn" type="button" id="btnShareLow">Share</button>
      <button class="btn" type="button" id="btnExportLowDocx">Export DOCX</button>
      <button class="btn" type="button" id="btnExportLowPdf">Export PDF</button>
    `;

    const rows = view.querySelectorAll(".row");
    if (rows && rows.length) rows[0].insertAdjacentElement("afterend", row);
    else view.insertAdjacentElement("afterbegin", row);

    const shareBtn = document.getElementById("btnShareLow");
    if (!navigator.share) {
      shareBtn.disabled = true;
      shareBtn.textContent = "Share (unsupported)";
    }

    document.getElementById("btnExportLowTxt").addEventListener("click", () => {
      const k = kindNow();
      downloadText(k === "edible" ? "inventory_low_list.txt" : "stock_low_list.txt", buildChecklistText(k));
    });

    shareBtn.addEventListener("click", async () => {
      const k = kindNow();
      const title = k === "edible" ? "Inventory LOW list" : "Stock LOW list";
      const ok = await shareText(title, buildChecklistText(k));
      if (!ok) alert("Sharing isn't available here. Use Export instead.");
    });

    document.getElementById("btnExportLowDocx").addEventListener("click", () => exportDocx(kindNow()));
    document.getElementById("btnExportLowPdf").addEventListener("click", () => exportPdf(kindNow()));
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpLowListAllWrapped) return;

    window.__afterShow = function (viewName) {
      try { if (typeof prev === "function") prev(viewName); } catch (_) {}
      if (viewName === "InventoryAvailable") setTimeout(ensureButtons, 0);
    };

    window.__afterShow._bpLowListAllWrapped = true;
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
