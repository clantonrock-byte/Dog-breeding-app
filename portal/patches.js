// portal/patches/patches.js
console.log("✅ patches.js loaded");
alert("HELLO FROM PATCHES");
(function () {
  /**
   * This loader injects patch scripts AFTER the app loads.
   * All paths here are relative to portal/index.html (NOT the patches folder).
   */

  function loadScript(src) {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = () => console.log("✅ loaded", src);
    s.onerror = () => console.error("❌ failed", src);
    document.body.appendChild(s);
  }

  // --- Pick your patches (order matters) ---
  // Debug (optional)
  loadScript("rc_debug.js");

  // Dogs
  loadScript("dogs_viewall_fix.js");
  loadScript("dog_ui_patch.js");        // dog list thumbnails/route etc (if this is your hotpatch)
  loadScript("dog_row_click.js");       // if this exists to improve row click
  loadScript("dog_photo_open.js");      // if used
  loadScript("photo_bind_per_dog.js");  // if used

  // Microchip fixes (if used)
  loadScript("microchip_patch.js");

  // If you have one-off dog patches, add them here when needed:
  // loadScript("dog_id_migrate.js");
  // loadScript("disable_list_photos.js");
})();
