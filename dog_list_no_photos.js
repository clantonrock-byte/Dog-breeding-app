// dog_list_no_photos.js
// Hard rule: Dog list shows NO photos at all (prevents bleed).
// Dog profile photos remain untouched.

(function(){
  function hideListImgs(){
    try{
      const view = document.getElementById("viewDogs") || document.body;
      // remove/ hide any images inside dog list cards
      view.querySelectorAll(".card img, .card .rc-profile-tile img, .card .rc-thumb img").forEach(img=>{
        img.style.display="none";
      });
      // also hide any tile placeholder images
      view.querySelectorAll(".rc-profile-tile img, .rc-thumb img").forEach(img=>{
        img.style.display="none";
      });
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    hideListImgs();
    setInterval(hideListImgs, 1200);
  });
})();
