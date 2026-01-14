
/**
 * dog_disposition_patch.js
 * Adds a separate Disposition status (Active | For sale | Transferred | Deceased)
 * under the Status section. Transferred/Deceased auto-archive the dog.
 */
(() => {
  "use strict";
  const DOG_KEY = "breederPro_dogs_store_v3";
  const $ = (id) => document.getElementById(id);

  function loadStore() {
    try { const raw = localStorage.getItem(DOG_KEY); const o = raw ? JSON.parse(raw) : {dogs:[]}; if(!Array.isArray(o.dogs)) o.dogs=[]; return o; }
    catch { return {dogs:[]}; }
  }
  function saveStore(o){ localStorage.setItem(DOG_KEY, JSON.stringify(o)); }
  function nowISO(){ return new Date().toISOString(); }
  function currentDogId(){ return String(window.currentDogId||"").trim(); }
  function getCtx(){
    const id=currentDogId(); if(!id) return null;
    const store=loadStore(); const idx=store.dogs.findIndex(d=>d&&d.dogId===id); if(idx<0) return null;
    return {store, idx, dog: store.dogs[idx]||{}};
  }

  function ensureUI(){
    const sec = document.getElementById("secStatus") || document.getElementById("viewDogProfile");
    if(!sec) return;
    if(document.getElementById("bpDispositionWrap")) return;
    const wrap=document.createElement("div");
    wrap.id="bpDispositionWrap"; wrap.className="timeline-item";
    wrap.innerHTML = `
      <strong>Disposition</strong>
      <div class="muted small" style="margin-top:6px;">Separate from Puppy/Adult. Use for sale/transfer/deceased.</div>
      <label class="label">Disposition</label>
      <select id="dogDisposition">
        <option value="Active">Active</option>
        <option value="For sale">For sale</option>
        <option value="Transferred">Transferred</option>
        <option value="Deceased">Deceased</option>
      </select>`;
    if (document.getElementById("secStatus")) {
      document.getElementById("secStatus").insertAdjacentElement("afterend", wrap);
    } else {
      sec.appendChild(wrap);
    }
  }

  function fill(){
    const ctx=getCtx(); if(!ctx) return; ensureUI();
    const sel=document.getElementById("dogDisposition"); if(!sel) return;
    const v=String(ctx.dog.disposition||"Active");
    sel.value = ["Active","For sale","Transferred","Deceased"].includes(v) ? v : "Active";
  }

  function persist(){
    const ctx=getCtx(); if(!ctx) return;
    const sel=document.getElementById("dogDisposition"); if(!sel) return;
    const v=String(sel.value||"Active");
    ctx.dog.disposition = v;
    if (v==="Transferred" || v==="Deceased"){
      ctx.dog.archived = true;
      ctx.dog.archivedAt = ctx.dog.archivedAt || nowISO();
    } else {
      ctx.dog.archived = false;
      ctx.dog.archivedAt = null;
    }
    ctx.store.dogs[ctx.idx]=ctx.dog; saveStore(ctx.store);
  }

  function bind(){
    const profile=document.getElementById("viewDogProfile"); if(!profile||profile._bpDispBound) return;
    profile.addEventListener("change",(e)=>{ if(e.target && e.target.id==="dogDisposition"){ try{persist();}catch{} } }, true);
    profile.addEventListener("click",(e)=>{
      const btn = e.target && e.target.closest ? e.target.closest("button") : null;
      if(!btn) return;
      const t=(btn.textContent||"").toLowerCase(); const i=(btn.id||"").toLowerCase();
      if(i.includes("save") || t.includes("save")) setTimeout(()=>{ try{persist();}catch{} }, 80);
    }, true);
    profile._bpDispBound=true;
  }

  function apply(){ ensureUI(); fill(); bind(); }
  function hook(){
    const prev = window.__afterShow;
    if(prev && prev._bpDispWrap) return;
    window.__afterShow = function(v){ try{ if(typeof prev==="function") prev(v);}catch{} if(v==="DogProfile") setTimeout(apply,0); };
    window.__afterShow._bpDispWrap=true;
  }
  document.addEventListener("DOMContentLoaded", ()=>{ hook(); apply(); setInterval(apply,1200); });
})();
