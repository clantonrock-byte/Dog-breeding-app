/**
 * inventory_low_badge_notify_patch.js
 *
 * Implements:
 * (1) LOW count badge on the Home screen buttons:
 *     - Inventory (Edible)  -> shows LOW (n)
 *     - Stock (Inedible)    -> shows LOW (n)
 *
 * (3) Optional "browser notification" alerting (best-effort, local-only):
 *     - Adds a toggle in Settings (if dlgBpSettings exists): "Enable browser notifications"
 *     - If enabled and permission granted, sends ONE notification per day per kind when LOW items exist.
 *
 * Depends on your existing on-hand low logic:
 * - Inventory store: breederPro_inventory_store_v1
 * - On-hand low thresholds: item.minOnHand, defaults from breederPro_inventory_settings_v2
 * - Default "On hand" bucket label: breederPro_transfer_locations_presets_v1.defaultSource (fallback "On hand")
 *
 * Install: load AFTER inventory_lowstock_onhand_settings_patch.js (recommended).
 */
(() => {
  "use strict";

  const INV_KEY = "breederPro_inventory_store_v1";
  const PRESETS_KEY = "breederPro_transfer_locations_presets_v1";
  const SETTINGS_KEY = "breederPro_inventory_settings_v2";
  const NOTIFY_KEY = "breederPro_inventory_notify_v1";
  const COOLDOWN_KEY = "breederPro_inventory_notify_cooldown_v1";

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

  function lowCount(kind) {
    const store = loadInv();
    const items = (store.inventory || []).filter((i) => !i.archived && ((i.kind || "edible") === kind));
    const lows = items.filter(isLow);
    return { count: lows.length, lows };
  }

  // ---------------------------
  // (1) Home button badges
  // ---------------------------
  function findHomeButtonByText(pattern) {
    const btns = Array.from(document.querySelectorAll("#viewHome button.btn.primary"));
    return btns.find((b) => pattern.test((b.textContent || "").trim())) || null;
  }

  function ensureBadge(btn, id) {
    if (!btn) return null;
    let badge = btn.querySelector(`span#${id}`);
    if (badge) return badge;

    badge = document.createElement("span");
    badge.className = "bp-low-badge hide";
    badge.id = id;
    badge.textContent = "LOW (0)";
    btn.style.position = "relative";
    btn.appendChild(badge);
    return badge;
  }

  function updateBadges() {
    const invBtn = findHomeButtonByText(/inventory/i);
    const stockBtn = findHomeButtonByText(/stock/i);

    const invBadge = ensureBadge(invBtn, "bpLowInv");
    const stockBadge = ensureBadge(stockBtn, "bpLowStock");

    const inv = lowCount("edible").count;
    const stock = lowCount("inedible").count;

    if (invBadge) {
      invBadge.textContent = `LOW (${inv})`;
      invBadge.classList.toggle("hide", inv <= 0);
    }
    if (stockBadge) {
      stockBadge.textContent = `LOW (${stock})`;
      stockBadge.classList.toggle("hide", stock <= 0);
    }
  }

  // ---------------------------
  // (3) Optional browser notifications
  // ---------------------------
  function loadNotifySettings() {
    const o = loadJson(NOTIFY_KEY, null) || {};
    if (typeof o.enabled !== "boolean") o.enabled = false;
    return o;
  }

  function saveNotifySettings(o) {
    saveJson(NOTIFY_KEY, o);
  }

  async function requestNotifyPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    try {
      const res = await Notification.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  }

  function canNotifyNow(kind) {
    const cd = loadJson(COOLDOWN_KEY, {}) || {};
    const key = `${kind}:${todayKey()}`;
    return !cd[key];
  }

  function markNotified(kind) {
    const cd = loadJson(COOLDOWN_KEY, {}) || {};
    cd[`${kind}:${todayKey()}`] = true;
    saveJson(COOLDOWN_KEY, cd);
  }

  function maybeNotify(kind) {
    const ns = loadNotifySettings();
    if (!ns.enabled) return;
    if (!("Notification" in window)) return;

    const s = loadSettings();
    if (s[kind]?.enableLowAlerts === false) return;

    const { count, lows } = lowCount(kind);
    if (count <= 0) return;
    if (!canNotifyNow(kind)) return;

    if (Notification.permission !== "granted") return;

    const names = lows.slice(0, 5).map((i) => i.name).filter(Boolean).join(", ");
    const body = `${count} low item(s) (${getDefaultSource()}): ${names}${count > 5 ? "…" : ""}`;

    try {
      new Notification(kind === "edible" ? "Inventory low stock" : "Stock low stock", { body });
      markNotified(kind);
    } catch {
      // ignore
    }
  }

  function ensureNotifyToggleInSettings() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg) return;
    if (document.getElementById("bpNotifyWrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "timeline-item";
    wrap.id = "bpNotifyWrap";
    wrap.innerHTML = `
      <strong>Notifications</strong>
      <div class="muted small" style="margin-top:6px;">
        Optional browser notifications (when LOW items exist). Requires permission and a secure site.
      </div>
      <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:10px;">
        <input type="checkbox" id="bpNotifyEnabled" />
        Enable browser notifications
      </label>
      <div class="row" style="margin-top:10px;">
        <button type="button" class="btn" id="bpNotifyRequest">Request permission</button>
      </div>
      <div id="bpNotifyStatus" class="muted small" style="margin-top:10px;"></div>
    `;

    const footer = dlg.querySelector(".dlg-f");
    if (footer) footer.insertAdjacentElement("beforebegin", wrap);
    else dlg.querySelector(".dlg-card")?.appendChild(wrap);

    const chk = document.getElementById("bpNotifyEnabled");
    const btn = document.getElementById("bpNotifyRequest");
    const status = document.getElementById("bpNotifyStatus");

    const refresh = () => {
      const ns = loadNotifySettings();
      chk.checked = !!ns.enabled;

      if (!("Notification" in window)) {
        status.textContent = "Notifications not supported in this browser.";
        btn.disabled = true;
        return;
      }
      status.textContent = `Permission: ${Notification.permission}`;
      btn.disabled = Notification.permission === "granted";
    };

    chk.addEventListener("change", async () => {
      const ns = loadNotifySettings();
      ns.enabled = !!chk.checked;
      saveNotifySettings(ns);

      if (ns.enabled) {
        const ok = await requestNotifyPermission();
        refresh();
        if (!ok) alert("Notifications are blocked or not granted.");
      }
    });

    btn.addEventListener("click", async () => {
      await requestNotifyPermission();
      refresh();
    });

    refresh();
  }

  // ---------------------------
  // Hooks
  // ---------------------------
  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpLowBadgeWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}

      if (view === "Home") {
        setTimeout(updateBadges, 0);
      }

      if (view === "InventoryAvailable") {
        // When user visits available list, update badges and maybe notify.
        setTimeout(() => {
          updateBadges();
          maybeNotify(kindNow());
        }, 0);
      }
    };

    window.__afterShow._bpLowBadgeWrapped = true;
  }

  function hookRcSetKind() {
    const fn = window.rcSetKind;
    if (typeof fn !== "function" || fn._bpLowBadgeWrapped) return;

    window.rcSetKind = function () {
      const res = fn.apply(this, arguments);
      setTimeout(() => {
        updateBadges();
      }, 0);
      return res;
    };

    window.rcSetKind._bpLowBadgeWrapped = true;
  }

  function install() {
    updateBadges();
    ensureNotifyToggleInSettings();
    hookAfterShow();
    hookRcSetKind();

    // Update periodically while app is open
    if (!window.__bpLowBadgeTimer) {
      window.__bpLowBadgeTimer = setInterval(updateBadges, 1500);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
