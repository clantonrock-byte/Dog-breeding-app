/**
 * dog_ui_patch.js
 *
 * Hot-patch for BreederPro dog list/profile without editing existing inline scripts:
 * - Replaces dog list HTML to include thumbnail and clickable route pill
 * - Removes the "Open" button by not rendering it
 * - Adds a robust "View all active dogs" handler and binds it if button IDs match
 *
 * How it works:
 * - Waits for existing app functions to be defined (renderDogs/_go/loadDogs/etc.)
 * - Overrides window.renderDogs with a patched implementation that reads the same localStorage store
 *
 * Assumptions:
 * - Dogs are stored in localStorage under "breederPro_dogs_store_v3" (matches your screenshot)
 * - Dog list container element id is "dogsList"
 * - A dog open function exists: _openDog(dogId) OR __openDog(dogId) OR openDog(dogId)
 * - View navigation exists: _go("Dogs") (optional; list will still render if absent)
 */
(() => {
  "use strict";

  const DOG_KEY = window.DOG_KEY || "breederPro_dogs_store_v3";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const loadDogsStore = () => {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      return raw ? JSON.parse(raw) : { dogs: [] };
    } catch {
      return { dogs: [] };
    }
  };

  const ensureDog = (d) => {
    if (!d) return d;
    d.immunizationEvents ||= [];
    d.microchip ||= { value: "", locked: false, lockedAt: null };
    if (typeof d.photoDataUrl !== "string") d.photoDataUrl = "";
    return d;
  };

  const isPrintableScalar = (v) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0 && v.length <= 80;
    if (typeof v === "number") return Number.isFinite(v);
    return false;
  };

  const detectRouteKey = (dogs) => {
    if (window.__routeKeyDetected) return window.__routeKeyDetected;

    const sample = (dogs || []).slice(0, 200);
    const counts = new Map();

    for (const d of sample) {
      if (!d || typeof d !== "object") continue;

      for (const [key, val] of Object.entries(d)) {
        if (!isPrintableScalar(val)) continue;

        const kl = key.toLowerCase();
        let score = 0;

        if (/(route|truck|run|pen|kennel|location|stall|area|zone)/.test(kl)) score += 5;
        if (/(name|note|status|breed|sex|dob|id|photo)/.test(kl)) score -= 2;

        const s = String(val).trim();
        if (s.length >= 2 && s.length <= 24) score += 1;

        counts.set(key, (counts.get(key) || 0) + score);
      }
    }

    let bestKey = "";
    let bestScore = 0;
    for (const [k, sc] of counts.entries()) {
      if (sc > bestScore) {
        bestScore = sc;
        bestKey = k;
      }
    }

    window.__routeKeyDetected = bestScore > 0 ? bestKey : "";
    return window.__routeKeyDetected;
  };

  const getDogRoute = (d, routeKey) => {
    if (!d || typeof d !== "object") return "";
    if (routeKey && isPrintableScalar(d[routeKey])) return String(d[routeKey]).trim();

    const candidates = [
      d.route,
      d.routeName,
      d.currentRoute,
      d.location,
      d.kennel,
      d.pen,
      d.run,
    ];
    for (const c of candidates) {
      if (isPrintableScalar(c)) return String(c).trim();
    }
    return "";
  };

  const openDog = (dogId) => {
    if (typeof window._openDog === "function") return window._openDog(dogId);
    if (typeof window.__openDog === "function") return window.__openDog(dogId);
    if (typeof window.openDog === "function") return window.openDog(dogId);
  };

  const openRoute = (route) => {
    const r = String(route || "").trim();
    if (!r) return;
    window.dogsRouteFilter = r;
    if (typeof window._go === "function") window._go("Dogs");
    if (typeof window.renderDogs === "function") window.renderDogs();
  };

  const clearRouteFilter = () => {
    window.dogsRouteFilter = "";
    if (typeof window.renderDogs === "function") window.renderDogs();
  };

  const closeDogProfileUI = () => {
    const dialogIds = ["dlgDog", "dlgDogProfile", "dlgDogDetail", "dlgDogView"];
    for (const id of dialogIds) {
      const el = document.getElementById(id);
      if (el && typeof el.close === "function") {
        try { el.close(); } catch {}
      }
    }
    const hideIds = ["dogProfileWrap", "dogDetailWrap", "dogPageWrap", "dogViewWrap"];
    for (const id of hideIds) {
      const el = document.getElementById(id);
      if (el && el.classList) {
        try { el.classList.add("hide"); } catch {}
      }
    }
  };

  const viewAllActiveDogs = () => {
    window.dogsViewMode = "All";
    window.dogsRouteFilter = "";
    closeDogProfileUI();
    if (typeof window._go === "function") window._go("Dogs");
    if (typeof window.renderDogs === "function") window.renderDogs();
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  };

  const bindViewAllDogsButton = () => {
    const btn =
      document.getElementById("btnViewAllDogs") ||
      document.getElementById("btnViewAll") ||
      document.getElementById("btnViewAllActiveDogs") ||
      document.querySelector('[data-action="view-all-dogs"]');

    if (!btn || btn._viewAllBound) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      viewAllActiveDogs();
    });
    btn._viewAllBound = true;
  };

  const patchedRenderDogs = () => {
    const store = loadDogsStore();
    const all = (store.dogs || []).map(ensureDog);

    let list = all.filter((d) => !d.archived);

    // Preserve your existing view modes if present
    if (window.dogsViewMode === "Males" && typeof window.sexCategory === "function") {
      list = list.filter((d) => window.sexCategory(d.sex) === "male");
    }
    if (window.dogsViewMode === "Females" && typeof window.sexCategory === "function") {
      list = list.filter((d) => window.sexCategory(d.sex) === "female");
    }
    if (window.dogsViewMode === "Unassigned" && typeof window.sexCategory === "function") {
      list = list.filter((d) => window.sexCategory(d.sex) === "unknown");
    }

    if (typeof window.sortDogsIntactFirst === "function") list.sort(window.sortDogsIntactFirst);

    const routeKey = detectRouteKey(all);
    const rf = String(window.dogsRouteFilter || "").trim();
    if (rf) list = list.filter((d) => getDogRoute(d, routeKey).toLowerCase() === rf.toLowerCase());

    const container = document.getElementById("dogsList");
    if (!container) return;

    if (!list.length) {
      container.innerHTML = `
        <div class="muted small">
          No dogs found.${rf ? ` <button class="route-pill" type="button" onclick="(${clearRouteFilter.toString()})()">Clear route filter</button>` : ""}
        </div>`;
      return;
    }

    // Set view pill text if your UI has it
    try {
      const pill = document.getElementById("dogsCurrentViewPill");
      if (pill) pill.textContent = rf ? `${window.dogsViewMode || "All"} • Route: ${rf}` : (window.dogsViewMode || "All");
    } catch {}

    container.innerHTML = list.map((d) => {
      const photo = (d.photoDataUrl || "").trim();
      const route = getDogRoute(d, routeKey);

      const thumbHtml = photo
        ? `<img class="dog-thumb" src="${esc(photo)}" alt="Photo of ${esc(d.callName || "dog")}" />`
        : `<div class="dog-thumb placeholder" aria-label="No photo"></div>`;

      const routeHtml = route
        ? `<button class="route-pill" type="button"
              onclick="event.stopPropagation(); (${openRoute.toString()})(${JSON.stringify(route)})"
              title="Filter by route: ${esc(route)}">${esc(route)}</button>`
        : `<span class="route-pill is-empty" title="No route set">No route</span>`;

      return `
        <div class="timeline-item dog-row" onclick="(${openDog.toString()})('${esc(d.dogId)}')">
          <div class="dog-row-left">${thumbHtml}</div>
          <div class="dog-row-mid">
            <div class="dog-row-title">
              <strong>${esc(d.callName || "")}</strong>
              <span class="muted small">${d.breed ? `• ${esc(d.breed)}` : ""}</span>
            </div>
            <div class="muted small">
              Breed: ${esc(d.breed || "")} • Sex: ${esc(d.sex || "unknown")} • Status: ${esc(d.status || "Adult")}
            </div>
          </div>
          <div class="dog-row-right">${routeHtml}</div>
        </div>
      `;
    }).join("");
  };

  const install = () => {
    // Install renderDogs override
    window.__origRenderDogs = window.renderDogs;
    window.renderDogs = patchedRenderDogs;

    bindViewAllDogsButton();
    setInterval(bindViewAllDogsButton, 800);

    // Re-render immediately if Dogs view already visible
    try { patchedRenderDogs(); } catch {}
  };

  // Wait until DOM is ready, then install. Also install even if existing scripts define later.
  document.addEventListener("DOMContentLoaded", () => {
    install();
    // Re-install after a bit to win load-order races with inline scripts
    setTimeout(install, 500);
    setTimeout(install, 1500);
  });
})();
