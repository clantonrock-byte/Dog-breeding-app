/**
 * portal/dogs_bundle_profile_disable_v4.js
 * Purpose: keep dogs.bundle for the list, but neutralize legacy profile actions.
 * Install: load AFTER portal/dogs.bundle.js and BEFORE dog_profile_rebuild_v3_7*.js
 */
(() => {
  "use strict";

  function replaceWithClone(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const clone = el.cloneNode(true);
    el.parentNode?.replaceChild(clone, el);
  }

  function hideLegacyProfileSection() {
    // Legacy section uses id viewDogProfile in your screenshots
    const legacy = document.getElementById("viewDogProfile");
    if (legacy) legacy.classList.add("hide");
  }

  function disableLegacyProfileBindings() {
    [
      "btnDoneDog",
      "btnNotesDog",
      "btnMoreDog",
      "btnSaveDog",
      "btnCancelDog",
      "dogNotes",
      "dogStatus",
      "dogSexInline",
      "dogBreedInline",
      "dogDobInline",
      "dogDobEstimatedInline",
    ].forEach(replaceWithClone);

    hideLegacyProfileSection();
  }

  // Run now, and again shortly (in case bundle renders profile later)
  disableLegacyProfileBindings();
  setTimeout(disableLegacyProfileBindings, 250);
  setTimeout(disableLegacyProfileBindings, 1000);
})();
