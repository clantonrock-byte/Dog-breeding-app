// Portal PIN gate (simple login) — device PIN + temporary session
//
// Notes:
// - This is NOT strong security (client-side only). It prevents casual access on a shared device.
// - PIN hash is stored in localStorage; session timeout reduces repeated prompts.

(() => {
  const PIN_HASH_KEY = "bp_portal_pin_hash_v1";
  const SESSION_UNTIL_KEY = "bp_portal_session_until_v1";
  const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  const overlay = document.getElementById("pinGateOverlay");
  const input = document.getElementById("pinGateInput");
  const btn = document.getElementById("pinGateBtn");
  const reset = document.getElementById("pinGateReset");
  const sub = document.getElementById("pinGateSub");
  const hint = document.getElementById("pinGateHint");
  const logoutBtn = document.getElementById("btnLogout");

  if (!overlay || !input || !btn || !reset || !sub || !hint) return;

  const safeGet = (k) => {
    try { return localStorage.getItem(k) || ""; } catch { return ""; }
  };
  const safeSet = (k, v) => {
    try { localStorage.setItem(k, v); } catch {}
  };
  const safeDel = (k) => {
    try { localStorage.removeItem(k); } catch {}
  };

  const now = () => Date.now();

  async function sha256(s) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  }

  function lockUi() {
    document.body.classList.add("rc-locked");
    overlay.classList.remove("hide");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 80);
  }

  function unlockUi() {
    overlay.classList.add("hide");
    document.body.classList.remove("rc-locked");
    overlay.setAttribute("aria-hidden", "true");
  }

  function isSessionValid() {
    const until = Number(safeGet(SESSION_UNTIL_KEY) || "0");
    return Number.isFinite(until) && until > now();
  }

  function startSession() {
    safeSet(SESSION_UNTIL_KEY, String(now() + SESSION_TTL_MS));
  }

  function endSession() {
    safeDel(SESSION_UNTIL_KEY);
  }

  function setMode(mode) {
    input.value = "";
    if (mode === "set") {
      sub.textContent = "Set PIN";
      hint.textContent = "Enter a new PIN (4–8 digits), then confirm it.";
      btn.textContent = "Set";
      reset.style.display = "none";
      return;
    }
    if (mode === "confirm") {
      sub.textContent = "Confirm PIN";
      hint.textContent = "Re-enter the same PIN.";
      btn.textContent = "Confirm";
      reset.style.display = "none";
      return;
    }
    sub.textContent = "Enter PIN";
    hint.textContent = "Enter your PIN to unlock this portal.";
    btn.textContent = "Unlock";
    reset.style.display = "";
  }

  const isPinFormatOk = (v) => /^[0-9]{4,8}$/.test(v);

  let pendingPin = "";
  let mode = safeGet(PIN_HASH_KEY) ? "unlock" : "set";

  async function submit() {
    const v = String(input.value || "").trim();

    if (mode === "set") {
      if (!isPinFormatOk(v)) {
        alert("PIN must be 4–8 digits.");
        input.focus();
        return;
      }
      pendingPin = v;
      mode = "confirm";
      setMode(mode);
      return;
    }

    if (mode === "confirm") {
      if (v !== pendingPin) {
        alert("PIN mismatch. Try again.");
        pendingPin = "";
        mode = "set";
        setMode(mode);
        return;
      }
      const h = await sha256(v);
      safeSet(PIN_HASH_KEY, h);
      pendingPin = "";
      startSession();
      unlockUi();
      return;
    }

    const stored = safeGet(PIN_HASH_KEY);
    if (!stored) {
      mode = "set";
      setMode(mode);
      return;
    }

    if (!isPinFormatOk(v)) {
      alert("Enter your 4–8 digit PIN.");
      input.focus();
      return;
    }

    const h = await sha256(v);
    if (h !== stored) {
      alert("Wrong PIN.");
      input.value = "";
      input.focus();
      return;
    }

    startSession();
    unlockUi();
  }

  function resetPin() {
    if (!confirm("Reset PIN on this device?")) return;
    safeDel(PIN_HASH_KEY);
    endSession();
    pendingPin = "";
    mode = "set";
    setMode(mode);
    lockUi();
  }

  function logout() {
    endSession();
    input.value = "";
    mode = safeGet(PIN_HASH_KEY) ? "unlock" : "set";
    setMode(mode);
    lockUi();
  }

  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  reset.addEventListener("click", resetPin);
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  setMode(mode);

  if (isSessionValid()) unlockUi();
  else lockUi();
})();
