(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const $ = (id) => document.getElementById(id);

  function loadDogs() {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      return Array.isArray(o.dogs) ? o.dogs : [];
    } catch {
      return [];
    }
  }

  function currentDog() {
    const id = String(window.currentDogId || "").trim();
    if (!id) return null;
    return loadDogs().find((d) => d && d.dogId === id) || null;
  }

  function lockStatusIfAdult() {
    const dog = currentDog();
    if (!dog) return;

    const status = String(dog.status || "").trim();
    const isLocked = !!status && status.toLowerCase() !== "puppy";

    const helper = $("bpStatusButtons");
    if (helper) helper.classList.toggle("hide", isLocked);

    const sel = $("dogStatus");
    if (sel) {
      sel.disabled = isLocked;
      sel.classList.toggle("bp-locked", isLocked);
    }

    const pill = $("dogStatusPill");
    if (pill) pill.classList.toggle("bp-locked", isLocked);
  }

  function hideHeatNotes() {
    const notes = $("heatNotes");
    if (!notes) return;

    notes.classList.add("hide");

    const lbl = notes.previousElementSibling;
    if (lbl && lbl.tagName.toLowerCase() === "label") lbl.classList.add("hide");

    const row = notes.closest(".row");
    if (row && row.querySelectorAll("input,textarea").length === 1) row.classList.add("hide");
  }

  function apply() {
    try { lockStatusIfAdult(); } catch {}
    try { hideHeatNotes(); } catch {}
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpDogCleanupWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };

    window.__afterShow._bpDogCleanupWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1200);
  });
})();
