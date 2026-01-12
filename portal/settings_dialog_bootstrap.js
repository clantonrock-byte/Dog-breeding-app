/**
 * settings_dialog_bootstrap.js
 *
 * Guarantees a Settings dialog exists at runtime.
 *
 * Why:
 * - If <dialog id="dlgBpSettings"> is missing / not deployed / inserted incorrectly,
 *   the Settings button can't open it.
 *
 * What it does:
 * - On DOMContentLoaded, if #dlgBpSettings is missing, it creates and appends it to <body>.
 * - Provides #btnBpSaveSettings so your existing settings patches can hook into it.
 *
 * Install:
 * - Load near the end of your footer (after bundles is fine).
 */
(() => {
  "use strict";

  function ensureDialog() {
    if (document.getElementById("dlgBpSettings")) return;

    const dlg = document.createElement("dialog");
    dlg.id = "dlgBpSettings";
    dlg.innerHTML = `
      <form method="dialog" class="dlg-card">
        <div class="dlg-h">
          <h2>Settings</h2>
          <button class="btn" value="cancel" aria-label="Close">✕</button>
        </div>

        <div class="muted small" style="margin-top:8px;">
          Settings content will appear here.
        </div>

        <div class="dlg-f">
          <button class="btn" value="cancel">Close</button>
          <button class="btn primary" id="btnBpSaveSettings" value="ok">Save</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureDialog();
  });
})();
