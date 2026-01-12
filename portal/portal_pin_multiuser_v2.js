/**
 * portal_pin_multiuser_v2.js
 *
 * Fix: show Portal PIN screen for first-time setup.
 * - If no users exist yet, the overlay is shown even if "enabled" is false,
 *   so you can create the first Admin via "Admin setup". After admin creation,
 *   the gate auto-enables.
 *
 * Multi-user PIN gate + Settings management (client-side).
 *
 * Storage: breederPro_portal_access_v1
 * { enabled:boolean, users:[{id,name,pinHashHex,isAdmin}], remember:{[id]:true} }
 *
 * Install: load AFTER dogs.bundle.js (at bottom). CSS in <head>.
 */
(() => {
  "use strict";
  const KEY="breederPro_portal_access_v1";
  const SESSION="breederPro_portal_session_v1";
  const LOCK="bp-portal-locked";

  const $=id=>document.getElementById(id);

  const load=()=>{try{const r=localStorage.getItem(KEY);const o=r?JSON.parse(r):{};
    if(typeof o.enabled!=="boolean") o.enabled=false;
    if(!Array.isArray(o.users)) o.users=[];
    if(!o.remember||typeof o.remember!=="object") o.remember={};
    return o;}catch{return {enabled:false,users:[],remember:{}}}};
  const save=o=>localStorage.setItem(KEY,JSON.stringify(o));
  const uid=()=>`u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const hex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  const sha256=async s=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));

  const lock=()=>document.documentElement.classList.add(LOCK);
  const unlock=()=>document.documentElement.classList.remove(LOCK);

  const setSession=id=>{try{sessionStorage.setItem(SESSION,JSON.stringify({id,at:Date.now()}))}catch{}};
  const getSession=()=>{try{return String(JSON.parse(sessionStorage.getItem(SESSION)||"{}").id||"")}catch{return ""}};
  const clearSession=()=>{try{sessionStorage.removeItem(SESSION)}catch{}};

  function ensureOverlay(){
    if($("portalPinOverlay")) return;
    const d=document.createElement("div");
    d.id="portalPinOverlay";
    d.innerHTML=`
      <div class="bp-pin-card">
        <div class="bp-pin-title">Portal Access</div>
        <div class="bp-pin-sub">Select your name and enter your PIN.</div>
        <label class="bp-pin-label">User</label>
        <select id="bpPinUser"></select>
        <label class="bp-pin-label">PIN</label>
        <input id="bpPinCode" type="password" inputmode="numeric" placeholder="PIN" />
        <label class="bp-pin-remember"><input type="checkbox" id="bpPinRemember" /> Remember this device</label>
        <button class="bp-pin-btn" id="bpPinUnlock" type="button">Unlock</button>
        <div class="bp-pin-msg" id="bpPinMsg"></div>
        <div class="bp-pin-footer">
          <button class="bp-pin-link" id="bpPinAdminSetup" type="button">Admin setup</button>
        </div>
      </div>`;
    document.body.appendChild(d);
    $("bpPinUnlock").addEventListener("click", attemptUnlock);
    $("bpPinCode").addEventListener("keydown",e=>{if(e.key==="Enter") attemptUnlock()});
    $("bpPinAdminSetup").addEventListener("click", adminSetup);
  }

  function showOverlay(on){
    const o=$("portalPinOverlay"); if(!o) return;
    o.style.display=on?"flex":"none";
  }

  function fillUsers(){
    const s=load();
    const sel=$("bpPinUser"); const msg=$("bpPinMsg");
    if(!sel) return;
    sel.innerHTML="";
    if(!s.users.length){
      sel.disabled=true; $("bpPinUnlock").disabled=true;
      msg.textContent="No users yet. Tap Admin setup to create the first Admin.";
      const opt=document.createElement("option"); opt.value=""; opt.textContent="(No users)"; sel.appendChild(opt);
      return;
    }
    sel.disabled=false; $("bpPinUnlock").disabled=false; msg.textContent="";
    s.users.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).forEach(u=>{
      const opt=document.createElement("option");
      opt.value=u.id; opt.textContent=u.name+(u.isAdmin?" (Admin)":"");
      sel.appendChild(opt);
    });
    const sid=getSession();
    if(sid && s.users.some(u=>u.id===sid)) sel.value=sid;
  }

  async function attemptUnlock(){
    const s=load();
    const userId=String($("bpPinUser")?.value||"");
    const pin=String($("bpPinCode")?.value||"").trim();
    const remember=!!$("bpPinRemember")?.checked;
    const msg=$("bpPinMsg"); msg.textContent="";
    const u=s.users.find(x=>x.id===userId);
    if(!u){ msg.textContent="Select a user."; return; }
    if(!pin){ msg.textContent="Enter a PIN."; return; }
    try{
      const h=await sha256(pin);
      if(h!==u.pinHashHex){ msg.textContent="Incorrect PIN."; return; }
      setSession(userId);
      if(remember){ s.remember[userId]=true; save(s); }
      $("bpPinCode").value="";
      showOverlay(false); unlock();
    }catch{ msg.textContent="Unlock failed."; }
  }

  async function adminSetup(){
    const s=load();
    if(s.users.length){ alert("Manage users in ⚙️ Settings → Portal access."); return; }
    const name=prompt("Create Admin user name:"); if(!name) return;
    const pin=prompt("Set Admin PIN:"); if(!pin) return;
    try{
      const h=await sha256(pin);
      s.users.push({id:uid(),name:String(name).trim(),pinHashHex:h,isAdmin:true});
      s.enabled=true; // auto-enable once admin exists
      save(s);
      fillUsers();
      $("bpPinMsg").textContent="Admin created. Select user and unlock.";
    }catch{ alert("Setup failed."); }
  }

  // Settings integration (inside dlgBpSettings if present)
  function ensureSettings(){
    const dlg=$("dlgBpSettings"); if(!dlg) return;
    if($("bpPortalAccessWrap")) return;

    const wrap=document.createElement("div");
    wrap.className="timeline-item";
    wrap.id="bpPortalAccessWrap";
    wrap.innerHTML=`
      <strong>Portal access</strong>
      <div class="muted small" style="margin-top:6px;">Multi-user PIN gate (client-side deterrence).</div>
      <label class="muted small" style="display:flex;gap:10px;align-items:center;margin-top:10px;">
        <input type="checkbox" id="bpPortalEnabled" /> Enable portal PIN gate
      </label>
      <div id="bpPortalUsers"></div>
      <div class="row" style="margin-top:10px;">
        <button type="button" class="btn primary" id="bpPortalAddUser">Add user</button>
        <button type="button" class="btn danger" id="bpPortalClearRemember">Clear remembered</button>
      </div>`;

    const footer=dlg.querySelector(".dlg-f");
    if(footer) footer.insertAdjacentElement("beforebegin", wrap);
    else dlg.querySelector(".dlg-card")?.appendChild(wrap);

    $("bpPortalEnabled").addEventListener("change",()=>{const st=load(); st.enabled=!!$("bpPortalEnabled").checked; save(st); applyGate();});
    $("bpPortalAddUser").addEventListener("click", addUser);
    $("bpPortalClearRemember").addEventListener("click", ()=>{const st=load(); st.remember={}; save(st); clearSession(); alert("Cleared."); applyGate();});

    renderUserRows();
    $("bpPortalEnabled").checked=load().enabled;
  }

  function renderUserRows(){
    const host=$("bpPortalUsers"); if(!host) return;
    const st=load();
    if(!st.users.length){ host.innerHTML=`<div class="muted small" style="margin-top:10px;">No users yet. Use Admin setup on the lock screen.</div>`; return; }
    host.innerHTML=st.users.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(u=>`
      <div class="bp-user-row" data-id="${u.id}">
        <div><strong>${u.name}</strong><div class="muted small">${u.isAdmin?"Admin":"User"}</div></div>
        <div class="bp-user-actions">
          <button type="button" class="btn" data-act="pin">Set PIN</button>
          <button type="button" class="btn" data-act="role">${u.isAdmin?"Make user":"Make admin"}</button>
          <button type="button" class="btn danger" data-act="del">Delete</button>
        </div>
      </div>`).join("");
    host.onclick=(e)=>{
      const btn=e.target.closest?.("button[data-act]"); if(!btn) return;
      const row=e.target.closest?.(".bp-user-row"); const id=row?.getAttribute("data-id"); if(!id) return;
      const act=btn.getAttribute("data-act");
      if(act==="pin") setPin(id);
      if(act==="role") toggleRole(id);
      if(act==="del") delUser(id);
    };
  }

  async function addUser(){
    const name=prompt("New user name:"); if(!name) return;
    const pin=prompt("Set PIN:"); if(!pin) return;
    const st=load();
    try{
      st.users.push({id:uid(),name:String(name).trim(),pinHashHex:await sha256(pin),isAdmin:false});
      if(!st.users.some(u=>u.isAdmin)) st.users[0].isAdmin=true;
      save(st);
      renderUserRows(); fillUsers();
    }catch{ alert("Add failed."); }
  }

  async function setPin(id){
    const pin=prompt("New PIN:"); if(!pin) return;
    const st=load(); const u=st.users.find(x=>x.id===id); if(!u) return;
    try{ u.pinHashHex=await sha256(pin); save(st); alert("PIN updated."); }catch{ alert("Failed."); }
  }

  function toggleRole(id){
    const st=load(); const u=st.users.find(x=>x.id===id); if(!u) return;
    u.isAdmin=!u.isAdmin;
    if(!st.users.some(x=>x.isAdmin)) u.isAdmin=true;
    save(st); renderUserRows(); fillUsers();
  }

  function delUser(id){
    const st=load(); const u=st.users.find(x=>x.id===id); if(!u) return;
    if(!confirm(`Delete user "${u.name}"?`)) return;
    st.users=st.users.filter(x=>x.id!==id);
    delete st.remember[id];
    if(st.users.length && !st.users.some(x=>x.isAdmin)) st.users[0].isAdmin=true;
    save(st); renderUserRows(); fillUsers();
  }

  function applyGate(){
    const st=load();
    const noUsers = !st.users.length;

    // First-time setup: force overlay even if not enabled
    if (noUsers) {
      lock();
      showOverlay(true);
      fillUsers();
      return;
    }

    if(!st.enabled){
      showOverlay(false);
      unlock();
      return;
    }

    lock();
    showOverlay(true);
    fillUsers();

    const sid=getSession();
    if(sid && st.remember?.[sid]){
      showOverlay(false);
      unlock();
    }
  }

  function install(){
    ensureOverlay();
    ensureSettings();
    applyGate();
    if(!window.__bpPortalTick) window.__bpPortalTick=setInterval(ensureSettings, 1200);
  }

  // lock ASAP if enabled OR no users (first-time setup)
  try{
    const st = load();
    if(st.enabled || !st.users.length) lock();
  }catch{}

  document.addEventListener("DOMContentLoaded",()=>{
    install();
    setTimeout(install, 600);
    setTimeout(install, 1600);
  });
})();
