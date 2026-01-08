// dog_photo_open.js — v5
// Adds an anchored thumbnail (or 📷 Add photo placeholder) inside each dog card.
// Clicking the thumbnail triggers the existing Open button click.
// Works even if card layout changes; avoids rebuilding card content.

(function(){
  const DOG_KEYS = ["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];

  function loadDogsStore(){
    for(const k of DOG_KEYS){
      try{
        const raw = localStorage.getItem(k);
        if(!raw) continue;
        const obj = JSON.parse(raw);
        if(Array.isArray(obj)) return {dogs: obj};
        if(obj && Array.isArray(obj.dogs)) return obj;
      }catch(e){}
    }
    return {dogs: []};
  }

  function buildPhotoMap(){
    const store = loadDogsStore();
    const map = new Map();
    (store.dogs||[]).forEach(d=>{
      const id = d.dogId || d.id;
      if(!id) return;
      const photo = d.photoDataUrl || d.photo || d.photoUrl || "";
      if(photo) map.set(String(id), photo);
    });
    return map;
  }

  function injectCSS(){
    if(document.getElementById("rcDogThumbCss")) return;
    const css=document.createElement("style");
    css.id="rcDogThumbCss";
    css.textContent=`
      .rc-dog-thumb{
        width:66px;height:54px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.85);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        flex:0 0 auto;
        padding:6px;
        text-align:center;
        line-height:1.05;
      }
      .rc-dog-thumb img{ width:100%;height:100%;object-fit:cover;display:block; }
      .rc-dog-thumb .cam{ font-size:16px; display:block; }
      .rc-dog-thumb .txt{ font-size:11px; opacity:.9; margin-top:2px; }
      .rc-dog-headrow{
        display:flex;
        align-items:center;
        gap:12px;
        margin-bottom:10px;
      }
      .rc-dog-headrow .rc-dog-text{
        flex:1;
        min-width:0;
      }
      .rc-dog-headrow .rc-dog-text .rc-dog-name{ font-weight:900; }
      .rc-dog-headrow .rc-dog-text .rc-dog-sub{ opacity:.75; font-size:12px; margin-top:2px; }
    `;
    document.head.appendChild(css);
  }

  function mkThumb(src){
    const el=document.createElement("div");
    el.className="rc-dog-thumb";
    if(src){
      const img=document.createElement("img");
      img.src=src;
      img.alt="Dog photo";
      el.appendChild(img);
    } else {
      el.innerHTML = `<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return el;
  }

  function extractDogIdFromOpen(btn){
    try{
      const oc = btn.getAttribute("onclick") || "";
      const m = oc.match(/__openDog\(['"]([^'"]+)['"]\)/);
      if(m) return m[1];
    }catch(e){}
    // fallback: sometimes stored in dataset
    return btn.dataset && (btn.dataset.dogId || btn.dataset.id) || "";
  }

  function enhance(){
    try{
      injectCSS();
      const photoMap = buildPhotoMap();
      const dogsView = document.getElementById("viewDogs") || document.body;

      // Dog cards are usually ".card" within Dogs view
      const cards = dogsView.querySelectorAll(".card");
      cards.forEach(card=>{
        if(card._rcThumbDone) return;

        const btn = Array.from(card.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="open");
        if(!btn) return;

        const dogId = extractDogIdFromOpen(btn);
        const src = dogId ? (photoMap.get(String(dogId))||"") : "";

        // find existing name/sub text
        const nameEl = card.querySelector(".h") || card.querySelector("strong");
        const subEl = card.querySelector(".sub") || card.querySelector(".small");

        const head=document.createElement("div");
        head.className="rc-dog-headrow";
        const thumb = mkThumb(src);
        const text=document.createElement("div");
        text.className="rc-dog-text";
        text.innerHTML = `
          <div class="rc-dog-name">${(nameEl ? nameEl.textContent.trim() : "Dog")}</div>
          ${subEl ? `<div class="rc-dog-sub">${subEl.textContent.trim()}</div>` : "" }
        `;

        head.appendChild(thumb);
        head.appendChild(text);

        // Insert head row at top if not already present
        card.insertBefore(head, card.firstChild);

        // click thumb/text opens profile
        const open = ()=>btn.click();
        thumb.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });
        text.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });

        // Hide the Open button to encourage thumb-as-open (optional; keep if you prefer)
        // We'll keep it visible for now; user asked to remove open later, but they still see it.
        // btn.style.display="none";

        card._rcThumbDone = true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
