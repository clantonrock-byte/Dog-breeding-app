/**
 * settings_tabs_patch_v3.js
 *
 * Ultra-robust Settings tabs for your BreederPro build.
 *
 * Problem solved:
 * - Some builds recreate/rename the Settings <dialog>, so v2 (hard-coded #dlgBpSettings)
 *   can miss it. v3 auto-detects the Settings dialog by:
 *   - #dlgBpSettings if present
 *   - otherwise: any <dialog> that contains the "Portal access" block or a "Settings" header
 *
 * Tabs: Access | Dogs | Inventory | Data
 * Moves blocks by ID if present:
 * - Access:    bpPortalAccessWrap, bpNotifyWrap
 * - Dogs:      bpHeatSettingsWrap
 * - Inventory: bpLowStockOnHandWrap, bpLowStockWrap
 * - Data:      bpBackupWrap
 *
 * Install: load after bundles. Safe to load last.
 */
(() => {
  "use strict";

  const TABS = [
    { btnId: "bpTabAccess", label: "Access", paneId: "bpPaneAccess" },
    { btnId: "bpTabDogs", label: "Dogs", paneId: "bpPaneDogs" },
    { btnId: "bpTabInventory", label: "Inventory", paneId: "bpPaneInventory" },
    { btnId: "bpTabData", label: "Data", paneId: "bpPaneData" },
  ];

  const $ = (id) => document.getElementById(id);

  function findSettingsDialog() {
    const byId = document.getElementById("dlgBpSettings");
    if (byId && byId.tagName.toLowerCase() === "dialog") return byId;

    // Prefer a dialog that already contains our injected blocks
    const dialogs = Array.from(document.querySelectorAll("dialog"));
    for (const d of dialogs) {
      if (d.querySelector("#bpPortalAccessWrap")) return d;
      const header = d.querySelector(".dlg-h");
      if (header && /settings/i.test(header.textContent || "")) return d;
    }
    return null;
  }

  function ensureShell(dlg) {
    if ($("bpSettingsTabs") && $("bpSettingsPanes")) return;

    const card = dlg.querySelector(".dlg-card") || dlg;
    const header = card.querySelector(".dlg-h");
    const footer = card.querySelector(".dlg-f");

    const tabs = document.createElement("div");
    tabs.id = "bpSettingsTabs";
    tabs.className = "bp-tabs";
    tabs.innerHTML = TABS.map(t => `<button type="button" class="bp-tab" id="${t.btnId}">${t.label}</button>`).join("");

    const panes = document.createElement("div");
    panes.id = "bpSettingsPanes";
    panes.innerHTML = TABS.map(t => `<div class="bp-pane ${t.paneId !== "bpPaneAccess" ? "hide" : ""}" id="${t.paneId}"></div>`).join("");

    if (header) header.insertAdjacentElement("afterend", tabs);
    else card.insertAdjacentElement("afterbegin", tabs);

    if (footer) footer.insertAdjacentElement("beforebegin", panes);
    else card.appendChild(panes);

    function show(paneId) {
      TABS.forEach(t => {
        $(t.paneId)?.classList.toggle("hide", t.paneId !== paneId);
        $(t.btnId)?.classList.toggle("active", t.paneId === paneId);
      });
    }

    TABS.forEach(t => $(t.btnId)?.addEventListener("click", () => show(t.paneId)));
    show("bpPaneAccess");
  }

  function moveIfExists(id, paneId) {
    const el = document.getElementById(id);
    const pane = document.getElementById(paneId);
    if (!el || !pane) return false;
    pane.appendChild(el);
    el._bpMoved = true;
    return true;
  }

  function moveHeuristically(dlg) {
    moveIfExists("bpPortalAccessWrap", "bpPaneAccess");
    moveIfExists("bpNotifyWrap", "bpPaneAccess");

    moveIfExists("bpHeatSettingsWrap", "bpPaneDogs");

    moveIfExists("bpLowStockOnHandWrap", "bpPaneInventory");
    moveIfExists("bpLowStockWrap", "bpPaneInventory");

    moveIfExists("bpBackupWrap", "bpPaneData");

    // Any remaining top-level blocks inside the dialog card go somewhere sensible
    const card = dlg.querySelector(".dlg-card") || dlg;
    const panes = {
      access: $("bpPaneAccess"),
      dogs: $("bpPaneDogs"),
      inv: $("bpPaneInventory"),
      data: $("bpPaneData"),
    };

    const candidates = Array.from(card.children).filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.id === "bpSettingsTabs" || node.id === "bpSettingsPanes") return false;
      if (node.classList.contains("dlg-h") || node.classList.contains("dlg-f")) return false;
      if (node.closest && node.closest("#bpSettingsPanes")) return false;
      return true;
    });

    candidates.forEach((item) => {
      const text = (item.textContent || "").toLowerCase();
      if (text.includes("portal") || text.includes("pin") || text.includes("notification")) {
        panes.access?.appendChild(item); return;
      }
      if (text.includes("heat") || text.includes("rabies") || text.includes("dogs")) {
        panes.dogs?.appendChild(item); return;
      }
      if (text.includes("backup") || text.includes("restore") || text.includes("export") || text.includes("import") || text.includes("reset")) {
        panes.data?.appendChild(item); return;
      }
      panes.inv?.appendChild(item);
    });
  }

  function applyTabs() {
    const dlg = findSettingsDialog();
    if (!dlg) return false;
    ensureShell(dlg);
    moveHeuristically(dlg);
    return true;
  }

  function install() {
    applyTabs();

    // Re-apply after settings is opened (blocks may be injected late)
    const dlg = findSettingsDialog();
    if (dlg && !dlg._bpTabsV3Hooked) {
      dlg.addEventListener("toggle", () => setTimeout(applyTabs, 0));
      dlg._bpTabsV3Hooked = true;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    // keep trying for a bit (late injection + mobile timing)
    const t = setInterval(() => {
      install();
      if (document.getElementById("bpSettingsTabs")) setTimeout(() => clearInterval(t), 6000);
    }, 500);
  });
})();
