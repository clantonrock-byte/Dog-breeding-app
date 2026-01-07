(function(){
  const KEY='bp_portal_pin_hash_v1';
  const o=document.getElementById('pinGateOverlay');
  const i=document.getElementById('pinGateInput');
  const b=document.getElementById('pinGateBtn');
  const r=document.getElementById('pinGateReset');

  async function h(s){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function g(){return localStorage.getItem(KEY)||'';}
  function s(v){localStorage.setItem(KEY,v);}
  function c(){localStorage.removeItem(KEY);}

  let mode=g()?'unlock':'set', p='';
  o.classList.remove('hide');

  async function sub(){
    const v=i.value.trim(); if(!v)return;
    if(mode==='set'){p=v; mode='confirm'; i.value=''; return;}
    if(mode==='confirm'){ if(v!==p){alert('Mismatch'); mode='set'; return;} s(await h(v)); o.classList.add('hide'); location.reload(); return;}
    if(await h(v)!==g()){alert('Wrong'); i.value=''; return;}
    o.classList.add('hide');
  }
  b.onclick=sub; i.onkeydown=e=>e.key==='Enter'&&sub();
  r.onclick=()=>{c(); mode='set'; o.classList.remove('hide');};
})();