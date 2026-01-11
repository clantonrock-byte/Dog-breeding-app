
/**
 * dogs_unified_v3.js
 *
 * Extends dogs_unified_v2:
 * - Applies same polished card layout to Archived dogs list as well
 * - Keeps All/Males/Females/Needs sex set filters working on ACTIVE dogs list
 *
 * Notes:
 * - Archived list ignores dogsViewMode and always shows archived dogs
 * - Archived section is only rendered when #dogsArchivedWrap is visible
 *
 * Assumes this script is loaded LAST in root index.html.
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

  const openDog = (dogId) => {
    if (!dogId) return;
    try {
      if (typeof window.__openDog === "function") return window.__openDog(dogId);
      if (typeof window._openDog === "function") return window._openDog(dogId);
      if (typeof window.openDog === "function") return window.openDog(dogId);
    } catch (_) {}
  };

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
    // Make "Needs sex set" a real filter mode instead of separate panel.
    try {
      const uw = document.getElementById("dogsUnassignedWrap");
      if (uw) uw.classList.add("hide");
    } catch (_) {}
  }

  function dogCardHtml(d, { archived = false } = {}) {
    const photo = (d.photoDataUrl || "").trim();
    const thumb = photo
      ? `<img class="dog-thumb" src="${esc(photo)}" alt="Photo of ${esc(d.callName || "dog")}" />`
      : `<div class="dog-thumb placeholder" aria-label="No photo"></div>`;

    const sex = d.sex || "(unknown)";
    const status = d.status || "Adult";
    const altered = sexCategory(d.sex) === "unknown" ? "" : (isAltered(d.sex) ? "Altered" : "Intact");
    const archivedLabel = archived ? `<div class="muted small dog-archived-line">Archived</div>` : "";

    return `
      <div class="timeline-item dog-card ${archived ? "is-archived" : ""}" role="button" tabindex="0"
           onclick="(${openDog.toString()})('${esc(d.dogId)}')">
        <div class="dog-card-left">${thumb}</div>
        <div class="dog-card-mid">
          <div class="dog-card-title">${esc(d.callName || "")}</div>
          ${archivedLabel}
          <div class="muted small">
            ${d.breed ? `Breed: ${esc(d.breed)} • ` : ""}
            Sex: ${esc(sex)}${altered ? ` (${esc(altered.toLowerCase())})` : ""} • Status: ${esc(status)}
          </div>
          ${d.archivedAt ? `<div class="muted small">Archived at: ${esc(new Date(d.archivedAt).toLocaleString())}</div>` : ""}
        </div>
        <div class="dog-card-right" aria-hidden="true">›</div>
      </div>
    `;
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
      ? archived.map((d) => dogCardHtml(d, { archived: true })).join("")
      : `<div class="muted small">No archived dogs.</div>`;
  }

  function renderActive(allDogs) {
    const container = document.getElementById("dogsList");
    if (!container) return;

    let list = allDogs.filter((d) => !d.archived);

    const mode = String(window.dogsViewMode || "All");

    if (mode === "Males") list = list.filter((d) => sexCategory(d.sex) === "male");
    if (mode === "Females") list = list.filter((d) => sexCategory(d.sex) === "female");
    if (mode === "Unassigned") list = list.filter((d) => sexCategory(d.sex) === "unknown");

    list.sort(sortDogsIntactFirst);

    hideLegacyPanels();
    setPillText(mode);
    setMeta(list.length);

    container.innerHTML = list.length
      ? list.map((d) => dogCardHtml(d, { archived: false })).join("")
      : `<div class="muted small">No dogs found in this view.</div>`;
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

    // When "Show archived" toggles visibility, re-render archived list immediately.
    bindCapture(document.getElementById("btnToggleArchivedDogs"), () => {
      // Let existing handler toggle the wrap (we don't know your exact behavior),
      // but render right after in a microtask so the DOM reflects the new state.
      Promise.resolve().then(renderDogsUnified);
    });
  }

  function install() {
    window.dogsViewMode = window.dogsViewMode || "All";

    if (!window.__origRenderDogs && typeof window.renderDogs === "function") {
      window.__origRenderDogs = window.renderDogs;
    }

    window.renderDogs = renderDogsUnified;

    bindButtons();

    try { renderDogsUnified(); } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 300);
    setTimeout(install, 1000);
    setInterval(bindButtons, 1200);
  });
})();
