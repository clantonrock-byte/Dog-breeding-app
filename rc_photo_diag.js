(function () {
  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];
  function loadDogs(){
    for(const k of DOG_KEYS){
      try{
        const raw=localStorage.getItem(k);
        if(!raw) continue;
        const obj=JSON.parse(raw);
        if(Array.isArray(obj)) return {key:k, dogs: obj};
        if(obj && Array.isArray(obj.dogs)) return {key:k, dogs: obj.dogs};
      }catch(e){}
    }
    return {key:"(none)", dogs:[]};
  }

  const store = loadDogs();
  const dogs = store.dogs || [];

  const photos = new Map();
  dogs.forEach(d=>{
    const call = (d.callName||d.name||"").toString().trim();
    const p = d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
    const short = p ? (p.slice(0,25) + "...") : "";
    photos.set(call || "(unnamed)", short);
  });

  const distinct = new Set(Array.from(photos.values()).filter(Boolean));

  alert(
    "Dog store key: " + store.key +
    "\nDogs: " + dogs.length +
    "\nDogs with a photo field: " + Array.from(photos.values()).filter(Boolean).length +
    "\nDistinct photo values: " + distinct.size +
    "\n\nIf distinct=1, the same photo is stored on multiple dogs (data issue)."
  );
})();