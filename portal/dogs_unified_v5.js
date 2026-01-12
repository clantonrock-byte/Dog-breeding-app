/**
 * dogs_unified_v5.js
 *
 * Fix: if the compiled app re-renders the legacy Dogs list (with "Open" buttons),
 * this patch re-renders AFTER the Dogs view is shown, so the unified UI "wins".
 *
 * Load this script LAST among dog scripts.
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

  function openDogById(dogId) {
    try {
      if (typeof window.__openDog === "function") return window.__openDog(dogId);
      if (typeof window._openDog === "function") return window._openDog(dogId);
      if (typeof window.openDog === "function") return window.openDog(dogId);
    } catch (_) {}
  }

  function setMode(mode) {
    window.dogsViewMode = mode;
    renderDogs();
  }

  function setPill(mode) {
    try {
      const pill = document.getElementById("dogsCurrentViewPill");
      if (pill) pill.textContent = mode === "Unassigned" ? "Needs sex set" : mode;
    } catch (_) {}
    try {
      const hint = document.getElementById("dogsSortHint");
      if (hint) hint.textContent = (mode === "Males" || mode === "Females") ? " • intact first, altered after" : "";
    } catch (_) {}
  }

  function renderDogs() {
    const listEl = document.getElementById("dogsList");
    if (!listEl) return;

    const store = loadDogs();
    const all = (store.dogs || []).map(ensureDog);
    const mode = String(window.dogsViewMode || "All");

    let list = all.filter((d) => !d.archived);
    if (mode === "Males") list = list.filter((d) => sexCategory(d.sex) === "male");
    if (mode === "Females") list = list.filter((d) => sexCategory(d.sex) === "female");
    if (mode === "Unassigned") list = list.filter((d) => sexCategory(d.sex) === "unknown");

    list.sort(sortDogsIntactFirst);

    // hide legacy unassigned panel so it's a true filter
    try { document.getElementById("dogsUnassignedWrap")?.classList?.add("hide"); } catch (_) {}

    setPill(mode);
    try { document.getElementById("dogsListMeta").textContent = `Dogs shown: ${list.length}`; } catch (_) {}

    listEl.innerHTML = list.length ? list.map((d) => {
      const photo = (d.photoDataUrl || "").trim();
      const thumb = photo
        ? `<img class="dog-thumb" src="${esc(photo)}" alt="Dog photo" />`
        : `<div class="dog-thumb placeholder" aria-label="No photo"></div>`;

      const sex = d.sex || "(unknown)";
      const status = d.status || "Adult";
      const altered = sexCategory(d.sex) === "unknown" ? "" : (isAltered(d.sex) ? "Altered" : "Intact");

      return `
        <div class="timeline-item dog-card" data-dog-id="${esc(d.dogId)}" role="button" tabindex="0">
          <div class="dog-card-left">${thumb}</div>
          <div class="dog-card-mid">
            <div class="dog-card-title">${esc(d.callName || "")}</div>
            <div class="muted small">
              ${d.breed ? `Breed: ${esc(d.breed)} • ` : ""}
              Sex: ${esc(sex)}${altered ? ` (${altered.toLowerCase()})` : ""} • Status: ${esc(status)}
            </div>
          </div>
          <div class="dog-card-right" aria-hidden="true">›</div>
        </div>
      `;
    }).join("") : `<div class="muted small">No dogs found in this view.</div>`;
  }

  function bindRowClicks() {
    const el = document.getElementById("dogsList");
    if (!el || el._ccBoundRows) return;
    el.addEventListener("click", (e) => {
      const card = e.target.closest && e.target.closest(".dog-card");
      const id = card?.getAttribute("data-dog-id");
      if (id) openDogById(id);
    });
    el._ccBoundRows = true;
  }

  function bindButtons() {
    const cap = (id, fn) => {
      const b = document.getElementById(id);
      if (!b || b._ccBound) return;
      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        fn();
      }, true);
      b._ccBound = true;
    };
    cap("btnViewAllDogs", () => setMode("All"));
    cap("btnViewMales", () => setMode("Males"));
    cap("btnViewFemales", () => setMode("Females"));
    cap("btnShowUnassigned", () => setMode("Unassigned"));
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._ccDogV5) return;
    window.__afterShow = function(view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}
      if (view === "Dogs") {
        setTimeout(() => {
          bindButtons();
          bindRowClicks();
          renderDogs();
        }, 0);
      }
    };
    window.__afterShow._ccDogV5 = true;
  }

  function install() {
    window.dogsViewMode = window.dogsViewMode || "All";
    bindButtons();
    bindRowClicks();
    hookAfterShow();
    setTimeout(renderDogs, 0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
