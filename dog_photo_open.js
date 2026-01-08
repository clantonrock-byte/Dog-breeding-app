// dog_photo_open.js — v9 (layout-agnostic, Open-button based)
// If your Dogs list has an "Open" button, this will add a thumbnail/placeholder next to it.
// - Finds every button whose text is "Open" (case-insensitive)
// - Attempts to find the dog name near that button and pull photoDataUrl from localStorage by callName
// - If a photo exists: shows it; otherwise shows 📷 Add photo
// - Clicking the thumbnail triggers the same Open button click
// - Hides the Open button

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

  function photoByCallName(call){
    const dogs=loadDogs();
    const key=(call||"").toString().trim().toLowerCase();
    if(!key) return "";
    const d=dogs.find(x=>((x.callName||x.name||"").toString().trim().toLowerCase()===key));
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function injectCSS(){
    if(document.getElementById("rcDogThumbCssV9")) return;
    const st=document.createElement("style");
    st.id="rcDogThumbCssV9";
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

  function findNearbyName(btn){
    // Try to find a name element in the same container/card
    const host = btn.closest(".card") || btn.parentElement;
    if(!host) return "";
    const nameEl = host.querySelector(".h") || host.querySelector("strong") || host.querySelector(".rc-dog-name");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    // fallback: first line of text in host
    const text = (host.textContent||"").trim().split("\n").map(s=>s.trim()).filter(Boolean);
    return text.length ? text[0] : "";
  }

  function enhance(){
    try{
      injectCSS();
      let injected=0;
      document.querySelectorAll("button").forEach(btn=>{
        const t=(btn.textContent||"").trim().toLowerCase();
        if(t!=="open") return;
        if(btn._rcDone) return;

        const name=findNearbyName(btn);
        const photo=photoByCallName(name);

        const wrap=document.createElement("span");
        wrap.className="rc-openwrap";
        const thumb=mkThumb(photo);

        thumb.addEventListener("click",(e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });

        // Wrap the button in place
        const parent=btn.parentNode;
        if(!parent) return;
        parent.insertBefore(wrap, btn);
        wrap.appendChild(thumb);
        wrap.appendChild(btn);

        // hide button
        btn.style.display="none";
        btn._rcDone=true;
        injected++;
      });

      // optional toast once we inject anything
      if(injected>0){
        try{ if(typeof window.rcToast==="function") window.rcToast("Dog thumbnails active"); }catch(e){}
      }
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
