// rc_clear_dog_list_photos.js
// One-time cleanup: clears dog-list photo mapping keys created by enhancements.
// Does NOT delete dogs, inventory, or other app data.
(function () {
  const KEYS = [
    "rc_dog_photos_v1",
    "rc_dog_photos",
    "rc_photo_map",
    "rc_dog_photo_map",
    "rc_dog_photos_v1_seed",
    "rc_photo_cleanup_v1"
  ];

  let cleared = 0;
  try {
    KEYS.forEach((k) => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        cleared++;
      }
    });
    alert("Cleared dog-list photo map (" + cleared + " keys). Reloading…");
  } catch (e) {
    alert("Clear failed: " + (e.message || e));
  }

  try { location.reload(); } catch (e) {}
})();