/**
 * dogs_filters_polish.js
 *
 * A) "Needs sex set" behaves like Males/Females/All (a real filter mode).
 * B) Dog list polish: badges + row tap + chevron, minimal buttons.
 *
 * Works as a runtime patch: reads dogs from localStorage and re-renders list.
 * Safe: does not modify dog data, only UI behavior.
 *
 * Assumes:
 * - Dogs stored under breederPro_dogs_store_v3
 * - Dog list container id: dogsList
 * - Pill id: dogsCurrentViewPill
 * - Meta id: dogsListMeta
 * - Buttons: btnViewAllDogs, btnViewMales, btnViewFemales, btnShowUnassigned
 * - open dog function exists: __openDog(dogId) OR _openDog(dogId) OR openDog(dogId)
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const loadDogs = () => {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      if (!Array.isArray(o.dogs)) o.dogs = [];
      return o;
    } catch {
      return { dogs: [] };
    }
  };

  const ensureDog = (d) => {
    if (!d) return d;
    if (typeof d.photoDataUrl !== "string") d.photoDataUrl = "";
    return d;
  };

  const sexCategory = (sexStr) => {
    const s = String(sexStr || "").toLowerCase();
    if (s.startsWith("male")) return "male";
    if (s.startsWith("female")) return "female";
    return "unknown";
  };

  const isAltered = (sexStr) => {
    const s = String(sexStr || "").toLowerCase();
    return s.includes("neutered") || s.includes("spayed");
  };

  const sortDogsIntactFirst = (a, b) => {
    const ai = isAltered(a.sex) ? 1 : 0;
    const bi = isAltered(b.sex) ? 1 : 0;
    if (ai !== bi) return ai - bi;
    return String(a.callName || "").toLowerCase().localeCompare(String(b.callName || "").toLowerCase());
  };

  const openDog = (dogId) => {
    try {
      if (typeof window.__openDog === "function") return window.__openDog(dogId);
      if (typeof window._openDog === "function") return window._openDog(dogId);
      if (typeof window.openDog === "function") return window.openDog(dogId);
    } catch (_) {}
  };

  function getRoute(d) {
    // Best-effort. If you later add routes, update this mapping.
    const candidates = [d.route, d.routeName, d.currentRoute, d.location, d.kennel, d.pen, d.run];
    for (const c of candidates) {
      const v = typeof c === "string" ? c.trim() : "";
      if (v) return v;
    }
    return "";
  }

  function badge(html, kind) {
    return `<span class="dog-badge ${kind}">${html}</span>`;
  }

  function renderDogsPatched() {
    const container = document.getElementById("dogsList");
    if (!container) return;

    const store = loadDogs();
    const all = (store.dogs || []).map(ensureDog);

    // Active-only for main list
    let list = all.filter((d) => !d.archived);

    const mode = String(window.dogsViewMode || "All");

    if (mode === "Males") list = list.filter((d) => sexCategory(d.sex) === "male");
    if (mode === "Females") list = list.filter((d) => sexCategory(d.sex) === "female");
    if (mode === "Unassigned") list = list.filter((d) => sexCategory(d.sex) === "unknown");

    list.sort(sortDogsIntactFirst);

    // Header/meta updates (safe if missing)
    try {
      const pill = document.getElementById("dogsCurrentViewPill");
      if (pill) pill.textContent = mode === "Unassigned" ? "Needs sex set" : mode;
    } catch (_) {}

    try {
      const hint = document.getElementById("dogsSortHint");
      if (hint) hint.textContent = (mode === "Males" || mode === "Females") ? " • intact first, altered after" : "";
    } catch (_) {}

    try {
      const meta = document.getElementById("dogsListMeta");
      if (meta) meta.textContent = `Dogs shown: ${list.length}`;
    } catch (_) {}

    // Hide the old separate "unassigned section" so it behaves like a filter
    try {
      const uw = document.getElementById("dogsUnassignedWrap");
      if (uw) uw.classList.add("hide");
    } catch (_) {}

    if (!list.length) {
      container.innerHTML = `<div class="muted small">No dogs found in this view.</div>`;
      return;
    }

    container.innerHTML = list.map((d) => {
      const photo = (d.photoDataUrl || "").trim();
      const sexCat = sexCategory(d.sex);
      const altered = sexCat === "unknown" ? false : isAltered(d.sex);
      const status = (d.status || "Adult").trim();
      const route = getRoute(d);

      const sexBadge =
        sexCat === "male" ? badge("Male", "sex-male") :
        sexCat === "female" ? badge("Female", "sex-female") :
        badge("Needs sex", "sex-unknown");

      const alterBadge =
        sexCat === "unknown" ? "" :
        altered ? badge("Altered", "altered") : badge("Intact", "intact");

      const statusBadge = status ? badge(esc(status), "status") : "";

      const routeBadge = route ? badge(esc(route), "route") : "";

      const thumb = photo
        ? `<img class="dog-thumb" src="${esc(photo)}" alt="Photo of ${esc(d.callName || "dog")}" />`
        : `<div class="dog-thumb placeholder" aria-label="No photo"></div>`;

      return `
        <div class="timeline-item dog-card" role="button" tabindex="0"
             onclick="(${openDog.toString()})('${esc(d.dogId)}')">
          <div class="dog-card-left">${thumb}</div>

          <div class="dog-card-mid">
            <div class="dog-card-title">${esc(d.callName || "")}</div>
            <div class="dog-card-sub muted small">
              ${d.breed ? `Breed: ${esc(d.breed)} • ` : ""}
              Sex: ${esc(d.sex || "(unknown)")} • Status: ${esc(status)}
            </div>
            <div class="dog-badges">
              ${sexBadge}
              ${alterBadge}
              ${statusBadge}
              ${routeBadge}
            </div>
          </div>

          <div class="dog-card-right" aria-hidden="true">›</div>
        </div>
      `;
    }).join("");
  }

  function setMode(mode) {
    window.dogsViewMode = mode;
    renderDogsPatched();
  }

  function bind() {
    const allBtn = document.getElementById("btnViewAllDogs");
    const malesBtn = document.getElementById("btnViewMales");
    const femalesBtn = document.getElementById("btnViewFemales");
    const unassignedBtn = document.getElementById("btnShowUnassigned");

    // Capture handlers so older inline handlers can't fight us.
    const bindCap = (btn, fn) => {
      if (!btn || btn._ccBound) return;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        fn();
      }, true);
      btn._ccBound = true;
    };

    bindCap(allBtn, () => setMode("All"));
    bindCap(malesBtn, () => setMode("Males"));
    bindCap(femalesBtn, () => setMode("Females"));
    bindCap(unassignedBtn, () => setMode("Unassigned"));
  }

  function install() {
    // Preserve original renderDogs (if needed elsewhere)
    if (!window.__origRenderDogs && typeof window.renderDogs === "function") {
      window.__origRenderDogs = window.renderDogs;
    }

    // Install our renderer as the canonical one
    window.renderDogs = renderDogsPatched;

    bind();

    // If Dogs view is already on screen, re-render.
    try { renderDogsPatched(); } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    // Win load-order races with late scripts
    setTimeout(install, 400);
    setTimeout(install, 1200);
    setInterval(bind, 1200);
  });
})();
