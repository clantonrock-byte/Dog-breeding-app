/**
 * portal/inventory.bundle.js
 *
 * A–D bundle loader + UX glue:
 * - Loads your existing inventory patch scripts in a fixed order (so index.html only needs one line)
 * - Adds "Reorder" workflow (pending reorder) and official backup/restore buttons inside Settings.
 *
 * IMPORTANT:
 * - This bundle expects the patch files to still exist in /portal/ (for now).
 * - After you confirm everything works, we can create a true single-file bundle and delete the old ones.
 */
(() => {
  "use strict";

  const PATCHES = [
    "portal/inventory_ui_patch.js",
    "portal/inventory_a_to_d_patch.js",
    "portal/inventory_destination_presets_patch.js",
    "portal/inventory_settings_kindfix.js",
    "portal/inventory_locations_ui_patch.js",
    "portal/inventory_lowstock_onhand_settings_patch.js",
    "portal/inventory_low_badge_notify_patch.js",
    "portal/inventory_low_shopping_list_allformats.js",
  ];

  const INV_KEY = "breederPro_inventory_store_v1";
  const DOG_KEY = "breederPro_dogs_store_v3";
  const ACT_KEY = "breederPro_inventory_activity_v1";
  const REORDER_KEY = "breederPro_reorder_v1";

  const kindNow = () => (window.rcInvKind === "inedible" ? "inedible" : "edible");

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  }

  function loadInv() {
    const o = loadJson(INV_KEY, { inventory: [] });
    if (!Array.isArray(o.inventory)) o.inventory = [];
    return o;
  }

  function saveInv(o) { saveJson(INV_KEY, o); }

  function loadReorder() {
    const o = loadJson(REORDER_KEY, { pending: [] });
    if (!Array.isArray(o.pending)) o.pending = [];
    return o;
  }

  function saveReorder(o) { saveJson(REORDER_KEY, o); }

  function loadAct() {
    const o = loadJson(ACT_KEY, { events: [] });
    if (!Array.isArray(o.events)) o.events = [];
    return o;
  }

  function saveAct(o) { saveJson(ACT_KEY, o); }

  function recordAct(evt) {
    const a = loadAct();
    a.events.unshift(evt);
    a.events = a.events.slice(0, 400);
    saveAct(a);
  }

  function nowISO() { return new Date().toISOString(); }

  // --------------------
  // Loader (sequential)
  // --------------------
  function loadScriptSequential(srcs) {
    return srcs.reduce((p, src) => p.then(() => new Promise((resolve, reject) => {
      // Already present?
      if ([...document.scripts].some(s => (s.src || "").includes(src))) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.body.appendChild(s);
    })), Promise.resolve());
  }

  // --------------------
  // Reorder workflow (simple + effective)
  // --------------------
  function ensureReorderDialog() {
    if (document.getElementById("dlgReorder")) return;

    const dlg = document.createElement("dialog");
    dlg.id = "dlgReorder";
    dlg.innerHTML = `
      <form method="dialog" class="dlg-card">
        <div class="dlg-h">
          <h3>Reorder</h3>
          <button class="btn" value="cancel">✕</button>
        </div>

        <div class="muted small" id="reorderItemLine" style="margin-top:8px;"></div>

        <label class="label">Vendor (optional)</label>
        <input id="reorderVendor" placeholder="e.g., Chewy, Tractor Supply…" />

        <label class="label">Quantity ordered</label>
        <input id="reorderQty" inputmode="decimal" placeholder="e.g., 10" />

        <label class="label">Notes (optional)</label>
        <input id="reorderNotes" placeholder="e.g., delivery Friday" />

        <div class="dlg-f">
          <button class="btn" value="cancel">Cancel</button>
          <button class="btn primary" id="btnReorderSave" value="ok">Save</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
  }

  function openReorder(itemId) {
    const inv = loadInv();
    const it = inv.inventory.find(x => x.itemId === itemId);
    if (!it) return;

    ensureReorderDialog();

    document.getElementById("reorderItemLine").textContent = `${it.name} (${kindNow()})`;
    document.getElementById("reorderVendor").value = "";
    document.getElementById("reorderQty").value = "";
    document.getElementById("reorderNotes").value = "";

    const dlg = document.getElementById("dlgReorder");
    dlg.dataset.itemId = itemId;
    dlg.showModal();
  }

  function saveReorderFromDialog() {
    const dlg = document.getElementById("dlgReorder");
    const itemId = dlg?.dataset?.itemId || "";
    if (!itemId) return;

    const vendor = String(document.getElementById("reorderVendor").value || "").trim();
    const qty = Number(document.getElementById("reorderQty").value || 0) || 0;
    const notes = String(document.getElementById("reorderNotes").value || "").trim();

    if (qty <= 0) {
      alert("Quantity ordered is required.");
      return;
    }

    const inv = loadInv();
    const it = inv.inventory.find(x => x.itemId === itemId);
    if (!it) return;

    const r = loadReorder();
    // replace existing pending for item
    r.pending = r.pending.filter(p => p.itemId !== itemId);
    r.pending.unshift({
      itemId,
      kind: (it.kind || "edible") === "inedible" ? "inedible" : "edible",
      itemName: it.name,
      vendor,
      qty,
      notes,
      at: nowISO(),
      received: false,
    });
    saveReorder(r);

    recordAct({
      type: "Reorder placed",
      kind: (it.kind || "edible") === "inedible" ? "inedible" : "edible",
      itemId,
      itemName: it.name,
      qty,
      at: nowISO(),
      note: vendor ? `Vendor: ${vendor}${notes ? " • " + notes : ""}` : notes,
    });

    dlg.close();

    try { if (typeof window.renderInv === "function") window.renderInv(); } catch {}
    // Also refresh home low badges if present
  }

  function addReorderButtonsToCards() {
    const list = document.getElementById("invList");
    if (!list) return;

    const r = loadReorder();
    const pendingSet = new Set(r.pending.filter(p => !p.received).map(p => p.itemId));

    list.querySelectorAll(".inv-card").forEach(card => {
      const itemId = card.getAttribute("data-item-id");
      if (!itemId) return;

      const actions = card.querySelector(".inv-actions");
      if (!actions) return;

      // Remove old reorder button if rerendered
      const old = actions.querySelector(".btn-reorder");
      if (old) old.remove();

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-reorder";
      btn.textContent = pendingSet.has(itemId) ? "Pending" : "Reorder";
      btn.disabled = pendingSet.has(itemId);
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openReorder(itemId);
      });

      actions.appendChild(btn);

      // Add a small "Pending reorder" line if pending
      card.querySelector(".inv-pending-line")?.remove();
      if (pendingSet.has(itemId)) {
        const p = r.pending.find(x => x.itemId === itemId);
        const line = document.createElement("div");
        line.className = "inv-pending-line muted small";
        line.textContent = `Pending reorder: ${p.qty}${p.vendor ? " • " + p.vendor : ""}`;
        actions.insertAdjacentElement("beforebegin", line);
      }
    });
  }

  // --------------------
  // Backup/Restore in Settings
  // --------------------
  function ensureBackupButtonsInSettings() {
    const dlg = document.getElementById("dlgBpSettings");
    if (!dlg) return;

    if (document.getElementById("bpBackupWrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "timeline-item";
    wrap.id = "bpBackupWrap";
    wrap.innerHTML = `
      <strong>Backup & Restore</strong>
      <div class="muted small" style="margin-top:6px;">Export or import all local data (Dogs + Inventory + Activity + Reorders).</div>
      <div class="row" style="margin-top:10px;">
        <button type="button" class="btn" id="bpExportAll">Export backup</button>
        <button type="button" class="btn" id="bpImportAll">Import backup</button>
      </div>
      <div class="row" style="margin-top:10px;">
        <button type="button" class="btn danger" id="bpResetInvEdible">Reset Inventory (edible)</button>
        <button type="button" class="btn danger" id="bpResetInvInedible">Reset Stock (inedible)</button>
      </div>
      <input id="bpImportFile" type="file" accept="application/json" class="hide" />
    `;

    const footer = dlg.querySelector(".dlg-f");
    if (footer) footer.insertAdjacentElement("beforebegin", wrap);
    else dlg.querySelector(".dlg-card")?.appendChild(wrap);

    const downloadText = (filename, text) => {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    };

    document.getElementById("bpExportAll").addEventListener("click", () => {
      const payload = {
        exportedAt: nowISO(),
        dogs: loadJson(DOG_KEY, { dogs: [] }),
        inventory: loadJson(INV_KEY, { inventory: [] }),
        activity: loadJson(ACT_KEY, { events: [] }),
        reorders: loadJson(REORDER_KEY, { pending: [] }),
        version: 1,
      };
      downloadText(`breederpro_backup_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload, null, 2));
    });

    const file = document.getElementById("bpImportFile");
    document.getElementById("bpImportAll").addEventListener("click", () => file.click());

    file.addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      try {
        const txt = await f.text();
        const obj = JSON.parse(txt);
        if (obj.dogs) saveJson(DOG_KEY, obj.dogs);
        if (obj.inventory) saveJson(INV_KEY, obj.inventory);
        if (obj.activity) saveJson(ACT_KEY, obj.activity);
        if (obj.reorders) saveJson(REORDER_KEY, obj.reorders);
        alert("Import complete.");
        try { if (typeof window.renderDogs === "function") window.renderDogs(); } catch {}
        try { if (typeof window.renderInv === "function") window.renderInv(); } catch {}
      } catch (err) {
        alert("Import failed: " + (err?.message || err));
      }
    });

    const resetKind = (kind) => {
      const ok = confirm(`Reset ALL ${kind} items and related pending reorders?`);
      if (!ok) return;

      const inv = loadInv();
      inv.inventory = inv.inventory.filter(i => (i.kind || "edible") !== kind);
      saveInv(inv);

      const r = loadReorder();
      r.pending = r.pending.filter(p => p.kind !== kind);
      saveReorder(r);

      recordAct({ type: "Reset items", kind, at: nowISO(), note: "User reset" });

      try { if (typeof window.renderInv === "function") window.renderInv(); } catch {}
    };

    document.getElementById("bpResetInvEdible").addEventListener("click", () => resetKind("edible"));
    document.getElementById("bpResetInvInedible").addEventListener("click", () => resetKind("inedible"));
  }

  // --------------------
  // Hooking
  // --------------------
  function hookAfterShowForSettings() {
    const prev = window.__afterShow;
    if (prev && prev._ccInvBundleWrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch (_) {}
      if (view === "InventoryAvailable") {
        setTimeout(addReorderButtonsToCards, 0);
      }
      // Settings dialog exists when opened; we inject buttons then
      setTimeout(ensureBackupButtonsInSettings, 0);
    };

    window.__afterShow._ccInvBundleWrapped = true;
  }

  function installReorder() {
    ensureReorderDialog();
    const btn = document.getElementById("btnReorderSave");
    if (btn && !btn._ccBound) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        saveReorderFromDialog();
      });
      btn._ccBound = true;
    }

    // Keep enhancing cards as the list rerenders
    if (!window.__ccReorderTimer) {
      window.__ccReorderTimer = setInterval(() => {
        try { addReorderButtonsToCards(); } catch {}
      }, 1400);
    }
  }

  function install() {
    hookAfterShowForSettings();
    installReorder();
    ensureBackupButtonsInSettings();
    addReorderButtonsToCards();
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Load existing patches first, then glue.
    loadScriptSequential(PATCHES)
      .then(() => {
        install();
        setTimeout(install, 600);
        setTimeout(install, 1600);
      })
      .catch((e) => {
        alert("Inventory bundle failed: " + e.message);
      });
  });
})();
