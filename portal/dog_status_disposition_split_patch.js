(() => {
  "use strict";

  const DOG_KEY = "breederPro_dogs_store_v3";
  const $ = (id) => document.getElementById(id);

  const LIFE_STAGE_KEEP = ["Puppy", "Adult"];
  const DISPOSITION_KEEP = ["Active", "For sale", "Retired", "Transferred", "Deceased"];

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

  function currentDog() {
    const id = String(window.currentDogId || "").trim();
    if (!id) return null;
    const store = loadStore();
    return store.dogs.find((d) => d && d.dogId === id) || null;
  }

  function norm(s) {
    return String(s || "").trim();
  }

  function pruneSelect(selId, keepList) {
    const sel = $(selId);
    if (!sel) return;

    const keepLower = keepList.map((x) => x.toLowerCase());

    Array.from(sel.querySelectorAll("option")).forEach((opt) => {
      const label = norm(opt.textContent) || norm(opt.value);
      const lower = label.toLowerCase();
      if (!keepLower.includes(lower)) opt.remove();
    });

    const cur = norm(sel.value).toLowerCase();
    if (!keepLower.includes(cur) && sel.options.length) {
      sel.value = sel.options[0].value;
    }
  }

  function ensureDispositionOptions() {
    const sel = $("dogDisposition");
    if (!sel) return;

    const existing = new Set(Array.from(sel.options).map((o) => norm(o.value || o.textContent)));
    DISPOSITION_KEEP.forEach((v) => {
      if (existing.has(v)) return;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  }

  function hideLegacyLifeStatusCard() {
    const profile = $("viewDogProfile");
    if (!profile) return;

    const headings = Array.from(profile.querySelectorAll("strong, h3, h2"))
      .filter((el) => (el.textContent || "").trim().toLowerCase() === "life status");

    headings.forEach((h) => {
      const card = h.closest(".timeline-item") || h.closest(".card") || h.parentElement;
      if (card) card.classList.add("bp-hide-legacy");
    });

    Array.from(profile.querySelectorAll("button")).forEach((b) => {
      const t = (b.textContent || "").trim().toLowerCase();
      if (t.includes("review transfer") || t.includes("deceased options")) {
        const card = b.closest(".timeline-item") || b.closest(".card") || b.parentElement;
        if (card) card.classList.add("bp-hide-legacy");
        b.classList.add("bp-hide-legacy");
      }
    });

    Array.from(profile.querySelectorAll("*")).forEach((el) => {
      const t = (el.textContent || "").trim();
      if (t.includes("Transferred / Deceased options are available under Status.")) {
        const card = el.closest(".timeline-item") || el.closest(".card") || el.parentElement;
        if (card) card.classList.add("bp-hide-legacy");
      }
    });
  }

  function hideLifeStageIfAdult() {
    const dog = currentDog();
    if (!dog) return;
    const status = norm(dog.status).toLowerCase();
    const isNotPuppy = status && status !== "puppy";

    const sel = $("dogStatus");
    if (sel) {
      sel.classList.toggle("hide", isNotPuppy);
      sel.disabled = isNotPuppy;
      const lbl = sel.previousElementSibling;
      if (lbl && lbl.tagName.toLowerCase() === "label") lbl.classList.toggle("hide", isNotPuppy);
    }
  }

  function syncStatusPill() {
    const dog = currentDog();
    if (!dog) return;
    const pill = $("dogStatusPill");
    if (pill && dog.status) pill.textContent = dog.status;
  }

  function apply() {
    pruneSelect("dogStatus", LIFE_STAGE_KEEP);
    ensureDispositionOptions();
    hideLegacyLifeStatusCard();
    hideLifeStageIfAdult();
    syncStatusPill();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpStatusDispSplitWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };
    window.__afterShow._bpStatusDispSplitWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1500);
  });
})();
