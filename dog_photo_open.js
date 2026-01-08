// dog_photo_open.js — v7 (anchored + photo map + hides Open)
(function(){
  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];
  function loadStore(){
    for(const k of DOG_KEYS){
      try{
        const raw=localStorage.getItem(k); if(!raw) continue;
        const obj=JSON.parse(raw);
        if(Array.isArray(obj)) return {dogs:obj};
        if(obj && Array.isArray(obj.dogs)) return obj;
      }catch(e){}
    }
    return {dogs:[]};
  }
  function buildMap(){
    const s=loadStore(); const byId=new Map(); const byCall=new Map();
    (s.dogs||[]).forEach(d=>{
      const id=d.dogId||d.id;
      const call=(d.callName||d.name||"").toString().trim().toLowerCase();
      const photo=d.photoDataUrl||d.photo||d.photoUrl||d.photoURI||"";
      if(id) byId.set(String(id), photo);
      if(call) byCall.set(call, photo);
    });
    return {byId,byCall};
  }
  function css(){
    if(document.getElementById("rcDogThumbCssV7")) return;
    const st=document.createElement("style");
    st.id="rcDogThumbCssV7";
    st.textContent=`
      .rc-thumbrow{display:flex;gap:12px;align-items:center;margin-bottom:10px;}
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
      .rc-thumbtext{flex:1;min-width:0;}
      .rc-thumbtext .n{font-weight:900;}
      .rc-thumbtext .s{opacity:.75;font-size:12px;margin-top:2px;}
    `;
    document.head.appendChild(st);
  }
  function mkThumb(src){
    const el=document.createElement("div"); el.className="rc-thumb";
    if(src){ const img=document.createElement("img"); img.src=src; el.appendChild(img); }
    else el.innerHTML=`<span class="cam">📷</span><span class="txt">Add photo</span>`;
    return el;
  }
  function dogIdFromOpen(btn){
    try{
      const oc=btn.getAttribute("onclick")||"";
      const m=oc.match(/__openDog\(['\"]([^'\"]+)['\"]\)/);
      if(m) return m[1];
    }catch(e){}
    return "";
  }
  function enhance(){
    try{
      css();
      const maps=buildMap();
      const scope=document.getElementById("viewDogs")||document.body;
      scope.querySelectorAll(".card").forEach(card=>{
        if(card._rcThumbV7) return;
        const openBtn=Array.from(card.querySelectorAll("button")).find(b=>(b.textContent||"").trim().toLowerCase()==="open");
        if(!openBtn) return;
        const id=dogIdFromOpen(openBtn);
        const nameEl=card.querySelector(".h")||card.querySelector("strong");
        const subEl=card.querySelector(".sub")||card.querySelector(".small");
        const name=nameEl?nameEl.textContent.trim():"Dog";
        const callKey=name.toLowerCase();
        let photo="";
        if(id && maps.byId.has(String(id))) photo=maps.byId.get(String(id))||"";
        if(!photo && maps.byCall.has(callKey)) photo=maps.byCall.get(callKey)||"";
        const row=document.createElement("div"); row.className="rc-thumbrow";
        const thumb=mkThumb(photo);
        const text=document.createElement("div"); text.className="rc-thumbtext";
        text.innerHTML=`<div class="n">${name}</div>${subEl?`<div class="s">${subEl.textContent.trim()}</div>`:""}`;
        row.appendChild(thumb); row.appendChild(text);
        card.insertBefore(row, card.firstChild);
        const open=()=>openBtn.click();
        thumb.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();open();});
        text.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();open();});
        openBtn.style.display="none";
        card._rcThumbV7=true;
      });
    }catch(e){}
  }
  document.addEventListener("DOMContentLoaded",()=>{enhance(); setInterval(enhance,1200);});
})();