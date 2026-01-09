// dog_list_tile_set_photo.js
// Mode B: Tap the 📷 Profile tile.
// - If no thumbnail set for this dog: prompt for a photo and save it (per Call Name).
// - If thumbnail exists: open the dog's profile (clicks the hidden Open button).
//
// Storage: localStorage["rc_list_thumb_v1"] = { "<callname_lower>": "<dataUrl>" }
//
// Safe: does not modify dog records; only stores list thumbnails in localStorage.

(function(){
  const KEY="rc_list_thumb_v1";

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function loadMap(){
    try{ return JSON.parse(localStorage.getItem(KEY)||"{}") || {}; }catch(e){ return {}; }
  }
  function saveMap(m){
    try{ localStorage.setItem(KEY, JSON.stringify(m||{})); }catch(e){}
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

  function pickPhoto(onDone){
    const input=document.createElement("input");
    input.type="file";
    input.accept="image/*";
    input.style.display="none";
    input.addEventListener("change", ()=>{
      const file=input.files && input.files[0];
      if(!file) return;
      const reader=new FileReader();
      reader.onload=()=>{ onDone(String(reader.result||"")); };
      reader.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(()=>{ try{ document.body.removeChild(input); }catch(e){} }, 30000);
  }

  function findOpenButtonNear(tile){
    const host = tile.closest(".card") || tile.closest("li") || tile.closest(".row") || tile.parentElement;
    if(!host) return null;
    const btns = Array.from(host.querySelectorAll("button"));
    return btns.find(b => (b.textContent||"").trim().toLowerCase()==="open") || null;
  }

  function extractCallNameNear(tile){
    const host = tile.closest(".card") || tile.closest("li") || tile.closest(".row") || tile.parentElement;
    if(!host) return "";
    const nameEl = host.querySelector(".h") || host.querySelector("strong");
    if(nameEl && nameEl.textContent) return nameEl.textContent.trim();
    const lines=(host.innerText||host.textContent||"").split("\n").map(s=>s.trim()).filter(Boolean);
    return lines.length?lines[0]:"";
  }

  function renderTile(tile, dataUrl){
    tile.innerHTML="";
    if(dataUrl){
      const img=document.createElement("img");
      img.src=dataUrl;
      img.alt="Thumbnail";
      img.style.width="100%";
      img.style.height="100%";
      img.style.objectFit="cover";
      img.style.display="block";
      tile.appendChild(img);
    }else{
      tile.innerHTML = `<div class="ph"><div class="cam">📷</div><div class="txt">Add photo</div></div>`;
    }
  }

  function enhance(){
    const tiles = Array.from(document.querySelectorAll(".rc-profile-tile"));
    if(!tiles.length) return;

    const map = loadMap();

    tiles.forEach(tile=>{
      if(tile._rcSetPhotoBound) return;

      const call = extractCallNameNear(tile);
      const key = norm(call);
      if(key && map[key]){
        renderTile(tile, map[key]);
      }

      tile.addEventListener("click",(e)=>{
        e.preventDefault(); e.stopPropagation();
        const callName = extractCallNameNear(tile);
        const k = norm(callName);
        if(!k){ toast("No call name found"); return; }

        const m = loadMap();
        const existing = m[k] || "";
        const openBtn = findOpenButtonNear(tile);

        if(!existing){
          pickPhoto((dataUrl)=>{
            const mm = loadMap();
            mm[k] = dataUrl;
            saveMap(mm);
            renderTile(tile, dataUrl);
            toast("Photo set for " + callName);
          });
          return;
        }

        if(openBtn){
          openBtn.click();
        }else{
          toast("Profile opener not found");
        }
      });

      tile._rcSetPhotoBound = true;
    });
  }

  function injectCss(){
    if(document.getElementById("rcTileSetPhotoCss")) return;
    const st=document.createElement("style");
    st.id="rcTileSetPhotoCss";
    st.textContent=`
      .rc-profile-tile .ph{
        width:100%;height:100%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:2px;padding:6px;
        color:rgba(242,242,242,0.9);
      }
      .rc-profile-tile .cam{font-size:16px;line-height:1;}
      .rc-profile-tile .txt{font-size:10px;opacity:.9;}
    `;
    document.head.appendChild(st);
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    injectCss();
    enhance();
    setInterval(enhance, 1200);
  });
})();