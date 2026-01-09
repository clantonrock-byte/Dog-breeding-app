(function () {
  const DOG_KEYS = ["breederPro_dogs_store_v3", "breeder_dogs_v1", "breederPro_dogs_store_v1"];

  function loadDogs() {
    for (const k of DOG_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (Array.isArray(obj)) return { key: k, dogs: obj };
        if (obj && Array.isArray(obj.dogs)) return { key: k, dogs: obj.dogs };
      } catch (e) {}
    }
    return { key: "(none)", dogs: [] };
  }

  const store = loadDogs();
  const dogs = store.dogs || [];

  // Find likely ID fields
  const idFields = ["dogId", "id", "_id", "dogID", "dogid"];
  const sample = dogs[0] || {};

  // Count distinct photo values across dogs
  function photoVal(d) {
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }
  const photos = dogs.map(photoVal).filter(Boolean);
  const distinctPhotos = new Set(photos);

  // Count how many dogs have each id field
  const counts = {};
  idFields.forEach(f => {
    counts[f] = dogs.filter(d => d && d[f]).length;
  });

  alert(
    "DOG STORE KEY: " + store.key +
    "\nDOG COUNT: " + dogs.length +
    "\n\nID FIELD COUNTS:" +
    "\n dogId: " + counts.dogId +
    "\n id: " + counts.id +
    "\n _id: " + counts._id +
    "\n dogID: " + counts.dogID +
    "\n dogid: " + counts.dogid +
    "\n\nPHOTO FIELDS:" +
    "\n dogs with photo field: " + photos.length +
    "\n distinct photo values: " + distinctPhotos.size +
    "\n\nSAMPLE DOG KEYS:\n" + Object.keys(sample).slice(0, 30).join(", ")
  );
})();
