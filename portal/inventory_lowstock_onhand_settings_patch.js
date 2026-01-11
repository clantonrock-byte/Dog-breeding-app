/**
 * inventory_lowstock_onhand_settings_patch.js
 *
 * Implements "Low prompt" based on ON HAND per item (not total).
 * Also adds a Settings section that lists items separately for:
 * - Inventory (edible)
 * - Stock (inedible)
 * so users can set low prompts per item.
 *
 * Definitions
 * - "On hand" means the DEFAULT SOURCE location bucket, configured in:
 *   breederPro_transfer_locations_presets_v1.defaultSource (fallback: "On hand")
 * - Per-item threshold: item.minOnHand (number). If absent, uses per-kind default.
 *
 * Adds to Settings dialog (#dlgBpSettings):
 * - Low stock defaults (per kind) + enable toggle (if not already present)
 * - Per-item thresholds table for edible and inedible
 * - Quick nav buttons already handled by other settings patches; this adds item lists.
 *
 * UI
 * - Adds LOW badge to Available cards based on onHandQty <= minOnHand
 * - Optional once-per-day alert when opening Available list (per kind)
 *
 * Storage
 * - Inventory store: breederPro_inventory_store_v1
 * - Settings store: breederPro_inventory_settings_v2
 *   { edible:{defaultMinOnHand, enableLowAlerts}, inedible:{...} }
 * - Cooldown: breederPro_lowstock_cooldown_v2
 *
 * Install
 * - Load AFTER inventory_ui_patch.js and AFTER inventory_settings_kindfix.js.
 * - If you previously installed inventory_settings_lowstock_patch.js, disable it to avoid conflicts.
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const PRESETS_KEY = "breederPro_transfer_locations_presets_v1";
  const SETTINGS_KEY = "breederPro_inventory_settings_v2";
  const COOLDOWN_KEY = "breederPro_lowstock_cooldown_v2";

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");
  const todayKey = () => new Date().toISOString().slice(0, 10);

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

  function num(v, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }

  function loadInv() {
    const o = loadJson(INV_KEY, { inventory: [] });
    if (!Array.isArray(o.inventory)) o.inventory = [];
    return o;
  }

  function saveInv(o) {
    saveJson(INV_KEY, o);
  }

  function getDefaultSource() {
    const p = loadJson(PRESETS_KEY, {}) || {};
    const v = String(p.defaultSource || "").trim();
    return v || "On hand";
  }

  function loadSettings() {
    const o = loadJson(SETTINGS_KEY, null) || {};
    if (!o.edible) o.edible = { defaultMinOnHand: 0, enableLowAlerts: true };
    if (!o.inedible) o.inedible = { defaultMinOnHand: 0, enableLowAlerts: true };
    return o;
  }

  function saveSettings(o) {
    saveJson(SETTINGS_KEY, o);
  }

  function ensureSettingsDefaults() {
    const s = loadSettings();
    saveSettings(s);
    return s;
  }

  // ---------- Core computations ----------
  function onHandQty(it) {
    const defSrc = getDefaultSource();
    if (it && it.locs && typeof it.locs === "object" && it.locs[defSrc] != null) {
      return num(it.locs[defSrc], 0);
    }
    // fallback for items without buckets
    return num(it?.qty, 0);
  }

  function minOnHand(it) {
    const s = ensureSettingsDefaults();
    const k = (it?.kind === "inedible") ? "inedible" : "edible";
    return num(it?.minOnHand, num(s[k]?.defaultMinOnHand, 0));
  }

  function isLow(it) {
    const threshold = minOnHand(it);
    if (threshold <= 0) return false;
    return onHandQty(it) <= threshold;
  }

  function computeLow(kind) {
    const store = loadInv();
    const items = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === kind));
    const lows = items.filter(isLow);
    return { items, lows };
  }

  // ---------- Available list badge ----------
  function addLowBadgesToInvCards() {
    const store = loadInv();
    const k = kindNow();
    const byId = new Map((store.inventory || []).map((i) => [i.itemId, i]));
    const defSrc = getDefaultSource();

    document.querySelectorAll("#invList .inv-card").forEach((card) => {
      const itemId = card.getAttribute("data-item-id") || "";
      const it = byId.get(itemId);
      if (!it) return;
      if ((it.kind || "edible") !== k) return;

      // remove old
      card.querySelector(".inv-low-badge")?.remove();
      card.querySelector(".inv-onhand-line")?.remove();

      const oh = onHandQty(it);
      const thr = minOnHand(it);
      const low = isLow(it);

      // add on hand line always (helps users understand)
      const onhand = document.createElement("div");
      onhand.className = "inv-onhand-line muted small";
      onhand.textContent = `${defSrc}: ${oh} • Low prompt: ${thr}`;
      const muted = card.querySelector(".muted.small");
      if (muted) muted.insertAdjacentElement("afterend", onhand);
      else card.appendChild(onhand);

      if (!low) return;

      const badge = document.createElement("div");
      badge.className = "inv-low-badge";
      badge.textContent = `LOW ≤ ${thr}`;
      const top = card.querySelector(".inv-card-top");
      if (top) top.appendChild(badge);
      else card.insertAdjacentElement("afterbegin", badge);
    });
  }

  function wrapRenderInvForBadges() {
    const fn = window.renderInv;
    if (typeof fn !== "function" || fn._bpOnHandWrapped) return;

    window.renderInv = function () {
      const res = fn.apply(this, arguments);
      setTimeout(() => {
        try { addLowBadgesToInvCards(); } catch (_) {}
      }, 0);
      return res;
    };

    window.renderInv._bpOnHandWrapped = true;
  }

  function maybeAlertOncePerDay(kind) {
    const s = ensureSettingsDefaults();
    if (s[kind]?.enableLowAlerts === false) return;

    const cooldown = loadJson(COOLDOWN_KEY, {}) || {};
    const key = `${kind}:${todayKey()}`;
    if (cooldown[key]) return;

    const { lows } = computeLow(kind);
    if (!lows.length) return;

    cooldown[key] = true;
    saveJson(COOLDOWN_KEY, cooldown);

    const names = lows.slice(0, 6).map((i) => i.name).filter(Boolean).join(", ");
    alert(`Low stock (${kind}) based on "${getDefaultSource()}": ${lows.length} item(s).\n\n${names}${lows.length > 6 ? "…" : ""}`);
  }

  // ---------- Settings UI: per-item lists ----------
  function ensureLowStockSettingsBlock() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg) return;

    if (document.getElementById("bpLowStockOnHandWrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "timeline-item";
    wrap.id = "bpLowStockOnHandWrap";
    wrap.innerHTML = `
      <strong>Low stock alerts (On hand)</strong>
      <div class="muted small" style="margin-top:6px;">
        Low prompts are based on the "${esc(getDefaultSource())}" bucket for each item.
      </div>

      <div class="grid2" style="margin-top:10px;">
        <div>
          <strong>Inventory (edible)</strong>
          <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <input type="checkbox" id="bpEnableLowEdible" />
            Enable alerts
          </label>
          <label class="label">Default low prompt for new items</label>
          <input id="bpDefaultLowEdible" inputmode="decimal" placeholder="e.g., 2" />
        </div>

        <div>
          <strong>Stock (inedible)</strong>
          <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <input type="checkbox" id="bpEnableLowInedible" />
            Enable alerts
          </label>
          <label class="label">Default low prompt for new items</label>
          <input id="bpDefaultLowInedible" inputmode="decimal" placeholder="e.g., 1" />
        </div>
      </div>

      <div class="muted small" style="margin-top:12px;">
        Per-item low prompts (edit below). Items appear automatically as you create them.
      </div>

      <div class="grid2" style="margin-top:12px;">
        <div>
          <strong>Inventory items</strong>
          <div id="bpLowListEdible" class="bp-item-list"></div>
        </div>
        <div>
          <strong>Stock items</strong>
          <div id="bpLowListInedible" class="bp-item-list"></div>
        </div>
      </div>
    `;

    const footer = dlg.querySelector(".dlg-f");
    if (footer) footer.insertAdjacentElement("beforebegin", wrap);
    else dlg.querySelector(".dlg-card")?.appendChild(wrap);
  }

  function fillLowStockSettingsBlock() {
    const s = ensureSettingsDefaults();
    const e = s.edible || {};
    const i = s.inedible || {};

    const chkE = document.getElementById("bpEnableLowEdible");
    const chkI = document.getElementById("bpEnableLowInedible");
    const defE = document.getElementById("bpDefaultLowEdible");
    const defI = document.getElementById("bpDefaultLowInedible");

    if (chkE) chkE.checked = e.enableLowAlerts !== false;
    if (chkI) chkI.checked = i.enableLowAlerts !== false;
    if (defE) defE.value = String(num(e.defaultMinOnHand, 0));
    if (defI) defI.value = String(num(i.defaultMinOnHand, 0));

    renderItemLists();
  }

  function saveLowStockSettingsBlock() {
    const s = ensureSettingsDefaults();

    s.edible.enableLowAlerts = !!document.getElementById("bpEnableLowEdible")?.checked;
    s.inedible.enableLowAlerts = !!document.getElementById("bpEnableLowInedible")?.checked;
    s.edible.defaultMinOnHand = num(document.getElementById("bpDefaultLowEdible")?.value, 0);
    s.inedible.defaultMinOnHand = num(document.getElementById("bpDefaultLowInedible")?.value, 0);

    saveSettings(s);

    // Apply defaults to items missing minOnHand (non-destructive)
    const store = loadInv();
    let changed = 0;
    (store.inventory || []).forEach((it) => {
      if (it == null || typeof it !== "object") return;
      if (it.minOnHand == null) {
        const k = (it.kind === "inedible") ? "inedible" : "edible";
        it.minOnHand = num(s[k]?.defaultMinOnHand, 0);
        changed++;
      }
    });
    if (changed) saveInv(store);
  }

  function rowHtml(it) {
    const defSrc = getDefaultSource();
    const oh = onHandQty(it);
    const thr = minOnHand(it);
    const low = isLow(it);

    return `
      <div class="bp-item-row ${low ? "is-low" : ""}" data-item-id="${esc(it.itemId)}">
        <div class="bp-item-name"><strong>${esc(it.name || "(item)")}</strong></div>
        <div class="muted small">${esc(defSrc)}: ${esc(oh)} • Total: ${esc(num(it.qty, 0))}</div>
        <label class="label">Low prompt</label>
        <input class="bp-item-min" inputmode="decimal" value="${esc(thr)}" />
      </div>
    `;
  }

  function renderItemLists() {
    const store = loadInv();
    const edible = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === "edible"));
    const inedible = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === "inedible"));

    const elE = document.getElementById("bpLowListEdible");
    const elI = document.getElementById("bpLowListInedible");
    if (!elE || !elI) return;

    edible.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    inedible.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    elE.innerHTML = edible.length ? edible.map(rowHtml).join("") : `<div class="muted small">No inventory items yet.</div>`;
    elI.innerHTML = inedible.length ? inedible.map(rowHtml).join("") : `<div class="muted small">No stock items yet.</div>`;
  }

  function bindItemListInputs() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg || dlg._bpItemBound) return;

    dlg.addEventListener("input", (e) => {
      const inp = e.target.closest?.("input.bp-item-min");
      if (!inp) return;
      const row = e.target.closest?.(".bp-item-row");
      const itemId = row?.getAttribute?.("data-item-id") || "";
      if (!itemId) return;

      // Persist immediately
      const store = loadInv();
      const it = (store.inventory || []).find((x) => x.itemId === itemId);
      if (!it) return;

      it.minOnHand = num(inp.value, it.minOnHand ?? 0);
      saveInv(store);

      // Update row low state
      row.classList.toggle("is-low", isLow(it));

      // Update badges in available list
      try { addLowBadgesToInvCards(); } catch (_) {}
    });

    dlg._bpItemBound = true;
  }

  // ---------- Wire into existing Settings save ----------
  function wrapSettingsSave() {
    const btn = document.getElementById("btnBpSaveSettings");
    if (!btn || btn._bpOnHandSaveWrapped) return;

    btn.addEventListener("click", () => {
      try { saveLowStockSettingsBlock(); } catch (_) {}
      try { renderItemLists(); } catch (_) {}
      try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
    }, true);

    btn._bpOnHandSaveWrapped = true;
  }

  // ---------- Hook view lifecycle ----------
  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpOnHandWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}

      if (view === "InventoryAvailable") {
        setTimeout(() => {
          try { wrapRenderInvForBadges(); } catch (_) {}
          try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
          try { maybeAlertOncePerDay(kindNow()); } catch (_) {}
        }, 0);
      }

      if (view === "InventoryTransfer") {
        setTimeout(() => {
          // If user changes defaultSource in other settings patch, reflect in badge text next render.
          try { wrapRenderInvForBadges(); } catch (_) {}
        }, 0);
      }
    };

    window.__afterShow._bpOnHandWrapped = true;
  }

  // Also refresh badges on kind change
  function hookRcSetKind() {
    const fn = window.rcSetKind;
    if (typeof fn !== "function" || fn._bpOnHandWrapped) return;

    window.rcSetKind = function () {
      const res = fn.apply(this, arguments);
      setTimeout(() => {
        try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
      }, 0);
      return res;
    };

    window.rcSetKind._bpOnHandWrapped = true;
  }

  function install() {
    ensureSettingsDefaults();

    // Settings dialog must exist from inventory_settings_kindfix.js
    ensureLowStockSettingsBlock();
    fillLowStockSettingsBlock();
    bindItemListInputs();
    wrapSettingsSave();

    wrapRenderInvForBadges();
    addLowBadgesToInvCards();

    hookAfterShow();
    hookRcSetKind();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
