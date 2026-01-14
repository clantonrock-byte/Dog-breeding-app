(() => {
  "use strict";

  const LIFE_STAGE_KEEP = ["Puppy", "Adult"];
  const DISPOSITION_KEEP = ["Active", "For sale", "Retired", "Transferred", "Deceased"];

  const $ = (id) => document.getElementById(id);

  function norm(s) {
    return String(s ?? "").trim();
  }

  function ensureOptions(selectEl, keepList) {
    if (!selectEl) return;

    const keepLower = keepList.map((x) => x.toLowerCase());

    // Map existing options by lowercase label/value
    const existing = new Map();
    Array.from(selectEl.options).forEach((opt) => {
      const label = norm(opt.textContent) || norm(opt.value);
      if (!label) return;
      existing.set(label.toLowerCase(), opt);
    });

    // Add missing keep options
    keepList.forEach((label) => {
      const key = label.toLowerCase();
      if (existing.has(key)) return;
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      selectEl.appendChild(opt);
    });

    // Remove options not in keep list
    Array.from(selectEl.options).forEach((opt) => {
      const label = norm(opt.textContent) || norm(opt.value);
      const key = label.toLowerCase();
      if (!keepLower.includes(key)) opt.remove();
    });

    // Ensure value valid
    const cur = norm(selectEl.value).toLowerCase();
    if (!keepLower.includes(cur) && selectEl.options.length) {
      selectEl.value = selectEl.options[0].value;
    }
  }

  function apply() {
    const statusSel = $("dogStatus");
    if (statusSel) ensureOptions(statusSel, LIFE_STAGE_KEEP);

    const dispSel = $("dogDisposition");
    if (dispSel) ensureOptions(dispSel, DISPOSITION_KEEP);
  }

  function hook() {
    const prev = window.__afterShow;
    if (prev && prev._bpSplitSafeV2Wrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };
    window.__afterShow._bpSplitSafeV2Wrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hook();
    apply();
    setInterval(apply, 1500);
  });
})();
