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

  function status(dog) {
    const start = parseISO(dog.heatStartISO || "");
    const end = start ? addDays(start, heatDurationDays) : null;
    const next = start ? addDays(start, cycleDays) : null;
    const now = new Date();

    const inHeatByDates = start && end ? (now >= start && now <= end) : false;
    const inHeat = !!dog.inHeat || inHeatByDates;
    const dueSoon = !inHeat && next ? (now >= addDays(next, -warnDays) && now <= next) : false;

    return { inHeat, dueSoon };
  }

  function clear(root) {
    root.querySelectorAll(".heat-name-badge").forEach((b) => b.remove());
  }

  function makeBadge(type) {
    const badge = document.createElement("span");
    badge.className = "heat-name-badge " + (type === "heat" ? "heat-now" : "heat-soon");
    badge.textContent = type === "heat" ? "HEAT" : "HEAT SOON";
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

      const st = status(dog);
      const type = st.inHeat ? "heat" : st.dueSoon ? "soon" : null;
      if (!type) return;

      const nameEl = card.querySelector(".dog-card-title") || card.querySelector("strong") || card;
      nameEl.appendChild(makeBadge(type));
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

    const st = status(dog);
    const type = st.inHeat ? "heat" : st.dueSoon ? "soon" : null;
    if (!type) return;

    const callName = String(dog.callName || "").trim();
    const nameEl = findProfileNameElement(profile, callName);
    if (!nameEl) return;

    nameEl.appendChild(makeBadge(type));
  }

  function refresh() {
    try { applyToList(); } catch {}
    try { applyToProfile(); } catch {}
  }

  function hook() {
    const prev = window.__afterShow;
    if (prev && prev._heatNameV2Wrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      setTimeout(refresh, 0);
    };
    window.__afterShow._heatNameV2Wrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hook();
    refresh();
    setInterval(refresh, 1200);
  });
})();
