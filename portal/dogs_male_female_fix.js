/**
 * dogs_male_female_fix.js
 *
 * Fixes "View males" / "View females" behaving differently than "View all".
 *
 * Some builds patch renderDogs() to read window.dogsViewMode, but the original
 * button handlers may only update a local (non-window) dogsViewMode.
 *
 * This script binds CAPTURE click handlers to take control:
 * - set window.dogsViewMode
 * - hide unassigned panel
 * - call renderDogs()
 */
(function () {
  "use strict";

  function apply(mode) {
    window.dogsViewMode = mode;

    try {
      const uw = document.getElementById("dogsUnassignedWrap");
      if (uw) uw.classList.add("hide");
    } catch (_) {}

    try {
      if (typeof window.renderDogs === "function") window.renderDogs();
    } catch (_) {}
  }

  function bind() {
    const males = document.getElementById("btnViewMales");
    const females = document.getElementById("btnViewFemales");

    if (males && !males._ccBound) {
      males.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          apply("Males");
        },
        true
      );
      males._ccBound = true;
    }

    if (females && !females._ccBound) {
      females.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          apply("Females");
        },
        true
      );
      females._ccBound = true;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    setInterval(bind, 800);
  });
})();
