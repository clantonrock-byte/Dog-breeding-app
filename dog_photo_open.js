// dog_photo_open.js — v4
// Shows current dog photo (if available) on dog list cards; photo/placeholder opens profile.
// Does NOT rebuild cards; it injects a small header row and hides the Open button.
// Photo source: looks up dogId from the Open button (onclick "__openDog('...')") and then
// reads photoDataUrl from the dogs store in localStorage.

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
    const css = document.createElement("style");
    css.id = "rcDogThumbCss";
    css.textContent = `
      .rc-dog-head{
        display:flex; align-items:center; gap:12px;
        margin-bottom:10px;
      }
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
      .rc-dog-thumb:active{ transform: translateY(1px); }
      .rc-dog-thumb .cam{ font-size:16px; display:block; }
      .rc-dog-thumb .txt{ font-size:11px; opacity:.9; margin-top:2px; }
      .rc-dog-titleblock{ min-width:0; flex:1; }
    `;
    document.head.appendChild(css);
  }

  function mkThumb(src){
    const wrap=document.createElement("div");
    wrap.className="rc-dog-thumb";
    if(src){
      const img=document.createElement("img");
      img.src=src;
      img.alt="Dog photo";
      wrap.appendChild(img);
    } else {
      wrap.innerHTML = `<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return wrap;
  }

  function extractDogIdFromOpen(btn){
    try{
      // onclick attribute: __openDog('dog_...')
      const oc = btn.getAttribute("onclick") || "";
      const m = oc.match(/__openDog\(['"]([^'"]+)['"]\)/);
      if(m) return m[1];
    }catch(e){}
    return "";
  }

  function enhance(){
    injectCSS();
    const photoMap = buildPhotoMap();

    // Dog cards generally have .card class in the Dogs view
    const dogsView = document.getElementById("viewDogs") || document.body;
    const cards = dogsView.querySelectorAll(".card");
    cards.forEach(card=>{
      if(card._rcPhotoDone) return;
      const btn = Array.from(card.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="open");
      if(!btn) return;

      const dogId = extractDogIdFromOpen(btn);
      const src = dogId ? (photoMap.get(String(dogId))||"") : "";

      // Create head row and move the existing title lines into it (without deleting anything)
      const head=document.createElement("div");
      head.className="rc-dog-head";
      const thumb = mkThumb(src);

      const titleBlock=document.createElement("div");
      titleBlock.className="rc-dog-titleblock";

      // Move the first two text nodes/elements that look like title/subtitle into titleBlock
      // Typically: <div class="h">Name</div> and <div class="sub">Breed...</div>
      const h = card.querySelector(".h") || card.querySelector("strong");
      const sub = card.querySelector(".sub") || card.querySelector(".small");
      if(h) titleBlock.appendChild(h);
      if(sub) titleBlock.appendChild(sub);

      head.appendChild(thumb);
      head.appendChild(titleBlock);

      // Insert head at top of card
      card.insertBefore(head, card.firstChild);

      // clicking thumb or title opens profile via existing button
      const open = ()=>btn.click();
      thumb.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });
      titleBlock.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });

      // Hide open button to encourage thumb-as-open UX
      btn.style.display="none";

      card._rcPhotoDone=true;
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
