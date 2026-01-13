/**
 * profile_save_and_autofill_fix.js
 *
 * Fixes two issues:
 * 1) Chrome password manager popping up when adding notes
 *    - Sets autocomplete attributes on "notes" inputs
 *    - Sets autocomplete="off" on any profile form/dialog if found
 *
 * 2) Status (Puppy/Adult) + Heat not sticking
 *    - On any Save click in Dog Profile, force-persist:
 *        dog.status from #dogStatusPill / #dogStatus
 *        dog.inHeat / dog.heatStartISO / dog.heatNotes from heat inputs
 *      into breederPro_dogs_store_v3 for the currentDogId
 *    - Runs BEFORE and AFTER original save handler (belt + suspenders).
 *
 * Install: load after dogs.bundle.js and after dog_profile_polish_patch_v2.js
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

  function getDogId() {
    return String(window.currentDogId || "").trim();
  }

  function readStatus() {
    const pill = $("dogStatusPill");
    const pillText = pill ? (pill.textContent || "").trim() : "";
    if (pillText) return pillText;

    const sel = $("dogStatus");
    const selVal = sel ? String(sel.value || "").trim() : "";
    if (selVal) return selVal;

    return "";
  }

  function syncStatusSelect() {
    const pill = $("dogStatusPill");
    const sel = $("dogStatus");
    if (!pill || !sel) return;
    const t = (pill.textContent || "").trim();
    if (t && sel.value !== t) sel.value = t;
  }

  function readHeat() {
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

  function forcePersist() {
    const dogId = getDogId();
    if (!dogId) return;

    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d && d.dogId === dogId);
    if (idx < 0) return;

    const dog = store.dogs[idx] || {};

    const status = readStatus();
    if (status) dog.status = status;

    const heat = readHeat();
    if (heat) {
      dog.inHeat = !!heat.inHeat;
      dog.heatNotes = heat.notesStr || "";
      if (heat.startStr) dog.heatStartISO = new Date(heat.startStr + "T00:00:00").toISOString();
    }

    store.dogs[idx] = dog;
    saveStore(store);
  }

  // ---- Autofill / password manager suppression ----
  function suppressPasswordManagerInProfile() {
    const profile = $("viewDogProfile");
    if (!profile) return;

    // Mark any form elements in profile as non-autofill
    profile.querySelectorAll("form").forEach((f) => {
      f.setAttribute("autocomplete", "off");
    });

    // Target note-like inputs and prevent password suggestions
    const noteInputs = Array.from(profile.querySelectorAll("input, textarea"))
      .filter((el) => {
        const id = (el.id || "").toLowerCase();
        const name = (el.getAttribute("name") || "").toLowerCase();
        const ph = (el.getAttribute("placeholder") || "").toLowerCase();
        return id.includes("note") || name.includes("note") || ph.includes("note");
      });

    noteInputs.forEach((el) => {
      // Use both patterns; Chrome tends to respect one of them.
      el.setAttribute("autocomplete", "off");
      el.setAttribute("autocomplete", "new-password");
      el.setAttribute("autocapitalize", "sentences");
      el.setAttribute("autocorrect", "on");
      el.setAttribute("spellcheck", "true");
      // Avoid any confusing name that triggers password manager
      if (!el.getAttribute("name")) el.setAttribute("name", "notes");
      if ((el.getAttribute("name") || "").toLowerCase().includes("pass")) el.setAttribute("name", "notes");
      if (el.tagName.toLowerCase() === "input" && !el.getAttribute("type")) el.setAttribute("type", "text");
    });
  }

  function bindSaveClicks() {
    const profile = $("viewDogProfile");
    if (!profile || profile._bpBoundSaveFix) return;

    profile.addEventListener(
      "click",
      (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn) return;
        const id = (btn.id || "").toLowerCase();
        const text = (btn.textContent || "").toLowerCase();

        const isSave = id.includes("save") || text.includes("save");
        if (!isSave) return;

        // Before original handler
        try { syncStatusSelect(); } catch {}
        try { forcePersist(); } catch {}

        // After original handler
        setTimeout(() => {
          try { syncStatusSelect(); } catch {}
          try { forcePersist(); } catch {}
        }, 80);
      },
      true
    );

    profile._bpBoundSaveFix = true;
  }

  function apply() {
    suppressPasswordManagerInProfile();
    bindSaveClicks();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpProfileSaveAutofillWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };

    window.__afterShow._bpProfileSaveAutofillWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1200);
  });
})();
