// portal/patches/patches.js
console.log("✅ portal patches loaded");

(function () {
  const PATCH_DIR = "patches/";

  function load(file) {
    const s = document.createElement("script");
    s.src = PATCH_DIR + file;
    s.defer = true;
    s.onload = () => console.log("✅ loaded", file);
    s.onerror = () => console.error("❌ failed to load", file);
    document.body.appendChild(s);
  }

  // Load your patch files (use the exact filenames in /portal/patches/)
  load("rc_clear_dog.js");
  load("rc_clear_bug.js");
  load("rc_dog_ui.js");
  load("rc_inventory_.js");
  load("dog_ui_patch.js");
  load("dogs_viewall_.js");
})();
