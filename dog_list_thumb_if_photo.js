// dog_list_thumb_if_photo.js
// Option B: show thumbnail ONLY if a photo exists for the dog.
// Does nothing for dogs without photos.
// Assumes dog rows are already clickable.

(function () {
  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function loadDogs(){
    const keys=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];
    for(const k of keys){
      try{
        const raw=localStorage.getItem(k);
        if(!raw) continue;
        const obj=JSON.parse(raw);
        if(Array.isArray(obj)) return obj;
        if(obj && Array.isArray(obj.dogs)) return obj.dogs;
      }catch(e){}
    }
    return [];
  }

  function getPhotoByCall(call){
    const dogs = loadDogs();
    const key = norm(call);
    const d = dogs.find(x => norm(x.callName||x.name) === key);
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function enhance(){
    try{
      const view = document.getElementById("viewDogs") || document.body;
      const cards = view.querySelectorAll(".card");
      cards.forEach(card=>{
        if(card._rcThumbDone) return;

        const nameEl = card.querySelector(".h") || card.querySelector("strong");
        if(!nameEl) return;
        const call = nameEl.textContent.trim();
        if(!call) return;

        const photo = getPhotoByCall(call);
        if(!photo) {
          card._rcThumbDone = true;
          return; // no placeholder, no thumbnail
        }

        // Create thumbnail
        const thumb = document.createElement("img");
        thumb.src = photo;
        thumb.alt = call + " photo";
        thumb.style.width = "48px";
        thumb.style.height = "48px";
        thumb.style.objectFit = "cover";
        thumb.style.borderRadius = "10px";
        thumb.style.border = "1px solid rgba(255,255,255,0.18)";
        thumb.style.marginBottom = "6px";
        thumb.style.display = "block";

        // Insert above name
        nameEl.parentElement.insertBefore(thumb, nameEl);

        card._rcThumbDone = true;
      });
    } catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1500);
  });
})();
