// photo_bind_per_dog.js — v1
// Goal: one CURRENT photo per dog (no bleed).
// Strategy:
// 1) Maintain localStorage map: rc_dog_photos_v1 { "<dogKey>": "<dataUrl>" }
//    dogKey defaults to Call Name (lowercased). (If dogId exists in store, we also store under dogId.)
// 2) On dog profile page, whenever a photo preview <img> updates, store it under current dogKey.
// 3) On dog list, thumbnails read from this map first, then fall back to dog.photoDataUrl etc.
// 4) Always overwrite: one current photo per dog.

(function(){
  const KEY="rc_dog_photos_v1";

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function loadMap(){
    try{ return JSON.parse(localStorage.getItem(KEY)||"{}") || {}; }catch(e){ return {}; }
  }
  function saveMap(m){
    try{ localStorage.setItem(KEY, JSON.stringify(m||{})); }catch(e){}
  }

  function getDogStore(){
    const keys=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];
    for(const k of keys){
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

  function currentDogKeyFromProfile(){
    const ids=["dogCallName","callName","bp_dog_callName","profileCallName"];
    for(const id of ids){
      const el=document.getElementById(id);
      if(el && (el.value||"").trim()) return norm(el.value);
    }
    const h = document.querySelector("#viewDogProfile .h, #viewDogProfile strong");
    if(h && h.textContent) return norm(h.textContent);
    return "";
  }

  function currentDogIdFromStore(callKey){
    try{
      const dogs=getDogStore();
      const d=dogs.find(x => norm(x.callName||x.name)===callKey);
      return d ? String(d.dogId||d.id||"") : "";
    }catch(e){ return ""; }
  }

  function setPhotoForDog(callKey, dataUrl){
    if(!callKey || !dataUrl) return;
    const m=loadMap();
    m[callKey]=dataUrl;
    const id=currentDogIdFromStore(callKey);
    if(id) m["id:"+id]=dataUrl;
    saveMap(m);
    try{ if(window.rcToast) window.rcToast("Photo saved"); }catch(e){}
  }

  function getPhotoForDog(callKey){
    const m=loadMap();
    if(!callKey) return "";
    const id=currentDogIdFromStore(callKey);
    if(id && m["id:"+id]) return m["id:"+id];
    return m[callKey] || "";
  }

  function watchProfilePhoto(){
    const imgs = Array.from(document.querySelectorAll("img"));
    imgs.forEach(img=>{
      const id=(img.id||"").toLowerCase();
      const cls=(img.className||"").toString().toLowerCase();
      if(!(id.includes("photo") || cls.includes("photo") || cls.includes("avatar"))) return;
      if(img._rcWatched) return;
      img._rcWatched=true;
      let last="";
      const obs=new MutationObserver(()=>{
        const src=img.src||"";
        if(src && src.startsWith("data:image") && src!==last){
          last=src;
          const callKey=currentDogKeyFromProfile();
          if(callKey) setPhotoForDog(callKey, src);
        }
      });
      obs.observe(img, {attributes:true, attributeFilter:["src"]});
    });
  }

  function updateDogListThumbs(){
    const buttons = Array.from(document.querySelectorAll("button")).filter(b=>(b.textContent||"").trim().toLowerCase()==="open");
    buttons.forEach(btn=>{
      const card = btn.closest(".card") || btn.parentElement;
      if(!card) return;

      const nameEl = card.querySelector(".h") || card.querySelector("strong");
      const call = nameEl ? nameEl.textContent.trim() : "";
      const callKey = norm(call);
      const photo = getPhotoForDog(callKey);

      let wrap = btn.parentElement && btn.parentElement.classList && btn.parentElement.classList.contains("rc-openwrap") ? btn.parentElement : null;
      if(!wrap){
        wrap=document.createElement("span");
        wrap.className="rc-openwrap";
        wrap.style.display="flex";
        wrap.style.alignItems="center";
        wrap.style.gap="10px";
        btn.parentNode.insertBefore(wrap, btn);
        wrap.appendChild(btn);
      }
      let thumb = wrap.querySelector(".rc-thumb");
      if(!thumb){
        thumb=document.createElement("div");
        thumb.className="rc-thumb";
        thumb.style.width="66px";
        thumb.style.height="54px";
        thumb.style.borderRadius="12px";
        thumb.style.border="1px solid rgba(255,255,255,0.18)";
        thumb.style.background="rgba(255,255,255,0.06)";
        thumb.style.overflow="hidden";
        thumb.style.display="flex";
        thumb.style.alignItems="center";
        thumb.style.justifyContent="center";
        thumb.style.padding="6px";
        thumb.style.textAlign="center";
        thumb.style.lineHeight="1.05";
        thumb.style.color="rgba(242,242,242,0.85)";
        wrap.insertBefore(thumb, btn);
        thumb.addEventListener("click",(e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });
      }
      thumb.innerHTML="";
      if(photo){
        const img=document.createElement("img");
        img.src=photo;
        img.style.width="100%"; img.style.height="100%"; img.style.objectFit="cover"; img.style.display="block";
        thumb.appendChild(img);
      }else{
        thumb.innerHTML=`<span style="font-size:16px;display:block;">📷</span><span style="font-size:11px;opacity:.9;margin-top:2px;display:block;">Add photo</span>`;
      }

      btn.style.display="none";
    });
  }

  function tick(){
    watchProfilePhoto();
    updateDogListThumbs();
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    tick();
    setInterval(tick, 1200);
  });
})();