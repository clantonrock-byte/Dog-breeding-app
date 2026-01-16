/**
 * portal/dog_profile_rebuild_v3_7_1.js
 *
 * v3.7.1: v3.7 (flat) + hides legacy timeline blocks under DogProfile,
 * so you don't see duplicate Status/DOB/Microchip/Rabies below the rebuilt editor.
 *
 * Keep Photo block visible (legacy photo UI stays).
 *
 * Install:
 *  - Upload JS to /portal
 *  - In root index.html footer (last):
 *      <script src="portal/dog_profile_rebuild_v3_7_1.js"></script>
 *  - Remove the v3.7 script line.
 */
(() => {
  "use strict";

  if (window.__bpProfileRebuildV371Loaded) return;
  window.__bpProfileRebuildV371Loaded = true;

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
  function saveStore(store) { localStorage.setItem(DOG_KEY, JSON.stringify(store)); }
  function nowISO() { return new Date().toISOString(); }
  function todayISODate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function parseCSV(s){ return String(s||"").split(",").map(x=>x.trim()).filter(Boolean); }
  function escapeHtml(s){
    return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function isFixed(sex){ const s=String(sex||"").toLowerCase(); return s.includes("spayed")||s.includes("neutered"); }
  function genderOf(sex){ const s=String(sex||"").toLowerCase(); if(s.includes("female")) return "female"; if(s.includes("male")) return "male"; return ""; }
  function isFemaleIntact(sex){ const s=String(sex||"").toLowerCase(); return s.includes("female")&&s.includes("intact")&&!s.includes("spayed"); }

  function profileRoot(){ return $("viewDogProfile") || document.querySelector("#viewDogProfile") || null; }
  function getProfileTitleText(profile) {
    const h = profile.querySelector("#dogProfileTitle") || profile.querySelector("h2") || profile.querySelector("h3");
    return (h?.textContent || "").trim();
  }
  function resolveDogId(profile) {
    const direct = String(window.currentDogId || "").trim();
    if (direct) return direct;

    const store = loadStore();
    const title = getProfileTitleText(profile);
    if (!title) return "";

    const matches = store.dogs.filter(d => d && String(d.callName||"").trim() === title);
    if (matches.length === 1 && matches[0].dogId) return String(matches[0].dogId);

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

  function fillSelect(el, options, selected){
    el.innerHTML="";
    options.forEach(opt=>{
      const o=document.createElement("option");
      o.value=opt; o.textContent=opt;
      if(opt===selected) o.selected=true;
      el.appendChild(o);
    });
  }

  function ensureBadge(profile){
    if (profile.querySelector(".bp-v37-badge")) return;
    const b=document.createElement("div");
    b.className="bp-v37-badge";
    b.textContent="V3.7";
    profile.appendChild(b);
  }

  function findPhotoBlock(profile){
    const tap = $("dogPhotoTap") || profile.querySelector("#dogPhotoTap");
    if (tap) return tap.closest(".timeline-item") || tap.parentElement;
    const img = $("dogPhotoImg") || profile.querySelector("#dogPhotoImg") || profile.querySelector("img");
    if (img) return img.closest(".timeline-item") || img.parentElement;

    const items = Array.from(profile.querySelectorAll(".timeline-item"));
    for (const it of items) {
      const strong = it.querySelector("strong");
      if ((strong?.textContent || "").trim().toLowerCase() === "photo") return it;
    }
    return null;
  }

  function ensureContainer(profile){
    let wrap=$("bpProfileV37");
    if(wrap) return wrap;

    wrap=document.createElement("section");
    wrap.id="bpProfileV37";
    wrap.className="bp-profile-v37 card";

    const photo = findPhotoBlock(profile);
    if (photo && photo.parentElement) photo.insertAdjacentElement("afterend", wrap);
    else {
      const title = profile.querySelector("h2") || profile.querySelector("h3") || null;
      if (title) title.insertAdjacentElement("afterend", wrap);
      else profile.prepend(wrap);
    }
    return wrap;
  }

  // Strong legacy hiding: hide old inline controls + hide legacy timeline blocks below Photo.
  function hideLegacy(profile){
    ["dogStatus","dogSexInline","btnDoneDog","btnNotesDog","btnMoreDog","dogNotes","btnSaveDog","btnCancelDog","btnMoreDogPanel","dogMorePanel"]
      .forEach((id)=>{
        const el=$(id);
        if(el){ el.classList.add("bp-hide-legacy-profile"); el.style.pointerEvents="none"; }
      });

    profile.querySelectorAll(".action-row, .row").forEach(row=>{
      const txt = (row.textContent||"").toLowerCase();
      if (txt.includes("done") && (txt.includes("notes") || txt.includes("more"))) {
        row.classList.add("bp-hide-legacy-profile");
        row.style.pointerEvents="none";
      }
    });

    const photo = findPhotoBlock(profile);
    const all = Array.from(profile.querySelectorAll(".timeline-item"));
    let startHiding = false;

    for (const it of all) {
      if (it === photo) { startHiding = true; continue; } // keep photo itself
      if (!startHiding) continue;

      if (it.id === "dogArchivedBanner" || it.querySelector("#dogArchivedBannerText")) continue;

      it.classList.add("bp-hide-legacy-profile");
      it.style.pointerEvents="none";
    }
  }

  function build(dog){
    const status=(dog.status||"Puppy").trim()||"Puppy";
    const nick=Array.isArray(dog.nicknames)?dog.nicknames.join(", "):(dog.nicknames||"");
    const heatStart=dog.heatStartISO?String(dog.heatStartISO).slice(0,10):"";
    const inHeat=!!dog.inHeat;

    return `
      <div class="bp-head">
        <div>
          <div class="bp-title">Profile</div>
          <div class="muted small">Basics • Repro • Heat • Notes</div>
        </div>
      </div>

      <div class="bp-tabs" role="tablist" aria-label="Profile sections">
        <button type="button" class="bp-tab" data-bp-jump="#bpBasics">Basics</button>
        <button type="button" class="bp-tab" data-bp-jump="#bpRepro">Repro</button>
        <button type="button" class="bp-tab" data-bp-jump="#bpHeat">Heat</button>
        <button type="button" class="bp-tab" data-bp-jump="#bpNotes">Notes</button>
      </div>

      <section id="bpBasics" class="bp-section">
        <h3>Basics</h3>
        <label class="label">Call name</label>
        <input id="bpCallName" value="${escapeHtml(dog.callName||"")}" />
        <label class="label">Breed</label>
        <input id="bpBreed" value="${escapeHtml(dog.breed||"")}" />
        <label class="label">Nicknames (comma-separated)</label>
        <input id="bpNicknames" value="${escapeHtml(nick)}" />
      </section>

      <section id="bpRepro" class="bp-section">
        <h3>Repro & Life stage</h3>
        <label class="label">Sex</label>
        <select id="bpSex"></select>
        <div class="muted small" style="margin-top:8px;">Auto-saves on change.</div>

        <div class="timeline-item" style="margin-top:12px;">
          <strong>Life stage</strong>
          <div class="row" style="justify-content:space-between; align-items:center;">
            <div class="muted small">Life stage</div>
            <div class="pill" id="bpLifeStagePill">${escapeHtml(status)}</div>
          </div>
          <button type="button" class="btn primary" id="bpPromoteAdult" style="margin-top:10px;">Promote to Adult</button>
        </div>

        <label class="label" style="margin-top:12px;">Disposition</label>
        <select id="bpDisposition"></select>
        <div class="muted small" style="margin-top:8px;">Retired / Transferred / Deceased auto-archive.</div>
      </section>

      <section id="bpHeat" class="bp-section">
        <h3>Heat tracking</h3>
        <div class="muted small">Adult intact females only. Heat actions auto-save.</div>
        <div class="row" style="margin-top:10px;">
          <button type="button" class="btn" id="bpHeatToday">Mark heat today</button>
          <button type="button" class="btn" id="bpHeatEnded">Mark heat ended</button>
        </div>
        <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:10px;" id="bpInHeatWrap">
          <input type="checkbox" id="bpInHeat" ${inHeat?"checked":""} /> Currently in heat
        </label>
        <label class="label">Heat start date</label>
        <input id="bpHeatStart" placeholder="YYYY-MM-DD" value="${escapeHtml(heatStart)}" />
      </section>

      <section id="bpNotes" class="bp-section">
        <h3>Notes</h3>
        <textarea id="bpNotes" rows="6" name="notes" autocomplete="off">${escapeHtml(dog.notes||"")}</textarea>
      </section>

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
    const wrap=$("bpHeat"); if(!wrap) return;
    const sex=$("bpSex")?$("bpSex").value:"";
    const stage=($("bpLifeStagePill")?$("bpLifeStagePill").textContent:"Puppy").trim().toLowerCase();
    const show = (stage==="adult" && isFemaleIntact(sex));
    wrap.classList.toggle("hide", !show);
  }

  function persistQuick(profile, mutateFn){
    const ctx = getCtx(profile);
    if(!ctx) return false;
    mutateFn(ctx.dog);
    ctx.store.dogs[ctx.idx] = ctx.dog;
    saveStore(ctx.store);
    try { if (typeof window.renderDogs === "function") window.renderDogs(); } catch {}
    return true;
  }

  function bind(profile){
    profile.querySelectorAll("#bpProfileV37 .bp-tab").forEach(btn => {
      if (btn._bpBound) return;
      btn.addEventListener("click", ()=>{
        const sel = btn.getAttribute("data-bp-jump");
        const el = profile.querySelector(sel);
        if (!el) return;
        el.scrollIntoView({behavior:"smooth", block:"start"});
      });
      btn._bpBound = true;
    });

    const sexSel=$("bpSex");
    if(sexSel && !sexSel._bpBound){
      sexSel.addEventListener("change", ()=>{
        applySexFilter();
        applyHeatVisibility();
        persistQuick(profile, (d)=>{ d.sex = sexSel.value; });
      });
      sexSel._bpBound=true;
    }

    const dispSel=$("bpDisposition");
    if(dispSel && !dispSel._bpBound){
      dispSel.addEventListener("change", ()=>{
        persistQuick(profile, (d)=>{
          d.disposition = dispSel.value;
          if(d.disposition==="Transferred"||d.disposition==="Deceased"||d.disposition==="Retired"){
            d.archived=true;
            d.archivedAt=d.archivedAt||nowISO();
          } else {
            d.archived=false;
            d.archivedAt=null;
          }
        });
      });
      dispSel._bpBound=true;
    }

    const promote=$("bpPromoteAdult");
    if(promote && !promote._bpBound){
      promote.addEventListener("click", ()=>{
        const pill=$("bpLifeStagePill"); if(pill) pill.textContent="Adult";
        applyHeatVisibility();
        persistQuick(profile, (d)=>{ d.status="Adult"; });
      });
      promote._bpBound=true;
    }

    const ht=$("bpHeatToday");
    if(ht && !ht._bpBound){
      ht.addEventListener("click", ()=>{
        const date = todayISODate();
        $("bpHeatStart").value = date;
        $("bpInHeat").checked = true;
        persistQuick(profile, (d)=>{
          d.inHeat = true;
          try { d.heatStartISO = new Date(date + "T00:00:00").toISOString(); } catch {}
        });
      });
      ht._bpBound=true;
    }

    const he=$("bpHeatEnded");
    if(he && !he._bpBound){
      he.addEventListener("click", ()=>{
        $("bpInHeat").checked = false;
        persistQuick(profile, (d)=>{ d.inHeat = false; });
      });
      he._bpBound=true;
    }

    const inHeat=$("bpInHeat");
    if(inHeat && !inHeat._bpBound){
      inHeat.addEventListener("change", ()=>{
        persistQuick(profile, (d)=>{ d.inHeat = !!inHeat.checked; });
      });
      inHeat._bpBound=true;
    }

    const heatStart=$("bpHeatStart");
    if(heatStart && !heatStart._bpBound){
      heatStart.addEventListener("change", ()=>{
        const hs = heatStart.value.trim();
        persistQuick(profile, (d)=>{
          if(hs){
            try { d.heatStartISO = new Date(hs + "T00:00:00").toISOString(); } catch {}
          }
        });
      });
      heatStart._bpBound=true;
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
        d.notes=$("bpNotes").value;

        d.sex = $("bpSex").value;
        d.disposition = $("bpDisposition").value;
        d.status = ($("bpLifeStagePill").textContent||"Puppy").trim();

        if(!$("bpHeat").classList.contains("hide")){
          d.inHeat=!!$("bpInHeat").checked;
          const hs=$("bpHeatStart").value.trim();
          if(hs){
            try{ d.heatStartISO=new Date(hs+"T00:00:00").toISOString(); }catch{}
          }
        }

        if(d.disposition==="Transferred"||d.disposition==="Deceased"||d.disposition==="Retired"){
          d.archived=true;
          d.archivedAt=d.archivedAt||nowISO();
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

  function render(profile){
    ensureBadge(profile);
    const wrap=ensureContainer(profile);

    const ctx=getCtx(profile);
    if(!ctx){
      const title=getProfileTitleText(profile) || "(no title)";
      wrap.innerHTML = `
        <div class="bp-title">Profile</div>
        <div class="muted small">V3.7.1 loaded, but dogId is not resolved yet.</div>
        <div class="muted small">Title: <strong>${escapeHtml(title)}</strong></div>
      `;
      hideLegacy(profile);
      return false;
    }

    wrap.innerHTML=build(ctx.dog);

    fillSelect($("bpSex"), SEX_OPTIONS, ctx.dog.sex || "(unknown)");
    fillSelect($("bpDisposition"), DISPOSITIONS, ctx.dog.disposition || "Active");

    const promote=$("bpPromoteAdult");
    if(promote) promote.classList.toggle("hide", String(ctx.dog.status||"Puppy").toLowerCase()!=="puppy");

    applySexFilter();
    applyHeatVisibility();
    bind(profile);
    hideLegacy(profile);
    return true;
  }

  function retryRenderOnce(){
    const profile=profileRoot();
    if(!profile || profile.classList.contains("hide")) return;

    let tries = 0;
    const t = setInterval(()=>{
      tries += 1;
      const ok = render(profile);
      if (ok || tries >= 20) clearInterval(t);
    }, 250);
  }

  function hook(){
    const prev=window.__afterShow;
    if(prev && prev._bpProfileRebuildV371Wrapped) return;

    window.__afterShow=function(view){
      try{ if(typeof prev==="function") prev(view); }catch{}
      if(view==="DogProfile") setTimeout(retryRenderOnce, 0);
    };
    window.__afterShow._bpProfileRebuildV371Wrapped=true;
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    hook();
    setTimeout(retryRenderOnce, 50);
  });
})();