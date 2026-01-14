/**
 * dog_lifestage_promote_patch.js
 *
 * Makes Life-stage status non-redundant:
 * - Hides the Status <select> once a status is set.
 * - If current status is "Puppy", shows ONE-way button: "Promote to Adult".
 * - If status is "Adult" (or anything else), hides the selector entirely (display-only pill).
 *
 * This matches your rule:
 * - Puppy -> Adult allowed
 * - Adult -> Puppy not allowed
 * - Ongoing "business" changes happen in Disposition (For sale / Transferred / Deceased)
 *
 * Works with your existing UI IDs:
 * - #secStatus, #dogStatus (select), #dogStatusPill (pill)
 *
 * Install: load after dogs.bundle.js
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const $ = (id) => document.getElementById(id);

  function loadStore() {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      if (!Array.isArray(o.dogs)) o.dogs = [];
      return o;
    } catch {
      return { dogs: [] };
    }
  }

  function saveStore(o) {
    localStorage.setItem(DOG_KEY, JSON.stringify(o));
  }

  function currentDog() {
    const id = String(window.currentDogId || "").trim();
    if (!id) return null;
    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d && d.dogId === id);
    if (idx < 0) return null;
    return { store, idx, dog: store.dogs[idx] || {} };
  }

  function hideStatusSelect() {
    const sel = $("dogStatus");
    if (!sel) return;
    sel.classList.add("hide");
    sel.disabled = true;
    const lbl = sel.previousElementSibling;
    if (lbl && lbl.tagName.toLowerCase() === "label") lbl.classList.add("hide");
  }

  function syncPillAndSelect(value) {
    const pill = $("dogStatusPill");
    const sel = $("dogStatus");
    if (pill) pill.textContent = value;
    if (sel) sel.value = value;
  }

  function ensurePromoteButton() {
    const sec = $("secStatus");
    if (!sec) return;

    let btn = $("bpPromoteAdult");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "bpPromoteAdult";
      btn.type = "button";
      btn.className = "btn primary bp-promote";
      btn.textContent = "Promote to Adult";
      btn.addEventListener("click", () => {
        const ctx = currentDog();
        if (!ctx) return;

        ctx.dog.status = "Adult";
        syncPillAndSelect("Adult");

        ctx.store.dogs[ctx.idx] = ctx.dog;
        saveStore(ctx.store);

        // Let existing renderers update UI
        try { if (typeof window.renderDogProfile === "function") window.renderDogProfile(ctx.dog); } catch {}
      });
      sec.appendChild(btn);
    }
    return btn;
  }

  function apply() {
    const ctx = currentDog();
    if (!ctx) return;

    const status = String(ctx.dog.status || "").trim() || "Puppy";
    syncPillAndSelect(status);

    // Always remove redundant quick buttons row if present
    const helper = $("bpStatusButtons");
    if (helper) helper.classList.add("hide");

    // Show promote button only when Puppy
    const btn = ensurePromoteButton();
    if (btn) btn.classList.toggle("hide", status.toLowerCase() !== "puppy");

    // Hide selector once status is not Puppy
    if (status.toLowerCase() !== "puppy") hideStatusSelect();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpLifeStageWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };
    window.__afterShow._bpLifeStageWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1200);
  });
})();
