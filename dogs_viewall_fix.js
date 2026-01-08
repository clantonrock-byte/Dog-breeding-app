// dogs_viewall_fix.js — v3
// Fix: View all must truly show ALL dogs after using females/males filters.
// We clear known filter vars AND force renderDogs to ignore sex filter when mode=All.

(function(){
  function clearSexFilters(){
    const candidates = [
      "dogsSexFilter","sexFilter","dogSexFilter","dogsGenderFilter","dogsFilterSex","dogsOnlySex",
      "dogsSex","dogsGender","dogsViewSex","dogsViewGender","filterSex","filterGender","dogsFilterGender",
      "dogsShowFemalesOnly","dogsShowMalesOnly","showFemalesOnly","showMalesOnly"
    ];
    candidates.forEach(k=>{
      try{
        if(typeof window[k] === "boolean") window[k] = false;
        else if(typeof window[k] === "string") window[k] = "all";
        else if(typeof window[k] !== "undefined") window[k] = null;
      }catch(e){}
    });
  }

  function doViewAll(){
    try{ window.dogsViewMode = "All"; }catch(e){}
    try{ dogsViewMode = "All"; }catch(e){}
    clearSexFilters();
    try{
      const pill=document.getElementById("dogsCurrentViewPill");
      if(pill) pill.textContent="All";
    }catch(e){}
    try{
      const w=document.getElementById("dogsUnassignedWrap");
      if(w) w.classList.add("hide");
    }catch(e){}
    try{ if(typeof window.renderDogs==="function") window.renderDogs(); }catch(e){}
  }

  function wrapRenderDogs(){
    try{
      if(typeof window.renderDogs!=="function" || window.renderDogs._rcWrappedAll) return;
      const orig = window.renderDogs;
      window.renderDogs = function(){
        // If view is All, clear sex filters just-in-time before rendering
        try{
          if((window.dogsViewMode||"").toString().toLowerCase()==="all"){
            clearSexFilters();
          }
        }catch(e){}
        return orig.apply(this, arguments);
      };
      window.renderDogs._rcWrappedAll = true;
    }catch(e){}
  }

  function bind(){
    try{
      const byId = document.getElementById("btnViewAllDogs");
      if(byId && !byId._rcBound){
        byId.addEventListener("click", (e)=>{ e.preventDefault(); doViewAll(); });
        byId._rcBound=true;
      }
      document.querySelectorAll("button").forEach(b=>{
        const t=(b.textContent||"").trim().toLowerCase();
        if(t==="view all" && !b._rcBoundText){
          b.addEventListener("click", (e)=>{ e.preventDefault(); doViewAll(); });
          b._rcBoundText=true;
        }
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    wrapRenderDogs();
    bind();
    setInterval(()=>{ wrapRenderDogs(); bind(); }, 900);
  });
})();
