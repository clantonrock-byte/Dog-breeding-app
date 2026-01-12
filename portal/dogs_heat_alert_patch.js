/**
 * dogs_heat_alert_patch.js
 *
 * Adds "Bitch in heat" tracking + alerts.
 *
 * Install: load AFTER dogs.bundle.js
 */
(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const SETTINGS_KEY = "breederPro_dogs_settings_v1";
  const COOLDOWN_KEY = "breederPro_dogs_heat_cooldown_v1";
  const DEFAULTS = { cycleDays: 180, heatDurationDays: 21, warnDays: 7 };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  const loadJson = (k, f) => { try{ const r=localStorage.getItem(k); return r?JSON.parse(r):f; }catch{ return f; } };
  const saveJson = (k, o) => localStorage.setItem(k, JSON.stringify(o));

  const loadDogsStore = () => {
    const o = loadJson(DOG_KEY, { dogs: [] });
    if (!Array.isArray(o.dogs)) o.dogs = [];
    return o;
  };
  const saveDogsStore = (o) => saveJson(DOG_KEY, o);

  const loadSettings = () => {
    const o = loadJson(SETTINGS_KEY, {}) || {};
    return {
      cycleDays: Number.isFinite(Number(o.cycleDays)) ? Number(o.cycleDays) : DEFAULTS.cycleDays,
      heatDurationDays: Number.isFinite(Number(o.heatDurationDays)) ? Number(o.heatDurationDays) : DEFAULTS.heatDurationDays,
      warnDays: Number.isFinite(Number(o.warnDays)) ? Number(o.warnDays) : DEFAULTS.warnDays,
    };
  };
  const saveSettings = (s) => saveJson(SETTINGS_KEY, {
    cycleDays: Number(s.cycleDays || DEFAULTS.cycleDays),
    heatDurationDays: Number(s.heatDurationDays || DEFAULTS.heatDurationDays),
    warnDays: Number(s.warnDays || DEFAULTS.warnDays),
  });

  const todayKey = () => new Date().toISOString().slice(0,10);
  const parseISO = (iso) => { if(!iso) return null; const d=new Date(iso); return Number.isFinite(d.getTime())?d:null; };
  const addDays = (d, n) => { const x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; };
  const fmtShort = (d) => { try{return d.toLocaleDateString();}catch{return "";} };

  const isFemale = (dog) => String(dog?.sex||"").toLowerCase().startsWith("female");

  const ensureDogFields = (dog) => {
    if (typeof dog.inHeat !== "boolean") dog.inHeat = false;
    if (typeof dog.heatStartISO !== "string") dog.heatStartISO = "";
    if (typeof dog.heatNotes !== "string") dog.heatNotes = "";
    return dog;
  };

  const computeHeatStatus = (dog) => {
    const s = loadSettings();
    const start = parseISO(dog.heatStartISO);
    const end = start ? addDays(start, s.heatDurationDays) : null;
    const next = start ? addDays(start, s.cycleDays) : null;
    const now = new Date();
    const inHeatByDates = start && end ? (now >= start && now <= end) : false;
    const inHeat = !!dog.inHeat || inHeatByDates;
    const dueSoon = !inHeat && next ? (now >= addDays(next, -s.warnDays) && now <= next) : false;
    return { start, end, next, inHeat, dueSoon, settings: s };
  };

  function ensureProfileBlock() {
    const secStatus = document.getElementById("secStatus");
    if (!secStatus) return;
    if (document.getElementById("heatBlock")) return;

    const block = document.createElement("div");
    block.className = "timeline-item";
    block.id = "heatBlock";
    block.innerHTML = `
      <strong>Bitch in heat</strong>
      <div class="muted small" style="margin-top:6px;">Track heat start date and show alerts (local only).</div>
      <label class="muted small" style="display:flex; gap:10px; align-items:center; margin-top:10px;">
        <input type="checkbox" id="chkInHeat" /> Currently in heat
      </label>
      <label class="label">Heat start date</label>
      <input id="heatStart" placeholder="YYYY-MM-DD" />
      <div id="heatDerived" class="muted small" style="margin-top:8px;"></div>
      <label class="label">Notes (optional)</label>
      <input id="heatNotes" placeholder="Optional notes…" />
      <div class="row" style="margin-top:12px;">
        <button type="button" class="btn" id="btnSaveHeat">Save heat info</button>
      </div>
    `;
    secStatus.insertAdjacentElement("afterend", block);

    document.getElementById("btnSaveHeat").addEventListener("click", () => {
      const dogId = window.currentDogId || "";
      if (!dogId) return;

      const store = loadDogsStore();
      const idx = store.dogs.findIndex(d => d.dogId === dogId);
      if (idx < 0) return;

      const dog = ensureDogFields(store.dogs[idx]);
      dog.inHeat = !!document.getElementById("chkInHeat").checked;

      const startStr = String(document.getElementById("heatStart").value || "").trim();
      dog.heatStartISO = startStr ? new Date(startStr + "T00:00:00").toISOString() : "";
      dog.heatNotes = String(document.getElementById("heatNotes").value || "").trim();

      store.dogs[idx] = dog;
      saveDogsStore(store);

      try { if (typeof window.renderDogProfile === "function") window.renderDogProfile(dog); } catch {}
      try { if (typeof window.renderDogs === "function") window.renderDogs(); } catch {}

      alert("Heat info saved.");
    });
  }

  function fillProfileBlock(dog) {
    if (!document.getElementById("heatBlock")) return;
    dog = ensureDogFields(dog);

    document.getElementById("chkInHeat").checked = !!dog.inHeat;
    document.getElementById("heatStart").value = dog.heatStartISO ? dog.heatStartISO.slice(0,10) : "";
    document.getElementById("heatNotes").value = dog.heatNotes || "";

    const st = computeHeatStatus(dog);
    const parts = [];
    if (st.start) parts.push(`Start: ${fmtShort(st.start)}`);
    if (st.end) parts.push(`Est end: ${fmtShort(st.end)}`);
    if (st.next) parts.push(`Est next: ${fmtShort(st.next)}`);
    if (st.dueSoon) parts.push("Due soon");
    if (st.inHeat) parts.push("IN HEAT");
    document.getElementById("heatDerived").textContent = parts.length ? parts.join(" • ") : "No heat date recorded yet.";
  }

  function wrapRenderDogProfile() {
    const fn = window.renderDogProfile;
    if (typeof fn !== "function" || fn._bpHeatWrapped) return;

    window.renderDogProfile = function(dog){
      const res = fn.apply(this, arguments);
      try{
        ensureProfileBlock();
        const isF = isFemale(dog);
        document.getElementById("heatBlock")?.classList?.toggle("hide", !isF);
        if (isF) fillProfileBlock(dog);
      }catch{}
      return res;
    };
    window.renderDogProfile._bpHeatWrapped = true;
  }

  function addHeatBadgesToDogCards() {
    const list = document.getElementById("dogsList");
    if (!list) return;

    const store = loadDogsStore();
    const byId = new Map((store.dogs||[]).map(d => [d.dogId, ensureDogFields(d)]));

    list.querySelectorAll(".dog-card").forEach(card => {
      const id = card.getAttribute("data-dog-id") || "";
      const dog = byId.get(id);
      if (!dog) return;

      card.querySelector(".heat-badge")?.remove();
      card.querySelector(".heat-soon-badge")?.remove();
      if (!isFemale(dog)) return;

      const st = computeHeatStatus(dog);
      const title = card.querySelector(".dog-card-title") || card.querySelector(".dog-card-mid");
      if (!title) return;

      if (st.inHeat) {
        const b=document.createElement("span");
        b.className="heat-badge";
        b.textContent="HEAT";
        title.appendChild(b);
      } else if (st.dueSoon) {
        const b=document.createElement("span");
        b.className="heat-soon-badge";
        b.textContent="SOON";
        title.appendChild(b);
      }
    });
  }

  function wrapRenderDogs() {
    const fn = window.renderDogs;
    if (typeof fn !== "function" || fn._bpHeatWrapped) return;

    window.renderDogs = function(){
      const res = fn.apply(this, arguments);
      setTimeout(() => { try{ addHeatBadgesToDogCards(); }catch{} }, 0);
      return res;
    };
    window.renderDogs._bpHeatWrapped = true;
  }

  function maybeAlertOnDogsOpen() {
    const cd = loadJson(COOLDOWN_KEY, {}) || {};
    const k = todayKey();
    if (cd[k]) return;

    const store = loadDogsStore();
    const dogs = (store.dogs||[]).map(ensureDogFields);

    const inHeat = dogs.filter(d => !d.archived && isFemale(d) && computeHeatStatus(d).inHeat);
    const soon = dogs.filter(d => !d.archived && isFemale(d) && !computeHeatStatus(d).inHeat && computeHeatStatus(d).dueSoon);

    if (!inHeat.length && !soon.length) return;

    cd[k] = true;
    saveJson(COOLDOWN_KEY, cd);

    const lines=[];
    if (inHeat.length) lines.push(`In heat: ${inHeat.map(d=>d.callName).join(", ")}`);
    if (soon.length) lines.push(`Due soon: ${soon.map(d=>d.callName).join(", ")}`);
    alert(lines.join("\n"));
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpHeatWrapped) return;
    window.__afterShow = function(view){
      try{ if (typeof prev === "function") prev(view); }catch{}
      if (view === "Dogs") {
        setTimeout(() => { try{ addHeatBadgesToDogCards(); }catch{} try{ maybeAlertOnDogsOpen(); }catch{} }, 0);
      }
      if (view === "DogProfile") {
        setTimeout(() => { try{ ensureProfileBlock(); }catch{} }, 0);
      }
    };
    window.__afterShow._bpHeatWrapped = true;
  }

  function injectHeatSettings() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg || document.getElementById("bpHeatSettingsWrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "timeline-item";
    wrap.id = "bpHeatSettingsWrap";
    wrap.innerHTML = `
      <strong>Heat alerts</strong>
      <div class="muted small" style="margin-top:6px;">These settings affect "Due soon" and estimated dates.</div>
      <div class="grid2" style="margin-top:10px;">
        <div>
          <label class="label">Cycle length (days)</label>
          <input id="bpHeatCycleDays" inputmode="decimal" placeholder="e.g., 180" />
        </div>
        <div>
          <label class="label">Heat duration (days)</label>
          <input id="bpHeatDurationDays" inputmode="decimal" placeholder="e.g., 21" />
        </div>
      </div>
      <label class="label">Warn days before next heat</label>
      <input id="bpHeatWarnDays" inputmode="decimal" placeholder="e.g., 7" />
    `;

    const footer = dlg.querySelector(".dlg-f");
    if (footer) footer.insertAdjacentElement("beforebegin", wrap);
    else dlg.querySelector(".dlg-card")?.appendChild(wrap);

    const s = loadSettings();
    document.getElementById("bpHeatCycleDays").value = String(s.cycleDays);
    document.getElementById("bpHeatDurationDays").value = String(s.heatDurationDays);
    document.getElementById("bpHeatWarnDays").value = String(s.warnDays);

    const btn = document.getElementById("btnBpSaveSettings");
    if (btn && !btn._bpHeatSaveBound) {
      btn.addEventListener("click", () => {
        saveSettings({
          cycleDays: Number(document.getElementById("bpHeatCycleDays").value || DEFAULTS.cycleDays),
          heatDurationDays: Number(document.getElementById("bpHeatDurationDays").value || DEFAULTS.heatDurationDays),
          warnDays: Number(document.getElementById("bpHeatWarnDays").value || DEFAULTS.warnDays),
        });
      }, true);
      btn._bpHeatSaveBound = true;
    }
  }

  function install() {
    wrapRenderDogProfile();
    wrapRenderDogs();
    hookAfterShow();
    injectHeatSettings();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
