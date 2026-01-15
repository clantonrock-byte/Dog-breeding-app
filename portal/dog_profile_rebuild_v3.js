// dog_profile_rebuild_v3.js
(function(){
  const LEGACY = [
    '.dog-status-select',
    '.dog-sex-select',
    '.dog-life-status',
    '.heat-tracking',
    '.profile-more',
    '.profile-notes-btn'
  ];

  function hideLegacy(){
    LEGACY.forEach(s=>document.querySelectorAll(s).forEach(e=>e.style.display='none'));
  }

  function bindSave(){
    const btn=document.getElementById('dogProfileSaveV3');
    if(!btn) return;
    btn.onclick=()=>{
      const id=document.body.dataset.dogId;
      const data=window.__dogProfileV3?.collect?.();
      if(!id||!data) return alert('Save failed');
      localStorage.setItem('dog:'+id, JSON.stringify(data));
      alert('Saved');
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    hideLegacy();
    bindSave();
  });
})();
