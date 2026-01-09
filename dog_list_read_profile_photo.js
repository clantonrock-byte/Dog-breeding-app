// dog_list_read_profile_photo.js
// Dog LIST = read-only reflection of PROFILE photo
// Shows thumbnail only if the dog already has a saved profile photo.
// Never writes, never guesses, never affects other dogs.

(function () {

  const DOG_KEYS = [
    "breederPro_dogs_store_v3",
    "breeder_dogs_v1",
    "breederPro_dogs_store_v1"
  ];

  function norm(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  function loadDogs() {
    for (const key of DOG_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (Array.isArray(obj)) return obj;
        if (obj && Array.isArray(obj.dogs)) return obj.dogs;
      } catch (e) {}
    }
    return [];
  }

  function getDogPhoto(dog) {
    if (!dog) return "";
    return (
      dog.photoDataUrl ||
      dog.photo ||
      dog.image ||
      dog.profilePhoto ||
      dog.photoURI ||
      ""
    );
  }

  function enhanceDogList() {
    const dogs = loadDogs();
    if (!dogs.length) return;

    const view = document.getElementById("viewDogs");
    if (!view) return;

    const rows = view.querySelectorAll(".card");
    rows.forEach(row => {
      if (row._rcPhotoBound) return;

      const nameEl = row.querySelector(".h") || row.querySelector("strong");
      if (!nameEl) return;

      const callName = nameEl.textContent.trim();
      if (!callName) return;

      const dog = dogs.find(d => norm(d.callName || d.name) === norm(callName));
      if (!dog) return;

      const photo = getDogPhoto(dog);
      if (!photo) {
        row._rcPhotoBound = true;
        return; // no photo → leave 📷 placeholder
      }

      // find the profile tile created earlier
      const tile = row.querySelector(".rc-profile-tile");
      if (!tile) return;

      tile.innerHTML = "";
      const img = document.createElement("img");
      img.src = photo;
      img.alt = callName + " photo";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.display = "block";
      tile.appendChild(img);

      row._rcPhotoBound = true;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhanceDogList();
    setInterval(enhanceDogList, 1500);
  });

})();
