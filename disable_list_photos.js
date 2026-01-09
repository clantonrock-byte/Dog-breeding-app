// Temporary safety patch: disables photos in dog list rendering
(function(){
  if(!window.renderDogs) return;
  const orig = window.renderDogs;
  window.renderDogs = function(list){
    const cleaned = (list||[]).map(d => {
      const c = Object.assign({}, d);
      delete c.photo;
      delete c.photoDataUrl;
      delete c.photoUrl;
      delete c.photoURI;
      return c;
    });
    return orig(cleaned);
  };
  console.log("Dog list photos disabled (temporary safety patch).");
})();