/**
 * dog_force_persist_status_heat.js
 *
 * Force-persist Dog Profile fields that aren't sticking (Status + Heat) by writing
 * directly to breederPro_dogs_store_v3 after any save click on the profile.
 *
 * Install after dogs.bundle.js and dog_profile_polish_patch_v2.js
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

  function getCurrentDogId() {
    return String(window.currentDogId || "").trim();
  }

  function readStatusFromUI() {
    const pill = $("dogStatusPill");
    const pillText = pill ? (pill.textContent || "").trim() : "";
    if (pillText) return pillText;

    const sel = $("dogStatus");
    const selVal = sel ? String(sel.value || "").trim() : "";
    if (selVal) return selVal;

    const profile = $("viewDogProfile");
    if (profile) {
      const opts = ["Puppy", "Adult", "Junior", "Senior"];
      const found = Array.from(profile.querySelectorAll("*"))
        .map((el) => (el.textContent || "").trim())
        .find((t) => opts.includes(t));
      if (found) return found;
    }
    return "";
  }

  function readHeatFromUI() {
    const chk = $("chkInHeat");
    const start = $("heatStart");
    const notes = $("heatNotes");

    const hasAny = !!(chk || start || notes);
    if (!hasAny) return null;

    return {
      inHeat: chk ? !!chk.checked : false,
      startStr: start ? String(start.value || "").trim() : "",
      notesStr: notes ? String(notes.value || "").trim() : "",
    };
  }

  function applyToStore() {
    const dogId = getCurrentDogId();
    if (!dogId) return;

    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d && d.dogId === dogId);
    if (idx < 0) return;

    const dog = store.dogs[idx] || {};

    const status = readStatusFromUI();
    if (status) dog.status = status;

    const heat = readHeatFromUI();
    if (heat) {
      dog.inHeat = !!heat.inHeat;
      dog.heatNotes = heat.notesStr || "";
      if (heat.startStr) dog.heatStartISO = new Date(heat.startStr + "T00:00:00").toISOString();
    }

    store.dogs[idx] = dog;
    saveStore(store);
  }

  function bindSaveClicks() {
    const profile = $("viewDogProfile");
    if (!profile || profile._bpForcePersistBound) return;

    profile.addEventListener(
      "click",
      (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn) return;
        const text = (btn.textContent || "").toLowerCase();
        const id = (btn.id || "").toLowerCase();

        const isSave =
          id.includes("save") ||
          text.includes("save");

        if (!isSave) return;

        // Let normal handler run first, then force persist.
        setTimeout(() => {
          try { applyToStore(); } catch {}
        }, 50);
      },
      true
    );

    profile._bpForcePersistBound = true;
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpForcePersistWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(bindSaveClicks, 0);
    };
    window.__afterShow._bpForcePersistWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    setTimeout(bindSaveClicks, 800);
    setInterval(bindSaveClicks, 1200);
  });
})();
