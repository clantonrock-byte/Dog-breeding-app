// dog_id_migrate.js
// Adds stable dogId to every dog record if missing, based on callName + dob (if present) + random salt once.
// Runs once per device (marks migration version).
(function(){
  const KEY_DONE="rc_dogid_migrated_v1";
  const DOG_KEYS=["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"];

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }
  function loadStore(){
    for(const k of DOG_KEYS){
      try{
        const raw=localStorage.getItem(k);
        if(!raw) continue;
        const obj=JSON.parse(raw);
        if(Array.isArray(obj)) return {key:k, store:{dogs:obj}, array:true};
        if(obj && Array.isArray(obj.dogs)) return {key:k, store:obj, array:false};
      }catch(e){}
    }
    return null;
  }
  function saveStore(found){
    try{
      if(found.array){
        localStorage.setItem(found.key, JSON.stringify(found.store.dogs));
      }else{
        localStorage.setItem(found.key, JSON.stringify(found.store));
      }
    }catch(e){}
  }
  function makeId(d){
    const call=norm(d.callName||d.name||"dog");
    const dob=norm(d.dob||d.DOB||"");
    const salt = Math.random().toString(16).slice(2);
    return `dog_${call}_${dob}_${salt}`.replace(/[^a-z0-9_]/g,"_");
  }

  function run(){
    try{
      if(localStorage.getItem(KEY_DONE)==="1") return;
      const found=loadStore();
      if(!found) { localStorage.setItem(KEY_DONE,"1"); return; }
      const dogs=found.store.dogs||[];
      let changed=0;
      dogs.forEach(d=>{
        if(!d.dogId){
          d.dogId = makeId(d);
          changed++;
        }
      });
      if(changed>0){
        saveStore(found);
      }
      localStorage.setItem(KEY_DONE,"1");
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded", run);
})();