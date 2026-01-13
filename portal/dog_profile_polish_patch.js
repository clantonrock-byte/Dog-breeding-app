/**
 * dog_profile_polish_patch.js
 *
 * Profile UX polish:
 * - Removes the "More" toggle (always shows the extra fields panel)
 * - Creates a single bottom action bar with ONE button: "Save & Done"
 * - Button triggers existing saveDog(true) when available (fallback: saveDog(false))
 *
 * Safe:
 * - No data model changes
 * - Does not delete any fields; only changes visibility/layout
 *
 * Assumptions (based on your app):
 * - Profile view id: #viewDogProfile (section)
 * - More panel id: #dogMorePanel
 * - Toggle button id: #btnMoreDog
 * - Save button id: #btnSaveDog
 * - Cancel/back button id: #btnCancelDog (optional)
 * - Save function: window.saveDog(exitAfter:boolean)
 *
 * Install: load AFTER dogs.bundle.js
 */
(() => {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function showMoreAlways() {
    const panel = $("dogMorePanel");
    const btnMore = $("btnMoreDog");
    if (panel) panel.classList.remove("hide");
    if (btnMore) btnMore.classList.add("hide");
  }

  function ensureSingleActionBar() {
    const view = $("viewDogProfile");
    if (!view) return;

    // Hide the old multi-button footer area if present (we'll keep underlying buttons in DOM for safety)
    const oldSave = $("btnSaveDog");
    if (oldSave) oldSave.classList.add("hide");

    // If action bar already exists, done.
    if ($("bpDogProfileActions")) return;

    const bar = document.createElement("div");
    bar.id = "bpDogProfileActions";
    bar.className = "bp-dog-actions";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn primary bp-dog-save";
    btn.id = "bpDogSaveDone";
    btn.textContent = "Save & Done";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (typeof window.saveDog === "function") {
          // preferred: save and exit back
          try { window.saveDog(true); return; } catch (_) {}
          // fallback: just save
          try { window.saveDog(false); return; } catch (_) {}
        }
      } catch (_) {}

      // Ultimate fallback: click the original save button if it exists
      try { $("btnSaveDog")?.click?.(); } catch (_) {}

      // If nothing exists, at least tell the user.
      alert("Save function not available yet.");
    });

    bar.appendChild(btn);
    view.appendChild(bar);
  }

  function apply() {
    showMoreAlways();
    ensureSingleActionBar();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpDogProfilePolishWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };

    window.__afterShow._bpDogProfilePolishWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    // apply if profile is already visible
    setTimeout(apply, 500);
    setInterval(() => {
      // keep panel open if other scripts try to hide it
      try { showMoreAlways(); } catch (_) {}
    }, 1200);
  });
})();
