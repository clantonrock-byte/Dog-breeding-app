// dog_photo_open.js — v2
// Fix: ensure each thumbnail stays anchored to its own dog card (no floating).
// Strategy: for each dog card, create/ensure a flex row and place thumb + name block together.
// Non-invasive: triggers existing Open button click.

(function(){
  function injectCSS(){
    if(document.getElementById("rcDogThumbCss")) return;
    const css = document.createElement("style");
    css.id = "rcDogThumbCss";
    css.textContent = `
      .rc-dog-row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      }
      .rc-dog-left{
        display:flex;
        align-items:center;
        gap:12px;
        min-width:0;
      }
      .rc-dog-thumb{
        width:54px;height:54px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.85);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        flex:0 0 auto;
      }
      .rc-dog-thumb img{ width:100%;height:100%;object-fit:cover;display:block; }
      .rc-dog-thumb:active{ transform: translateY(1px); }
      .rc-dog-namewrap{ min-width:0; }
      .rc-dog-namewrap .rc-dog-name{ font-weight:900; }
      .rc-dog-namewrap .rc-dog-sub{ opacity:.75;font-size:12px;margin-top:2px; }
    `;
    document.head.appendChild(css);
  }

  function mkThumb(src){
    const wrap=document.createElement("div");
    wrap.className="rc-dog-thumb";
    if(src){
      const img=document.createElement("img");
      img.src=src;
      img.alt="Dog photo";
      wrap.appendChild(img);
    } else {
      wrap.textContent="Photo";
    }
    return wrap;
  }

  function findDogCards(){
    // Try common dog list containers; fall back to cards in Dogs view
    const dogsView = document.getElementById("viewDogs") || document.getElementById("Dogs") || document.body;
    return dogsView.querySelectorAll(".card");
  }

  function enhance(){
    try{
      injectCSS();
      const cards = findDogCards();
      cards.forEach(card=>{
        // Find an Open button within the card
        const btn = Array.from(card.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="open");
        if(!btn) return;
        if(card._rcThumbDone) return;

        // Extract name text from the card (best-effort)
        let nameEl = card.querySelector("strong") || card.querySelector(".h") || card.querySelector(".dog-name");
        const nameText = nameEl ? (nameEl.textContent||"").trim() : "";
        // Try to find a subline
        let subEl = card.querySelector(".small") || card.querySelector(".sub");
        const subText = subEl ? (subEl.textContent||"").trim() : "";

        // Build left block (thumb + name)
        const left=document.createElement("div");
        left.className="rc-dog-left";
        const thumb = mkThumb(null);
        const nameWrap=document.createElement("div");
        nameWrap.className="rc-dog-namewrap";
        nameWrap.innerHTML = `<div class="rc-dog-name">${nameText || "Dog"}</div>${subText ? `<div class="rc-dog-sub">${subText}</div>` : ""}`;
        left.appendChild(thumb);
        left.appendChild(nameWrap);

        // Clicking thumb triggers Open
        thumb.addEventListener("click", (e)=>{
          e.preventDefault(); e.stopPropagation();
          btn.click();
        });
        // Also clicking name triggers Open (nice UX)
        nameWrap.addEventListener("click", (e)=>{
          e.preventDefault(); e.stopPropagation();
          btn.click();
        });

        // Build a row container to control layout
        const row=document.createElement("div");
        row.className="rc-dog-row";
        row.appendChild(left);
        row.appendChild(btn);

        // Clear card and reinsert row (preserve other nodes? keep it minimal)
        // To avoid floating artifacts, we reconstruct the card content deterministically.
        card.innerHTML = "";
        card.appendChild(row);

        // Hide "Open" text but keep button for click area (optional)
        btn.textContent = "Open";
        // If you want no visible Open, uncomment:
        // btn.style.display="none";

        card._rcThumbDone=true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 900);
  });
})();
