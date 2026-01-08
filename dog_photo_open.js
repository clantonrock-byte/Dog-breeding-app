// dog_photo_open.js — v11 (self-healing, updates existing thumbs; no stale bleed)
// Fixes "all dogs show same photo" caused by stale injected thumbs from earlier versions.
// Strategy:
// - Always locate each "Open" button.
// - For each, find (or create) a wrapper with a thumb.
// - Recompute photo by call name each pass and UPDATE the thumb in-place.
// - Never trust old flags; will overwrite stale image with placeholder if no photo.

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
    if(document.getElementById("rcDogThumbCssV11")) return;
    const st=document.createElement("style");
    st.id="rcDogThumbCssV11";
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

  function renderThumb(el, src){
    // wipe contents
    el.innerHTML = "";
    if(src){
      const img=document.createElement("img");
      img.src=src;
      img.alt="Dog photo";
      el.appendChild(img);
    } else {
      el.innerHTML = `<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
  }

  function findCard(btn){
    return btn.closest(".card") || btn.parentElement;
  }

  function extractNameFromCard(card){
    if(!card) return "";
    const nameEl = card.querySelector(".h") || card.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    // Fallback: attempt to grab first bold-ish line (avoid breed line)
    const lines = (card.innerText||card.textContent||"")
      .split("\n")
      .map(s=>s.trim())
      .filter(Boolean);
    // choose first line that is not starting with "Breed:" and not "German"
    for(const ln of lines){
      if(/^breed:/i.test(ln)) continue;
      if(/^sex:/i.test(ln)) continue;
      if(/^german\s/i.test(ln)) continue;
      if(ln.length<=2) continue;
      return ln;
    }
    return lines.length?lines[0]:"";
  }

  function ensureWrap(btn){
    // If already wrapped, return existing wrap+thumb
    const existing = btn.parentElement && btn.parentElement.classList && btn.parentElement.classList.contains("rc-openwrap")
      ? btn.parentElement
      : null;
    if(existing){
      let thumb = existing.querySelector(".rc-thumb");
      if(!thumb){
        thumb = document.createElement("div");
        thumb.className="rc-thumb";
        existing.insertBefore(thumb, existing.firstChild);
      }
      return {wrap: existing, thumb};
    }
    // Create wrapper
    const wrap = document.createElement("span");
    wrap.className="rc-openwrap";
    const thumb = document.createElement("div");
    thumb.className="rc-thumb";
    const parent = btn.parentNode;
    if(!parent) return null;
    parent.insertBefore(wrap, btn);
    wrap.appendChild(thumb);
    wrap.appendChild(btn);
    return {wrap, thumb};
  }

  function enhance(){
    try{
      injectCSS();
      let changed=0;
      document.querySelectorAll("button").forEach(btn=>{
        const t=(btn.textContent||"").trim().toLowerCase();
        if(t!=="open") return;

        const card=findCard(btn);
        const callName=extractNameFromCard(card);

        const photo=photoForCallName(callName); // strict match; may be ""

        const obj = ensureWrap(btn);
        if(!obj) return;

        // Update thumb every time (self-heal)
        renderThumb(obj.thumb, photo);

        // Click thumb to open
        if(!obj.thumb._rcBound){
          obj.thumb.addEventListener("click",(e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });
          obj.thumb._rcBound=true;
        }

        // Hide Open button
        btn.style.display="none";

        changed++;
      });

      if(changed>0){
        try{ if(typeof window.rcToast==="function") window.rcToast("Dog thumbnails refreshed"); }catch(e){}
      }
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
