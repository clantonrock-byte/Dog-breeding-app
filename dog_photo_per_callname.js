// dog_photo_per_callname.js — v1
// CONFIRMED RULE A: one current photo per dog (keyed by Call Name), overwrite allowed.
// Adds photo thumbnails to dog list and prevents "all dogs same photo" by never using global photo state.
//
// How it works:
// - Stores photos in localStorage key: rc_dog_photos_v1  (object map { "<callname>": "<dataUrl>" })
// - In dog list, for each dog card, shows photo if available, otherwise 📷 Add photo.
// - If photo missing: tapping thumbnail opens file picker to set photo for THAT dog.
// - If photo exists: tapping thumbnail opens the dog profile (triggers existing Open button click).
// - Hides the Open button once thumbnail is installed.
// - One-time cleanup: removes common legacy global photo keys (safe).

(function(){
  const MAP_KEY="rc_dog_photos_v1";
  const LEGACY_KEYS=["dogPhoto","bp_dog_photo","rc_dog_photo","dog_photo","dogPhotoDataUrl"];

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }
  function toast(msg){ try{ if(typeof window.rcToast==="function") window.rcToast(msg); }catch(e){} }

  function loadMap(){
    try{ return JSON.parse(localStorage.getItem(MAP_KEY)||"{}") || {}; }catch(e){ return {}; }
  }
  function saveMap(m){
    try{ localStorage.setItem(MAP_KEY, JSON.stringify(m||{})); }catch(e){}
  }

  function cleanupLegacyOnce(){
    const flag="rc_photo_cleanup_v1";
    try{
      if(localStorage.getItem(flag)==="1") return;
      LEGACY_KEYS.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
      localStorage.setItem(flag,"1");
    }catch(e){}
  }

  function injectCSS(){
    if(document.getElementById("rcDogPhotoCallCss")) return;
    const st=document.createElement("style");
    st.id="rcDogPhotoCallCss";
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
      .rc-thumb .txt{font-size:11px;opacity:.9;margin-top:2px;display:block;}
      .rc-thumb:active{ transform: translateY(1px); }
      input.rc-file{ display:none; }
    `;
    document.head.appendChild(st);
  }

  function mkThumb(photo){
    const el=document.createElement("div");
    el.className="rc-thumb";
    el.innerHTML="";
    if(photo){
      const img=document.createElement("img");
      img.src=photo;
      img.alt="Dog photo";
      el.appendChild(img);
    }else{
      el.innerHTML=`<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return el;
  }

  function findCard(btn){
    return btn.closest(".card") || btn.parentElement;
  }
  function extractCallNameFromCard(card){
    if(!card) return "";
    const nameEl = card.querySelector(".h") || card.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines=(card.innerText||card.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    return lines.length?lines[0]:"";
  }

  function ensureWrap(btn){
    const existing = btn.parentElement && btn.parentElement.classList && btn.parentElement.classList.contains("rc-openwrap")
      ? btn.parentElement : null;
    if(existing){
      let thumb=existing.querySelector(".rc-thumb");
      if(!thumb){
        thumb=document.createElement("div");
        thumb.className="rc-thumb";
        existing.insertBefore(thumb, existing.firstChild);
      }
      return {wrap:existing, thumb};
    }
    const wrap=document.createElement("span");
    wrap.className="rc-openwrap";
    const parent=btn.parentNode;
    if(!parent) return null;
    parent.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    return {wrap, thumb:null};
  }

  function pickPhotoFor(callName, onDone){
    const input=document.createElement("input");
    input.type="file";
    input.accept="image/*";
    input.className="rc-file";
    input.addEventListener("change", ()=>{
      const file=input.files && input.files[0];
      if(!file) return;
      const reader=new FileReader();
      reader.onload=()=>{
        onDone(String(reader.result||""));
      };
      reader.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
    // cleanup node later
    setTimeout(()=>{ try{ document.body.removeChild(input); }catch(e){} }, 30000);
  }

  function enhance(){
    cleanupLegacyOnce();
    injectCSS();
    const map=loadMap();

    const buttons = Array.from(document.querySelectorAll("button"))
      .filter(b => (b.textContent||"").trim().toLowerCase() === "open");

    buttons.forEach(btn=>{
      const card=findCard(btn);
      if(!card) return;
      const callName=extractCallNameFromCard(card);
      const key=norm(callName);
      if(!key) return;

      const wrapObj=ensureWrap(btn);
      if(!wrapObj) return;

      // ensure thumb exists
      let thumb = wrapObj.wrap.querySelector(".rc-thumb");
      if(!thumb){
        thumb=mkThumb(map[key]||"");
        wrapObj.wrap.insertBefore(thumb, btn);
      }else{
        // update thumb state in place
        const photo=map[key]||"";
        thumb.replaceWith(mkThumb(photo));
        thumb = wrapObj.wrap.querySelector(".rc-thumb");
      }

      // bind click once
      if(!thumb._rcBound){
        thumb.addEventListener("click",(e)=>{
          e.preventDefault(); e.stopPropagation();
          const m=loadMap();
          const photo=m[key]||"";
          if(photo){
            btn.click(); // open profile
          }else{
            pickPhotoFor(callName, (dataUrl)=>{
              const mm=loadMap();
              mm[key]=dataUrl; // overwrite allowed
              saveMap(mm);
              toast("Photo saved for " + callName);
              // refresh this thumb immediately
              thumb.replaceWith(mkThumb(dataUrl));
            });
          }
        });
        thumb._rcBound=true;
      }

      // hide Open button
      btn.style.display="none";
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
