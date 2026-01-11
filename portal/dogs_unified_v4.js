/**
 * dogs_unified_v4.js
 *
 * Fixes:
 * - Dog rows not opening profile (no click action)
 * - Archived styling must depend ONLY on d.archived === true
 *
 * Key change vs v3:
 * - NO inline onclick / function-toString injection (can break on some browsers/CSP)
 * - Uses data-dog-id + event delegation to open profile robustly
 *
 * Requires root index loads this script LAST.
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

  const sortByName = (a, b) =>
    String(a.callName || "").toLowerCase().localeCompare(String(b.callName || "").toLowerCase());

  function openDogById(dogId) {
    if (!dogId) return;
    try {
      if (typeof window.__openDog === "function") return window.__openDog(dogId);
      if (typeof window._openDog === "function") return window._openDog(dogId);
      if (typeof window.openDog === "function") return window.openDog(dogId);
    } catch (_) {}
  }

  function setPillText(mode) {
    try {
      const pill = document.getElementById("dogsCurrentViewPill");
      if (pill) pill.textContent = mode === "Unassigned" ? "Needs sex set" : mode;
    } catch (_) {}

    try {
      const hint = document.getElementById("dogsSortHint");
      if (hint) hint.textContent = (mode === "Males" || mode === "Females") ? " • intact first, altered after" : "";
    } catch (_) {}
  }

  function setMeta(count) {
    try {
      const meta = document.getElementById("dogsListMeta");
      if (meta) meta.textContent = `Dogs shown: ${count}`;
    } catch (_) {}
  }

  function hideLegacyPanels() {
    try {
      const uw = document.getElementById("dogsUnassignedWrap");
      if (uw) uw.classList.add("hide");
    } catch (_) {}
  }

  function dogCardHtml(d) {
    const archived = d.archived === true; // ONLY source of truth
    const photo = (d.photoDataUrl || "").trim();
    const thumb = photo
      ? `<img class="dog-thumb" src="${esc(photo)}" alt="Dog photo" />`
      : `<div class="dog-thumb placeholder" aria-label="No photo"></div>`;

    const sex = d.sex || "(unknown)";
    const status = d.status || "Adult";
    const altered =
      sexCategory(d.sex) === "unknown" ? "" : (isAltered(d.sex) ? "Altered" : "Intact");

    return `
      <div class="timeline-item dog-card ${archived ? "is-archived" : ""}"
           role="button" tabindex="0" data-dog-id="${esc(d.dogId)}">
        <div class="dog-card-left">${thumb}</div>
        <div class="dog-card-mid">
          <div class="dog-card-title">${esc(d.callName || "")}</div>
          ${archived ? `<div class="archived-badge">ARCHIVED</div>` : ``}
          <div class="muted small">
            ${d.breed ? `Breed: ${esc(d.breed)} • ` : ""}
            Sex: ${esc(sex)}${altered ? ` (${altered.toLowerCase()})` : ""} • Status: ${esc(status)}
          </div>
          ${archived && d.archivedAt ? `<div class="muted small">Archived at: ${esc(new Date(d.archivedAt).toLocaleString())}</div>` : ``}
        </div>
        <div class="dog-card-right" aria-hidden="true">›</div>
      </div>
    `;
  }

  function renderActive(allDogs) {
    const listEl = document.getElementById("dogsList");
    if (!listEl) return;

    let list = allDogs.filter((d) => !d.archived);

    const mode = String(window.dogsViewMode || "All");
    if (mode === "Males") list = list.filter((d) => sexCategory(d.sex) === "male");
    if (mode === "Females") list = list.filter((d) => sexCategory(d.sex) === "female");
    if (mode === "Unassigned") list = list.filter((d) => sexCategory(d.sex) === "unknown");

    list.sort(sortDogsIntactFirst);

    hideLegacyPanels();
    setPillText(mode);
    setMeta(list.length);

    listEl.innerHTML = list.length
      ? list.map(dogCardHtml).join("")
      : `<div class="muted small">No dogs found in this view.</div>`;
  }

  function renderArchived(allDogs) {
    const wrap = document.getElementById("dogsArchivedWrap");
    if (!wrap || wrap.classList.contains("hide")) return;

    const meta = document.getElementById("dogsArchivedMeta");
    const listEl = document.getElementById("dogsArchivedList");
    if (!listEl) return;

    const archived = allDogs.filter((d) => d.archived).slice().sort(sortByName);
    if (meta) meta.textContent = `Archived dogs: ${archived.length}`;

    listEl.innerHTML = archived.length
      ? archived.map(dogCardHtml).join("")
      : `<div class="muted small">No archived dogs.</div>`;
  }

  function renderDogsUnified() {
    const store = loadDogs();
    const all = (store.dogs || []).map(ensureDog);

    renderActive(all);
    renderArchived(all);
  }

  function bindCapture(btn, fn) {
    if (!btn || btn._ccBoundUnified) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      fn();
    }, true);
    btn._ccBoundUnified = true;
  }

  function bindButtons() {
    bindCapture(document.getElementById("btnViewAllDogs"), () => {
      window.dogsViewMode = "All";
      renderDogsUnified();
    });
    bindCapture(document.getElementById("btnViewMales"), () => {
      window.dogsViewMode = "Males";
      renderDogsUnified();
    });
    bindCapture(document.getElementById("btnViewFemales"), () => {
      window.dogsViewMode = "Females";
      renderDogsUnified();
    });
    bindCapture(document.getElementById("btnShowUnassigned"), () => {
      window.dogsViewMode = "Unassigned";
      renderDogsUnified();
    });
    bindCapture(document.getElementById("btnToggleArchivedDogs"), () => {
      Promise.resolve().then(renderDogsUnified);
    });
  }

  function bindRowClicks() {
    const list = document.getElementById("dogsList");
    if (list && !list._ccDelegated) {
      list.addEventListener("click", (e) => {
        const card = e.target.closest && e.target.closest(".dog-card");
        const dogId = card ? card.getAttribute("data-dog-id") : "";
        if (dogId) openDogById(dogId);
      });
      list.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest && e.target.closest(".dog-card");
        const dogId = card ? card.getAttribute("data-dog-id") : "";
        if (dogId) {
          e.preventDefault();
          openDogById(dogId);
        }
      });
      list._ccDelegated = true;
    }

    const arch = document.getElementById("dogsArchivedList");
    if (arch && !arch._ccDelegated) {
      arch.addEventListener("click", (e) => {
        const card = e.target.closest && e.target.closest(".dog-card");
        const dogId = card ? card.getAttribute("data-dog-id") : "";
        if (dogId) openDogById(dogId);
      });
      arch._ccDelegated = true;
    }
  }

  function install() {
    window.dogsViewMode = window.dogsViewMode || "All";

    if (!window.__origRenderDogs && typeof window.renderDogs === "function") {
      window.__origRenderDogs = window.renderDogs;
    }

    window.renderDogs = renderDogsUnified;

    bindButtons();
    bindRowClicks();

    try { renderDogsUnified(); } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 300);
    setTimeout(install, 1000);
    setInterval(bindButtons, 1200);
    setInterval(bindRowClicks, 1200);
  });
})();
