/**
 * heat_single_save_patch.js
 *
 * Fix: Two save buttons on Dog Profile (Heat block "Save" + Profile "Save & Done").
 *
 * Approach:
 * - Hides the Heat block Save button (#btnSaveHeat) and its row.
 * - Relies on your unified save pipeline (Save & Done + dog_status_heat_unify_patch)
 *   to persist heat fields (#chkInHeat/#heatStart/#heatNotes) when saving the profile.
 *
 * Install: load AFTER dogs_heat_cycle_per_dog.js and AFTER dog_profile_polish_patch_v2.js
 */
(() => {
  "use strict";

  function hideHeatSave() {
    const btn = document.getElementById("btnSaveHeat");
    if (!btn) return;

    // Hide the whole row that contains the heat save button
    const row = btn.closest(".row") || btn.parentElement;
    if (row) row.classList.add("hide");
    btn.classList.add("hide");
  }

  function install() {
    hideHeatSave();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpHeatSingleSaveWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(install, 0);
    };

    window.__afterShow._bpHeatSingleSaveWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    install();
    setInterval(install, 1200);
  });
})();
