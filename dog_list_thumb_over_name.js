// dog_list_thumb_over_name.js
// Replaces "Open" button with a thumbnail placeholder positioned above the dog's name.
// Binds per dog by Call Name (current constraint). Clicking the thumbnail opens the profile.
// Uses existing open function if available (__openDog), else falls back to renderDogProfile.
//
// NOTE: This does not manage real photos yet; placeholder is "📷" + call name.
// Later we can swap placeholder with actual photo when per-dog photo storage is stable.

(function(){
  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];
  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function loadDogs(){
    for(const k of DOG_KEYS){
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

  function findDogByCall(call){
    const key=norm(call);
    if(!key) return null;
    const dogs=loadDogs();
    return dogs.find(d=>norm(d.callName||d.name)===key) || null;
  }

  function openDog(d){
    if(!d) return;
    const dogId=d.dogId||d.id||d.dogID||d.dogid;
    try{
      if(typeof window.__openDog==="function" && dogId){
        window.__openDog(String(dogId));
        return;
      }
    }catch(e){}
    try{
      if(typeof window.renderDogProfile==="function"){
        window.renderDogProfile(d);
        return;
      }
    }catch(e){}
  }

  function injectCSS(){
    if(document.getElementById("rcThumbOverNameCss")) return;
    const st=document.createElement("style");
    st.id="rcThumbOverNameCss";
    st.textContent=`
      .rc-thumb-badge{
        width:66px;height:54px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.9);
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        gap:2px;
        overflow:hidden;
        padding:6px;
        line-height:1.05;
        margin-bottom:8px;
      }
      .rc-thumb-badge .cam{font-size:16px;line-height:1;}
      .rc-thumb-badge .txt{font-size:10px;opacity:.9;max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .rc-thumb-badge:active{transform:translateY(1px);}
    `;
    document.head.appendChild(st);
  }

  function makeThumb(callName){
    const el=document.createElement("div");
    el.className="rc-thumb-badge";
    el.innerHTML = `<div class="cam">📷</div><div class="txt">${(callName||"").toString().trim()}</div>`;
    return el;
  }

  function enhance(){
    try{
      injectCSS();
      const scope=document.getElementById("viewDogs") || document.body;
      const cards=scope.querySelectorAll(".card");
      cards.forEach(card=>{
        if(card._rcThumbOverDone) return;

        // Find call name element in card
        const nameEl = card.querySelector(".h") || card.querySelector("strong");
        if(!nameEl || !nameEl.textContent) return;
        const callName=nameEl.textContent.trim();
        if(!callName) return;

        // Find open button if exists and hide it
        const openBtn = Array.from(card.querySelectorAll("button")).find(b=>(b.textContent||"").trim().toLowerCase()==="open");
        if(openBtn) openBtn.style.display="none";

        // Insert thumb directly ABOVE the name element
        const thumb = makeThumb(callName);
        nameEl.parentElement.insertBefore(thumb, nameEl);

        thumb.addEventListener("click",(e)=>{
          e.preventDefault(); e.stopPropagation();
          const d=findDogByCall(callName);
          if(d) openDog(d);
        });

        // Also make call name click open
        if(!nameEl._rcOpenBound){
          nameEl.style.cursor="pointer";
          nameEl.addEventListener("click",(e)=>{
            try{ if(e.target.closest("button,a,input,select,textarea,label")) return; }catch(_){}
            const d=findDogByCall(callName);
            if(d) openDog(d);
          });
          nameEl._rcOpenBound=true;
        }

        card._rcThumbOverDone=true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();