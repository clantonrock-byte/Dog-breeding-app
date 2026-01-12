/**
 * portal_auto_logout.js
 *
 * Auto-logout after inactivity (default 10 minutes).
 *
 * Designed to work WITH portal_pin_multiuser_v2.js.
 * - Clears sessionStorage session
 * - Forces PIN screen to reappear
 *
 * Inactivity definition:
 * - No user interaction (touch, click, key, scroll)
 *
 * Install:
 * - Load AFTER portal_pin_multiuser_v2.js
 */
(() => {
  "use strict";

  const TIMEOUT_MINUTES = 10;
  const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

  const SESSION_KEY = "breederPro_portal_session_v1";
  const LOCK_CLASS = "bp-portal-locked";

  let timer = null;

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  function lockNow() {
    clearSession();
    document.documentElement.classList.add(LOCK_CLASS);

    const overlay = document.getElementById("portalPinOverlay");
    if (overlay) overlay.style.display = "flex";
  }

  function resetTimer() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(lockNow, TIMEOUT_MS);
  }

  function bindActivity() {
    const events = [
      "click",
      "touchstart",
      "touchmove",
      "keydown",
      "mousemove",
      "scroll"
    ];

    events.forEach(evt => {
      document.addEventListener(evt, resetTimer, { passive: true });
    });
  }

  function install() {
    resetTimer();
    bindActivity();
  }

  document.addEventListener("DOMContentLoaded", install);
})();
