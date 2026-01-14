/**
 * dog_disposition_patch.js
 *
 * Adds a second "Disposition" status reserved for: For sale | Transferred | Deceased.
 * Keeps existing life-stage status (Puppy/Adult/etc.) separate.
 *
 * Data model (per dog, localStorage breederPro_dogs_store_v3):
 * - dog.status        => life stage (Puppy/Adult/etc.)  (existing)
 * - dog.disposition   => "Active" | "For sale" | "Transferred" | "Deceased" (new)
 *
 * Behavior:
 * - Disposition defaults to "Active"
 * - If disposition is Transferred or Deceased:
 *   - dog.archived = true
 *   - dog.archivedAt = nowISO()
 * - Otherwise:
 *   - dog.archived = false
 *   - dog.archivedAt = null
 *
 * UI:
 * - Inserts a "Disposition" select under the Status section on Dog Profile.
 * - Persists disposition after any Save click (works with Save & Done).
 *
 * Install: load AFTER dogs.bundle.js and AFTER your Save & Done polish script.
 */
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

  function nowISO() {
    return new Date().toISOString();
  }

  function currentDogId() {
    return String(window.currentDogId || "").trim();
  }

  function getCurrentDog() {
    const id = currentDogId();
    if (!id) return null;
    const store = loadStore();
    const idx = store.dogs.findIndex((d) => d && d.dogId === id);
    if (idx < 0) return null;
    return { store, idx, dog: store.dogs[idx] || {} };
  }

  function ensureDispositionUI() {
    const sec = $("secStatus");
    if (!sec) return;

    if ($("bpDispositionWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "bpDispositionWrap";
    wrap.className = "timeline-item";
    wrap.innerHTML = `
      <strong>Disposition</strong>
      <div class="muted small" style="margin-top:6px;">
        Use this for sale, transfer, or deceased status (separate from Puppy/Adult).
      </div>

      <label class="label">Disposition</label>
      <select id="dogDisposition">
        <option value="Active">Active</option>
        <option value="For sale">For sale</option>
        <option value="Transferred">Transferred</option>
        <option value="Deceased">Deceased</option>
      </select>
    `;

    // Insert under the existing Status section block (right after secStatus)
    sec.insertAdjacentElement("afterend", wrap);
  }

  function fillDispositionFromDog() {
    const ctx = getCurrentDog();
    if (!ctx) return;
    ensureDispositionUI();

    const sel = $("dogDisposition");
    if (!sel) return;

    const disp = String(ctx.dog.disposition || "Active").trim() || "Active";
    sel.value = ["Active", "For sale", "Transferred", "Deceased"].includes(disp) ? disp : "Active";
  }

  function persistDispositionToDog() {
    const ctx = getCurrentDog();
    if (!ctx) return;

    const sel = $("dogDisposition");
    if (!sel) return;

    const disp = String(sel.value || "Active").trim() || "Active";
    ctx.dog.disposition = disp;

    if (disp === "Transferred" || disp === "Deceased") {
      ctx.dog.archived = true;
      ctx.dog.archivedAt = ctx.dog.archivedAt || nowISO();
    } else {
      ctx.dog.archived = false;
      ctx.dog.archivedAt = null;
    }

    ctx.store.dogs[ctx.idx] = ctx.dog;
    saveStore(ctx.store);
  }

  function bindSaveClicks() {
    const profile = $("viewDogProfile");
    if (!profile || profile._bpDispBound) return;

    profile.addEventListener(
      "click",
      (e) => {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn) return;

        const id = (btn.id || "").toLowerCase();
        const text = (btn.textContent || "").toLowerCase();
        const isSave = id.includes("save") || text.includes("save");
        if (!isSave) return;

        // Let the original handler run, then persist disposition.
        setTimeout(() => {
          try { persistDispositionToDog(); } catch {}
        }, 80);
      },
      true
    );

    // Also persist immediately on change.
    profile.addEventListener(
      "change",
      (e) => {
        if (e.target && e.target.id === "dogDisposition") {
          try { persistDispositionToDog(); } catch {}
        }
      },
      true
    );

    profile._bpDispBound = true;
  }

  function apply() {
    ensureDispositionUI();
    fillDispositionFromDog();
    bindSaveClicks();
  }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpDispWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };

    window.__afterShow._bpDispWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    apply();
    setInterval(apply, 1200);
  });
})();
