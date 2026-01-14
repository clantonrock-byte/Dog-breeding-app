
/**
 * dog_status_hide_lifestage_when_adult.js
 *
 * Hides the Puppy/Adult selector once the dog is not Puppy (e.g., Adult).
 * Keeps a compact pill/label, and keeps the Disposition selector visible.
 */
(() => {
  "use strict";

  const DOG_KEY="breederPro_dogs_store_v3";
  const $ = (id)=>document.getElementById(id);

  function loadDogs(){
    try{ const raw=localStorage.getItem(DOG_KEY); const o=raw?JSON.parse(raw):{dogs:[]}; if(!Array.isArray(o.dogs)) o.dogs=[]; return o; }
    catch{ return {dogs:[]}; }
  }
  function currentDog(){
    const id=String(window.currentDogId||"").trim(); if(!id) return null;
    const store=loadDogs(); const dog=store.dogs.find(d=>d&&d.dogId===id) || null; return dog;
  }

  function hideLifeStageWhenAdult(){
    const dog=currentDog(); if(!dog) return;
    const status=String(dog.status||"").trim().toLowerCase();
    const isAdultLike = status && status !== "puppy";

    const sec = $("secStatus") || document.getElementById("viewDogProfile");
    if(!sec) return;

    // Hide helper buttons if present
    const helper = $("bpStatusButtons");
    if(helper) helper.classList.add("hide");

    // Hide the life-stage <select> and its label, but keep the top pill showing current status
    const sel = $("dogStatus");
    if (isAdultLike && sel) {
      // hide the select
      sel.classList.add("hide");
      sel.setAttribute("disabled","disabled");

      // hide adjacent label if directly above
      const prev = sel.previousElementSibling;
      if(prev && prev.tagName.toLowerCase()==="label") prev.classList.add("hide");
    }

    // Make sure the pill remains visible for reference
    const pill = $("dogStatusPill");
    if(pill){ pill.classList.add("bp-locked"); }

    // Ensure the Disposition block stays visible (created by dog_disposition_patch.js)
    const disp = document.getElementById("bpDispositionWrap");
    if(disp) disp.classList.remove("hide");
  }

  function apply(){ hideLifeStageWhenAdult(); }

  function hook(){
    const prev=window.__afterShow;
    if(prev && prev._bpHideLifeStageWrapped) return;
    window.__afterShow = function(v){ try{ if(typeof prev==="function") prev(v);}catch{} if(v==="DogProfile") setTimeout(apply,0); };
    window.__afterShow._bpHideLifeStageWrapped=true;
  }

  document.addEventListener("DOMContentLoaded", ()=>{ hook(); apply(); setInterval(apply,1200); });
})();
