/**
 * dog_status_redundancy_fix.js
 *
 * Fixes "Status redundancy" on Dog Profile:
 * - Hides the quick "Set Puppy / Set Adult" helper buttons (from earlier patch).
 * - Once status is not Puppy (e.g., Adult), prevents changing back to Puppy by:
 *   - disabling the Puppy option in the #dogStatus select (if present)
 *   - (optional) leaving the select enabled for other statuses
 *
 * This follows your rule:
 * - Puppy -> Adult is allowed
 * - Adult -> Puppy is not allowed
 *
 * Install: load after dogs.bundle.js (and after any status patches).
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function hideQuickButtons() {
    // Hide our injected helper row if present
    const helper = $("bpStatusButtons");
    if (helper) helper.classList.add("hide");

    // Also hide any visible buttons that say Set Puppy/Set Adult inside status section
    const sec = $("secStatus") || document.querySelector("#viewDogProfile");
    if (!sec) return;

    Array.from(sec.querySelectorAll("button"))
      .filter((b) => /set\s+puppy|set\s+adult/i.test((b.textContent || "").trim()))
      .forEach((b) => b.classList.add("hide"));
  }

  function lockPuppyOption() {
    const sel = $("dogStatus");
    if (!sel) return;

    const current = String(sel.value || "").trim();
    const isAdultOrOther = current && current.toLowerCase() !== "puppy";

    // Find an option that represents "Puppy" by value or label text
    const opts = Array.from(sel.querySelectorAll("option"));
    const puppyOpt = opts.find((o) => String(o.value || "").toLowerCase() === "puppy") ||
                     opts.find((o) => String(o.textContent || "").trim().toLowerCase() === "puppy");

    if (!puppyOpt) return;

    puppyOpt.disabled = isAdultOrOther;

    // If we're already adult/other, also remove it from the dropdown list visually on some browsers
    // by moving it to the end and keeping disabled (safe).
    if (isAdultOrOther) {
      try { sel.appendChild(puppyOpt); } catch (_) {}
    }
  }

  function apply() {
    hideQuickButtons();
    lockPuppyOption();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpStatusRedundancyWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };

    window.__afterShow._bpStatusRedundancyWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1200);
  });
})();
