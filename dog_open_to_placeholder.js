// dog_open_to_placeholder.js — v3
// Mode C: Set list thumbnail from inside the DOG PROFILE page.
// - Adds a "Use as list thumbnail" button on the profile page (Active dogs only).
// - Saves the current profile photo (data:image...) into localStorage map keyed by Call Name.
// - Dog list tiles show ONLY that saved thumbnail (never guess from dog records). If none saved -> 📷 Profile.
//
// Storage: localStorage["rc_list_thumb_v1"] = { "<callname_lower>": "<dataUrl>" }
//
// Safe: does not modify dog records, only stores list thumbnails.
// Also keeps existing behavior: tile click opens profile via hidden Open button.

(function(){
  const THUMB_KEY="rc_list_thumb_v1";

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function loadThumbMap(){
    try{ return JSON.parse(localStorage.getItem(THUMB_KEY)||"{}") || {}; }catch(e){ return {}; }
  }
  function saveThumbMap(m){
    try{ localStorage.setItem(THUMB_KEY, JSON.stringify(m||{})); }catch(e){}
  }

  function toast(msg){
    try{ if(typeof window.rcToast==="function"){ window.rcToast(msg); return; } }catch(e){}
    try{
      let el=document.getElementById("rcToastLite");
      if(!el){
        el=document.createElement("div");
        el.id="rcToastLite";
        el.style.position="fixed";
        el.style.left="12px";
        el.style.right="12px";
        el.style.bottom="18px";
        el.style.zIndex="999999";
        el.style.display="none";
        el.style.background="rgba(0,0,0,0.78)";
        el.style.color="#f2f2f2";
        el.style.border="1px solid rgba(255,255,255,0.18)";
        el.style.borderRadius="14px";
        el.style.padding="10px 12px";
        el.style.fontSize="14px";
        document.body.appendChild(el);
      }
      el.textContent=String(msg||"");
      el.style.display="block";
      clearTimeout(el._t);
      el._t=setTimeout(()=>{ el.style.display="none"; }, 1400);
    }catch(e){}
  }

  function injectCSS(){
    if(document.getElementById("rcProfileTileCssV3")) return;
    const st=document.createElement("style");
    st.id="rcProfileTileCssV3";
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
      .rc-profile-tile img{width:100%;height:100%;object-fit:cover;display:block;}
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
      .rc-btn{
        display:inline-block;
        padding:10px 12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        color:#f2f2f2;
        font-weight:800;
        cursor:pointer;
        margin-top:10px;
      }
      .rc-btn:active{transform:translateY(1px);}
      .rc-btn[disabled]{opacity:.5;cursor:default;}
    `;
    document.head.appendChild(st);
  }

  function extractCallNameFromRow(btn){
    const host = btn.closest(".card") || btn.closest("li") || btn.closest(".row") || btn.parentElement;
    if(!host) return "";
    const nameEl = host.querySelector(".h") || host.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines=(host.innerText||host.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    return lines.length?lines[0]:"";
  }

  function renderTile(tile, callName){
    const map = loadThumbMap();
    const key = norm(callName);
    const dataUrl = key ? (map[key]||"") : "";
    tile.innerHTML="";
    if(dataUrl){
      const img=document.createElement("img");
      img.src=dataUrl;
      img.alt=(callName||"Dog")+" thumbnail";
      tile.appendChild(img);
    }else{
      tile.innerHTML = `<div class="ph"><div class="cam">📷</div><div class="txt">Profile</div></div>`;
    }
  }

  function enhanceDogListTiles(){
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
        wrap.insertBefore(tile, btn);

        tile.addEventListener("click",(e)=>{
          e.preventDefault(); e.stopPropagation();
          btn.click();
        });
      }

      btn.style.display="none";

      const call = extractCallNameFromRow(btn);
      renderTile(tile, call);
    });
  }

  function getProfileCallName(){
    const ids=["dogCallName","callName","bp_dog_callName","profileCallName"];
    for(const id of ids){
      const el=document.getElementById(id);
      if(!el) continue;
      const v = ("value" in el) ? el.value : el.textContent;
      if(v && v.toString().trim()) return v.toString().trim();
    }
    const h=document.querySelector("#viewDogProfile .h, #viewDogProfile strong");
    if(h && h.textContent) return h.textContent.trim();
    return "";
  }

  function profileIsArchived(){
    const scope=document.getElementById("viewDogProfile") || document.body;
    const t=(scope.innerText||"").toLowerCase();
    return t.includes("archived") || t.includes("deceased");
  }

  function findProfilePhotoImg(){
    const scope=document.getElementById("viewDogProfile") || document.body;
    const imgs=Array.from(scope.querySelectorAll("img"));
    let best=null, bestArea=0;
    imgs.forEach(img=>{
      const src=img.getAttribute("src")||"";
      const w=img.naturalWidth||img.width||0;
      const h=img.naturalHeight||img.height||0;
      const area=w*h;
      if(src.startsWith("data:image") && area>=bestArea){ best=img; bestArea=area; }
      else if(!best && area>bestArea){ best=img; bestArea=area; }
    });
    return best;
  }

  function attachProfileButton(){
    const scope=document.getElementById("viewDogProfile");
    if(!scope) return;
    if(scope.querySelector("#rcUseThumbBtn")) return;

    const call=getProfileCallName();
    if(!call) return;

    const img=findProfilePhotoImg();
    if(!img) return;

    const host = img.parentElement || scope;
    const btn=document.createElement("button");
    btn.id="rcUseThumbBtn";
    btn.className="rc-btn";
    btn.type="button";
    btn.textContent="Use as list thumbnail";

    if(profileIsArchived()){
      btn.disabled=true;
      btn.textContent="Thumbnail locked (archived)";
    }

    btn.addEventListener("click",()=>{
      const callName=getProfileCallName();
      const key=norm(callName);
      const src=img.getAttribute("src")||"";
      if(!key){ toast("No call name"); return; }
      if(!src.startsWith("data:image")){ toast("No photo found"); return; }
      const map=loadThumbMap();
      map[key]=src;
      saveThumbMap(map);
      toast("Thumbnail saved for " + callName);
    });

    host.appendChild(btn);
  }

  function tick(){
    try{
      injectCSS();
      enhanceDogListTiles();
      attachProfileButton();
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    tick();
    setInterval(tick, 1200);
  });
})();