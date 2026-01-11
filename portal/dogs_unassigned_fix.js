/**
 * dogs_unassigned_fix.js
 *
 * Fix: "Needs sex set" should filter the main list (like View all / males / females).
 *
 * Root cause (common in your build):
 * - Existing click handler updates a local dogsViewMode (not window.dogsViewMode)
 * - Patched renderDogs() reads window.dogsViewMode -> stays "All" -> shows all dogs
 *
 * This patch:
 * - Adds a CAPTURE click handler to the "Needs sex set" button
 * - Sets window.dogsViewMode="Unassigned"
 * - Hides the old separate unassigned panel
 * - Calls renderDogs()
 *
 * Robust: finds the button by id OR by button text.
 */
(function () {
  "use strict";

  function findNeedsSexButton() {
    // Preferred: known id from portal index
    const byId =
      document.getElementById("btnShowUnassigned") ||
      document.getElementById("btnNeedsSexSet") ||
      document.getElementById("btnUnassigned");

    if (byId) return byId;

    // Fallback: search buttons by visible text
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.find((b) => /needs\s+sex\s+set/i.test((b.textContent || "").trim())) || null;
  }

  function apply() {
    window.dogsViewMode = "Unassigned";

    try {
      const uw = document.getElementById("dogsUnassignedWrap");
      if (uw) uw.classList.add("hide");
    } catch (_) {}

    try {
      if (typeof window.renderDogs === "function") window.renderDogs();
    } catch (_) {}
  }

  function bind() {
    const btn = findNeedsSexButton();
    if (!btn || btn._ccBoundNeedsSex) return;

    btn.addEventListener(
      "click",
      (e) => {
        // Capture-phase: prevents older bubbling handlers from fighting this
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        apply();
      },
      true
    );

    btn._ccBoundNeedsSex = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    setInterval(bind, 800);
  });
})();
