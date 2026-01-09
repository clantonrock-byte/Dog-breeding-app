// dog_profile_photo_placeholder_name.js
// Rule: On dog profile page, Call Name = photo placeholder label for that dog.
// If there is no current photo, show a placeholder text like: "Aina · Add photo".
// Non-invasive: does not change stored data.

(function(){
  function norm(s){ return (s||"").toString().trim(); }

  function getCallName(){
    const ids=["dogCallName","callName","bp_dog_callName","profileCallName"];
    for(const id of ids){
      const el=document.getElementById(id);
      if(!el) continue;
      const v = ("value" in el) ? el.value : el.textContent;
      if(v && norm(v)) return norm(v);
    }
    const h=document.querySelector("#viewDogProfile .h, #viewDogProfile strong");
    if(h && h.textContent) return norm(h.textContent);
    return "";
  }

  function profileScope(){
    return document.getElementById("viewDogProfile") || document.body;
  }

  function hasPhoto(scope){
    const imgs = Array.from(scope.querySelectorAll("img"));
    // consider photo present if any reasonably large image has a src
    for(const img of imgs){
      const src = img.getAttribute("src") || "";
      if(!src) continue;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if((w*h) >= 2500) return true; // ~50x50
      if(src.startsWith("data:image")) return true;
    }
    return false;
  }

  function findPhotoContainer(scope){
    // Try common IDs/classes
    const candidates = [
      "#dogPhotoWrap","#photoWrap","#profilePhotoWrap","#dogPhoto",
      ".dog-photo",".profile-photo",".photo-wrap",".avatar-wrap"
    ];
    for(const sel of candidates){
      const el = scope.querySelector(sel);
      if(el) return el;
    }
    // Fallback: nearest container around an "Add photo" button/label
    const add = Array.from(scope.querySelectorAll("button,div,span,a,label")).find(el=>{
      const t=(el.textContent||"").toLowerCase();
      return t.includes("add photo") || t.includes("photo") && t.includes("add");
    });
    if(add) return add.parentElement || add;
    // Last resort: first card in profile
    return scope.querySelector(".card") || scope;
  }

  function ensurePlaceholder(container, callName){
    if(!container) return;
    let ph = container.querySelector("#rcPhotoPlaceholderName");
    if(!ph){
      ph = document.createElement("div");
      ph.id = "rcPhotoPlaceholderName";
      ph.style.marginTop = "8px";
      ph.style.fontSize = "12px";
      ph.style.opacity = "0.9";
      ph.style.color = "#f2f2f2";
      ph.style.display = "inline-block";
      ph.style.padding = "4px 8px";
      ph.style.borderRadius = "999px";
      ph.style.border = "1px solid rgba(255,255,255,0.18)";
      ph.style.background = "rgba(255,255,255,0.06)";
      container.appendChild(ph);
    }
    ph.textContent = callName ? (callName + " · Add photo") : "Add photo";
  }

  function removePlaceholder(scope){
    const ph = scope.querySelector("#rcPhotoPlaceholderName");
    if(ph && ph.parentElement) ph.parentElement.removeChild(ph);
  }

  function tick(){
    try{
      const scope = profileScope();
      const call = getCallName();
      if(!call) return;
      if(hasPhoto(scope)){
        removePlaceholder(scope);
        return;
      }
      const container = findPhotoContainer(scope);
      ensurePlaceholder(container, call);
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    tick();
    setInterval(tick, 900);
  });
})();