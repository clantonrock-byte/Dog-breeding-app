// identity_header.js — v1
// Adds an "identity header" to dog cards wherever they appear:
// - Photo (or 📷 Add photo placeholder)
// - Microchip: On file / None
// - Rabies: On file / None  (expiration handled in health record later)
//
// Non-invasive: does not change existing click behavior; it makes photo/name clickable by triggering existing Open button.

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

  function buildDogMap(){
    const store = loadDogsStore();
    const byId = new Map();
    const byCall = new Map();
    (store.dogs||[]).forEach(d=>{
      const id = d.dogId || d.id;
      const call = (d.callName||d.name||"").toString().trim().toLowerCase();
      if(id) byId.set(String(id), d);
      if(call) byCall.set(call, d);
    });
    return {byId, byCall};
  }

  function injectCSS(){
    if(document.getElementById("rcIdentityCss")) return;
    const css=document.createElement("style");
    css.id="rcIdentityCss";
    css.textContent=`
      .rc-id-head{ display:flex; gap:12px; align-items:center; margin-bottom:10px; }
      .rc-id-thumb{
        width:66px;height:54px;border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        overflow:hidden; flex:0 0 auto;
        display:flex; align-items:center; justify-content:center;
        text-align:center; padding:6px; line-height:1.05;
      }
      .rc-id-thumb img{ width:100%;height:100%;object-fit:cover;display:block; }
      .rc-id-thumb .cam{ font-size:16px; display:block; }
      .rc-id-thumb .txt{ font-size:11px; opacity:.9; margin-top:2px; }
      .rc-id-main{ flex:1; min-width:0; }
      .rc-id-name{ font-weight:900; }
      .rc-id-sub{ opacity:.75; font-size:12px; margin-top:2px; }
      .rc-id-pills{ display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
      .rc-pill{
        display:inline-block;
        font-size:12px;
        padding:2px 8px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,0.18);
        opacity:.95;
      }
      .rc-pill.ok{ border-color: rgba(74,144,226,0.55); }
      .rc-pill.warn{ border-color: rgba(255,59,48,0.55); }
    `;
    document.head.appendChild(css);
  }

  function mkThumb(photo){
    const el=document.createElement("div");
    el.className="rc-id-thumb";
    if(photo){
      const img=document.createElement("img");
      img.src=photo;
      img.alt="Dog photo";
      el.appendChild(img);
    } else {
      el.innerHTML = `<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return el;
  }

  function dogIdFromOpen(btn){
    try{
      const oc = btn.getAttribute("onclick") || "";
      const m = oc.match(/__openDog\(['"]([^'"]+)['"]\)/);
      if(m) return m[1];
    }catch(e){}
    return "";
  }

  function hasMicrochip(d){
    try{
      if(d.microchips && Array.isArray(d.microchips) && d.microchips.length) return true;
      if(d.microchip && d.microchip.value) return true;
    }catch(e){}
    return false;
  }

  function hasRabies(d){
    try{
      // v1: simple presence check
      if(d.rabiesDate) return true;
      if(d.immunizationEvents && Array.isArray(d.immunizationEvents)){
        return d.immunizationEvents.some(ev => (ev.type||"").toLowerCase().includes("rabies"));
      }
    }catch(e){}
    return false;
  }

  function enhance(){
    try{
      injectCSS();
      const maps = buildDogMap();

      // Find dog cards: any .card containing an "Open" button
      const scope = document.getElementById("viewDogs") || document.body;
      const cards = scope.querySelectorAll(".card");

      cards.forEach(card=>{
        if(card._rcIdentityDone) return;

        const openBtn = Array.from(card.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="open");
        if(!openBtn) return;

        const dogId = dogIdFromOpen(openBtn);
        const nameEl = card.querySelector(".h") || card.querySelector("strong");
        const subEl = card.querySelector(".sub") || card.querySelector(".small");

        const callName = nameEl ? nameEl.textContent.trim() : "";
        const key = callName.toLowerCase();

        let d = null;
        if(dogId && maps.byId.has(String(dogId))) d = maps.byId.get(String(dogId));
        if(!d && key && maps.byCall.has(key)) d = maps.byCall.get(key);

        const photo = d ? (d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "") : "";
        const chip = d ? hasMicrochip(d) : false;
        const rabies = d ? hasRabies(d) : false;

        const head=document.createElement("div");
        head.className="rc-id-head";
        const thumb=mkThumb(photo);

        const main=document.createElement("div");
        main.className="rc-id-main";
        main.innerHTML = `
          <div class="rc-id-name">${callName || "Dog"}</div>
          ${subEl ? `<div class="rc-id-sub">${subEl.textContent.trim()}</div>` : "" }
          <div class="rc-id-pills">
            <span class="rc-pill ${chip?'ok':'warn'}">Microchip: ${chip?'On file':'None'}</span>
            <span class="rc-pill ${rabies?'ok':'warn'}">Rabies: ${rabies?'On file':'None'}</span>
          </div>
        `;

        head.appendChild(thumb);
        head.appendChild(main);

        // Add at top of card without deleting existing content
        card.insertBefore(head, card.firstChild);

        // Make thumb + name area open profile
        const open = ()=>openBtn.click();
        thumb.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });
        main.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); open(); });

        // Optional: hide old Open button once identity header exists
        // openBtn.style.display="none";

        card._rcIdentityDone = true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1500);
  });
})();
