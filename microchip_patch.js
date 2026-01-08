// microchip_patch.js — immutable microchip entries w/ double-confirm on manual entry
// Works by hooking #btnAddMicrochip and enhancing the microchip panel after renderDogProfile runs.
// Assumes app defines: renderDogProfile(d), updateDog(d), getDog(dogId), window.__curDogId or current dog selection.
// Safe no-op if elements/functions not found.

(function(){
  function fmtMDY(ts){
    try{
      const d = new Date(ts);
      return d.toLocaleDateString('en-US'); // M/D/YYYY
    }catch(e){ return ""; }
  }

  function ensureArrayMicrochips(d){
    if(!d) return;
    if(!Array.isArray(d.microchips)) d.microchips = [];
    // migrate legacy single microchip if present
    if(d.microchip && d.microchip.value){
      const exists = d.microchips.some(x => String(x.value) === String(d.microchip.value));
      if(!exists){
        d.microchips.push({
          value: String(d.microchip.value),
          atUtc: d.microchip.lockedAt || new Date().toISOString(),
          source: "legacy"
        });
      }
      // keep legacy object but do not allow editing
    }
  }

  function getCurrentDog(){
    try{
      // Try common globals
      if(typeof window.__curDogId === "string" && typeof window.getDog === "function") return window.getDog(window.__curDogId);
    }catch(e){}
    try{
      if(typeof window.curDogId === "string" && typeof window.getDog === "function") return window.getDog(window.curDogId);
    }catch(e){}
    try{
      // Some builds keep current dog object
      if(window.__curDog && typeof window.__curDog === "object") return window.__curDog;
    }catch(e){}
    return null;
  }

  function saveDog(d){
    try{
      if(typeof window.updateDog === "function"){ window.updateDog(d); return true; }
    }catch(e){}
    // fallback: try loadDogs/saveDogs
    try{
      if(typeof window.loadDogs === "function" && typeof window.saveDogs === "function"){
        const store = window.loadDogs();
        const dogs = store.dogs || [];
        const id = d.dogId || d.id;
        const i = dogs.findIndex(x => (x.dogId||x.id) === id);
        if(i>=0) dogs[i]=d; else dogs.push(d);
        store.dogs = dogs;
        window.saveDogs(store);
        return true;
      }
    }catch(e){}
    return false;
  }

  function toast(msg){
    try{ if(typeof window.rcToast==="function") window.rcToast(msg); }catch(e){}
  }

  function ensureDialog(){
    if(document.getElementById("dlgMicrochip")) return;
    const dlg = document.createElement("dialog");
    dlg.id = "dlgMicrochip";
    dlg.innerHTML = `
      <div style="font-weight:900;font-size:16px;margin-bottom:8px;">Add microchip (manual)</div>
      <div style="opacity:.75;font-size:12px;margin-bottom:10px;">Enter the microchip number twice to confirm. This record cannot be edited later.</div>

      <label style="display:block;font-size:12px;opacity:.8;margin-bottom:6px;">Microchip number</label>
      <input id="mc1" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:#f2f2f2;font-size:16px;" inputmode="numeric" autocomplete="off" />

      <label style="display:block;font-size:12px;opacity:.8;margin:10px 0 6px;">Confirm microchip number</label>
      <input id="mc2" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:#f2f2f2;font-size:16px;" inputmode="numeric" autocomplete="off" />

      <div id="mcMatch" style="font-size:12px;opacity:.85;margin-top:10px;"></div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;justify-content:flex-end;">
        <button id="mcCancel" class="btn" type="button">Cancel</button>
        <button id="mcSave" class="btn btn-primary" type="button" disabled>Save microchip</button>
      </div>
    `;
    document.body.appendChild(dlg);

    const mc1 = dlg.querySelector("#mc1");
    const mc2 = dlg.querySelector("#mc2");
    const match = dlg.querySelector("#mcMatch");
    const save = dlg.querySelector("#mcSave");
    const cancel = dlg.querySelector("#mcCancel");

    function check(){
      const a=(mc1.value||"").trim();
      const b=(mc2.value||"").trim();
      const ok = a.length>0 && a===b;
      save.disabled = !ok;
      match.textContent = ok ? "✓ Numbers match" : (b.length>0 ? "✕ Numbers do not match" : "");
    }
    mc1.addEventListener("input", check);
    mc2.addEventListener("input", check);

    cancel.addEventListener("click", ()=>dlg.close());

    save.addEventListener("click", ()=>{
      const v=(mc1.value||"").trim();
      if(!v) return;
      const d=getCurrentDog();
      if(!d){ alert("No dog selected."); return; }
      ensureArrayMicrochips(d);

      // immutable append-only
      d.microchips.push({ value: v, atUtc: new Date().toISOString(), source: "manual" });

      // also maintain legacy microchip view by setting last chip, but never edit it
      d.microchip = d.microchip || { value:"", locked:true, lockedAt:null };
      d.microchip.value = v;
      d.microchip.locked = true;
      d.microchip.lockedAt = new Date().toISOString();

      saveDog(d);
      toast("Microchip saved");
      dlg.close();

      // re-render profile if possible
      try{ if(typeof window.renderDogProfile==="function") window.renderDogProfile(d); }catch(e){}
    });
  }

  function renderMicrochipList(d){
    try{
      const host = document.getElementById("microchipValueWrap");
      if(!host) return;
      ensureArrayMicrochips(d);
      // add a list container if missing
      let list = document.getElementById("microchipList");
      if(!list){
        list = document.createElement("div");
        list.id = "microchipList";
        list.style.marginTop = "10px";
        host.appendChild(list);
      }
      const items = (d.microchips||[]).slice().reverse();
      list.innerHTML = items.length ? items.map(x=>{
        const when = fmtMDY(x.atUtc);
        return `<div class="muted small" style="margin-top:6px;">
          ${when} · <span class="big-code" style="display:inline-block;margin-left:6px;">${String(x.value).replaceAll("<","&lt;")}</span>
        </div>`;
      }).join("") : "";
      // allow adding another chip
      const btn = document.getElementById("btnAddMicrochip");
      if(btn){
        btn.disabled = false;
        btn.textContent = (items.length ? "Add another microchip" : "Add microchip");
      }
    }catch(e){}
  }

  function bind(){
    try{
      const btn = document.getElementById("btnAddMicrochip");
      if(btn && !btn._mcBound){
        btn.addEventListener("click", (e)=>{
          e.preventDefault();
          ensureDialog();
          const dlg = document.getElementById("dlgMicrochip");
          if(dlg && typeof dlg.showModal==="function") dlg.showModal();
        });
        btn._mcBound=true;
      }
    }catch(e){}
  }

  // Wrap renderDogProfile so we can update microchip section after each render
  function wrapRender(){
    try{
      if(typeof window.renderDogProfile!=="function" || window.renderDogProfile._mcWrapped) return;
      const orig = window.renderDogProfile;
      window.renderDogProfile = function(d){
        const r = orig.apply(this, arguments);
        try{ renderMicrochipList(d); }catch(e){}
        try{ bind(); }catch(e){}
        return r;
      };
      window.renderDogProfile._mcWrapped = true;
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    wrapRender();
    bind();
  });
  setInterval(()=>{ wrapRender(); bind(); }, 1200);
})();
