// dog_photo_open.js
// Makes the dog list show a photo (or placeholder) and uses it to open the profile.
// Non-invasive: finds existing "Open" buttons and uses their click handler.
// Hides the Open button (optional) to encourage photo-as-open UX.

(function(){
  function mkThumb(src){
    const wrap = document.createElement("div");
    wrap.className = "rc-dog-thumb";
    if(src){
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Dog photo";
      wrap.appendChild(img);
    } else {
      wrap.textContent = "Photo";
    }
    return wrap;
  }

  function enhance(){
    try{
      // Find the dogs list container used by the app family
      const list = document.getElementById("dogsList") || document.querySelector("#viewDogs .dogs-list") || document.querySelector("#viewDogs .list");
      if(!list) return;

      // Find all "Open" buttons inside dog cards
      const openBtns = list.querySelectorAll("button");
      openBtns.forEach(btn=>{
        const t = (btn.textContent||"").trim().toLowerCase();
        if(t !== "open") return;
        if(btn._rcEnhanced) return;

        // Identify the card
        const card = btn.closest(".card") || btn.parentElement;
        if(!card) return;

        // Try to find photoDataUrl in the card dataset or in-memory (not always available).
        // Many builds don't render photos in list yet, so we use a placeholder.
        const thumb = mkThumb(null);

        // Make thumb clickable: trigger the same action as the Open button
        thumb.addEventListener("click", (e)=>{
          e.preventDefault();
          e.stopPropagation();
          btn.click();
        });

        // Insert thumb at the start of the card
        card.style.display = card.style.display || "block";
        card.style.position = card.style.position || "relative";

        // Create a row container if none exists
        let row = card.querySelector(".row");
        if(!row){
          row = document.createElement("div");
          row.className = "row";
          row.style.display = "flex";
          row.style.justifyContent = "space-between";
          row.style.alignItems = "center";
          row.style.gap = "10px";

          // Move existing content into row
          const kids = Array.from(card.childNodes);
          kids.forEach(k=>row.appendChild(k));
          card.appendChild(row);
        }

        // Prepend thumb
        row.insertBefore(thumb, row.firstChild);

        // Hide the Open button to reinforce new UX (comment this line out if you want both)
        btn.style.display = "none";

        btn._rcEnhanced = true;
      });
    } catch(e){}
  }

  // Add minimal CSS
  function injectCSS(){
    if(document.getElementById("rcDogThumbCss")) return;
    const css = document.createElement("style");
    css.id = "rcDogThumbCss";
    css.textContent = `
      .rc-dog-thumb{
        width: 54px; height: 54px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.06);
        color: rgba(242,242,242,0.85);
        display:flex; align-items:center; justify-content:center;
        overflow:hidden;
        flex: 0 0 auto;
      }
      .rc-dog-thumb img{
        width:100%; height:100%;
        object-fit: cover;
        display:block;
      }
      .rc-dog-thumb:active{ transform: translateY(1px); }
    `;
    document.head.appendChild(css);
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    injectCSS();
    enhance();
    setInterval(enhance, 800);
  });
})();
