(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const $ = (id) => document.getElementById(id);

  const DISPOSITIONS = ["Active", "For sale", "Retired", "Transferred", "Deceased"];
  const SEX_OPTIONS = ["(unknown)", "Male (intact)", "Male (neutered)", "Female (intact)", "Female (spayed)"];

  function loadStore() {
    try {
      const raw = localStorage.getItem(DOG_KEY);
      const o = raw ? JSON.parse(raw) : { dogs: [] };
      if (!Array.isArray(o.dogs)) o.dogs = [];
      return o;
    } catch {
      return { dogs: [] };
    }
  }

  function saveStore(store) {
    localStorage.setItem(DOG_KEY, JSON.stringify(store));
  }

  function nowISO() { return new Date().toISOString(); }
  function todayISODate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function parseCSV(s){ return String(s||"").split(",").map(x=>x.trim()).filter(Boolean); }
  function escapeHtml(s){
    return String(s??"")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function isFixed(sex){ const s=String(sex||"").toLowerCase(); return s.includes("spayed")||s.includes("neutered"); }
  function genderOf(sex){ const s=String(sex||"").toLowerCase(); if(s.includes("female")) return "female"; if(s.includes("male")) return "male"; return ""; }
  function isFemaleIntact(sex){ const s=String(sex||"").toLowerCase(); return s.includes("female")&&s.includes("intact")&&!s.includes("spayed"); }

  function fillSelect(id, options, selected){
    const sel=$(id); if(!sel) return;
    sel.innerHTML="";
    options.forEach(opt=>{
      const o=document.createElement("option");
      o.value=opt; o.textContent=opt;
      if(opt===selected) o.selected=true;
      sel.appendChild(o);
    });
  }

  function profileRoot(){
    return $("viewDogProfile") || document.querySelector("#viewDogProfile") || null;
  }

  function getProfileTitleText(profile) {
    const h = profile.querySelector("h2") || profile.querySelector("h3");
    return (h?.textContent || "").trim();
  }

  function resolveDogId(profile) {
    // 1) preferred: bundle sets this
    const direct = String(window.currentDogId || "").trim();
    if (direct) return direct;

    // 2) fallback: match by callName from the profile title
    const store = loadStore();
    const title = getProfileTitleText(profile);
    if (!title) return "";

    const matches = store.dogs.filter(d => d && String(d.callName||"").trim() === title);
    if (matches.length === 1 && matches[0].dogId) return String(matches[0].dogId);

    // 3) weaker fallback: match by registeredName if that's what title shows
    const matches2 = store.dogs.filter(d => d && String(d.registeredName||"").trim() === title);
    if (matches2.length === 1 && matches2[0].dogId) return String(matches2[0].dogId);

    return "";
  }

  function getCtx(profile) {
    const id = resolveDogId(profile);
    if (!id) return null;

    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d && String(d.dogId) === String(id));
    if (idx < 0) return null;
    return { id, store, idx, dog: store.dogs[idx] || {} };
  }

  function ensureBadge(profile){
    if (profile.querySelector(".bp-v33-badge")) return;
    const b=document.createElement("div");
    b.className="bp-v33-badge";
    b.textContent="V3.3";
    profile.appendChild(b);
  }

  function ensureContainer(profile){
    let wrap=$("bpProfileV33");
    if(wrap) return wrap;

    wrap=document.createElement("div");
    wrap.id="bpProfileV33";
    wrap.className="bp-profile-v33 card";

    const title = profile.querySelector("h2") || profile.querySelector("h3") || null;
    if (title) title.insertAdjacentElement("afterend", wrap);
    else profile.prepend(wrap);

    return wrap;
  }

  function hideLegacy(profile){
    ["dogStatus","dogSexInline","dogSex","btnDoneDog","btnNotesDog","btnMoreDog","btnSaveDog","btnCancelDog"].forEach((id)=>{
      const el=$(id);
      if(el){ el.classList.add("bp-hide-legacy-profile"); el.style.pointerEvents="none"; }
    });

    profile.querySelectorAll("button").forEach((b)=>{
      const t=(b.textContent||"").trim().toLowerCase();
      if(t==="done" || t==="notes" || t.startsWith("more")){
        const row=b.closest(".action-row") || b.closest(".row") || b.parentElement;
        if(row) row.classList.add("bp-hide-legacy-profile");
        b.classList.add("bp-hide-legacy-profile");
        b.style.pointerEvents="none";
      }
    });
  }

  function build(dog){
    const status=(dog.status||"Puppy").trim()||"Puppy";
    const nick=Array.isArray(dog.nicknames)?dog.nicknames.join(", "):(dog.nicknames||"");
    const heatStart=dog.heatStartISO?String(dog.heatStartISO).slice(0,10):"";
    const inHeat=!!dog.inHeat;

    return `
      <div class="bp-v33-title">Profile (rebuilt)</div>

      <label class="label">Call name</label>
      <input id="bpCallName" value="${escapeHtml(dog.callName||"")}" />

      <label class="label">Breed</label>
      <input id="bpBreed" value="${escapeHtml(dog.breed||"")}" />

      <label class="label">Nicknames (comma-separated)</label>
      <input id="bpNicknames" value="${escapeHtml(nick)}" />

      <div class="timeline-item" style="margin-top:12px;">
        <strong>Sex</strong>
        <label class="label">Sex</label>
        <select id="bpSex"></select>
      </div>

      <div class="timeline-item" style="margin-top:12px;">
        <strong>Life stage</strong>
        <div class="row" style="justify-content:space-between; align-items:center;">
          <div class="muted small">Life stage</div>
          <div class="pill" id="bpLifeStagePill">${escapeHtml(status)}</div>
        </div>
        <button type="button" class="btn primary bp-promote" id="bpPromoteAdult" style="margin-top:10px;">Promote to Adult</button>
      </div>

      <div class="timeline-item" style="margin-top:12px;">
        <strong>Disposition</strong>
        <label class="label">Disposition</label>
        <select id="bpDisposition"></select>
        <div class="muted small" style="margin-top:8px;">Retired / Transferred / Deceased auto-archive.</div>
      </div>

      <div class="timeline-item" style="margin-top:12px;" id="bpHeatWrap">
        <strong>Heat tracking</strong>
        <div class="muted small" style="margin-top:6px;">Adult intact females only.</div>
        <div class="row" style="margin-top:10px;">
          <button type="button" class="btn" id="bpHeatToday">Mark heat today</button>
          <button type="button" class="btn" id="bpHeatEnded">Mark heat ended</button>
        </div>
        <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:10px;">
          <input type="checkbox" id="bpInHeat" ${inHeat?"checked":""} /> Currently in heat
        </label>
        <label class="label">Heat start date</label>
        <input id="bpHeatStart" placeholder="YYYY-MM-DD" value="${escapeHtml(heatStart)}" />
      </div>

      <div class="timeline-item" style="margin-top:12px;">
        <strong>Notes</strong>
        <textarea id="bpNotes" rows="5" name="notes" autocomplete="off">${escapeHtml(dog.notes||"")}</textarea>
      </div>

      <div class="bp-savebar">
        <button type="button" class="btn primary bp-savebtn" id="bpSaveDone">Save & Done</button>
      </div>
    `;
  }

  function applySexFilter(){
    const sel=$("bpSex"); if(!sel) return;
    const current=sel.value;
    const g=genderOf(current);

    sel.querySelectorAll("option").forEach(o=>{ o.hidden=false; o.disabled=false; });

    if(!g) return;

    sel.querySelectorAll("option").forEach(o=>{
      if(o.value.toLowerCase().includes("unknown")){ o.hidden=true; o.disabled=true; }
    });

    if(isFixed(current)){
      sel.querySelectorAll("option").forEach(o=>{
        const keep=o.value===current;
        o.hidden=!keep; o.disabled=!keep;
      });
      return;
    }

    sel.querySelectorAll("option").forEach(o=>{
      const og=genderOf(o.value);
      if(og && og!==g){ o.hidden=true; o.disabled=true; }
    });
  }

  function applyHeatVisibility(){
    const heat=$("bpHeatWrap"); if(!heat) return;
    const sex=$("bpSex")?$("bpSex").value:"";
    const stage=($("bpLifeStagePill")?$("bpLifeStagePill").textContent:"Puppy").trim().toLowerCase();
    heat.classList.toggle("hide", !(stage==="adult" && isFemaleIntact(sex)));
  }

  function bind(profile, ctx){
    const sexSel=$("bpSex");
    if(sexSel && !sexSel._bpBound){
      sexSel.addEventListener("change", ()=>{ applySexFilter(); applyHeatVisibility(); });
      sexSel._bpBound=true;
    }

    const promote=$("bpPromoteAdult");
    if(promote && !promote._bpBound){
      promote.addEventListener("click", ()=>{
        const pill=$("bpLifeStagePill"); if(pill) pill.textContent="Adult";
        applyHeatVisibility();
      });
      promote._bpBound=true;
    }

    const ht=$("bpHeatToday");
    if(ht && !ht._bpBound){
      ht.addEventListener("click", ()=>{ $("bpHeatStart").value=todayISODate(); $("bpInHeat").checked=true; });
      ht._bpBound=true;
    }

    const he=$("bpHeatEnded");
    if(he && !he._bpBound){
      he.addEventListener("click", ()=>{ $("bpInHeat").checked=false; });
      he._bpBound=true;
    }

    const saveBtn=$("bpSaveDone");
    if(saveBtn && !saveBtn._bpBound){
      saveBtn.addEventListener("click", ()=>{
        const fresh = getCtx(profile);
        if(!fresh) return alert("No current dog (could not resolve dogId).");

        const d=fresh.dog;
        d.callName=$("bpCallName").value.trim();
        d.breed=$("bpBreed").value.trim();
        d.nicknames=parseCSV($("bpNicknames").value);
        d.sex=$("bpSex").value;

        const stage=($("bpLifeStagePill").textContent||"Puppy").trim();
        d.status=stage;

        d.disposition=$("bpDisposition").value;

        if(d.disposition==="Transferred"||d.disposition==="Deceased"||d.disposition==="Retired"){
          d.archived=true;
          d.archivedAt=d.archivedAt||nowISO();
        } else {
          d.archived=false;
          d.archivedAt=null;
        }

        d.notes=$("bpNotes").value;

        if(!$("bpHeatWrap").classList.contains("hide")){
          d.inHeat=!!$("bpInHeat").checked;
          const hs=$("bpHeatStart").value.trim();
          if(hs){
            try{ d.heatStartISO=new Date(hs+"T00:00:00").toISOString(); }catch{}
          }
        }

        fresh.store.dogs[fresh.idx]=d;
        saveStore(fresh.store);

        try{ if(typeof window.renderDogs==="function") window.renderDogs(); }catch{}
        try{
          if(typeof window.__back==="function") window.__back();
          else if(typeof window.__go==="function") window.__go("Dogs");
        }catch{}
      }, true);
      saveBtn._bpBound=true;
    }
  }

  function render(){
    const profile=profileRoot();
    if(!profile) return;
    ensureBadge(profile);

    const wrap=ensureContainer(profile);

    const ctx=getCtx(profile);
    if(!ctx){
      const title=getProfileTitleText(profile) || "(no title)";
      wrap.innerHTML = `
        <div class="bp-v33-title">Profile (rebuilt)</div>
        <div class="muted small">V3.3 loaded, but dogId is not resolved yet.</div>
        <div class="muted small">Title seen: <strong>${escapeHtml(title)}</strong></div>
      `;
      hideLegacy(profile);
      return;
    }

    wrap.innerHTML=build(ctx.dog);

    fillSelect("bpSex", SEX_OPTIONS, ctx.dog.sex || "(unknown)");
    fillSelect("bpDisposition", DISPOSITIONS, ctx.dog.disposition || "Active");

    const promote=$("bpPromoteAdult");
    if(promote) promote.classList.toggle("hide", String(ctx.dog.status||"Puppy").toLowerCase()!=="puppy");

    applySexFilter();
    applyHeatVisibility();
    bind(profile, ctx);
    hideLegacy(profile);
  }

  function hook(){
    const prev=window.__afterShow;
    if(prev && prev._bpProfileRebuildV33Wrapped) return;

    window.__afterShow=function(view){
      try{ if(typeof prev==="function") prev(view); }catch{}
      if(view==="DogProfile") setTimeout(render, 0);
    };
    window.__afterShow._bpProfileRebuildV33Wrapped=true;
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    hook();
    setInterval(()=>{
      const profile=profileRoot();
      if(profile && !profile.classList.contains("hide")) render();
    }, 1200);
  });
})();
