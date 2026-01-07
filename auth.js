// Portal PIN Gate (Option A)
// - No server, no accounts.
// - PIN is stored as a SHA-256 hash in localStorage on THIS device.
// - First visit: set a PIN. Afterwards: enter PIN to unlock.
// - Reset: button clears stored PIN hash.

(function(){
  const KEY = "bp_portal_pin_hash_v1";
  const overlay = document.getElementById("pinGateOverlay");
  const input = document.getElementById("pinGateInput");
  const btn = document.getElementById("pinGateBtn");
  const reset = document.getElementById("pinGateReset");
  const title = document.getElementById("pinGateTitle");
  const sub = document.getElementById("pinGateSub");
  const hint = document.getElementById("pinGateHint");

  if (!overlay || !input || !btn) return;

  function show(){ overlay.style.display="flex"; overlay.classList.remove("hide"); }
  function hide(){ overlay.style.display="none"; overlay.classList.add("hide"); }

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function getHash(){
    try{ return localStorage.getItem(KEY) || ""; }catch{ return ""; }
  }
  function setHash(h){
    try{ localStorage.setItem(KEY, h); }catch{}
  }
  function clearHash(){
    try{ localStorage.removeItem(KEY); }catch{}
  }

  let mode = "unlock"; // unlock | set | confirm
  let pending = "";

  function setMode(m){
    mode = m;
    input.value = "";
    input.focus();
    if (m === "set"){
      title.textContent = "Set PIN";
      sub.textContent = "Choose a PIN for this device. (4–12 digits recommended)";
      hint.textContent = "You’ll confirm it once.";
      btn.textContent = "Set";
      reset.style.display = "none";
    } else if (m === "confirm"){
      title.textContent = "Confirm PIN";
      sub.textContent = "Re-enter your PIN to confirm.";
      hint.textContent = "";
      btn.textContent = "Confirm";
      reset.style.display = "none";
    } else {
      title.textContent = "Enter PIN";
      sub.textContent = "This portal is protected by a local PIN on this device.";
      hint.textContent = "";
      btn.textContent = "Unlock";
      reset.style.display = "inline-block";
    }
  }

  async function onSubmit(){
    const pin = (input.value || "").trim();
    if (!pin) return;
    if (mode === "set"){
      if (pin.length < 4){ alert("PIN too short."); return; }
      pending = pin;
      setMode("confirm");
      return;
    }
    if (mode === "confirm"){
      if (pin !== pending){ alert("PINs do not match."); setMode("set"); return; }
      const h = await sha256Hex(pin);
      setHash(h);
      pending = "";
      hide();
      // reload to render portal with unlocked state (mobile-safe)
      try{ location.reload(); }catch(e){}
      return;
    }
    // unlock
    const stored = getHash();
    if (!stored){
      setMode("set");
      return;
    }
    const h = await sha256Hex(pin);
    if (h !== stored){
      alert("Incorrect PIN.");
      input.value = "";
      input.focus();
      return;
    }
    hide();
  }

  btn.addEventListener("click", ()=>{ onSubmit(); });
  input.addEventListener("keydown", (e)=>{ if (e.key === "Enter") onSubmit(); });
  reset.addEventListener("click", ()=>{
    if (!confirm("Reset PIN on this device?")) return;
    clearHash();
    setMode("set");
  });

  // Boot
  show();
  const stored = getHash();
  if (!stored) setMode("set");
  else setMode("unlock");
})();