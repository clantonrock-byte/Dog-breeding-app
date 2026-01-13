(() => {
  const DOG_KEY="breederPro_dogs_store_v3";
  const COOLDOWN_KEY="breederPro_dogs_heat_cooldown_v2";
  const cycleDays=180, heatDurationDays=21, warnDays=14;
  const $=id=>document.getElementById(id);
  const load=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}};
  const save=(k,o)=>localStorage.setItem(k,JSON.stringify(o));
  const loadDogs=()=>{const o=load(DOG_KEY,{dogs:[]}); if(!Array.isArray(o.dogs)) o.dogs=[]; return o;};
  const saveDogs=o=>save(DOG_KEY,o);
  const today=()=>new Date().toISOString().slice(0,10);
  const parse=iso=>{if(!iso) return null; const d=new Date(iso); return Number.isFinite(d.getTime())?d:null;};
  const add=(d,n)=>{const x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x;};
  const fmt=d=>{try{return d.toLocaleDateString()}catch{return ""}};
  const ensureDog=d=>{if(typeof d.inHeat!=="boolean") d.inHeat=false; if(typeof d.heatStartISO!=="string") d.heatStartISO=""; if(typeof d.heatNotes!=="string") d.heatNotes=""; return d;};
  const intactFemale=d=>{const s=String(d?.sex||"").toLowerCase().trim(); return s.startsWith("female") && !s.includes("spayed");};
  const status=d=>{d=ensureDog(d); const start=parse(d.heatStartISO); const end=start?add(start,heatDurationDays):null; const next=start?add(start,cycleDays):null;
    const now=new Date(); const inHeatByDates=start&&end?(now>=start&&now<=end):false; const inHeat=!!d.inHeat||inHeatByDates;
    const dueSoon=!inHeat&&next?(now>=add(next,-warnDays)&&now<=next):false; return {start,end,next,inHeat,dueSoon};};
  const profileRoot=()=>document.getElementById("viewDogProfile")||null;
  const anchor=()=>document.getElementById("secStatus")||document.getElementById("secNotes")||(profileRoot()?profileRoot().querySelector("h2"):null)||profileRoot();
  function ensureBlock(){
    if(document.getElementById("heatBlock")) return;
    const a=anchor(); if(!a) return;
    const b=document.createElement("div"); b.className="timeline-item"; b.id="heatBlock";
    b.innerHTML=`<strong>Heat tracking</strong>
    <div class="muted small" style="margin-top:6px;">Intact females only. Mark observed heats to forecast next (~6 months).</div>
    <div class="row" style="margin-top:10px;">
      <button type="button" class="btn" id="btnMarkHeatToday">Mark heat today</button>
      <button type="button" class="btn" id="btnMarkHeatEnd">Mark heat ended</button>
    </div>
    <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:10px;">
      <input type="checkbox" id="chkInHeat" /> Currently in heat
    </label>
    <label class="label">Heat start date</label>
    <input id="heatStart" placeholder="YYYY-MM-DD" />
    <div id="heatDerived" class="muted small" style="margin-top:8px;"></div>
    <label class="label">Notes (optional)</label>
    <input id="heatNotes" placeholder="Optional notes…" />
    <div class="row" style="margin-top:12px;"><button type="button" class="btn primary" id="btnSaveHeat">Save</button></div>`;
    a.insertAdjacentElement("afterend", b);
    document.getElementById("btnMarkHeatToday").onclick=()=>{const d=new Date(); const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0");
      document.getElementById("heatStart").value=`${yyyy}-${mm}-${dd}`; document.getElementById("chkInHeat").checked=true; document.getElementById("heatNotes").focus();};
    document.getElementById("btnMarkHeatEnd").onclick=()=>{document.getElementById("chkInHeat").checked=false;};
    document.getElementById("btnSaveHeat").onclick=()=>{
      const dogId=window.currentDogId||""; if(!dogId) return;
      const store=loadDogs(); const idx=store.dogs.findIndex(d=>d.dogId===dogId); if(idx<0) return;
      const dog=ensureDog(store.dogs[idx]);
      dog.inHeat=!!document.getElementById("chkInHeat").checked;
      const s=String(document.getElementById("heatStart").value||"").trim();
      dog.heatStartISO=s?new Date(s+"T00:00:00").toISOString():"";
      dog.heatNotes=String(document.getElementById("heatNotes").value||"").trim();
      store.dogs[idx]=dog; saveDogs(store);
      try{ if(typeof window.renderDogProfile==="function") window.renderDogProfile(dog);}catch{}
      try{ if(typeof window.renderDogs==="function") window.renderDogs();}catch{}
      alert("Saved.");
    };
  }
  function fill(dog){
    const b=document.getElementById("heatBlock"); if(!b) return;
    const show=intactFemale(dog); b.classList.toggle("hide",!show); if(!show) return;
    dog=ensureDog(dog);
    document.getElementById("chkInHeat").checked=!!dog.inHeat;
    document.getElementById("heatStart").value=dog.heatStartISO?dog.heatStartISO.slice(0,10):"";
    document.getElementById("heatNotes").value=dog.heatNotes||"";
    const st=status(dog); const parts=[];
    if(st.start) parts.push(`Start: ${fmt(st.start)}`);
    if(st.end) parts.push(`Est end: ${fmt(st.end)}`);
    if(st.next) parts.push(`Est next heat: ${fmt(st.next)}`);
    if(st.dueSoon) parts.push(`Due soon (≤ ${warnDays} days)`);
    if(st.inHeat) parts.push("IN HEAT");
    document.getElementById("heatDerived").textContent=parts.length?parts.join(" • "):"No heat start recorded yet.";
  }
  function profileBadge(dog){
    document.querySelectorAll(".heat-badge.profile,.heat-soon-badge.profile").forEach(n=>n.remove());
    if(!intactFemale(dog)) return;
    const st=status(dog); const type=st.inHeat?"heat":(st.dueSoon?"soon":""); if(!type) return;
    const target=document.getElementById("dogProfileTitle")||document.getElementById("dogCallNameDisplay")||(profileRoot()?profileRoot().querySelector("h2"):null);
    if(!target) return;
    const span=document.createElement("span");
    span.className=(type==="heat"?"heat-badge profile":"heat-soon-badge profile");
    span.textContent=(type==="heat"?"HEAT":"SOON");
    target.appendChild(span);
  }
  function listBadges(){
    const list=document.getElementById("dogsList"); if(!list) return;
    const store=loadDogs(); const byId=new Map((store.dogs||[]).map(d=>[d.dogId,ensureDog(d)]));
    list.querySelectorAll(".dog-card").forEach(card=>{
      const id=card.getAttribute("data-dog-id")||""; const dog=byId.get(id); if(!dog) return;
      card.querySelector(".heat-badge")?.remove(); card.querySelector(".heat-soon-badge")?.remove();
      if(!intactFemale(dog)) return;
      const st=status(dog);
      const title=card.querySelector(".dog-card-title")||card.querySelector(".dog-card-mid"); if(!title) return;
      if(st.inHeat){const b=document.createElement("span"); b.className="heat-badge"; b.textContent="HEAT"; title.appendChild(b);}
      else if(st.dueSoon){const b=document.createElement("span"); b.className="heat-soon-badge"; b.textContent="SOON"; title.appendChild(b);}
    });
  }
  function maybeAlert(){
    const cd=load(COOLDOWN_KEY,{})||{}; const k=today(); if(cd[k]) return;
    const store=loadDogs(); const dogs=(store.dogs||[]).map(ensureDog).filter(d=>!d.archived && intactFemale(d));
    const inHeat=dogs.filter(d=>status(d).inHeat); const soon=dogs.filter(d=>!status(d).inHeat && status(d).dueSoon);
    if(!inHeat.length && !soon.length) return;
    cd[k]=true; save(COOLDOWN_KEY,cd);
    const lines=[]; if(inHeat.length) lines.push("In heat: "+inHeat.map(d=>d.callName).join(", "));
    if(soon.length) lines.push("Due soon: "+soon.map(d=>d.callName).join(", "));
    alert(lines.join("\n"));
  }
  function wrapProfile(){
    const fn=window.renderDogProfile;
    if(typeof fn!=="function" || fn._heatWrapped) return;
    window.renderDogProfile=function(dog){
      const res=fn.apply(this,arguments);
      try{ensureBlock(); fill(dog); profileBadge(dog);}catch{}
      return res;
    };
    window.renderDogProfile._heatWrapped=true;
  }
  function wrapDogs(){
    const fn=window.renderDogs;
    if(typeof fn!=="function" || fn._heatWrapped) return;
    window.renderDogs=function(){
      const res=fn.apply(this,arguments);
      setTimeout(()=>{try{listBadges();}catch{}},0);
      return res;
    };
    window.renderDogs._heatWrapped=true;
  }
  function hookAfterShow(){
    const prev=window.__afterShow;
    if(prev && prev._heatWrapped) return;
    window.__afterShow=function(view){
      try{ if(typeof prev==="function") prev(view);}catch{}
      if(view==="Dogs") setTimeout(()=>{try{listBadges();}catch{} try{maybeAlert();}catch{}},0);
      if(view==="DogProfile") setTimeout(()=>{try{ensureBlock();}catch{}},0);
    };
    window.__afterShow._heatWrapped=true;
  }
  function install(){wrapProfile();wrapDogs();hookAfterShow();}
  document.addEventListener("DOMContentLoaded",()=>{install(); setTimeout(install,600); setTimeout(install,1600);});
})();
