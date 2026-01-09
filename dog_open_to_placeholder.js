// dog_open_to_placeholder.js — v2
// Option A+: Replace visible "Open" button with a tile that shows:
// - current photo if available
// - otherwise 📷 Add photo
// Tile remains the tap-to-open control (triggers the hidden Open button).
//
// Photo lookup (current constraint): by Call Name from the dog row/card text,
// using the dogs store in localStorage (photoDataUrl/photo/photoUrl/photoURI).

(function(){
  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function loadDogs(){
    for(const k of DOG_KEYS){
      try{
        const raw=localStorage.getItem(k);
        if(!raw) continue;
        const obj=JSON.parse(raw);
        if(Array.isArray(obj)) return obj;
        if(obj && Array.isArray(obj.dogs)) return obj.dogs;
      }catch(e){}
    }
    return [];
  }

  function photoForCall(call){
    const key=norm(call);
    if(!key) return "";
    const dogs=loadDogs();
    const d=dogs.find(x=>norm(x.callName||x.name)===key);
    if(!d) return "";
    return d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
  }

  function injectCSS(){
    if(document.getElementById("rcProfileTileCssV2")) return;
    const st=document.createElement("style");
    st.id="rcProfileTileCssV2";
    st.textContent=`
      .rc-profile-tile{
        width:66px;height:54px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.9);
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        gap:2px;
        overflow:hidden;
        padding:0;
        line-height:1.05;
        flex:0 0 auto;
      }
      .rc-profile-tile img{
        width:100%;height:100%;
        object-fit:cover;
        display:block;
      }
      .rc-profile-tile .ph{
        width:100%;height:100%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:2px;padding:6px;
      }
      .rc-profile-tile .cam{font-size:16px;line-height:1;}
      .rc-profile-tile .txt{font-size:10px;opacity:.9;}
      .rc-profile-tile:active{transform:translateY(1px);}
      .rc-openwrap{display:flex;align-items:center;gap:10px;}
    `;
    document.head.appendChild(st);
  }

  function extractCallNameFromRow(btn){
    // Try to find a nearby dog name element
    const host = btn.closest(".card") || btn.closest("li") || btn.closest(".row") || btn.parentElement;
    if(!host) return "";
    const nameEl = host.querySelector(".h") || host.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines=(host.innerText||host.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    // first line usually name
    return lines.length?lines[0]:"";
  }

  function renderTile(tile, call){
    const photo = photoForCall(call);
    tile.innerHTML="";
    if(photo){
      const img=document.createElement("img");
      img.src=photo;
      img.alt=call ? (call+" photo") : "Dog photo";
      tile.appendChild(img);
    }else{
      tile.innerHTML = `<div class="ph"><div class="cam">📷</div><div class="txt">Add photo</div></div>`;
    }
  }

  function enhance(){
    try{
      injectCSS();

      const buttons = Array.from(document.querySelectorAll("button"))
        .filter(b => (b.textContent||"").trim().toLowerCase()==="open");

      buttons.forEach(btn=>{
        // skip if already wrapped
        if(btn._rcReplacedV2 && btn.parentElement && btn.parentElement.querySelector(".rc-profile-tile")) {
          // update tile photo in case it changed
          const tile = btn.parentElement.querySelector(".rc-profile-tile");
          if(tile){
            const call = extractCallNameFromRow(btn);
            renderTile(tile, call);
          }
          return;
        }

        const parent = btn.parentNode;
        if(!parent) return;

        let wrap = parent.classList && parent.classList.contains("rc-openwrap") ? parent : null;
        if(!wrap){
          wrap=document.createElement("span");
          wrap.className="rc-openwrap";
          parent.insertBefore(wrap, btn);
          wrap.appendChild(btn);
        }

        // Create tile
        const tile=document.createElement("div");
        tile.className="rc-profile-tile";

        const call = extractCallNameFromRow(btn);
        renderTile(tile, call);

        wrap.insertBefore(tile, btn);

        // Hide button
        btn.style.display="none";

        // Click tile triggers hidden Open button
        tile.addEventListener("click",(e)=>{
          e.preventDefault(); e.stopPropagation();
          btn.click();
        });

        btn._rcReplacedV2=true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1500);
  });
})();