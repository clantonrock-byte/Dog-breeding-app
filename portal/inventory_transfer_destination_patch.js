/**
 * inventory_transfer_destination_patch.js
 *
 * Adds an OPEN text field to Transfer flow for destination/location entry.
 *
 * Behavior
 * - Injects a "Destination" text input into the existing Transfer form (#transferForm)
 * - Records destination in the activity log (breederPro_inventory_activity_v1) as note
 * - Does NOT change inventory quantities logic (still subtracts qty on transfer)
 *
 * Assumes your app already has:
 * - #transferForm, #transferQty, #btnTransferConfirm, #transferStatus
 * - window.transferItemId set when showTransfer(itemId) called
 * - applyTransfer() performs the quantity update
 * - Activity log patch uses breederPro_inventory_activity_v1 (if installed)
 *
 * Install: load this script AFTER inventory_ui_patch.js (or at least after app scripts).
 */
(() => {
  "use strict";

  const ACT_KEY = "breederPro_inventory_activity_v1";

  function kindNow() {
    return window.rcInvKind === "inedible" ? "inedible" : "edible";
  }

  function loadActivity() {
    try {
      const raw = localStorage.getItem(ACT_KEY);
      const o = raw ? JSON.parse(raw) : { events: [] };
      if (!Array.isArray(o.events)) o.events = [];
      return o;
    } catch {
      return { events: [] };
    }
  }

  function saveActivity(o) {
    localStorage.setItem(ACT_KEY, JSON.stringify(o));
  }

  function recordEvent(evt) {
    const store = loadActivity();
    store.events.unshift(evt);
    store.events = store.events.slice(0, 200);
    saveActivity(store);
  }

  function injectDestinationField() {
    const form = document.getElementById("transferForm");
    if (!form) return;

    if (document.getElementById("transferDest")) return;

    const wrap = document.createElement("div");
    wrap.className = "transfer-dest-wrap";
    wrap.style.marginTop = "10px";
    wrap.innerHTML = `
      <label class="label">Destination (optional)</label>
      <input id="transferDest" placeholder="e.g., Freezer, Kennel A, Truck 2…" />
      <div class="muted small" style="margin-top:6px;">This is saved to activity log only.</div>
    `;

    // Insert destination field above the buttons row inside the transfer form
    const buttons = form.querySelector(".row");
    if (buttons) buttons.insertAdjacentElement("beforebegin", wrap);
    else form.appendChild(wrap);
  }

  function wrapApplyTransfer() {
    const fn = window.applyTransfer;
    if (typeof fn !== "function" || fn._destWrapped) return;

    window.applyTransfer = function () {
      // Capture destination before original function hides/clears
      const dest = String(document.getElementById("transferDest")?.value || "").trim();
      const qty = Number(document.getElementById("transferQty")?.value || 0) || null;
      const itemId = window.transferItemId || "";

      const res = fn.apply(this, arguments);

      // Record destination into activity log (compatible with inventory_ui_patch)
      if (dest) {
        recordEvent({
          type: "Transfer destination",
          kind: kindNow(),
          itemId,
          itemName: "",
          qty,
          at: new Date().toISOString(),
          note: `To: ${dest}`,
        });
      }

      return res;
    };

    window.applyTransfer._destWrapped = true;
  }

  function wrapShowTransfer() {
    const fn = window.showTransfer;
    if (typeof fn !== "function" || fn._destWrapped) return;

    window.showTransfer = function () {
      const res = fn.apply(this, arguments);
      try {
        injectDestinationField();
        const input = document.getElementById("transferDest");
        if (input) input.value = "";
      } catch (_) {}
      return res;
    };

    window.showTransfer._destWrapped = true;
  }

  function install() {
    injectDestinationField();
    wrapShowTransfer();
    wrapApplyTransfer();
  }

  document.addEventListener("DOMContentLoaded", () => {
    install();
    setTimeout(install, 400);
    setTimeout(install, 1200);
  });
})();
