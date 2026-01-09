// dog_open_to_placeholder.js
// Option A: Replace visible "Open" button with a photo placeholder tile (📷 Profile).
// Clicking placeholder triggers the hidden Open button.
// Works with dog_row_click.js already installed.

(function(){
  function injectCSS(){
    if(document.getElementById("rcProfileTileCss")) return;
    const st=document.createElement("style");
    st.id="rcProfileTileCss";
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
        padding:6px;
        line-height:1.05;
        flex:0 0 auto;
      }
      .rc-profile-tile .cam{font-size:16px;line-height:1;}
      .rc-profile-tile .txt{font-size:10px;opacity:.9;}
      .rc-profile-tile:active{transform:translateY(1px);}
      .rc-openwrap{display:flex;align-items:center;gap:10px;}
    `;
    document.head.appendChild(st);
  }

  function isControl(el){
    try{ return !!el.closest("button,a,input,select,textarea,label"); }catch(e){ return false; }
  }

  function enhance(){
    try{
      injectCSS();
      // Find all Open buttons
      const buttons = Array.from(document.querySelectorAll("button"))
        .filter(b => (b.textContent||"").trim().toLowerCase()==="open");

      buttons.forEach(btn=>{
        if(btn._rcReplaced) return;

        // Build wrapper
        const parent = btn.parentNode;
        if(!parent) return;

        // If already wrapped, keep
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
        tile.innerHTML = `<div class="cam">📷</div><div class="txt">Profile</div>`;

        // Place tile before button
        wrap.insertBefore(tile, btn);

        // Hide button
        btn.style.display="none";

        // Click tile triggers hidden Open button
        tile.addEventListener("click",(e)=>{
          e.preventDefault(); e.stopPropagation();
          btn.click();
        });

        btn._rcReplaced=true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();