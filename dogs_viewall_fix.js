// dogs_viewall_fix.js — v2
// Ensures "View all" truly shows all dogs after using males/females filters.
// Works by binding the View all button (by id or by text) and clearing filter state.

(function(){
  function doViewAll(){
    try{ window.dogsViewMode = "All"; }catch(e){}
    try{ dogsViewMode = "All"; }catch(e){}
    // Clear known filter vars
    ["dogsSexFilter","sexFilter","dogSexFilter","dogsGenderFilter","dogsFilterSex"].forEach(k=>{
      try{ if(typeof window[k] !== "undefined") window[k] = "all"; }catch(e){}
    });
    try{
      const pill=document.getElementById("dogsCurrentViewPill");
      if(pill) pill.textContent="All";
    }catch(e){}
    try{
      const w=document.getElementById("dogsUnassignedWrap");
      if(w) w.classList.add("hide");
    }catch(e){}
    try{ if(typeof window.renderDogs==="function") window.renderDogs(); }catch(e){}
    try{ if(typeof renderDogs==="function") renderDogs(); }catch(e){}
  }

  function bind(){
    try{
      // bind by id if present
      const byId = document.getElementById("btnViewAllDogs");
      if(byId && !byId._rcBound){
        byId.addEventListener("click", (e)=>{ e.preventDefault(); doViewAll(); });
        byId._rcBound=true;
      }
      // bind by text
      document.querySelectorAll("button").forEach(b=>{
        const t=(b.textContent||"").trim().toLowerCase();
        if(t==="view all" && !b._rcBoundText){
          b.addEventListener("click", (e)=>{ e.preventDefault(); doViewAll(); });
          b._rcBoundText=true;
        }
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", bind);
  setInterval(bind, 900);
})();
