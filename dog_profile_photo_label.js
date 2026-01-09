// dog_profile_photo_label.js
// Adds a small label under (or on) the current photo in a dog profile:
// "Current photo · <Call Name>"
// Non-invasive: does not change image data; just displays the dog's call name next to the photo.

(function(){
  function norm(s){ return (s||"").toString().trim(); }

  function getCallName(){
    // Common ids for call name input/display
    const ids=["dogCallName","callName","bp_dog_callName","profileCallName"];
    for(const id of ids){
      const el=document.getElementById(id);
      if(!el) continue;
      const v = ("value" in el) ? el.value : el.textContent;
      if(v && norm(v)) return norm(v);
    }
    // fallback: header in profile
    const h = document.querySelector("#viewDogProfile .h, #viewDogProfile strong");
    if(h && h.textContent) return norm(h.textContent);
    return "";
  }

  function findProfilePhotoImg(){
    // Try to find an image in the dog profile section.
    const scope = document.getElementById("viewDogProfile") || document.body;
    // Prefer images likely to be the dog photo/portrait
    const imgs = Array.from(scope.querySelectorAll("img"));
    if(!imgs.length) return null;
    // Heuristic: pick first data:image or largest image by area
    let best = null;
    let bestArea = 0;
    imgs.forEach(img=>{
      const src = img.getAttribute("src") || "";
      // ignore tiny icons
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      const area = w*h;
      const isData = src.startsWith("data:image");
      if(isData && area >= bestArea){
        best = img; bestArea = area;
      } else if(!best && area > bestArea){
        best = img; bestArea = area;
      }
    });
    return best;
  }

  function ensureLabel(img){
    if(!img) return;
    // Put label right after the image, inside its parent.
    const parent = img.parentElement;
    if(!parent) return;

    let lbl = parent.querySelector(".rc-photo-label");
    if(!lbl){
      lbl = document.createElement("div");
      lbl.className = "rc-photo-label";
      lbl.style.marginTop = "8px";
      lbl.style.fontSize = "12px";
      lbl.style.opacity = "0.85";
      lbl.style.color = "#f2f2f2";
      lbl.style.display = "flex";
      lbl.style.gap = "6px";
      lbl.style.flexWrap = "wrap";
      parent.appendChild(lbl);
    }

    const call = getCallName();
    lbl.textContent = call ? ("Current photo · " + call) : "Current photo";
  }

  function tick(){
    try{
      const img = findProfilePhotoImg();
      ensureLabel(img);
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    tick();
    setInterval(tick, 1000);
  });
})();