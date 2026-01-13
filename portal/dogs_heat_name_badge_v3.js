/**
 * dogs_heat_name_badge_v3.js
 *
 * Phase-aware heat badges next to DOG NAME (list + profile).
 *
 * Your rule:
 * - During standing heat: show RED "HEAT" (ALL CAPS).
 * - Only show YELLOW when "coming into" OR "coming out of" heat.
 *
 * Implementation:
 * - Intact females only (sex starts with "female" and not "spayed").
 * - Heat duration assumed 21 days.
 * - Cycle assumed ~180 days for forecasting (used only for "coming into").
 *
 * Yellow states:
 * - "HEAT SOON" (coming into) when within 14 days BEFORE predicted next heat start.
 * - "HEAT ENDING" (coming out) when within last 5 days of the current heat window.
 *
 * Red state:
 * - "HEAT" when in heat but NOT within the ending window.
 *
 * Inputs (per dog) from breederPro_dogs_store_v3:
 * - dog.inHeat (boolean)   // user marks observed heat
 * - dog.heatStartISO (ISO string at midnight)  // last observed heat start date (optional but recommended)
 * - dog.sex (string)
 *
 * Install AFTER dogs_heat_cycle_per_dog.js (and replace older badge script).
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";

  const CYCLE_DAYS = 180;
  const HEAT_DURATION_DAYS = 21;
  const WARN_BEFORE_DAYS = 14;
  const ENDING_LAST_DAYS = 5;

  function loadDogs() {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      return Array.isArray(o.dogs) ? o.dogs : [];
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

  function computePhase(dog) {
    const now = new Date();
    const start = parseISO(dog.heatStartISO || "");

    // If user explicitly marked inHeat, prefer that.
    const userInHeat = !!dog.inHeat;

    // If we have a start date, compute end/next.
    const end = start ? addDays(start, HEAT_DURATION_DAYS) : null;
    const next = start ? addDays(start, CYCLE_DAYS) : null;

    // In-heat by date window (only if start known)
    const dateInHeat = start && end ? (now >= start && now <= end) : false;
    const inHeat = userInHeat || dateInHeat;

    // Coming out: last N days of heat window (needs start+end)
    const endingSoon = inHeat && start && end
      ? (now >= addDays(end, -ENDING_LAST_DAYS) && now <= end)
      : false;

    // Coming in: within N days before predicted next start (needs start+next) and NOT currently in heat
    const comingSoon = !inHeat && next
      ? (now >= addDays(next, -WARN_BEFORE_DAYS) && now <= next)
      : false;

    if (endingSoon) return "ending";
    if (inHeat) return "heat";
    if (comingSoon) return "soon";
    return "";
  }

  function clear(root) {
    root.querySelectorAll(".heat-name-badge").forEach((b) => b.remove());
  }

  function makeBadge(phase) {
    const badge = document.createElement("span");
    badge.className = "heat-name-badge " + (phase === "heat" ? "heat-now" : "heat-warn");
    badge.textContent = phase === "heat" ? "HEAT" : (phase === "ending" ? "HEAT ENDING" : "HEAT SOON");
    return badge;
  }

  function applyToList() {
    const list = document.getElementById("dogsList");
    if (!list) return;

    clear(list);

    const dogs = loadDogs();
    const byId = new Map(dogs.map((d) => [d.dogId, d]));

    list.querySelectorAll(".dog-card").forEach((card) => {
      const id = card.getAttribute("data-dog-id");
      const dog = byId.get(id);
      if (!dog || !isFemaleIntact(dog)) return;

      const phase = computePhase(dog);
      if (!phase) return;

      const nameEl = card.querySelector(".dog-card-title") || card.querySelector("strong") || card;
      nameEl.appendChild(makeBadge(phase));
    });
  }

  function findProfileNameElement(profile, callName) {
    const byId1 = document.getElementById("dogProfileTitle");
    if (byId1) return byId1;
    const byId2 = document.getElementById("dogCallNameDisplay");
    if (byId2) return byId2;

    const h = profile.querySelector("h2, h3, h4");
    if (h) return h;

    const leafExact = Array.from(profile.querySelectorAll("*"))
      .filter((el) => el.children.length === 0)
      .find((el) => (el.textContent || "").trim() === callName);
    if (leafExact) return leafExact;

    const candidates = Array.from(profile.querySelectorAll("strong, .big, .title, div, span"))
      .filter((el) => (el.textContent || "").includes(callName));
    return candidates[0] || null;
  }

  function applyToProfile() {
    const profile = document.getElementById("viewDogProfile");
    if (!profile) return;

    clear(profile);

    const dogId = window.currentDogId || "";
    if (!dogId) return;

    const dog = loadDogs().find((d) => d.dogId === dogId);
    if (!dog || !isFemaleIntact(dog)) return;

    const phase = computePhase(dog);
    if (!phase) return;

    const callName = String(dog.callName || "").trim();
    const nameEl = findProfileNameElement(profile, callName);
    if (!nameEl) return;

    nameEl.appendChild(makeBadge(phase));
  }

  function refresh() {
    try { applyToList(); } catch {}
    try { applyToProfile(); } catch {}
  }

  function hook() {
    const prev = window.__afterShow;
    if (prev && prev._heatNameV3Wrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      setTimeout(refresh, 0);
    };
    window.__afterShow._heatNameV3Wrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hook();
    refresh();
    setInterval(refresh, 1500);
  });
})();
