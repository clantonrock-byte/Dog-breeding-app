// dog_photo_open.js — v3
// - Anchors a thumbnail/placeholder to each dog card
// - Placeholder shows a small camera + "Add photo"
// - Tapping the thumbnail (or name) opens the profile (uses existing Open button click)

(function(){
  function injectCSS(){
    if(document.getElementById("rcDogThumbCss")) return;
    const css = document.createElement("style");
    css.id = "rcDogThumbCss";
    css.textContent = `
      .rc-dog-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .rc-dog-left{ display:flex; align-items:center; gap:12px; min-width:0; }
      .rc-dog-thumb{
        width:66px;height:54px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.85);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        flex:0 0 auto;
        padding:6px;
        text-align:center;
        line-height:1.05;
      }
      .rc-dog-thumb img{ width:100%;height:100%;object-fit:cover;display:block; }
      .rc-dog-thumb:active{ transform: translateY(1px); }
      .rc-dog-thumb .cam{ font-size:16px; display:block; }
      .rc-dog-thumb .txt{ font-size:11px; opacity:.9; margin-top:2px; }
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
      wrap.innerHTML = `<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return wrap;
  }

  function findDogCards(){
    const dogsView = document.getElementById("viewDogs") || document.body;
    return dogsView.querySelectorAll(".card");
  }

  function enhance(){
    try{
      injectCSS();
      const cards = findDogCards();
      cards.forEach(card=>{
        const btn = Array.from(card.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="open");
        if(!btn) return;
        if(card._rcThumbDone) return;

        let nameEl = card.querySelector("strong") || card.querySelector(".h") || card.querySelector(".dog-name");
        const nameText = nameEl ? (nameEl.textContent||"").trim() : "";
        let subEl = card.querySelector(".small") || card.querySelector(".sub");
        const subText = subEl ? (subEl.textContent||"").trim() : "";

        const left=document.createElement("div");
        left.className="rc-dog-left";
        const thumb = mkThumb(null);

        const nameWrap=document.createElement("div");
        nameWrap.className="rc-dog-namewrap";
        nameWrap.innerHTML = `<div class="rc-dog-name">${nameText || "Dog"}</div>${subText ? `<div class="rc-dog-sub">${subText}</div>` : ""}`;

        left.appendChild(thumb);
        left.appendChild(nameWrap);

        thumb.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });
        nameWrap.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); btn.click(); });

        const row=document.createElement("div");
        row.className="rc-dog-row";
        row.appendChild(left);
        row.appendChild(btn);

        card.innerHTML = "";
        card.appendChild(row);

        // keep button visible for now; user taps photo/name mostly
        btn.textContent = "Open";
        card._rcThumbDone=true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 900);
  });
})();
