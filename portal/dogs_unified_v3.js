
// dogs_unified_v3.js
// Same logic as v3; archived emphasis handled via CSS (strong badge)

// NOTE: This file is identical to dogs_unified_v3.js logic-wise.
// You only need this if you haven't already installed v3.
// If v3 is already installed, you may replace ONLY the CSS file.

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

  function dogCardHtml(d,d.archived===true) {
    const photo = (d.photoDataUrl || "").trim();
    const thumb = photo
      ? `<img class="dog-thumb" src="${esc(photo)}" />`
      : `<div class="dog-thumb placeholder"></div>`;

    const sex = d.sex || "(unknown)";
    const status = d.status || "Adult";
    const altered =
      sexCategory(d.sex) === "unknown" ? "" : (isAltered(d.sex) ? "Altered" : "Intact");

    return `
      <div class="timeline-item dog-card ${archived ? "is-archived" : ""}"
           onclick="(${openDog.toString()})('${esc(d.dogId)}')">
        <div class="dog-card-left">${thumb}</div>
        <div class="dog-card-mid">
          <div class="dog-card-title">${esc(d.callName || "")}</div>
          ${archived ? `<div class="archived-badge">ARCHIVED</div>` : ``}
          <div class="muted small">
            ${d.breed ? `Breed: ${esc(d.breed)} • ` : ""}
            Sex: ${esc(sex)}${altered ? ` (${altered.toLowerCase()})` : ""} • Status: ${esc(status)}
          </div>
          ${archived && d.archivedAt ? `<div class="muted small">Archived at: ${new Date(d.archivedAt).toLocaleString()}</div>` : ``}
        </div>
        <div class="dog-card-right">›</div>
      </div>
    `;
  }

  function renderDogsUnified() {
    const store = loadDogs();
    const all = (store.dogs || []).map(ensureDog);

    const active = all.filter((d) => !d.archived);
    const archived = all.filter((d) => d.archived).sort(sortByName);

    const mode = String(window.dogsViewMode || "All");

    let list = active;
    if (mode === "Males") list = active.filter((d) => sexCategory(d.sex) === "male");
    if (mode === "Females") list = active.filter((d) => sexCategory(d.sex) === "female");
    if (mode === "Unassigned") list = active.filter((d) => sexCategory(d.sex) === "unknown");

    list.sort(sortDogsIntactFirst);

    const listEl = document.getElementById("dogsList");
    if (listEl) {
      listEl.innerHTML = list.length
        ? list.map((d) => dogCardHtml(d, false)).join("")
        : `<div class="muted small">No dogs found.</div>`;
    }

    const aw = document.getElementById("dogsArchivedWrap");
    const al = document.getElementById("dogsArchivedList");
    const am = document.getElementById("dogsArchivedMeta");

    if (aw && !aw.classList.contains("hide") && al) {
      if (am) am.textContent = `Archived dogs: ${archived.length}`;
      al.innerHTML = archived.length
        ? archived.map((d) => dogCardHtml(d, true)).join("")
        : `<div class="muted small">No archived dogs.</div>`;
    }
  }

  function bind(btn, fn) {
    if (!btn || btn._boundStrong) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    }, true);
    btn._boundStrong = true;
  }

  function bindButtons() {
    bind(document.getElementById("btnViewAllDogs"), () => { window.dogsViewMode = "All"; renderDogsUnified(); });
    bind(document.getElementById("btnViewMales"), () => { window.dogsViewMode = "Males"; renderDogsUnified(); });
    bind(document.getElementById("btnViewFemales"), () => { window.dogsViewMode = "Females"; renderDogsUnified(); });
    bind(document.getElementById("btnShowUnassigned"), () => { window.dogsViewMode = "Unassigned"; renderDogsUnified(); });
    bind(document.getElementById("btnToggleArchivedDogs"), () => { Promise.resolve().then(renderDogsUnified); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindButtons();
    renderDogsUnified();
  });
})();
