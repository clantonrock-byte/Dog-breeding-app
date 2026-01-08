// dog_photo_open.js — v10 (call-name bound, no photo bleed)
// Since dogId isn't available yet, bind photos by Call Name exactly.
// IMPORTANT: If a dog has no stored photo, show 📷 Add photo (do NOT reuse another dog’s photo).

(function(){
  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];

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

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function photoForCallName(call){
    const key = norm(call);
    if(!key) return "";
    const dogs = loadDogs();
    const d = dogs.find(x => norm(x.callName||x.name) === key);
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function injectCSS(){
    if(document.getElementById("rcDogThumbCssV10")) return;
    const st=document.createElement("style");
    st.id="rcDogThumbCssV10";
    st.textContent=`
      .rc-openwrap{display:flex;align-items:center;gap:10px;}
      .rc-thumb{
        width:66px;height:54px;border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        overflow:hidden;flex:0 0 auto;
        display:flex;align-items:center;justify-content:center;
        padding:6px;text-align:center;line-height:1.05;
        color:rgba(242,242,242,0.85);
      }
      .rc-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
      .rc-thumb .cam{font-size:16px;display:block;}
      .rc-thumb .txt{font-size:11px;opacity:.9;margin-top:2px;}
    `;
    document.head.appendChild(st);
  }

  function mkThumb(src){
    const el=document.createElement("div");
    el.className="rc-thumb";
    if(src){
      const img=document.createElement("img");
      img.src=src;
      img.alt="Dog photo";
      el.appendChild(img);
    } else {
      el.innerHTML=`<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return el;
  }

  function findCard(btn){
    return btn.closest(".card") || btn.parentElement;
  }

  function extractNameFromCard(card){
    if(!card) return "";
    const nameEl = card.querySelector(".h") || card.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines = (card.innerText||card.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    return lines.length ? lines[0] : "";
  }

  function enhance(){
    try{
      injectCSS();
      let injected=0;
      document.querySelectorAll("button").forEach(btn=>{
        const t=(btn.textContent||"").trim().toLowerCase();
        if(t!=="open") return;
        if(btn._rcDoneV10) return;

        const card=findCard(btn);
        const name=extractNameFromCard(card);
        const photo=photoForCallName(name);

        const wrap=document.createElement("span");
        wrap.className="rc-openwrap";
        const thumb=mkThumb(photo);

        thumb.addEventListener("click",(e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });

        const parent=btn.parentNode;
        if(!parent) return;
        parent.insertBefore(wrap, btn);
        wrap.appendChild(thumb);
        wrap.appendChild(btn);

        btn.style.display="none";
        btn._rcDoneV10=true;
        injected++;
      });

      if(injected>0){
        try{ if(typeof window.rcToast==="function") window.rcToast("Dog photos linked"); }catch(e){}
      }
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
