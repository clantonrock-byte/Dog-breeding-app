// dog_open_to_placeholder.js — SAFE (no list photos)
// Keeps: 📷 Profile tile replaces Open, tile opens profile.
// Does NOT render any photos in the list.

(function(){
  function injectCSS(){
    if(document.getElementById("rcProfileTileCssSAFE")) return;
    const st=document.createElement("style");
    st.id="rcProfileTileCssSAFE";
    st.textContent=`
      .rc-profile-tile{
        width:66px;height:54px;border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:rgba(242,242,242,0.9);
        display:flex;align-items:center;justify-content:center;
        flex-direction:column;gap:2px;overflow:hidden;padding:6px;
        line-height:1.05;flex:0 0 auto;
      }
      .rc-profile-tile .cam{font-size:16px;line-height:1;}
      .rc-profile-tile .txt{font-size:10px;opacity:.9;}
      .rc-profile-tile:active{transform:translateY(1px);}
      .rc-openwrap{display:flex;align-items:center;gap:10px;}
    `;
    document.head.appendChild(st);
  }

  function enhance(){
    try{
      injectCSS();
      const buttons = Array.from(document.querySelectorAll("button"))
        .filter(b => (b.textContent||"").trim().toLowerCase()==="open");

      buttons.forEach(btn=>{
        const parent = btn.parentNode;
        if(!parent) return;

        let wrap = parent.classList && parent.classList.contains("rc-openwrap") ? parent : null;
        if(!wrap){
          wrap=document.createElement("span");
          wrap.className="rc-openwrap";
          parent.insertBefore(wrap, btn);
          wrap.appendChild(btn);
        }

        let tile = wrap.querySelector(".rc-profile-tile");
        if(!tile){
          tile=document.createElement("div");
          tile.className="rc-profile-tile";
          tile.innerHTML = `<div class="cam">📷</div><div class="txt">Profile</div>`;
          wrap.insertBefore(tile, btn);

          tile.addEventListener("click",(e)=>{
            e.preventDefault(); e.stopPropagation();
            btn.click();
          });
        }

        btn.style.display="none";
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();
