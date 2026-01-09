// dog_photo_per_callname.js — v2
// One current photo per dog keyed by Call Name, no bleed.
// Built-in toast fallback, and list reflects photo stored on dog record when available.

(function(){
  const MAP_KEY="rc_dog_photos_v1";
  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];
  const LEGACY_KEYS=["dogPhoto","bp_dog_photo","rc_dog_photo","dog_photo","dogPhotoDataUrl"];
  const FLAG_CLEAN="rc_photo_cleanup_v1";

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function toast(msg){
    try{ if(typeof window.rcToast==="function"){ window.rcToast(msg); return; } }catch(e){}
    try{
      let el=document.getElementById("rcToastLite");
      if(!el){
        el=document.createElement("div");
        el.id="rcToastLite";
        el.style.position="fixed";
        el.style.left="12px";
        el.style.right="12px";
        el.style.bottom="18px";
        el.style.zIndex="999999";
        el.style.display="none";
        el.style.background="rgba(0,0,0,0.78)";
        el.style.color="#f2f2f2";
        el.style.border="1px solid rgba(255,255,255,0.18)";
        el.style.borderRadius="14px";
        el.style.padding="10px 12px";
        el.style.fontSize="14px";
        document.body.appendChild(el);
      }
      el.textContent=String(msg||"");
      el.style.display="block";
      clearTimeout(el._t);
      el._t=setTimeout(function(){ el.style.display="none"; }, 1400);
    }catch(e){}
  }

  function loadMap(){
    try{ return JSON.parse(localStorage.getItem(MAP_KEY)||"{}") || {}; }catch(e){ return {}; }
  }
  function saveMap(m){
    try{ localStorage.setItem(MAP_KEY, JSON.stringify(m||{})); }catch(e){}
  }

  function cleanupLegacyOnce(){
    try{
      if(localStorage.getItem(FLAG_CLEAN)==="1") return;
      LEGACY_KEYS.forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} });
      localStorage.setItem(FLAG_CLEAN,"1");
    }catch(e){}
  }

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

  function photoFromStore(callKey){
    if(!callKey) return "";
    const dogs=loadDogs();
    const d=dogs.find(function(x){ return norm(x.callName||x.name)===callKey; });
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function setPhoto(callKey, dataUrl, prettyName){
    if(!callKey || !dataUrl) return;
    const m=loadMap();
    m[callKey]=dataUrl;
    saveMap(m);
    toast("Photo saved for " + (prettyName||callKey));
  }

  function getPhoto(callKey){
    const m=loadMap();
    if(callKey && m[callKey]) return m[callKey];
    return photoFromStore(callKey) || "";
  }

  function injectCSS(){
    if(document.getElementById("rcDogPhotoCallCssV2")) return;
    const st=document.createElement("style");
    st.id="rcDogPhotoCallCssV2";
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
      el.innerHTML='<span class="cam">📷</span><span class="txt">Add photo</span>';
    }
    return el;
  }

  function pickPhotoFor(callName, onDone){
    const input=document.createElement("input");
    input.type="file";
    input.accept="image/*";
    input.className="rc-file";
    input.addEventListener("change", function(){
      const file=input.files && input.files[0];
      if(!file) return;
      const reader=new FileReader();
      reader.onload=function(){ onDone(String(reader.result||"")); };
      reader.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(function(){ try{ document.body.removeChild(input); }catch(e){} }, 30000);
  }

  function findCard(btn){
    return btn.closest(".card") || btn.parentElement;
  }
  function extractCallNameFromCard(card){
    if(!card) return "";
    const nameEl = card.querySelector(".h") || card.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines=(card.innerText||card.textContent||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
    return lines.length?lines[0]:"";
  }

  function seedFromProfile(){
    try{
      const ids=["dogCallName","callName","bp_dog_callName","profileCallName"];
      let call="";
      for(const id of ids){
        const el=document.getElementById(id);
        if(el && (el.value||"").trim()){ call=el.value.trim(); break; }
      }
      const callKey=norm(call);
      if(!callKey) return;
      const imgs=Array.from(document.querySelectorAll("img"));
      for(const img of imgs){
        const src=img.src||"";
        if(src.startsWith("data:image")){
          const m=loadMap();
          if(!m[callKey]){
            m[callKey]=src;
            saveMap(m);
            toast("Photo synced to list for " + call);
          }
          break;
        }
      }
    }catch(e){}
  }

  function enhance(){
    cleanupLegacyOnce();
    injectCSS();
    seedFromProfile();

    const buttons = Array.from(document.querySelectorAll("button"))
      .filter(function(b){ return (b.textContent||"").trim().toLowerCase() === "open"; });

    buttons.forEach(function(btn){
      const card=findCard(btn);
      if(!card) return;
      const callName=extractCallNameFromCard(card);
      const callKey=norm(callName);
      if(!callKey) return;

      let wrap = btn.parentElement && btn.parentElement.classList && btn.parentElement.classList.contains("rc-openwrap") ? btn.parentElement : null;
      if(!wrap){
        wrap=document.createElement("span");
        wrap.className="rc-openwrap";
        btn.parentNode.insertBefore(wrap, btn);
        wrap.appendChild(btn);
      }

      const photo = getPhoto(callKey);
      const newThumb = mkThumb(photo);

      const oldThumb = wrap.querySelector(".rc-thumb");
      if(oldThumb) oldThumb.replaceWith(newThumb);
      else wrap.insertBefore(newThumb, btn);

      newThumb.addEventListener("click", function(e){
        e.preventDefault(); e.stopPropagation();
        const curPhoto=getPhoto(callKey);
        if(curPhoto){
          btn.click();
        }else{
          pickPhotoFor(callName, function(dataUrl){
            setPhoto(callKey, dataUrl, callName);
          });
        }
      });

      btn.style.display="none";
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    enhance();
    setInterval(enhance, 1200);
  });
})();
