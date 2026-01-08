// dogs_viewall_fix.js — v4
(function(){
  function clear(){
    const keys=["dogsSexFilter","sexFilter","dogSexFilter","dogsGenderFilter","dogsFilterSex","dogsOnlySex",
      "dogsShowFemalesOnly","dogsShowMalesOnly","showFemalesOnly","showMalesOnly","dogsFilterGender"];
    keys.forEach(k=>{
      try{
        if(typeof window[k]==="boolean") window[k]=false;
        else if(typeof window[k]==="string") window[k]="all";
        else if(typeof window[k]!=="undefined") window[k]=null;
      }catch(e){}
    });
  }
  function setModeAll(){
    try{ window.dogsViewMode="All"; }catch(e){}
    try{ dogsViewMode="All"; }catch(e){}
    clear();
    try{ if(typeof window.renderDogs==="function") window.renderDogs(); }catch(e){}
  }
  function bind(){
    try{
      document.querySelectorAll("button").forEach(b=>{
        const t=(b.textContent||"").trim().toLowerCase();
        if(t==="view all" && !b._rcAll){
          b.addEventListener("click",(e)=>{e.preventDefault(); setModeAll();});
          b._rcAll=true;
        }
      });
    }catch(e){}
  }
  function wrap(){
    try{
      if(typeof window.renderDogs!=="function" || window.renderDogs._rcWrapped) return;
      const orig=window.renderDogs;
      window.renderDogs=function(){
        try{
          if((window.dogsViewMode||"").toString().toLowerCase()==="all"){ clear(); }
        }catch(e){}
        return orig.apply(this, arguments);
      };
      window.renderDogs._rcWrapped=true;
    }catch(e){}
  }
  document.addEventListener("DOMContentLoaded",()=>{wrap(); bind(); setInterval(()=>{wrap(); bind();},900);});
})();