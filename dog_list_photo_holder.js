// dog_list_photo_holder.js
// Creates a photo holder for each dog in the list and makes it the tap-to-open control.
// No actual photos yet—just a consistent visual "profile" affordance (📷 Profile).
// Safe: does not modify dog data.

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
    const key = norm(call);
    if(!key) return null;
    const dogs = loadDogs();
    return dogs.find(d => norm(d.callName||d.name) === key) || null;
  }

  function openDog(d){
    if(!d) return;
    const dogId = d.dogId || d.id || d.dogID || d.dogid;
    try{
      if(typeof window.__openDog === "function" && dogId){
        window.__openDog(String(dogId));
        return;
      }
    }catch(e){}
    try{
      if(typeof window.renderDogProfile === "function"){
        window.renderDogProfile(d);
        return;
      }
    }catch(e){}
    try{ if(window.rcToast) window.rcToast("Opening profile…"); }catch(e){}
  }

  function injectCSS(){
    if(document.getElementById("rcDogHolderCss")) return;
    const st=document.createElement("style");
    st.id="rcDogHolderCss";
    st.textContent = `
      .rc-dog-holder{
        width:66px;height:54px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.85);
        display:flex;align-items:center;justify-content:center;
        padding:6px;text-align:center;line-height:1.05;
        flex:0 0 auto;
      }
      .rc-dog-holder .cam{ font-size:16px; display:block; }
      .rc-dog-holder .txt{ font-size:11px; opacity:.9; margin-top:2px; display:block; }
      .rc-dog-holder:active{ transform: translateY(1px); }
      .rc-dog-rowwrap{
        display:flex; align-items:center; gap:10px;
      }
    `;
    document.head.appendChild(st);
  }

  function makeHolder(){
    const el=document.createElement("div");
    el.className="rc-dog-holder";
    el.innerHTML = `<span class="cam">📷</span><span class="txt">Profile</span>`;
    return el;
  }

  function getDogsListNodes(){
    const list = document.getElementById("dogsList");
    if(list) return Array.from(list.children);
    const view = document.getElementById("viewDogs") || document.body;
    // fallback to cards/rows within Dogs view
    const cards = Array.from(view.querySelectorAll(".card"));
    return cards.length ? cards : Array.from(view.querySelectorAll("li, .row, .item"));
  }

  function extractCallName(el){
    const nameEl = el.querySelector(".h") || el.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines=(el.innerText||el.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    return lines.length?lines[0]:"";
  }

  function enhance(){
    try{
      injectCSS();
      const nodes = getDogsListNodes();
      nodes.forEach(el=>{
        if(el._rcHolderBound) return;
        const call = extractCallName(el);
        if(!call) return;

        // Wrap existing content so we can prepend holder without breaking layout
        const wrap=document.createElement("div");
        wrap.className="rc-dog-rowwrap";

        // Move existing children into wrap
        const children = Array.from(el.childNodes);
        children.forEach(ch=>wrap.appendChild(ch));

        // Clear and rebuild
        el.innerHTML = "";
        const holder = makeHolder();
        el.appendChild(holder);
        el.appendChild(wrap);

        holder.addEventListener("click",(e)=>{
          e.preventDefault(); e.stopPropagation();
          const d=findDogByCall(call);
          if(d) setTimeout(()=>openDog(d), 0);
        });

        // Optional: also make the name area clickable
        wrap.addEventListener("click",(e)=>{
          // don't trigger if clicked on a button inside
          try{ if(e.target.closest("button,a,input,select,textarea,label")) return; }catch(_){}
          const d=findDogByCall(call);
          if(d) setTimeout(()=>openDog(d), 0);
        });

        el._rcHolderBound = true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();