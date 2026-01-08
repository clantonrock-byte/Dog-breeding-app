// dog_photo_open.js — v6
// Links the profile photo to the dog list thumbnail by reading the same dog record from localStorage.
// If dogId can't be parsed from the Open button, falls back to callName match.
// Shows current photo if available; otherwise shows 📷 Add photo.
// Tapping thumbnail opens profile (triggers existing Open button click).

(function(){
  const DOG_KEYS = ["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];

  function loadDogsStore(){
    for(const k of DOG_KEYS){
      try{
        const raw = localStorage.getItem(k);
        if(!raw) continue;
        const obj = JSON.parse(raw);
        if(Array.isArray(obj)) return {dogs: obj, _key:k};
        if(obj && Array.isArray(obj.dogs)) return Object.assign({_key:k}, obj);
      }catch(e){}
    }
    return {dogs: [], _key:null};
  }

  function buildMaps(){
    const store = loadDogsStore();
    const byId = new Map();
    const byCall = new Map();
    (store.dogs||[]).forEach(d=>{
      const id = d.dogId || d.id;
      const call = (d.callName||d.name||"").toString().trim().toLowerCase();
      const photo = d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
      if(id) byId.set(String(id), {dog:d, photo});
      if(call) byCall.set(call, {dog:d, photo});
    });
    return {byId, byCall};
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
      .rc-dog-headrow .rc-dog-text{ flex:1; min-width:0; }
      .rc-dog-headrow .rc-dog-name{ font-weight:900; }
      .rc-dog-headrow .rc-dog-sub{ opacity:.75; font-size:12px; margin-top:2px; }
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
    return btn.dataset && (btn.dataset.dogId || btn.dataset.id) || "";
  }

  function enhance(){
    try{
      injectCSS();
      const maps = buildMaps();
      const dogsView = document.getElementById("viewDogs") || document.body;
      const cards = dogsView.querySelectorAll(".card");
      cards.forEach(card=>{
        if(card._rcThumbDone) return;

        const btn = Array.from(card.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="open");
        if(!btn) return;

        const dogId = extractDogIdFromOpen(btn);
        const nameEl = card.querySelector(".h") || card.querySelector("strong");
        const subEl = card.querySelector(".sub") || card.querySelector(".small");
        const callName = nameEl ? nameEl.textContent.trim() : "";
        const callKey = callName.toLowerCase();

        let photo = "";
        if(dogId && maps.byId.has(String(dogId))) photo = maps.byId.get(String(dogId)).photo || "";
        if(!photo && callKey && maps.byCall.has(callKey)) photo = maps.byCall.get(callKey).photo || "";

        const head=document.createElement("div");
        head.className="rc-dog-headrow";
        const thumb = mkThumb(photo);
        const text=document.createElement("div");
        text.className="rc-dog-text";
        text.innerHTML = `
          <div class="rc-dog-name">${callName || "Dog"}</div>
          ${subEl ? `<div class="rc-dog-sub">${subEl.textContent.trim()}</div>` : "" }
        `;
        head.appendChild(thumb);
        head.appendChild(text);

        card.insertBefore(head, card.firstChild);

        const open = ()=>btn.click();
        thumb.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });
        text.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });

        // Hide Open button now that thumb/name opens
        btn.style.display="none";

        card._rcThumbDone = true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1400);
  });
})();
