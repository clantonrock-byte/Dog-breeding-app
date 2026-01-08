// dog_photo_open.js — v12 (dogId-aware with migration)
// Uses dogId if present; otherwise falls back to callName. Never bleeds photos.
// Also writes data-dogid onto the Open button wrapper for stable lookup.
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

  function injectCSS(){
    if(document.getElementById("rcDogThumbCssV12")) return;
    const st=document.createElement("style");
    st.id="rcDogThumbCssV12";
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
    el.innerHTML="";
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
    const lines=(card.innerText||card.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    return lines.length?lines[0]:"";
  }

  function dogFor(cardName){
    const dogs=loadDogs();
    const key=norm(cardName);
    if(!key) return null;
    return dogs.find(d=>norm(d.callName||d.name)===key) || null;
  }

  function photoForDog(d){
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function ensureWrap(btn){
    const existing = btn.parentElement && btn.parentElement.classList && btn.parentElement.classList.contains("rc-openwrap")
      ? btn.parentElement : null;
    if(existing){
      let thumb=existing.querySelector(".rc-thumb");
      if(!thumb){
        thumb=document.createElement("div"); thumb.className="rc-thumb";
        existing.insertBefore(thumb, existing.firstChild);
      }
      return {wrap:existing, thumb};
    }
    const wrap=document.createElement("span");
    wrap.className="rc-openwrap";
    const thumb=document.createElement("div"); thumb.className="rc-thumb";
    const parent=btn.parentNode;
    if(!parent) return null;
    parent.insertBefore(wrap, btn);
    wrap.appendChild(thumb);
    wrap.appendChild(btn);
    return {wrap, thumb};
  }

  function enhance(){
    try{
      injectCSS();
      document.querySelectorAll("button").forEach(btn=>{
        const t=(btn.textContent||"").trim().toLowerCase();
        if(t!=="open") return;
        const card=findCard(btn);
        const name=extractNameFromCard(card);
        const d=dogFor(name);
        const src=photoForDog(d);
        const obj=ensureWrap(btn);
        if(!obj) return;

        // store dogId on wrapper if available
        try{
          if(d && d.dogId) obj.wrap.dataset.dogid = d.dogId;
        }catch(e){}

        // render thumb fresh each time
        const newThumb = mkThumb(src);
        obj.thumb.replaceWith(newThumb);
        obj.thumb = newThumb;

        if(!newThumb._bound){
          newThumb.addEventListener("click",(e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });
          newThumb._bound=true;
        }
        btn.style.display="none";
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();