/**
 * dogs_bundle_profile_disable_v2.js
 *
 * Keeps portal/dogs.bundle.js for list/navigation, but prevents it from rewriting the DogProfile DOM.
 * Unlike v1, DOES NOT override __openDog (so row click behavior stays intact).
 *
 * Install order:
 *   dogs.bundle.js
 *   dogs_bundle_profile_disable_v2.js   <-- this
 *   dog_profile_rebuild_v3_5.js         (or your current rebuild owner)
 */
(() => {
  "use strict";

  function setProfileTitleFromDog(dog) {
    const profile = document.getElementById("viewDogProfile");
    if (!profile) return;
    const h = profile.querySelector("h2") || profile.querySelector("h3");
    if (!h) return;
    const title = (dog && (dog.callName || dog.registeredName)) ? (dog.callName || dog.registeredName) : h.textContent;
    h.textContent = String(title || "").trim() || h.textContent;
  }

  try {
    if (typeof window.renderDogProfile === "function" && !window.renderDogProfile._bpDisabledV2) {
      const _legacy = window.renderDogProfile;

      window.renderDogProfile = function (dog) {
        try {
          if (dog && dog.dogId) window.currentDogId = dog.dogId;
          setProfileTitleFromDog(dog);
        } catch {}
        // Do NOT call legacy DOM writer.
        return;
      };

      window.renderDogProfile._bpDisabledV2 = true;
      window.renderDogProfile._bpLegacy = _legacy;
    }
  } catch {}
})();
