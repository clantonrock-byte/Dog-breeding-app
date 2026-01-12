/**
 * back_button_history_patch.js
 *
 * Makes Android/Samsung browser Back button behave like in-app navigation,
 * preventing accidental exits/reloads (and repeated sign-in).
 *
 * Install: load AFTER dogs.bundle.js so __go/__back/__home exist.
 */
(() => {
  "use strict";

  const STATE_KEY = "__bpNavState";
  let suppressPush = false;
  let idx = 0;

  const originalGo = window.__go;
  const originalBack = window.__back;
  const originalHome = window.__home;

  if (typeof originalGo !== "function" || typeof originalBack !== "function" || typeof originalHome !== "function") return;

  function readState() {
    try {
      const st = history.state && history.state[STATE_KEY] ? history.state[STATE_KEY] : null;
      return st && typeof st.view === "string" && typeof st.idx === "number" ? st : null;
    } catch {
      return null;
    }
  }

  function replaceState(view, newIdx) {
    try {
      history.replaceState({ ...(history.state || {}), [STATE_KEY]: { view, idx: newIdx } }, "");
    } catch {}
  }

  function pushState(view, newIdx) {
    try {
      history.pushState({ ...(history.state || {}), [STATE_KEY]: { view, idx: newIdx } }, "");
    } catch {}
  }

  function ensureRootState() {
    const st = readState();
    if (st) {
      idx = st.idx;
      return;
    }
    idx = 0;
    replaceState("Home", idx);
  }

  function goInternal(view) {
    suppressPush = true;
    try {
      originalGo(view);
    } finally {
      suppressPush = false;
    }
  }

  // Patch __go to push history
  window.__go = function (view) {
    if (!view) return;
    if (!suppressPush) {
      idx += 1;
      pushState(String(view), idx);
    }
    return originalGo(view);
  };

  // Patch __home to push a Home state
  window.__home = function () {
    if (!suppressPush) {
      idx += 1;
      pushState("Home", idx);
    }
    return originalHome();
  };

  // Patch __back to prefer history.back()
  window.__back = function () {
    const st = readState();
    if (st && st.idx > 0) {
      history.back(); // popstate will call goInternal()
      return;
    }
    return originalBack();
  };

  // Intercept hardware/back gesture
  window.addEventListener("popstate", () => {
    const st = readState();
    if (!st) {
      ensureRootState();
      goInternal("Home");
      return;
    }
    idx = st.idx;
    goInternal(st.view);
  });

  // Init
  ensureRootState();

  // Add a second Home entry so one Back stays inside app
  if (idx === 0) {
    idx = 1;
    pushState("Home", idx);
  }
})();
