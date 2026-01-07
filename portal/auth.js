(function(){
  const KEY='bp_portal_pin_hash_v1';
  const overlay=document.getElementById('pinGateOverlay');
  const input=document.getElementById('pinGateInput');
  const btn=document.getElementById('pinGateBtn');
  const reset=document.getElementById('pinGateReset');
  const sub=document.getElementById('pinGateSub');
  const hint=document.getElementById('pinGateHint');

  if(!overlay||!input||!btn||!reset) return;

  async function sha256(s){
    const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function get(){ try{return localStorage.getItem(KEY)||'';}catch{return '';} }
  function set(v){ try{localStorage.setItem(KEY,v);}catch{} }
  function clr(){ try{localStorage.removeItem(KEY);}catch{} }

  let stored=get();
  let mode = stored ? 'unlock' : 'set';
  let pending='';

  function show(){ overlay.classList.remove('hide'); setTimeout(()=>input.focus(),80); }
  function setMode(m){
    mode=m;
    input.value='';
    if(m==='set'){
      sub.textContent='Set PIN';
      hint.textContent='Enter a new PIN, then confirm it.';
      btn.textContent='Set';
      reset.style.display='none';
    } else if(m==='confirm'){
      sub.textContent='Confirm PIN';
      hint.textContent='Re-enter the same PIN.';
      btn.textContent='Confirm';
      reset.style.display='none';
    } else {
      sub.textContent='Enter PIN';
      hint.textContent='';
      btn.textContent='Unlock';
      reset.style.display='inline-block';
    }
    setTimeout(()=>input.focus(),80);
  }

  async function submit(){
    const v=(input.value||'').trim();
    if(!v) return;

    if(mode==='set'){
      if(v.length<4){ alert('PIN too short'); return; }
      pending=v;
      setMode('confirm');
      return;
    }
    if(mode==='confirm'){
      if(v!==pending){ alert('PIN mismatch'); setMode('set'); return; }
      set(await sha256(v));
      pending='';
      window.location.href = "https://clantonrock-byte.github.io/Dog-breeding-app/";
      return;
    }

    stored=get();
    if(!stored){ setMode('set'); return; }
    if(await sha256(v)!==stored){ alert('Wrong PIN'); input.value=''; input.focus(); return; }
    window.location.href = "https://clantonrock-byte.github.io/Dog-breeding-app/";
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') submit(); });
  reset.addEventListener('click', ()=>{
    if(!confirm('Reset PIN on this device?')) return;
    clr();
    stored='';
    setMode('set');
    show();
  });

  show();
  setMode(mode);
})();
