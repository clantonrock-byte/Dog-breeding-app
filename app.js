// ===== Time helpers =====
function nowUtc() { return new Date().toISOString(); }
function localTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch { return iso; }
}
const deviceTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

// ===== Storage =====
const DOG_KEY = "breeder_dogs_v1";
function load(key, fallback){ try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;} }
function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }

// ===== State =====
let dogs = load(DOG_KEY, []);
let currentDogId = null;
const view = document.getElementById("view");

// ===== Normalize =====
function normSex(v){
  v=String(v||"").toLowerCase();
  if(v==="male"||v==="m") return "male";
  if(v==="female"||v==="f") return "female";
  return "";
}
function reproOptions(sex){
  return sex==="male" ? ["Intact","Neutered"] :
         sex==="female" ? ["Intact","Spayed"] :
         ["Unknown"];
}

// ===== Dogs list =====
function showDogs(){
  let html = `<h2>Dogs</h2><button onclick="showAddDog()">Add Dog</button>`;
  dogs.forEach(d=>{
    const badge = d.reproStatus ? `<span class="pill">${d.sexLabel} · ${d.reproStatus}</span>` : "";
    const memorial = d.status==="deceased" ? " memorial" : "";
    html += `<div class="card${memorial}">
      <div class="row">
        <div>
          <strong>${d.callName}</strong><br>
          <span class="small">${badge}</span>
        </div>
        <button onclick="showDogProfile(${d.id})">Open</button>
      </div>
    </div>`;
  });
  view.innerHTML = html;
}

// ===== Add Dog =====
function showAddDog(){
  view.innerHTML = `
    <h2>Add Dog</h2>
    <div class="card">
      <label>Call Name<br><input id="dog_name"></label><br><br>
      <label>Sex<br>
        <select id="dog_sex">
          <option value="">Unknown</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label><br><br>
      <button onclick="saveDog()">Save</button>
      <button onclick="showDogs()">Cancel</button>
    </div>`;
}
function saveDog(){
  const name=document.getElementById("dog_name").value.trim();
  const sex=normSex(document.getElementById("dog_sex").value);
  if(!name){alert("Call name required");return;}
  const dog={
    id:Date.now(),
    callName:name,
    sex:sex,
    sexLabel:sex==="male"?"Male":sex==="female"?"Female":"Unknown",
    reproStatus:"",
    status:"active",
    createdAt:nowUtc(),
    updatedAt:nowUtc(),
    deceasedAt:"",
    memorialNotes:""
  };
  dogs.push(dog);
  save(DOG_KEY,dogs);
  showDogs();
}

// ===== Profile =====
function showDogProfile(id){
  const d=dogs.find(x=>x.id===id);
  if(!d) return;
  currentDogId=id;
  const reproOpts=reproOptions(d.sex).map(o=>`<option ${d.reproStatus===o?"selected":""}>${o}</option>`).join("");
  const memorialBlock = d.status==="deceased" ? `
    <div class="card memorial">
      <strong>In Memoriam</strong><br>
      <span class="small">Date: ${localTime(d.deceasedAt)}</span><br><br>
      <label>Memorial Notes<br><textarea id="edit_memorial">${d.memorialNotes||""}</textarea></label>
    </div>` : "";
  view.innerHTML = `
    <h2>Dog Profile</h2>
    <div class="card">
      <label>Call Name<br><input id="edit_name" value="${d.callName}"></label><br><br>
      <label>Sex<br><input value="${d.sexLabel}" disabled></label><br><br>
      <label>Reproductive Status<br>
        <select id="edit_repro">${reproOpts}</select>
      </label><br><br>
      <label>Status<br>
        <select id="edit_status">
          <option value="active" ${d.status==="active"?"selected":""}>Active</option>
          <option value="archived" ${d.status==="archived"?"selected":""}>Archived</option>
          <option value="transferred" ${d.status==="transferred"?"selected":""}>Transferred</option>
          <option value="deceased" ${d.status==="deceased"?"selected":""}>Deceased</option>
        </select>
      </label><br><br>
      <div class="small">Created: ${localTime(d.createdAt)}</div>
      <div class="small">Updated: ${localTime(d.updatedAt)}</div>
      <div class="small">Device Time Zone: ${deviceTZ}</div><br>
      <button onclick="saveDogProfile()">Save Changes</button>
      <button onclick="showDogs()">Back</button>
    </div>
    ${memorialBlock}
  `;
}

function saveDogProfile(){
  const d=dogs.find(x=>x.id===currentDogId);
  if(!d) return;
  d.callName=document.getElementById("edit_name").value.trim();
  d.reproStatus=document.getElementById("edit_repro").value;
  const newStatus=document.getElementById("edit_status").value;
  if(newStatus==="deceased" && d.status!=="deceased"){
    d.deceasedAt=nowUtc();
  }
  d.status=newStatus;
  const mem=document.getElementById("edit_memorial");
  if(mem) d.memorialNotes=mem.value;
  d.updatedAt=nowUtc();
  save(DOG_KEY,dogs);
  showDogProfile(currentDogId);
}

// ===== Inventory / Scanner stubs =====
function showInventory(){ view.innerHTML="<h2>Inventory</h2><p>(unchanged)</p><button onclick='showDogs()'>Back</button>"; }
function showScanner(){ view.innerHTML="<h2>Scanner</h2><p>(stub)</p><button onclick='showDogs()'>Back</button>"; }

// ===== Boot =====
showDogs();
