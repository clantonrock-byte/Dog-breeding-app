// dog_row_click.js — SAFE
// Row click opens correct dog profile.
// Never hijacks clicks inside profile pages or images.

(function () {
  function inProfile(target){
    try{ return !!target.closest("#viewDogProfile"); }catch(e){ return false; }
  }
  function inDogsView(target){
    try{ return !!target.closest("#viewDogs"); }catch(e){ return false; }
  }
  function isControl(el) {
    try { return !!el.closest("button,a,input,select,textarea,label,.rc-profile-tile"); } catch (e) { return false; }
  }
  function isImage(el){
    try{ return !!el.closest("img,svg,canvas"); }catch(e){ return false; }
  }
  function findOpenButton(startEl) {
    let el = startEl;
    for (let i = 0; i < 8 && el; i++) {
      try {
        const btns = el.querySelectorAll ? el.querySelectorAll("button") : [];
        for (const b of btns) {
          const t = (b.textContent || "").trim().toLowerCase();
          if (t === "open") return b;
        }
      } catch (e) {}
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener("click", function (e) {
    if(inProfile(e.target)) return;
    if(!inDogsView(e.target)) return;
    if(isControl(e.target)) return;
    if(isImage(e.target)) return;

    const openBtn = findOpenButton(e.target);
    if (!openBtn) return;
    openBtn.click();
  }, false);
})();
