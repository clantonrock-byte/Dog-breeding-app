/**
 * dogs_heat_visual_badges_v2.js
 *
 * Fix: Don't rely on existing .heat-badge elements.
 * v2 computes HEAT / HEAT SOON directly from localStorage dog data and overlays on photos.
 *
 * Compatible with dogs_heat_cycle_per_dog.js data fields:
 * - dog.inHeat (bool)
 * - dog.heatStartISO (iso string)
 * - dog.sex (string)
 *
 * Rules:
 * - Intact females only (sex starts with "female" and not "spayed")
 * - HEAT if dog.inHeat OR (heatStartISO within 21 days)
 * - HEAT SOON if within 14 days before (heatStartISO + 180 days)
 *
 * Install AFTER dogs_heat_cycle_per_dog.js (but order doesn't matter much now).
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const cycleDays = 180;
  const heatDurationDays = 21;
  const warnDays = 14;

  function loadDogs() {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      if (!Array.isArray(o.dogs)) o.dogs = [];
      return o.dogs;
    } catch {
      return [];
    }
  }

  function parseISO(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function isFemaleIntact(dog) {
    const s = String(dog?.sex || "").toLowerCase().trim();
    return s.startsWith("female") && !s.includes("spayed");
  }

  function status(dog) {
    const start = parseISO(dog?.heatStartISO || "");
    const end = start ? addDays(start, heatDurationDays) : null;
    const next = start ? addDays(start, cycleDays) : null;

    const now = new Date();
    const inHeatByDates = start && end ? (now >= start && now <= end) : false;
    const inHeat = !!dog?.inHeat || inHeatByDates;

    const dueSoon = !inHeat && next ? (now >= addDays(next, -warnDays) && now <= next) : false;

    return { inHeat, dueSoon };
  }

  function clearBadges(root) {
    root.querySelectorAll(".heat-photo-badge").forEach((b) => b.remove());
  }

  function placeBadge(container, type) {
    if (!container) return;
    container.style.position = "relative";
    if (container.querySelector(".heat-photo-badge")) return;

    const badge = document.createElement("div");
    badge.className = "heat-photo-badge " + (type === "heat" ? "heat-now" : "heat-soon");
    badge.textContent = type === "heat" ? "HEAT" : "HEAT SOON";
    container.appendChild(badge);
  }

  function applyToList() {
    const list = document.getElementById("dogsList");
    if (!list) return;

    clearBadges(list);

    const dogs = loadDogs();
    const byId = new Map(dogs.map((d) => [d.dogId, d]));

    list.querySelectorAll(".dog-card").forEach((card) => {
      const dogId = card.getAttribute("data-dog-id") || "";
      const dog = byId.get(dogId);
      if (!dog || !isFemaleIntact(dog)) return;

      const st = status(dog);
      const type = st.inHeat ? "heat" : (st.dueSoon ? "soon" : "");
      if (!type) return;

      const photoWrap = card.querySelector(".dog-card-left") || card;
      placeBadge(photoWrap, type);
    });
  }

  function applyToProfile() {
    const profile = document.getElementById("viewDogProfile");
    if (!profile) return;

    // Only clear within photo area to avoid wiping list badges
    const photoArea =
      document.getElementById("dogPhotoTap") ||
      document.getElementById("dogPhotoImg")?.parentElement ||
      profile;

    if (photoArea) clearBadges(photoArea);

    const dogId = window.currentDogId || "";
    if (!dogId) return;

    const dog = loadDogs().find((d) => d.dogId === dogId) || null;
    if (!dog || !isFemaleIntact(dog)) return;

    const st = status(dog);
    const type = st.inHeat ? "heat" : (st.dueSoon ? "soon" : "");
    if (!type) return;

    const wrap =
      document.getElementById("dogPhotoTap") ||
      document.getElementById("dogPhotoImg")?.parentElement ||
      photoArea;

    placeBadge(wrap, type);
  }

  function refresh() {
    try { applyToList(); } catch {}
    try { applyToProfile(); } catch {}
  }

  function hook() {
    const prev = window.__afterShow;
    if (prev && prev._heatVisualV2Wrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      setTimeout(refresh, 0);
    };

    window.__afterShow._heatVisualV2Wrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hook();
    refresh();
    // In case other renderers run later
    setInterval(refresh, 1200);
  });
})();
