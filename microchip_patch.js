// microchip_patch.js — v3: immutable microchips + confirm + manufacturer hint + registry lookup (A,C)
(function(){
  function fmtMDY(ts){
    try{ return new Date(ts).toLocaleDateString('en-US'); }catch(e){ return ""; }
  }

  // Best-effort manufacturer heuristics (not authoritative)
  function detectMfr(code){
    const v = String(code||"").replace(/\s+/g,"");
    if(/^\d{15}$/.test(v)){
      if(v.startsWith("985")) return "HomeAgain (likely)";
      if(v.startsWith("956")) return "AKC Reunite (likely)";
      if(v.startsWith("900")) return "ISO (900...) (likely)";
      if(v.startsWith("941")) return "ISO (941...) (likely)";
      if(v.startsWith("98"))  return "ISO (98x...) (likely)";
      return "ISO microchip (likely)";
    }
    if(/^\d{9,10}$/.test(v)) return "Non-ISO numeric (unknown mfr)";
    if(/[A-Za-z]/.test(v)) return "Alphanumeric (unknown mfr)";
    return "Unknown";
  }

  // Registry helper links. Many registries don't support direct-number URL params; in those cases we open the site.
  const REGISTRY_LINKS = [
    { name:"AAHA Universal Pet Microchip Lookup", url:"https://www.aaha.org/your-pet/pet-microchip-lookup/" },
    { name:"AKC Reunite", url:"https://www.akcreunite.org/" },
    { name:"HomeAgain", url:"https://www.homeagain.com/" },
    { name:"Found Animals / Microchip Registry", url:"https://www.found.org/" },
    { name:"24PetWatch", url:"https://www.24petwatch.com/" }
  ];

  function openRegistry(name, baseUrl, code){
    // Try a query-based fallback using the registry name + chip number
    try{
      const q = encodeURIComponent(name + " microchip lookup " + code);
      // Open a web search in a new tab (works everywhere, no API needed)
      window.open("https://www.google.com/search?q="+q, "_blank", "noopener");
    }catch(e){
      window.open(baseUrl, "_blank", "noopener");
    }
  }

  async function copyText(t){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(String(t));
        return true;
      }
    }catch(e){}
    // fallback
    try{
      const ta=document.createElement("textarea");
      ta.value=String(t);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    }catch(e){}
    return false;
  }

  function ensureArrayMicrochips(d){
    if(!d) return;
    if(!Array.isArray(d.microchips)) d.microchips = [];
    if(d.microchip && d.microchip.value){
      const exists = d.microchips.some(x => String(x.value) === String(d.microchip.value));
      if(!exists){
        d.microchips.push({
          value: String(d.microchip.value),
          atUtc: d.microchip.lockedAt || new Date().toISOString(),
          source: "legacy",
          mfr: d.microchip.mfr || detectMfr(d.microchip.value)
        });
      }
    }
  }

  function getCurrentDog(){
    try{ if(typeof window.currentDogId === "string" && typeof window.getDog === "function") return window.getDog(window.currentDogId); }catch(e){}
    try{ if(typeof window.__curDogId === "string" && typeof window.getDog === "function") return window.getDog(window.__curDogId); }catch(e){}
    try{ if(window.__curDog && typeof window.__curDog === "object") return window.__curDog; }catch(e){}
    return null;
  }

  function saveDog(d){
    try{
      if(typeof window.updateDog === "function"){ window.updateDog(d.dogId, ()=>d); return true; }
    }catch(e){}
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

      <label style="display:block;font-size:12px;opacity:.8;margin:10px 0 6px;">Manufacturer (optional)</label>
      <select id="mcMfr" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:#f2f2f2;font-size:16px;">
        <option value="">Auto-detect</option>
        <option>HomeAgain</option>
        <option>AKC Reunite</option>
        <option>AVID</option>
        <option>Datamars</option>
        <option>ISO (generic)</option>
        <option>Other/Unknown</option>
      </select>

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
    const mfrSel = dlg.querySelector("#mcMfr");

    function check(){
      const a=(mc1.value||"").trim();
      const b=(mc2.value||"").trim();
      const ok = a.length>0 && a===b;
      save.disabled = !ok;
      if(ok){
        const mfr = (mfrSel.value||"").trim() || detectMfr(a);
        match.textContent = "✓ Numbers match" + (mfr ? (" · " + mfr) : "");
      } else {
        match.textContent = (b.length>0 ? "✕ Numbers do not match" : "");
      }
    }
    mc1.addEventListener("input", check);
    mc2.addEventListener("input", check);
    mfrSel.addEventListener("change", check);

    cancel.addEventListener("click", ()=>dlg.close());

    save.addEventListener("click", ()=>{
      const v=(mc1.value||"").trim();
      if(!v) return;
      const d=getCurrentDog();
      if(!d){ alert("No dog selected."); return; }
      ensureArrayMicrochips(d);

      const mfr = (mfrSel.value||"").trim() || detectMfr(v);

      d.microchips.push({ value: v, atUtc: new Date().toISOString(), source: "manual", mfr });

      d.microchip = d.microchip || { value:"", locked:true, lockedAt:null, mfr:"" };
      d.microchip.value = v;
      d.microchip.locked = true;
      d.microchip.lockedAt = new Date().toISOString();
      d.microchip.mfr = mfr;

      saveDog(d);
      toast("Microchip saved");
      dlg.close();

      try{ if(typeof window.renderDogProfile==="function") window.renderDogProfile(d); }catch(e){}
    });
  }

  function renderMicrochipList(d){
    try{
      const host = document.getElementById("microchipValueWrap");
      if(!host) return;
      ensureArrayMicrochips(d);

      let list = document.getElementById("microchipList");
      if(!list){
        list = document.createElement("div");
        list.id = "microchipList";
        list.style.marginTop = "10px";
        host.appendChild(list);
      }

      const items = (d.microchips||[]).slice().reverse();
      list.innerHTML = items.length ? items.map((x, idx)=>{
        const when = fmtMDY(x.atUtc);
        const mfr = x.mfr ? String(x.mfr).replaceAll("<","&lt;") : detectMfr(x.value);
        const code = String(x.value).replaceAll("<","&lt;");
        return `
          <div class="muted small" style="margin-top:8px;">
            ${when} · <span class="big-code" style="display:inline-block;margin-left:6px;">${code}</span>
            <div class="muted small" style="margin-top:4px;">${mfr}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
              <button class="btn" type="button" data-mc="${code}" data-mcname="${mfr}" data-act="copy">Copy #</button>
              <button class="btn btn-primary" type="button" data-mc="${code}" data-mcname="${mfr}" data-act="lookup">Lookup registry</button>
            </div>
          </div>`;
      }).join("") : "";

      // bind buttons
      list.querySelectorAll("button[data-act]").forEach(btn=>{
        if(btn._bound) return;
        btn._bound=true;
        btn.addEventListener("click", async ()=>{
          const code = btn.getAttribute("data-mc") || "";
          const mfr = btn.getAttribute("data-mcname") || "";
          if(btn.getAttribute("data-act")==="copy"){
            const ok = await copyText(code);
            toast(ok ? "Copied" : "Copy failed");
            return;
          }
          // lookup: open registry helper search
          openRegistry("AAHA Universal Pet Microchip Lookup", "https://www.aaha.org/your-pet/pet-microchip-lookup/", code);
        });
      });

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
