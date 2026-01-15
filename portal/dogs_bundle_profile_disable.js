/**
 * portal/dogs_bundle_profile_disable.js
 *
 * Purpose
 * - Keep portal/dogs.bundle.js for the Dogs list and navigation,
 *   BUT prevent it from driving the Dog Profile UI (which causes "flick-off"/resets).
 *
 * How it works
 * - Overrides renderDogProfile() to NOT write legacy UI.
 * - Overrides __openDog(id) to:
 *    1) set window.currentDogId
 *    2) update the DogProfile title (h2) for the rebuild fallback id resolver
 *    3) navigate to DogProfile without calling legacy renderers
 *
 * Install
 * - Load AFTER portal/dogs.bundle.js
 * - Load BEFORE your dog_profile_rebuild_v3_5.js (or whichever rebuild owns the profile)
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

  function findDogById(dogId) {
    const store = loadDogsStore();
    return store.dogs.find((d) => d && String(d.dogId) === String(dogId)) || null;
  }

  function setProfileTitleFromDog(dog) {
    const profile = document.getElementById("viewDogProfile");
    if (!profile) return;
    const h2 = profile.querySelector("h2") || profile.querySelector("h3");
    if (!h2) return;
    const title = (dog && (dog.callName || dog.registeredName)) ? (dog.callName || dog.registeredName) : (h2.textContent || "");
    h2.textContent = String(title || "").trim() || h2.textContent;
  }

  // 1) Neutralize legacy renderer if present
  try {
    if (typeof window.renderDogProfile === "function" && !window.renderDogProfile._bpDisabled) {
      const _legacy = window.renderDogProfile;
      window.renderDogProfile = function (dog) {
        try {
          if (dog && dog.dogId) window.currentDogId = dog.dogId;
          setProfileTitleFromDog(dog);
        } catch {}
        // Do NOT call legacy renderer; rebuilt profile owns UI.
        return;
      };
      window.renderDogProfile._bpDisabled = true;
      window.renderDogProfile._bpLegacy = _legacy;
    }
  } catch {}

  // 2) Override __openDog to avoid legacy profile setup
  try {
    if (typeof window.__openDog === "function" && !window.__openDog._bpDisabled) {
      const _open = window.__openDog;

      window.__openDog = function (dogId) {
        try {
          window.currentDogId = dogId;
          const dog = findDogById(dogId);
          setProfileTitleFromDog(dog);
        } catch {}

        try {
          if (typeof window.__go === "function") window.__go("DogProfile");
        } catch {}

        // Call afterShow hook so rebuild scripts run immediately.
        try {
          if (typeof window.__afterShow === "function") window.__afterShow("DogProfile");
        } catch {}

        return;
      };

      window.__openDog._bpDisabled = true;
      window.__openDog._bpLegacy = _open;
    }
  } catch {}

  // 3) Belt-and-suspenders: prevent stray legacy buttons from doing anything if they exist
  try {
    ["btnDoneDog", "btnNotesDog", "btnMoreDog"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        clone.style.display = "none";
      }
    });
  } catch {}
})();
