// dog_list_thumb_over_name.js — v2
// Shows the CURRENT photo (if available) above the dog's name in the list.
// Fallback: 📷 + call name placeholder.
// Matching is by Call Name (current constraint).
// Clicking the thumb opens that dog's profile.

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

  function getDogByCall(call){
    const key=norm(call);
    if(!key) return null;
    const dogs=loadDogs();
    return dogs.find(d=>norm(d.callName||d.name)===key) || null;
  }

  function getPhotoForDog(d){
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function openDog(d){
    if(!d) return;
    const dogId=d.dogId||d.id||d.dogID||d.dogid;
    try{
      if(typeof window.__openDog==="function" && dogId){
        window.__openDog(String(dogId)); return;
      }
    }catch(e){}
    try{
      if(typeof window.renderDogProfile==="function"){ window.renderDogProfile(d); return; }
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
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        padding:0;
        margin-bottom:8px;
      }
      .rc-thumb-badge img{width:100%;height:100%;object-fit:cover;display:block;}
      .rc-thumb-badge .ph{
        width:100%;height:100%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:2px;padding:6px;line-height:1.05;
      }
      .rc-thumb-badge .cam{font-size:16px;line-height:1;}
      .rc-thumb-badge .txt{font-size:10px;opacity:.9;max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .rc-thumb-badge:active{transform:translateY(1px);}
    `;
    document.head.appendChild(st);
  }

  function renderThumb(el, callName, photo){
    el.innerHTML="";
    if(photo){
      const img=document.createElement("img");
      img.src=photo;
      img.alt="Dog photo";
      el.appendChild(img);
    }else{
      el.innerHTML=`<div class="ph"><div class="cam">📷</div><div class="txt">${callName}</div></div>`;
    }
  }

  function enhance(){
    try{
      injectCSS();
      const scope=document.getElementById("viewDogs") || document.body;
      const cards=scope.querySelectorAll(".card");
      cards.forEach(card=>{
        // Find call name
        const nameEl = card.querySelector(".h") || card.querySelector("strong");
        if(!nameEl || !nameEl.textContent) return;
        const callName=nameEl.textContent.trim();
        if(!callName) return;

        // Hide open button if exists
        const openBtn = Array.from(card.querySelectorAll("button")).find(b=>(b.textContent||"").trim().toLowerCase()==="open");
        if(openBtn) openBtn.style.display="none";

        // Ensure thumb exists above name
        let thumb = card.querySelector(".rc-thumb-badge");
        if(!thumb){
          thumb=document.createElement("div");
          thumb.className="rc-thumb-badge";
          nameEl.parentElement.insertBefore(thumb, nameEl);
          thumb.addEventListener("click",(e)=>{
            e.preventDefault(); e.stopPropagation();
            const d=getDogByCall(callName);
            if(d) openDog(d);
          });
        }

        // Update thumb each pass (self-heal)
        const d=getDogByCall(callName);
        const photo=getPhotoForDog(d);
        renderThumb(thumb, callName, photo);
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1500);
  });
})();