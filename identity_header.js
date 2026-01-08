// identity_header.js — v1A (microchip/rabies pills)
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
  function byId(){
    const s=loadStore(); const m=new Map();
    (s.dogs||[]).forEach(d=>{
      const id=d.dogId||d.id;
      if(id) m.set(String(id), d);
    });
    return m;
  }
  function css(){
    if(document.getElementById("rcIdentityCssV1")) return;
    const st=document.createElement("style");
    st.id="rcIdentityCssV1";
    st.textContent=`
      .rc-id-pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
      .rc-pill{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);opacity:.95;}
      .rc-pill.ok{border-color:rgba(74,144,226,0.55);}
      .rc-pill.warn{border-color:rgba(255,59,48,0.55);}
    `;
    document.head.appendChild(st);
  }
  function hasChip(d){
    try{
      if(d.microchips && Array.isArray(d.microchips) && d.microchips.length) return true;
      if(d.microchip && d.microchip.value) return true;
    }catch(e){}
    return false;
  }
  function hasRabies(d){
    try{
      if(d.rabiesDate) return true;
      if(d.immunizationEvents && Array.isArray(d.immunizationEvents))
        return d.immunizationEvents.some(ev => (ev.type||"").toLowerCase().includes("rabies"));
    }catch(e){}
    return false;
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
      const m=byId();
      const scope=document.getElementById("viewDogs")||document.body;
      scope.querySelectorAll(".card").forEach(card=>{
        if(card._rcIdPills) return;
        const openBtn=Array.from(card.querySelectorAll("button")).find(b=>(b.textContent||"").trim().toLowerCase()==="open");
        if(!openBtn) return;
        const id=dogIdFromOpen(openBtn);
        const d=id?m.get(String(id)):null;
        if(!d) return;
        const chip=hasChip(d);
        const rab=hasRabies(d);
        const wrap=document.createElement("div");
        wrap.className="rc-id-pills";
        wrap.innerHTML=`<span class="rc-pill ${chip?'ok':'warn'}">Microchip: ${chip?'On file':'None'}</span>
                        <span class="rc-pill ${rab?'ok':'warn'}">Rabies: ${rab?'On file':'None'}</span>`;
        card.insertBefore(wrap, card.children[1]||null);
        card._rcIdPills=true;
      });
    }catch(e){}
  }
  document.addEventListener("DOMContentLoaded",()=>{enhance(); setInterval(enhance,1400);});
})();