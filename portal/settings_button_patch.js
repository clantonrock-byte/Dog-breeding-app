/**
 * settings_button_patch.js
 *
 * Restores a visible ⚙️ Settings button in the top bar.
 *
 * Why:
 * - In some builds, Settings button was injected by a patch that may no longer be loaded.
 * - This patch guarantees the button exists and opens the Settings dialog.
 *
 * Works with:
 * - Any Settings dialog with id dlgBpSettings OR any <dialog> containing "Portal access" text.
 *
 * Install: load near the end of your footer (after bundles is fine).
 */
(() => {
  "use strict";

  function findSettingsDialog() {
    const byId = document.getElementById("dlgBpSettings");
    if (byId && byId.tagName.toLowerCase() === "dialog") return byId;

    const dialogs = Array.from(document.querySelectorAll("dialog"));
    for (const d of dialogs) {
      const t = (d.textContent || "").toLowerCase();
      if (t.includes("portal access") || t.includes("settings")) return d;
    }
    return null;
  }

  function openSettings() {
    const dlg = findSettingsDialog();
    if (dlg && typeof dlg.showModal === "function") {
      try { dlg.showModal(); return; } catch {}
    }
    // Fallback: try any existing click handler if present
    const btn = document.getElementById("btnBpSettings") || document.getElementById("btnSettings");
    if (btn) return;
    alert("Settings dialog not found yet. Try again in a moment.");
  }

  function addButton() {
    const topbar = document.querySelector(".topbar") || document.querySelector("#topbar") || document.body;
    if (!topbar) return;

    if (document.getElementById("btnBpSettings")) return;

    const btn = document.createElement("button");
    btn.id = "btnBpSettings";
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "⚙️ Settings";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openSettings();
    });

    // Place near the end of topbar (next to Talk if present)
    topbar.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    addButton();
    // Views sometimes rebuild topbar; keep re-adding if needed
    setInterval(addButton, 800);
  });
})();
