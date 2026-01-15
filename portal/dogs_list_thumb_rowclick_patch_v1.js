/**
 * dogs_list_thumb_rowclick_patch_v1.js
 *
 * Restores:
 * - Row click anywhere on a dog card (not just Open button)
 * - Thumbnail on dog list cards when photoDataUrl exists
 *
 * Works by wrapping renderDogs() and post-processing its generated HTML.
 *
 * Requires dogs.bundle.js to be loaded.
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";

  function loadDogsStore() {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      if (!Array.isArray(o.dogs)) o.dogs = [];
      return o;
    } catch {
      return { dogs: [] };
    }
  }

  function getPhotoById() {
    const store = loadDogsStore();
    const m = new Map();
    for (const d of store.dogs) {
      if (d && d.dogId && typeof d.photoDataUrl === "string" && d.photoDataUrl) {
        m.set(String(d.dogId), d.photoDataUrl);
      }
    }
    return m;
  }

  function parseDogIdFromOnclick(el) {
    // cards often have onclick="__openDog('dog_...')"
    const oc = el.getAttribute("onclick") || "";
    const m = oc.match(/__openDog\\(['"]([^'"]+)['"]\\)/);
    return m ? m[1] : "";
  }

  function enhanceList(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const photoMap = getPhotoById();

    // Add click handler to each card
    root.querySelectorAll(".timeline-item").forEach((card) => {
      const dogId = card.getAttribute("data-dog-id") || parseDogIdFromOnclick(card);
      if (!dogId) return;

      card.setAttribute("data-dog-id", dogId);
      card.style.cursor = "pointer";

      if (!card._bpRowClick) {
        card.addEventListener("click", (e) => {
          // ignore clicks on actual buttons/inputs
          const t = e.target;
          if (t && (t.closest("button") || t.closest("input") || t.closest("select") || t.closest("textarea"))) return;
          try { if (typeof window.__openDog === "function") window.__openDog(dogId); } catch {}
        });
        card._bpRowClick = true;
      }

      // Insert thumbnail if missing and photo exists
      if (!card.querySelector(".dog-thumb-btn") && photoMap.has(String(dogId))) {
        const imgUrl = photoMap.get(String(dogId));
        const btn = document.createElement("button");
        btn.className = "dog-thumb-btn";
        btn.type = "button";
        btn.innerHTML = `<img alt="" src="${imgUrl}">`;
        btn.addEventListener("click", () => {
          try { if (typeof window.__openDog === "function") window.__openDog(dogId); } catch {}
        });

        // Insert before the first strong (call name), else prepend
        const strong = card.querySelector("strong");
        if (strong) strong.insertAdjacentElement("beforebegin", btn);
        else card.prepend(btn);
      }
    });
  }

  function wrapRenderDogs() {
    if (typeof window.renderDogs !== "function" || window.renderDogs._bpWrappedThumbs) return false;

    const _legacy = window.renderDogs;
    window.renderDogs = function () {
      const r = _legacy.apply(this, arguments);
      try {
        enhanceList("dogsList");
        enhanceList("dogsArchivedList");
        enhanceList("dogsUnassignedList");
      } catch {}
      return r;
    };
    window.renderDogs._bpWrappedThumbs = true;
    window.renderDogs._bpLegacy = _legacy;

    // run once if list already rendered
    try { window.renderDogs(); } catch {}
    return true;
  }

  function start() {
    const t = setInterval(() => {
      if (wrapRenderDogs()) clearInterval(t);
    }, 500);
  }

  document.addEventListener("DOMContentLoaded", start);
})();
