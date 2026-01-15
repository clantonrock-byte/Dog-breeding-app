/**
 * dogs_list_thumb_rowclick_patch_v2.js
 *
 * Fixes two things:
 * 1) Thumbnail sometimes becomes "full image" if CSS isn't applied yet.
 *    - We apply inline sizing on the thumbnail button + img as a fallback.
 * 2) Row click (tap anywhere) opens profile without interfering with buttons.
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
    const oc = el.getAttribute("onclick") || "";
    const m = oc.match(/__openDog\\(['"]([^'"]+)['"]\\)/);
    return m ? m[1] : "";
  }

  function makeThumbButton(dogId, imgUrl) {
    const btn = document.createElement("button");
    btn.className = "dog-thumb-btn";
    btn.type = "button";

    // Inline fallback sizing (in case CSS didn't load yet)
    btn.style.width = "64px";
    btn.style.height = "64px";
    btn.style.borderRadius = "12px";
    btn.style.overflow = "hidden";
    btn.style.flex = "0 0 auto";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";

    const img = document.createElement("img");
    img.alt = "";
    img.src = imgUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";

    btn.appendChild(img);

    btn.addEventListener("click", () => {
      try { if (typeof window.__openDog === "function") window.__openDog(dogId); } catch {}
    });

    return btn;
  }

  function enhanceList(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const photoMap = getPhotoById();

    root.querySelectorAll(".timeline-item").forEach((card) => {
      const dogId = card.getAttribute("data-dog-id") || parseDogIdFromOnclick(card);
      if (!dogId) return;

      card.setAttribute("data-dog-id", dogId);
      card.style.cursor = "pointer";

      if (!card._bpRowClick) {
        card.addEventListener("click", (e) => {
          const t = e.target;
          if (t && (t.closest("button") || t.closest("input") || t.closest("select") || t.closest("textarea"))) return;
          try { if (typeof window.__openDog === "function") window.__openDog(dogId); } catch {}
        });
        card._bpRowClick = true;
      }

      if (!card.querySelector(".dog-thumb-btn") && photoMap.has(String(dogId))) {
        const btn = makeThumbButton(dogId, photoMap.get(String(dogId)));
        const strong = card.querySelector("strong");
        if (strong) strong.insertAdjacentElement("beforebegin", btn);
        else card.prepend(btn);
      }
    });
  }

  function wrapRenderDogs() {
    if (typeof window.renderDogs !== "function" || window.renderDogs._bpWrappedThumbsV2) return false;

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
    window.renderDogs._bpWrappedThumbsV2 = true;
    window.renderDogs._bpLegacy = _legacy;

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
