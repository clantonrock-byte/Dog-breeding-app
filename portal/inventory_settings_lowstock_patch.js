/**
 * inventory_settings_lowstock_patch.js
 *
 * Adds to Settings + Inventory:
 * 1) Settings: "Go to" buttons that jump/focus the relevant section.
 *    - Transfer locations presets
 *    - Low-stock alerts
 *
 * 2) Low-stock alerts (reorder prompts):
 *    - Per-item alert threshold: item.minQty (number, default 0)
 *    - UI highlights items at/below minQty
 *    - Optional one-time-per-day alert when you open Available list (per kind)
 *
 * Works with your current app + patches:
 * - Uses inventory store: breederPro_inventory_store_v1
 * - Uses kind split: window.rcInvKind
 * - If inventory_ui_patch.js is installed, it overrides renderInv; we wrap it to add low-stock UI.
 *
 * Install: load AFTER inventory_ui_patch.js and AFTER inventory_settings_kindfix.js (if used).
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const SETTINGS_KEY = "breederPro_inventory_settings_v1";
  const ALERT_COOLDOWN_KEY = "breederPro_lowstock_cooldown_v1";

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");
  const todayKey = () => new Date().toISOString().slice(0, 10);

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

  function loadSettings() {
    const o = loadJson(SETTINGS_KEY, null) || {};
    if (!o.edible) o.edible = { defaultMinQty: 0, enableLowAlerts: true };
    if (!o.inedible) o.inedible = { defaultMinQty: 0, enableLowAlerts: true };
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

  function num(v, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }

  function ensureMinQtyOnNewItems() {
    const s = ensureSettingsDefaults();
    const store = loadInv();
    let changed = 0;
    (store.inventory || []).forEach((it) => {
      if (it == null || typeof it !== "object") return;
      if (it.minQty == null) {
        const k = (it.kind === "inedible") ? "inedible" : "edible";
        it.minQty = num(s[k]?.defaultMinQty, 0);
        changed++;
      }
    });
    if (changed) saveInv(store);
  }

  // -----------------------------
  // Settings dialog enhancements
  // -----------------------------
  function injectSettingsQuickNav() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg) return;

    if (dlg.querySelector(".bp-settings-nav")) return;

    const nav = document.createElement("div");
    nav.className = "bp-settings-nav timeline-item";
    nav.innerHTML = `
      <strong>Settings shortcuts</strong>
      <div class="muted small" style="margin-top:6px;">Tap a button to jump to the section you want to change.</div>
      <div class="row" style="margin-top:10px;">
        <button type="button" class="btn primary" id="btnGoTransferPresets">Transfer locations</button>
        <button type="button" class="btn primary" id="btnGoLowStock">Low stock alerts</button>
      </div>
    `;

    const card = dlg.querySelector(".timeline-item");
    if (card) card.insertAdjacentElement("beforebegin", nav);
    else dlg.querySelector(".dlg-card")?.insertAdjacentElement("afterbegin", nav);

    document.getElementById("btnGoTransferPresets").addEventListener("click", () => {
      const el = document.getElementById("bpDefaultSource") || document.getElementById("bpEdibleSources");
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      el?.focus?.();
    });

    document.getElementById("btnGoLowStock").addEventListener("click", () => {
      const el = document.getElementById("bpLowStockWrap");
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      const inp = document.getElementById("bpEnableLowAlertsEdible");
      inp?.focus?.();
    });
  }

  function injectLowStockSettingsIntoDialog() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg) return;

    if (document.getElementById("bpLowStockWrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "timeline-item";
    wrap.id = "bpLowStockWrap";
    wrap.innerHTML = `
      <strong>Low stock alerts</strong>
      <div class="muted small" style="margin-top:6px;">
        Set reorder thresholds. Inventory and Stock are separate but behave the same.
      </div>

      <div class="grid2" style="margin-top:10px;">
        <div>
          <strong>Inventory (edible)</strong>
          <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <input type="checkbox" id="bpEnableLowAlertsEdible" />
            Enable low stock alerts
          </label>
          <label class="label">Default alert level for new items</label>
          <input id="bpDefaultMinEdible" inputmode="decimal" placeholder="e.g., 2" />
        </div>

        <div>
          <strong>Stock (inedible)</strong>
          <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <input type="checkbox" id="bpEnableLowAlertsInedible" />
            Enable low stock alerts
          </label>
          <label class="label">Default alert level for new items</label>
          <input id="bpDefaultMinInedible" inputmode="decimal" placeholder="e.g., 1" />
        </div>
      </div>

      <div class="muted small" style="margin-top:10px;">
        Per-item alert level is editable in the "Create item" dialog and in the Locations editor.
      </div>
    `;

    // Insert near the bottom of the existing settings form (before buttons)
    const footer = dlg.querySelector(".dlg-f");
    if (footer) footer.insertAdjacentElement("beforebegin", wrap);
    else dlg.querySelector(".dlg-card")?.appendChild(wrap);
  }

  function fillLowStockSettings() {
    const s = ensureSettingsDefaults();
    const e = s.edible || {};
    const i = s.inedible || {};

    const chkE = document.getElementById("bpEnableLowAlertsEdible");
    const chkI = document.getElementById("bpEnableLowAlertsInedible");
    const minE = document.getElementById("bpDefaultMinEdible");
    const minI = document.getElementById("bpDefaultMinInedible");

    if (chkE) chkE.checked = e.enableLowAlerts !== false;
    if (chkI) chkI.checked = i.enableLowAlerts !== false;
    if (minE) minE.value = String(num(e.defaultMinQty, 0));
    if (minI) minI.value = String(num(i.defaultMinQty, 0));
  }

  function saveLowStockSettings() {
    const s = ensureSettingsDefaults();

    const chkE = document.getElementById("bpEnableLowAlertsEdible");
    const chkI = document.getElementById("bpEnableLowAlertsInedible");
    const minE = document.getElementById("bpDefaultMinEdible");
    const minI = document.getElementById("bpDefaultMinInedible");

    s.edible.enableLowAlerts = chkE ? !!chkE.checked : true;
    s.inedible.enableLowAlerts = chkI ? !!chkI.checked : true;
    s.edible.defaultMinQty = num(minE?.value, 0);
    s.inedible.defaultMinQty = num(minI?.value, 0);

    saveSettings(s);
  }

  function wrapSettingsSaveButton() {
    const btn = document.getElementById("btnBpSaveSettings");
    if (!btn || btn._bpLowWrapped) return;

    btn.addEventListener("click", () => {
      // Settings dialog already saves transfer presets; we additionally save low-stock settings.
      try { saveLowStockSettings(); } catch (_) {}
      try { ensureMinQtyOnNewItems(); } catch (_) {}
      // After saving, refresh inventory UI if present.
      try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
    }, true);

    btn._bpLowWrapped = true;
  }

  // -----------------------------
  // Per-item minQty field injection
  // -----------------------------
  function injectMinQtyIntoCreateDialog() {
    const dlg = document.getElementById("dlgInv");
    if (!dlg) return;

    if (document.getElementById("invMinQty")) return;

    const s = ensureSettingsDefaults();
    const k = kindNow();
    const def = num(s[k]?.defaultMinQty, 0);

    const label = document.createElement("label");
    label.className = "label";
    label.textContent = "Reorder alert level (low stock threshold)";

    const input = document.createElement("input");
    input.id = "invMinQty";
    input.inputMode = "decimal";
    input.placeholder = `e.g., ${def}`;

    // Insert before dialog footer buttons (.dlg-f)
    const footer = dlg.querySelector(".dlg-f");
    if (footer) {
      footer.insertAdjacentElement("beforebegin", label);
      label.insertAdjacentElement("afterend", input);
    } else {
      dlg.querySelector("form")?.appendChild(label);
      dlg.querySelector("form")?.appendChild(input);
    }
  }

  function wrapOpenInvDialogToSetDefault() {
    // Your app exports openInvDialog via window.openInvDialog in some patches; best effort.
    const fn = window.openInvDialog || window.openInvDialogFixed;
    if (typeof fn !== "function" || fn._bpLowWrapped) return;

    const wrapped = function () {
      const res = fn.apply(this, arguments);
      try {
        injectMinQtyIntoCreateDialog();
        const s = ensureSettingsDefaults();
        const def = num(s[kindNow()]?.defaultMinQty, 0);
        const inp = document.getElementById("invMinQty");
        if (inp) inp.value = String(def);
      } catch (_) {}
      return res;
    };

    wrapped._bpLowWrapped = true;

    // Replace known globals
    if (window.openInvDialog === fn) window.openInvDialog = wrapped;
    if (window.openInvDialogFixed === fn) window.openInvDialogFixed = wrapped;
  }

  function wrapSaveInvDefToPersistMinQty() {
    const fn = window.saveInvDef;
    if (typeof fn !== "function" || fn._bpLowWrapped) return;

    window.saveInvDef = function () {
      // Snapshot before
      const before = loadInv().inventory.length;

      const res = fn.apply(this, arguments);

      try {
        const store = loadInv();
        if (store.inventory.length > before) {
          const last = store.inventory[store.inventory.length - 1];
          const s = ensureSettingsDefaults();
          const def = num(s[kindNow()]?.defaultMinQty, 0);
          const v = num(document.getElementById("invMinQty")?.value, def);
          last.minQty = v;
          saveInv(store);
        }
      } catch (_) {}

      return res;
    };

    window.saveInvDef._bpLowWrapped = true;
  }

  // -----------------------------
  // Locations editor: show/edit minQty
  // -----------------------------
  function injectMinQtyIntoLocationsDialog() {
    const dlg = document.getElementById("dlgItemLocs");
    if (!dlg) return;
    if (document.getElementById("locsMinQty")) return;

    const sub = document.getElementById("locsSub");
    if (!sub) return;

    const wrap = document.createElement("div");
    wrap.className = "locs-min-wrap";
    wrap.innerHTML = `
      <label class="label">Reorder alert level (low stock threshold)</label>
      <input id="locsMinQty" inputmode="decimal" placeholder="e.g., 2" />
    `;
    sub.insertAdjacentElement("afterend", wrap);
  }

  function wrapRenderLocEditorIfExists() {
    // The A–C locations patch exposes renderLocEditor in closure, so we can't reach it.
    // Instead we hook the dialog open flow: when dlgItemLocs is shown, inject and fill from item.
    const dlg = document.getElementById("dlgItemLocs");
    if (!dlg || dlg._bpLowBound) return;

    dlg.addEventListener("show", () => {
      // not reliable; dialog doesn't fire "show" consistently
    });

    dlg.addEventListener("close", () => {});

    dlg._bpLowBound = true;
  }

  function fillLocMinQtyFromCurrentItem() {
    // We infer current item id from the title line, fallback to none.
    const title = document.getElementById("locsTitle")?.textContent || "";
    // Find item by matching name substring (best effort), since itemId isn't exposed.
    const store = loadInv();
    const k = kindNow();
    const candidates = (store.inventory || []).filter((i) => (i.kind || "edible") === k);
    const it = candidates.find((i) => title.includes(i.name || "")) || null;

    injectMinQtyIntoLocationsDialog();

    const s = ensureSettingsDefaults();
    const def = num(s[k]?.defaultMinQty, 0);

    const inp = document.getElementById("locsMinQty");
    if (!inp) return;
    inp.value = String(num(it?.minQty, def));
  }

  function wrapLocsSaveButtonToPersistMinQty() {
    const btn = document.getElementById("btnLocsSave");
    if (!btn || btn._bpLowWrapped) return;

    btn.addEventListener("click", () => {
      try {
        const title = document.getElementById("locsTitle")?.textContent || "";
        const store = loadInv();
        const k = kindNow();
        const it = (store.inventory || []).filter((i) => (i.kind || "edible") === k).find((i) => title.includes(i.name || ""));
        if (!it) return;

        const s = ensureSettingsDefaults();
        const def = num(s[k]?.defaultMinQty, 0);
        it.minQty = num(document.getElementById("locsMinQty")?.value, def);
        saveInv(store);
      } catch (_) {}
    }, true);

    btn._bpLowWrapped = true;
  }

  // -----------------------------
  // Low stock highlighting + daily alert
  // -----------------------------
  function computeLowCounts() {
    const s = ensureSettingsDefaults();
    const k = kindNow();
    const store = loadInv();
    const items = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === k));
    const lows = items.filter((i) => Number(i.qty || 0) <= num(i.minQty, num(s[k]?.defaultMinQty, 0)));
    return { total: items.length, low: lows.length, lows };
  }

  function maybeShowLowAlertOncePerDay() {
    const s = ensureSettingsDefaults();
    const k = kindNow();
    if (s[k]?.enableLowAlerts === false) return;

    const key = `${k}:${todayKey()}`;
    const cooldown = loadJson(ALERT_COOLDOWN_KEY, {});
    if (cooldown[key]) return;

    const { low, lows } = computeLowCounts();
    if (low <= 0) return;

    cooldown[key] = true;
    saveJson(ALERT_COOLDOWN_KEY, cooldown);

    const names = lows.slice(0, 6).map((i) => i.name).filter(Boolean).join(", ");
    alert(`Low stock (${k}): ${low} item(s) at/below reorder level.\n\n${names}${low > 6 ? "…" : ""}`);
  }

  function addLowBadgesToInvCards() {
    const s = ensureSettingsDefaults();
    const k = kindNow();
    const store = loadInv();
    const byId = new Map((store.inventory || []).map((i) => [i.itemId, i]));

    document.querySelectorAll("#invList .inv-card").forEach((card) => {
      const itemId = card.getAttribute("data-item-id") || "";
      const it = byId.get(itemId);
      if (!it) return;
      if ((it.kind || "edible") !== k) return;

      const threshold = num(it.minQty, num(s[k]?.defaultMinQty, 0));
      const qty = Number(it.qty || 0);
      const isLow = qty <= threshold && threshold > 0;

      // Remove prior badge
      const old = card.querySelector(".inv-low-badge");
      if (old) old.remove();

      if (!isLow) return;

      const badge = document.createElement("div");
      badge.className = "inv-low-badge";
      badge.textContent = `LOW ≤ ${threshold}`;

      // Insert near title (first line)
      const top = card.querySelector(".inv-card-top");
      if (top) top.appendChild(badge);
      else card.insertAdjacentElement("afterbegin", badge);
    });
  }

  // Wrap renderInv to post-process cards
  function wrapRenderInvForLowBadges() {
    const fn = window.renderInv;
    if (typeof fn !== "function" || fn._bpLowWrapped) return;

    window.renderInv = function () {
      const res = fn.apply(this, arguments);
      setTimeout(() => {
        try { addLowBadgesToInvCards(); } catch (_) {}
      }, 0);
      return res;
    };

    window.renderInv._bpLowWrapped = true;
  }

  // Hook afterShow so when InventoryAvailable opens we can alert + badge.
  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpLowWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}

      if (view === "InventoryAvailable") {
        setTimeout(() => {
          try { ensureMinQtyOnNewItems(); } catch (_) {}
          try { wrapRenderInvForLowBadges(); } catch (_) {}
          try { if (typeof window.renderInv === "function") window.renderInv(); } catch (_) {}
          try { maybeShowLowAlertOncePerDay(); } catch (_) {}
        }, 0);
      }

      if (view === "InventoryTransfer") {
        setTimeout(() => {
          // ensure per-kind selects are correct and settings quick nav exists
          try { injectSettingsQuickNav(); } catch (_) {}
        }, 0);
      }
    };

    window.__afterShow._bpLowWrapped = true;
  }

  function install() {
    ensureSettingsDefaults();
    ensureMinQtyOnNewItems();

    // Settings dialog enhancements (exists from inventory_settings_kindfix)
    injectSettingsQuickNav();
    injectLowStockSettingsIntoDialog();
    fillLowStockSettings();
    wrapSettingsSaveButton();

    // Per-item minQty in create dialog
    injectMinQtyIntoCreateDialog();
    wrapOpenInvDialogToSetDefault();
    wrapSaveInvDefToPersistMinQty();

    // Locations dialog minQty
    injectMinQtyIntoLocationsDialog();
    fillLocMinQtyFromCurrentItem();
    wrapLocsSaveButtonToPersistMinQty();

    // Low badges
    wrapRenderInvForLowBadges();
    addLowBadgesToInvCards();

    hookAfterShow();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
