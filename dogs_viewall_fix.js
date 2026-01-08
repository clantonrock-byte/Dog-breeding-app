// dogs_viewall_fix.js
// Fix: After filtering by males/females, "View all" must truly show all dogs.
// We enforce dogsViewMode="All" and clear any sex filter flags, then renderDogs().

(function(){
  function bind(){
    try{
      const btnAll = document.getElementById("btnViewAllDogs");
      if(btnAll && !btnAll._rcBound){
        btnAll.addEventListener("click", ()=>{
          try{ window.dogsViewMode = "All"; }catch(e){}
          try{ dogsViewMode = "All"; }catch(e){}
          // Clear any ad-hoc sex filter vars used by some builds
          ["dogsSexFilter","sexFilter","dogSexFilter","dogsGenderFilter"].forEach(k=>{
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
        });
        btnAll._rcBound = true;
      }
    }catch(e){}
  }
  document.addEventListener("DOMContentLoaded", bind);
  setInterval(bind, 800);
})();
