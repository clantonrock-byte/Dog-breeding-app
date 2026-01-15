/**
 * dogs_bundle_profile_disable_v3.js
 *
 * Goal
 * - Keep portal/dogs.bundle.js for Dogs list + navigation.
 * - Prevent legacy profile logic from resetting state (heat/lifestage/etc).
 * - BUT still show the dog's photo in the profile header (photo block).
 *
 * Approach
 * - Wrap renderDogProfile(dog):
 *    - bind ONLY the photo block (#dogPhotoImg + placeholder) and "View photo" behavior
 *    - DO NOT render legacy fields / buttons
 *
 * Install order:
 *   dogs.bundle.js
 *   dogs_bundle_profile_disable_v3.js   <-- this
 *   dog_profile_rebuild_v3_5.js         (or current rebuild owner)
 */
(() => {
  "use strict";

  function bindPhotoOnly(dog) {
    try {
      const img = document.getElementById("dogPhotoImg");
      const ph = document.getElementById("dogPhotoPlaceholder");
      const btnView = document.getElementById("btnViewPhoto");

      const url = (dog && typeof dog.photoDataUrl === "string") ? dog.photoDataUrl : "";

      if (img) {
        if (url) {
          img.src = url;
          img.style.display = "block";
        } else {
          img.src = "";
          img.style.display = "none";
        }
      }
      if (ph) {
        ph.style.display = url ? "none" : "block";
      }
      if (btnView) {
        btnView.disabled = !url;
        btnView.onclick = () => {
          if (!url) return;
          try { window.open(url, "_blank"); } catch {}
        };
      }
    } catch {}
  }

  function hideLegacyButtons() {
    ["btnDoneDog", "btnNotesDog", "btnMoreDog"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "none";
      el.style.pointerEvents = "none";
    });
  }

  try {
    if (typeof window.renderDogProfile === "function" && !window.renderDogProfile._bpDisabledV3) {
      const _legacy = window.renderDogProfile;

      window.renderDogProfile = function (dog) {
        // Keep just the photo in sync
        try {
          if (dog && dog.dogId) window.currentDogId = dog.dogId;
        } catch {}
        bindPhotoOnly(dog);
        hideLegacyButtons();
        // Do NOT call legacy renderer (prevents flick/reset)
        return;
      };

      window.renderDogProfile._bpDisabledV3 = true;
      window.renderDogProfile._bpLegacy = _legacy;
    }
  } catch {}
})();
