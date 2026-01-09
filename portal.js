// Portal v6 — working tabs + content (keeps it usable)
const TAB_TO_VIEW = {
  dash: "viewDash",
  dogs: "viewDogs",
  inv_edible: "viewInvEdible",
  stock_inedible: "viewStockInedible",
  history: "viewHistory",
};

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function loadAny(keys){
  for(const k of keys){
    const raw = localStorage.getItem(k);
    if(raw) { try{return JSON.parse(raw);}catch{} }
  }
  return null;
}

function getDogs(){
  const obj = loadAny(["breederPro_dogs_store_v3","breeder_dogs_v1","breederPro_dogs_store_v1"]);
  if(!obj) return [];
  if(Array.isArray(obj)) return obj;
  return obj.dogs || [];
}

function getInv(){
  const obj = loadAny(["breederPro_inventory_store_v1","breederPro_inventory_store_v3","breeder_inventory_v1"]);
  if(!obj) return [];
  if(Array.isArray(obj)) return obj;
  return obj.inventory || [];
}

function getEvents(){
  const ev = loadAny(["rc_events_v1","breeder_events_v1"]);
  if(!ev) return [];
  return Array.isArray(ev) ? ev : [];
}

function invKind(i){
  const k=String(i.kind||"").toLowerCase();
  return k==="inedible" ? "inedible" : "edible";
}

function renderDash(){
  const dogs=getDogs();
  const inv=getInv();
  document.getElementById('viewDash').innerHTML = `
    <div class="list">
      <div class="item"><div class="h">Dogs</div><div class="sub">Total: <b>${dogs.length}</b></div></div>
      <div class="item"><div class="h">Items</div><div class="sub">Total: <b>${inv.length}</b> (edible+inedible)</div></div>
      <div class="item"><div class="h">Tip</div><div class="sub">Use tabs to drill down. Portal reads this device’s app data.</div></div>
    </div>`;
}

function renderDogs(){
  const dogs=getDogs();
  const el=document.getElementById('viewDogs');
  el.innerHTML = `<div class="list">${
    dogs.map(d=>`<div class="item"><div class="row"><div><div class="h">${esc(d.callName||d.name||'(unnamed)')}</div><div class="sub">Sex: ${esc(d.sex||'Unknown')} • Status: ${esc(d.status||'')}</div></div><span class="pill">${esc(d.status||'')}</span></div></div>`).join('')
    || '<div class="sub">No dogs found.</div>'
  }</div>`;
}

function renderInv(kind){
  const inv=getInv().filter(i=>invKind(i)===kind && !i.archived);
  const el=document.getElementById(kind==='edible'?'viewInvEdible':'viewStockInedible');
  el.innerHTML = `<div class="list">${
    inv.map(i=>`<div class="item"><div class="row"><div><div class="h">${esc(i.name||'(unnamed item)')}</div><div class="sub">Qty: <b>${Number(i.qty||0)}</b> • <code>${esc(i.identifierValue||'')}</code></div></div><span class="pill">${kind}</span></div></div>`).join('')
    || '<div class="sub">No items found.</div>'
  }</div>`;
}

function renderHistory(){
  const ev=getEvents().slice().reverse().slice(0,50);
  const el=document.getElementById('viewHistory');
  el.innerHTML = `<div class="list">${
    ev.map(e=>`<div class="item"><div class="h">${esc(e.type||'event')}</div><div class="sub">${esc(e.atLocal||e.atUtc||'')}</div><div class="sub">${esc(e.note||'')}</div></div>`).join('')
    || '<div class="sub">No history found.</div>'
  }</div>`;
}

function setTab(tab){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hide'));
  const id = TAB_TO_VIEW[tab] || "viewDash";
  const el = document.getElementById(id);
  if(el) el.classList.remove('hide');

  if(tab==='dash') renderDash();
  if(tab==='dogs') renderDogs();
  if(tab==='inv_edible') renderInv('edible');
  if(tab==='stock_inedible') renderInv('inedible');
  if(tab==='history') renderHistory();
}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click', ()=>setTab(b.dataset.tab)));
setTab('dash');
