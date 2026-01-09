// dog_card_click.js
// Option A: Make entire dog card clickable to open that dog's profile.
// Keeps the existing Open button (as fallback), but clicking anywhere on the card triggers it.

(function(){
  function isInsideControl(el){
    try{ return !!el.closest("button,a,input,select,textarea,label"); }catch(e){ return false; }
  }

  function enhance(){
    try{
      const view = document.getElementById("viewDogs") || document.body;
      const cards = Array.from(view.querySelectorAll(".card"));
      cards.forEach(card=>{
        if(card._rcCardClick) return;

        const openBtn = Array.from(card.querySelectorAll("button"))
          .find(b => (b.textContent||"").trim().toLowerCase()==="open");
        if(!openBtn) return;

        card.style.cursor = "pointer";
        card.addEventListener("click", (e)=>{
          if(isInsideControl(e.target)) return;
          openBtn.click();
        });

        card._rcCardClick = true;
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enhance();
    setInterval(enhance, 1200);
  });
})();