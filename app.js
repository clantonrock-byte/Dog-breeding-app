// app.js — Rocks Corner Breeder Pro (Phase 1) — FIX03-2026-01-05
// ZIP-only drop-in build: no service worker, cache-safe.
// Data is stored in localStorage.

(function () {
  "use strict";

  const BUILD_ID = "FIX03-2026-01-05";
  const $ = (id) => document.getElementById(id);

  // ---------- Navigation ----------
  const stack = [];
  function show(viewId) {
    const views = document.querySelectorAll("[data-view]");
    views.forEach(v => v.classList.add("hide"));
    const el = $(viewId);
    if (!el) return;
    el.classList.remove("hide");
    $("currentViewLabel").textContent = viewId;
    if (typeof window.afterShow === "function") {
      try { window.afterShow(viewId); } catch (e) {}
    }
  }
  window.__back = function () {
    if (!stack.length) return show("Home");
    show(stack.pop());
  };
  window.__home = function () {
    stack.length = 0;
    show("Home");
  };
  window.__nav = function (next) {
    const cur = $("currentViewLabel").textContent || "Home";
    if (cur && cur !== next) stack.push(cur);
    show(next);
  };

  // ---------- Storage helpers ----------
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function lsSet(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // ---------- Dogs ----------
  const DOGS_KEY = "rc_dogs_v1";
  function loadDogs() {
    return lsGet(DOGS_KEY, { dogs: [] });
  }
  function saveDogs(store) {
    lsSet(DOGS_KEY, store);
  }

  function currentDogsFilterSex() {
    const pill = $("dogsFilterPill").textContent.trim();
    if (pill === "Males") return "male";
    if (pill === "Females") return "female";
    return "";
  }

  function renderDogs(filterSex) {
    const store = loadDogs();
    const list = $("dogsList");
    list.innerHTML = "";

    const dogs = store.dogs
      .filter(d => !d.archived)
      .filter(d => !filterSex || (d.sex || "").toLowerCase() === filterSex);

    if (!dogs.length) {
      list.innerHTML = "<div class='muted small'>No dogs yet. Tap <b>Add dog</b>.</div>";
      $("dogsCount").textContent = "0";
      return;
    }

    dogs.sort((a, b) => (a.callName || "").localeCompare(b.callName || ""));
    $("dogsCount").textContent = String(dogs.length);

    for (const d of dogs) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="row" style="justify-content:space-between; gap:10px;">
          <div>
            <div class="title">${escapeHtml(d.callName || "")}</div>
            <div class="muted small">${escapeHtml(d.breed || "")} • ${escapeHtml(d.sex || "") || "Sex: ?"} • ${escapeHtml(d.dob || "") || "DOB: ?"}</div>
          </div>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button class="btn" data-act="edit">Edit</button>
            <button class="btn" data-act="archive">Archive</button>
          </div>
        </div>
      `;
      card.querySelector('[data-act="edit"]').addEventListener("click", () => openDogEditor(d.dogId));
      card.querySelector('[data-act="archive"]').addEventListener("click", () => archiveDog(d.dogId));
      list.appendChild(card);
    }
  }

  function newDogId() {
    return "dog_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function addDogBasic(callName) {
    const store = loadDogs();
    store.dogs.push({
      dogId: newDogId(),
      callName: callName,
      breed: "German Shorthaired Pointer",
      sex: "",
      dob: "",
      notes: "",
      archived: false,
      createdAt: new Date().toISOString()
    });
    saveDogs(store);
    return store.dogs[store.dogs.length - 1].dogId;
  }

  function archiveDog(id) {
    const store = loadDogs();
    const d = store.dogs.find(x => x.dogId === id);
    if (!d) return;
    d.archived = true;
    d.archivedAt = new Date().toISOString();
    saveDogs(store);
    renderDogs(currentDogsFilterSex());
  }

  function openDogEditor(id) {
    const store = loadDogs();
    const d = store.dogs.find(x => x.dogId === id);
    if (!d) return;

    $("editDogId").textContent = id;
    $("editCallName").value = d.callName || "";
    $("editBreed").value = d.breed || "German Shorthaired Pointer";
    $("editSex").value = d.sex || "";
    $("editDob").value = d.dob || "";
    $("editNotes").value = d.notes || "";

    $("dogEditorSaveBtn").textContent = "Save";
    $("dogEditor").classList.remove("hide");
  }

  function closeDogEditor() {
    $("dogEditor").classList.add("hide");
  }

  function saveDogEditor() {
    const id = $("editDogId").textContent;
    const store = loadDogs();
    const d = store.dogs.find(x => x.dogId === id);
    if (!d) return;

    d.callName = ($("editCallName").value || "").trim();
    d.breed = ($("editBreed").value || "").trim();
    d.sex = ($("editSex").value || "").trim();
    d.dob = ($("editDob").value || "").trim();
    d.notes = ($("editNotes").value || "").trim();
    d.updatedAt = new Date().toISOString();
    saveDogs(store);

    $("dogEditorSaveBtn").textContent = "Done";
    setTimeout(() => {
      closeDogEditor();
      renderDogs(currentDogsFilterSex());
    }, 250);
  }

  // Expose for the Add Dog button (fix for bp_openAddDogSheet)
  window.bp_openAddDogSheet = function () {
    try {
      $("addDogCallName").value = "";
      $("addDogBreed").value = "German Shorthaired Pointer";
      $("addDogSex").value = "";
      $("addDogDob").value = "";
      $("addDogSaveBtn").textContent = "Save";
      $("addDogSheet").classList.remove("hide");
    } catch (e) {
      alert("Add Dog not ready: " + (e && e.message ? e.message : "unknown error"));
    }
  };

  function closeAddDogSheet() {
    $("addDogSheet").classList.add("hide");
  }

  function saveAddDogSheet() {
    const name = ($("addDogCallName").value || "").trim();
    if (!name) {
      alert("Call name is required.");
      return;
    }
    const dogId = addDogBasic(name);

    // Apply optional fields
    const store = loadDogs();
    const d = store.dogs.find(x => x.dogId === dogId);
    if (d) {
      d.breed = ($("addDogBreed").value || "").trim() || d.breed;
      d.sex = ($("addDogSex").value || "").trim();
      d.dob = ($("addDogDob").value || "").trim();
      saveDogs(store);
    }

    $("addDogSaveBtn").textContent = "Done";
    setTimeout(() => {
      closeAddDogSheet();
      renderDogs(currentDogsFilterSex());
    }, 250);
  }

  // ---------- Inventory ----------
  // Definitions: { sku, name, unit }
  // Stock: { sku -> qty }
  const INV_DEF_KEY = "rc_inv_defs_v1";
  const INV_STOCK_KEY = "rc_inv_stock_v1";
  const INV_LOG_KEY = "rc_inv_log_v1";

  function loadDefs() { return lsGet(INV_DEF_KEY, { defs: [] }); }
  function saveDefs(s) { lsSet(INV_DEF_KEY, s); }
  function loadStock() { return lsGet(INV_STOCK_KEY, { stock: {} }); }
  function saveStock(s) { lsSet(INV_STOCK_KEY, s); }
  function loadLog() { return lsGet(INV_LOG_KEY, { log: [] }); }
  function saveLog(s) { lsSet(INV_LOG_KEY, s); }

  function invLog(entry) {
    const L = loadLog();
    L.log.unshift(Object.assign({ at: new Date().toISOString() }, entry));
    L.log = L.log.slice(0, 200);
    saveLog(L);
  }

  function renderInventory() {
    const defs = loadDefs().defs;
    const stock = loadStock().stock;
    const list = $("invList");
    list.innerHTML = "";

    if (!defs.length) {
      list.innerHTML = "<div class='muted small'>No inventory definitions yet. Tap <b>Add definition</b>.</div>";
      return;
    }

    defs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    for (const d of defs) {
      const qty = Number(stock[d.sku] || 0);
      const row = document.createElement("div");
      row.className = "card";
      row.innerHTML = `
        <div class="row" style="justify-content:space-between; gap:10px;">
          <div>
            <div class="title">${escapeHtml(d.name || "")}</div>
            <div class="muted small">SKU: ${escapeHtml(d.sku)} • Qty: <b>${qty}</b> ${escapeHtml(d.unit || "")}</div>
          </div>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button class="btn" data-act="add">+ Stock</button>
            <button class="btn" data-act="sub">- Stock</button>
          </div>
        </div>
      `;
      row.querySelector('[data-act="add"]').addEventListener("click", () => openInvAdjust(d.sku, +1));
      row.querySelector('[data-act="sub"]').addEventListener("click", () => openInvAdjust(d.sku, -1));
      list.appendChild(row);
    }
  }

  function openInvDefinition() {
    $("defSku").value = "";
    $("defName").value = "";
    $("defUnit").value = "";
    $("defSaveBtn").textContent = "Save";
    $("invDefSheet").classList.remove("hide");
  }
  function closeInvDefinition() { $("invDefSheet").classList.add("hide"); }
  function saveInvDefinition() {
    const sku = ($("defSku").value || "").trim();
    const name = ($("defName").value || "").trim();
    const unit = ($("defUnit").value || "").trim();
    if (!sku || !name) { alert("SKU and Name are required."); return; }

    const defs = loadDefs();
    const existing = defs.defs.find(d => d.sku === sku);
    if (existing) {
      existing.name = name;
      existing.unit = unit;
    } else {
      defs.defs.push({ sku, name, unit });
    }
    saveDefs(defs);

    $("defSaveBtn").textContent = "Done";
    setTimeout(() => { closeInvDefinition(); renderInventory(); }, 250);
  }

  function openInvAdjust(sku, dir) {
    $("adjSku").textContent = sku;
    $("adjDir").textContent = dir > 0 ? "Add" : "Reduce";
    $("adjQty").value = "";
    $("adjSaveBtn").textContent = "Save";
    $("invAdjSheet").classList.remove("hide");
  }
  function closeInvAdjust() { $("invAdjSheet").classList.add("hide"); }
  function saveInvAdjust() {
    const sku = $("adjSku").textContent;
    const dir = $("adjDir").textContent === "Add" ? +1 : -1;
    const qty = Number(($("adjQty").value || "").trim());
    if (!Number.isFinite(qty) || qty <= 0) { alert("Enter a positive number."); return; }

    const S = loadStock();
    const cur = Number(S.stock[sku] || 0);
    const next = Math.max(0, cur + dir * qty);
    S.stock[sku] = next;
    saveStock(S);
    invLog({ kind: dir > 0 ? "ADD" : "REDUCE", sku, qty, next });

    $("adjSaveBtn").textContent = "Done";
    setTimeout(() => { closeInvAdjust(); renderInventory(); }, 250);
  }

  // ---------- Scanner (best-effort; uses BarcodeDetector if available) ----------
  async function scanOnce() {
    $("scanStatus").textContent = "Scanning…";
    const video = $("scanVideo");
    let stream = null;
    try {
      if (!("BarcodeDetector" in window)) {
        $("scanStatus").textContent = "BarcodeDetector not supported on this device/browser.";
        return;
      }
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "upc_a", "upc_e"] });
      const t0 = Date.now();
      while (Date.now() - t0 < 8000) {
        const barcodes = await detector.detect(video);
        if (barcodes && barcodes.length) {
          const val = barcodes[0].rawValue || "";
          $("scanStatus").textContent = "Scanned: " + val;
          $("scanResult").value = val;
          break;
        }
        await new Promise(r => setTimeout(r, 200));
      }
      if (!$("scanResult").value) $("scanStatus").textContent = "No code found (try better light).";
    } catch (e) {
      $("scanStatus").textContent = "Scan error: " + (e && e.message ? e.message : "unknown");
    } finally {
      if (stream) stream.getTracks().forEach(t => t.stop());
      video.pause();
      video.srcObject = null;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- afterShow hook ----------
  window.afterShow = function (viewId) {
    if (viewId === "Dogs") {
      $("buildStamp").textContent = BUILD_ID;
      renderDogs(currentDogsFilterSex());
    }
    if (viewId === "Inventory") {
      $("buildStamp").textContent = BUILD_ID;
      renderInventory();
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    $("buildStamp").textContent = BUILD_ID;

    // Home nav
    $("goDogs").addEventListener("click", () => window.__nav("Dogs"));
    $("goInventory").addEventListener("click", () => window.__nav("Inventory"));

    // Dogs
    $("dogsAll").addEventListener("click", () => { $("dogsFilterPill").textContent = "All"; renderDogs(""); });
    $("dogsMales").addEventListener("click", () => { $("dogsFilterPill").textContent = "Males"; renderDogs("male"); });
    $("dogsFemales").addEventListener("click", () => { $("dogsFilterPill").textContent = "Females"; renderDogs("female"); });
    $("btnAddDog").addEventListener("click", () => window.bp_openAddDogSheet());
    $("addDogCancelBtn").addEventListener("click", closeAddDogSheet);
    $("addDogSaveBtn").addEventListener("click", saveAddDogSheet);

    $("dogEditorCancelBtn").addEventListener("click", closeDogEditor);
    $("dogEditorSaveBtn").addEventListener("click", saveDogEditor);

    // Inventory
    $("btnAddDef").addEventListener("click", openInvDefinition);
    $("defCancelBtn").addEventListener("click", closeInvDefinition);
    $("defSaveBtn").addEventListener("click", saveInvDefinition);

    $("adjCancelBtn").addEventListener("click", closeInvAdjust);
    $("adjSaveBtn").addEventListener("click", saveInvAdjust);

    $("btnScan").addEventListener("click", scanOnce);

    // Start
    show("Home");
  });
})();
