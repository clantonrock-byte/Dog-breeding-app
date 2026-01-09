// dog_row_click.js — v2 SAFE
// Fixes: clicking inside a DOG PROFILE (especially on photo) must NOT trigger dog-row navigation.
// Root cause: global click handler was finding an "Open" button elsewhere and clicking it (opening wrong dog).
//
// Rules:
// - Do nothing if click occurs inside #viewDogProfile (profile screen).
// - Do nothing if click is on/inside controls OR images.
// - Only act inside the Dogs list view (#viewDogs) to trigger the nearest row's Open button.

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
    // Never hijack profile clicks (this was the Kaia/Aina swap trigger)
    if(inProfile(e.target)) return;

    // Only handle clicks that happen inside Dogs list view
    if(!inDogsView(e.target)) return;

    if (isControl(e.target)) return;
    if (isImage(e.target)) return;

    const openBtn = findOpenButton(e.target);
    if (!openBtn) return;
    openBtn.click();
  }, false);

  console.log("dog_row_click.js v2 SAFE active");
})();