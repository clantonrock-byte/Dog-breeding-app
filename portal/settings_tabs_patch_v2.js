/**
 * settings_tabs_patch_v2.js
 *
 * v2: More robust tabbed Settings.
 * - Waits until the Settings dialog (#dlgBpSettings) exists AND is opened (or at least attached)
 * - Re-applies tab layout on each open (covers late-injected blocks like backup/reset)
 *
 * Tabs: Access | Dogs | Inventory | Data
 *
 * Install: load AFTER inventory.bundle.js (and after any settings patches).
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

  function getDlg() {
    return document.getElementById("dlgBpSettings");
  }

  function ensureShell(dlg) {
    if ($("bpSettingsTabs") && $("bpSettingsPanes")) return;

    const card = dlg.querySelector(".dlg-card");
    if (!card) return;

    const tabs = document.createElement("div");
    tabs.id = "bpSettingsTabs";
    tabs.className = "bp-tabs";
    tabs.innerHTML = TABS.map(t => `<button type="button" class="bp-tab" id="${t.btnId}">${t.label}</button>`).join("");

    const panes = document.createElement("div");
    panes.id = "bpSettingsPanes";
    panes.innerHTML = TABS.map(t => `<div class="bp-pane ${t.paneId !== "bpPaneAccess" ? "hide" : ""}" id="${t.paneId}"></div>`).join("");

    const header = card.querySelector(".dlg-h");
    if (header) header.insertAdjacentElement("afterend", tabs);
    else card.insertAdjacentElement("afterbegin", tabs);

    const footer = card.querySelector(".dlg-f");
    if (footer) footer.insertAdjacentElement("beforebegin", panes);
    else card.appendChild(panes);

    function show(paneId) {
      TABS.forEach(t => {
        $(t.paneId)?.classList.toggle("hide", t.paneId !== paneId);
        $(t.btnId)?.classList.toggle("active", t.paneId === paneId);
      });
    }

    TABS.forEach(t => {
      $(t.btnId)?.addEventListener("click", () => show(t.paneId));
    });

    show("bpPaneAccess");
  }

  function moveIfExists(id, paneId) {
    const el = $(id);
    const pane = $(paneId);
    if (!el || !pane) return false;
    pane.appendChild(el);
    el._bpMoved = true;
    return true;
  }

  function moveHeuristically(dlg) {
    // Known IDs
    moveIfExists("bpPortalAccessWrap", "bpPaneAccess");
    moveIfExists("bpNotifyWrap", "bpPaneAccess");

    moveIfExists("bpHeatSettingsWrap", "bpPaneDogs");

    moveIfExists("bpLowStockOnHandWrap", "bpPaneInventory");
    moveIfExists("bpLowStockWrap", "bpPaneInventory");
    moveIfExists("bpLowStockOnHandWrap", "bpPaneInventory");

    moveIfExists("bpBackupWrap", "bpPaneData");
    moveIfExists("bpLowListWrap", "bpPaneData");  // if any

    // Anything still in dialog card that isn't footer/header/tabs should be placed.
    const card = dlg.querySelector(".dlg-card");
    if (!card) return;

    const panes = {
      access: $("bpPaneAccess"),
      dogs: $("bpPaneDogs"),
      inv: $("bpPaneInventory"),
      data: $("bpPaneData"),
    };

    const candidates = Array.from(card.children).filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.id === "bpSettingsTabs") return false;
      if (node.id === "bpSettingsPanes") return false;
      if (node.classList.contains("dlg-h")) return false;
      if (node.classList.contains("dlg-f")) return false;
      // If it's already inside a pane, skip
      if (node.closest && node.closest("#bpSettingsPanes")) return false;
      return true;
    });

    candidates.forEach((item) => {
      const text = (item.textContent || "").toLowerCase();

      if (text.includes("portal") || text.includes("pin") || text.includes("notification")) {
        panes.access?.appendChild(item);
        return;
      }
      if (text.includes("heat") || text.includes("immun") || text.includes("rabies") || text.includes("dogs")) {
        panes.dogs?.appendChild(item);
        return;
      }
      if (text.includes("backup") || text.includes("restore") || text.includes("export") || text.includes("import") || text.includes("reset")) {
        panes.data?.appendChild(item);
        return;
      }
      panes.inv?.appendChild(item);
    });
  }

  function applyTabs() {
    const dlg = getDlg();
    if (!dlg) return false;
    ensureShell(dlg);
    moveHeuristically(dlg);
    return true;
  }

  function hookOpen() {
    const dlg = getDlg();
    if (!dlg || dlg._bpTabsHooked) return;

    // When dialog opens, blocks might have been injected; apply then.
    dlg.addEventListener("toggle", () => setTimeout(applyTabs, 0));
    dlg.addEventListener("close", () => {});
    dlg._bpTabsHooked = true;
  }

  function installLoop() {
    const ok = applyTabs();
    if (ok) hookOpen();
  }

  document.addEventListener("DOMContentLoaded", () => {
    installLoop();
    // keep trying until settings dialog exists + is patched
    const t = setInterval(() => {
      installLoop();
      if (getDlg() && $("bpSettingsTabs")) {
        // still keep the interval a bit in case late blocks show up
        setTimeout(() => clearInterval(t), 5000);
      }
    }, 500);
  });
})();
