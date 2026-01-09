(function () {
  const KEYS = [
    "rc_list_thumb_v1",
    "rc_dog_photos_v1",
    "rc_photo_cleanup_v1",
    "dogPhoto",
    "bp_dog_photo",
    "rc_dog_photo",
    "dog_photo",
    "dogPhotoDataUrl"
  ];

  let cleared = 0;
  try {
    KEYS.forEach(k => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        cleared++;
      }
    });
    alert("Photo reset complete ✅\nKeys cleared: " + cleared + "\nReloading…");
  } catch (e) {
    alert("Photo reset failed: " + (e.message || e));
  }

  try { location.reload(); } catch (e) {}
})();
