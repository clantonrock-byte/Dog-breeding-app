/**
 * dog_status_heat_unify_patch.js
 *
 * Fixes two pain points:
 * 1) Status not sticking (Puppy/Adult) because users may not be changing the hidden <select id="dogStatus">.
 *    - Adds explicit "Set Puppy" / "Set Adult" buttons inside the Status section.
 *    - Keeps dogStatus select + dogStatusPill in sync so saveDog() persists correctly.
 *
 * 2) Heat not sticking when using Save & Done.
 *    - Wraps window.saveDog(exitAfter) to also persist per-dog heat fields if present:
 *      - #chkInHeat, #heatStart, #heatNotes -> dog.inHeat, dog.heatStartISO, dog.heatNotes
 *
 * Requires:
 * - Root app defines global saveDog() (it does in your index.html build)
 * - Dog store key: breederPro_dogs_store_v3
 *
 * Install: load AFTER dogs.bundle.js and AFTER dogs_heat_cycle_per_dog.js (safe anywhere after those).
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

  function currentDogId() {
    return window.currentDogId || "";
  }

  function updateHeatOnCurrentDog() {
    const dogId = currentDogId();
    if (!dogId) return;

    const chk = $("chkInHeat");
    const start = $("heatStart");
    const notes = $("heatNotes");

    // Only run if heat UI exists on page
    if (!chk && !start && !notes) return;

    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d.dogId === dogId);
    if (idx < 0) return;

    const dog = store.dogs[idx] || {};
    dog.inHeat = chk ? !!chk.checked : !!dog.inHeat;

    const startStr = start ? String(start.value || "").trim() : "";
    dog.heatStartISO = startStr ? new Date(startStr + "T00:00:00").toISOString() : (dog.heatStartISO || "");

    dog.heatNotes = notes ? String(notes.value || "").trim() : (dog.heatNotes || "");

    store.dogs[idx] = dog;
    saveStore(store);
  }

  // ----- Status UI helpers -----
  function setStatus(value) {
    const sel = $("dogStatus");
    const pill = $("dogStatusPill");
    if (sel) sel.value = value;
    if (pill) pill.textContent = value;
  }

  function ensureStatusButtons() {
    const sec = $("secStatus");
    if (!sec || $("bpStatusButtons")) return;

    const wrap = document.createElement("div");
    wrap.id = "bpStatusButtons";
    wrap.className = "row";
    wrap.style.marginTop = "10px";

    const btnP = document.createElement("button");
    btnP.type = "button";
    btnP.className = "btn";
    btnP.textContent = "Set Puppy";
    btnP.addEventListener("click", () => setStatus("Puppy"));

    const btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className = "btn";
    btnA.textContent = "Set Adult";
    btnA.addEventListener("click", () => setStatus("Adult"));

    wrap.appendChild(btnP);
    wrap.appendChild(btnA);

    // Insert near the status pill
    const pill = $("dogStatusPill");
    if (pill) pill.insertAdjacentElement("afterend", wrap);
    else sec.appendChild(wrap);
  }

  // ----- Wrap saveDog -----
  function wrapSaveDog() {
    const fn = window.saveDog;
    if (typeof fn !== "function" || fn._bpWrapped) return;

    window.saveDog = function (exitAfter) {
      // Before saving, ensure status select matches pill (if user tapped our buttons)
      try {
        const pill = $("dogStatusPill");
        const sel = $("dogStatus");
        if (pill && sel && pill.textContent && sel.value !== pill.textContent) {
          sel.value = pill.textContent;
        }
      } catch {}

      // Call original save
      const res = fn.apply(this, arguments);

      // After original save, also persist heat fields to dog store
      try { updateHeatOnCurrentDog(); } catch {}

      return res;
    };

    window.saveDog._bpWrapped = true;
  }

  function install() {
    ensureStatusButtons();
    wrapSaveDog();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpStatusHeatWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(install, 0);
    };

    window.__afterShow._bpStatusHeatWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    install();
    setInterval(install, 1200);
  });
})();
