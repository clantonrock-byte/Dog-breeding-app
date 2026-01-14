(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const $ = (id) => document.getElementById(id);

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

  function saveStore(o) {
    localStorage.setItem(DOG_KEY, JSON.stringify(o));
  }

  function getCtx() {
    const id = String(window.currentDogId || "").trim();
    if (!id) return null;
    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d && d.dogId === id);
    if (idx < 0) return null;
    return { store, idx, dog: store.dogs[idx] || {} };
  }

  function sexInfo(sexStr) {
    const s = String(sexStr || "").toLowerCase();
    const female = s.includes("female");
    const male = s.includes("male");
    const spayed = s.includes("spayed");
    const neutered = s.includes("neutered");
    const fixed = spayed || neutered;
    const intact = s.includes("intact") && !fixed;
    const gender = female ? "female" : male ? "male" : "";
    return { gender, intact, fixed };
  }

  function optionInfo(opt) {
    const t = (opt.textContent || "").toLowerCase();
    const v = String(opt.value || "").toLowerCase();
    return sexInfo(t + " " + v);
  }

  function applyLocks() {
    const sel = $("dogSex");
    if (!sel) return;

    const ctx = getCtx();
    const cur = sexInfo(ctx?.dog?.sex || sel.value);

    if (!sel._bpPrevSex) sel._bpPrevSex = sel.value;

    Array.from(sel.querySelectorAll("option")).forEach((opt) => {
      const oi = optionInfo(opt);
      let disabled = false;

      // Rule: fixed -> intact not allowed
      if (cur.fixed && oi.intact) disabled = true;

      // Rule: gender locked once set (intact dog can only be one gender)
      if (cur.gender && oi.gender && oi.gender !== cur.gender) disabled = true;

      opt.disabled = disabled;
    });
  }

  function onChange() {
    const sel = $("dogSex");
    if (!sel) return;

    const prevVal = sel._bpPrevSex || sel.value;
    const prev = sexInfo(prevVal);
    const nextVal = sel.value;
    const next = sexInfo(nextVal);

    if (prev.fixed && next.intact) {
      sel.value = prevVal;
      alert("Once fixed (spayed/neutered), you can't switch back to intact.");
      return;
    }

    if (prev.gender && next.gender && prev.gender !== next.gender) {
      sel.value = prevVal;
      alert("Gender is locked once set. If this was a mistake, create a new profile or contact admin to correct it.");
      return;
    }

    sel._bpPrevSex = sel.value;
    applyLocks();

    const ctx = getCtx();
    if (!ctx) return;
    ctx.dog.sex = sel.value;
    ctx.store.dogs[ctx.idx] = ctx.dog;
    saveStore(ctx.store);
  }

  function bind() {
    const sel = $("dogSex");
    if (!sel || sel._bpSexBound) return;

    sel.addEventListener("focus", () => {
      sel._bpPrevSex = sel.value;
      applyLocks();
    });
    sel.addEventListener("change", onChange);

    sel._bpSexBound = true;
  }

  function apply() {
    bind();
    applyLocks();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpSexLockWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };
    window.__afterShow._bpSexLockWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1500);
  });
})();
