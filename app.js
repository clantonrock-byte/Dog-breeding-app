// ===== Storage helpers =====
const DOG_KEY = "breeder_dogs_v1";
const INV_KEY = "breeder_inventory_v1";
const HEALTH_KEY = "breeder_health_v1"; // { [dogId]: [records...] }

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ===== State =====
let dogs = load(DOG_KEY, []);
let inventory = load(INV_KEY, []);
let health = load(HEALTH_KEY, {});
let currentDogId = null;

const view = document.getElementById("view");

// ===== Dogs list =====
function showDogs() {
  let html = `<h2>Dogs</h2>
    <button onclick="showAddDog()">Add Dog</button>`;

  if (dogs.length === 0) {
    html += "<p>No dogs yet.</p>";
  } else {
    dogs.forEach(d => {
      html += `<div class="card">
        <div class="row">
          <div>
            <strong>${escapeHtml(d.callName)}</strong><br>
            <span class="small">${escapeHtml(d.sex || "")}${d.microchip ? " · microchip" : ""}</span>
          </div>
          <button onclick="showDogProfile(${d.id})">Open</button>
        </div>
      </div>`;
    });
  }
  view.innerHTML = html;
}

// ===== Add Dog =====
function showAddDog() {
  view.innerHTML = `
    <h2>Add Dog</h2>
    <div class="card">
      <label>Call Name<br><input id="dog_name"></label><br><br>
      <button onclick="saveDog()">Save</button>
      <button onclick="showDogs()">Cancel</button>
    </div>`;
}
function saveDog() {
  const name = document.getElementById("dog_name").value.trim();
  if (!name) { alert("Call name required"); return; }
  const dog = {
    id: Date.now(),
    callName: name,
    sex:"", dob:"", color:"", notes:"",
    microchip:"",
    rabiesDate:"",
    photoDataUrl:""
  };
  dogs.push(dog);
  save(DOG_KEY, dogs);
  showDogs();
}

// ===== Dog Profile =====
function showDogProfile(id) {
  const dog = dogs.find(d => d.id === id);
  if (!dog) return;
  currentDogId = id;

  const records = (health[id] || []);
  const rabies = dog.rabiesDate ? `Rabies: <span class="pill">${escapeHtml(dog.rabiesDate)}</span>` : `Rabies: <span class="pill">—</span>`;
  const micro = dog.microchip ? `Microchip: <span class="pill">${escapeHtml(dog.microchip)}</span>` : `Microchip: <span class="pill">—</span>`;

  const photo = dog.photoDataUrl
    ? `<img class="photo" src="${dog.photoDataUrl}" alt="Dog photo">`
    : `<div class="photo card" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;">No Photo</div>`;

  let recHtml = "";
  if (records.length === 0) {
    recHtml = "<p class='small'>No health records yet.</p>";
  } else {
    recHtml = records.slice().reverse().map(r => `
      <div class="card">
        <div class="row">
          <div>
            <strong>${escapeHtml(r.type)}</strong><br>
            <span class="small">${escapeHtml(r.date)}${r.notes ? " · " + escapeHtml(r.notes) : ""}</span>
          </div>
          <button onclick="deleteHealthRecord(${r.id})">Delete</button>
        </div>
      </div>
    `).join("");
  }

  view.innerHTML = `
    <h2>Dog Profile</h2>

    <div class="card grid2">
      <div>
        ${photo}
        <div style="margin-top:10px">
          <input id="photo_file" type="file" accept="image/*">
          <div class="small" style="margin-top:6px;">(Photo saves on device)</div>
        </div>
      </div>

      <div>
        <label>Call Name<br><input id="edit_name" value="${escapeAttr(dog.callName)}"></label><br><br>
        <label>Sex<br><input id="edit_sex" value="${escapeAttr(dog.sex || "")}" placeholder="Male/Female"></label><br><br>
        <label>DOB<br><input id="edit_dob" value="${escapeAttr(dog.dob || "")}" placeholder="YYYY-MM-DD"></label><br><br>
        <label>Color<br><input id="edit_color" value="${escapeAttr(dog.color || "")}"></label><br><br>
        <label>Microchip<br><input id="edit_microchip" value="${escapeAttr(dog.microchip || "")}"></label><br><br>
        <label>Rabies Date<br><input id="edit_rabies" value="${escapeAttr(dog.rabiesDate || "")}" placeholder="YYYY-MM-DD"></label><br><br>
        <label>Notes<br><textarea id="edit_notes">${escapeHtml(dog.notes || "")}</textarea></label><br><br>

        <div class="card">
          <div class="small">${micro}</div>
          <div class="small" style="margin-top:6px;">${rabies}</div>
        </div>

        <button onclick="saveDogProfile()">Save Changes</button>
        <button onclick="deleteDog()">Delete Dog</button>
        <button onclick="showDogs()">Back</button>
      </div>
    </div>

    <hr>

    <h3>Health Records</h3>
    <div class="card">
      <label>Type
        <select id="health_type">
          <option value="Rabies">Rabies</option>
          <option value="DHPP">DHPP</option>
          <option value="Bordetella">Bordetella</option>
          <option value="Deworming">Deworming</option>
          <option value="OFA">OFA</option>
          <option value="Vet Visit">Vet Visit</option>
          <option value="Note">Note</option>
        </select>
      </label><br><br>
      <label>Date<br><input id="health_date" placeholder="YYYY-MM-DD"></label><br><br>
      <label>Notes<br><input id="health_notes" placeholder="optional"></label><br><br>
      <button onclick="addHealthRecord()">Add Record</button>
    </div>

    ${recHtml}
  `;

  // Wire photo upload (no inline handlers for file inputs)
  const f = document.getElementById("photo_file");
  if (f) {
    f.onchange = async () => {
      const file = f.files && f.files[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      // Save immediately
      const d = dogs.find(x => x.id === currentDogId);
      if (!d) return;
      d.photoDataUrl = dataUrl;
      save(DOG_KEY, dogs);
      showDogProfile(currentDogId);
    };
  }
}

function saveDogProfile() {
  const d = dogs.find(x => x.id === currentDogId);
  if (!d) return;
  d.callName = document.getElementById("edit_name").value.trim();
  d.sex = document.getElementById("edit_sex").value.trim();
  d.dob = document.getElementById("edit_dob").value.trim();
  d.color = document.getElementById("edit_color").value.trim();
  d.microchip = document.getElementById("edit_microchip").value.trim();
  d.rabiesDate = document.getElementById("edit_rabies").value.trim();
  d.notes = document.getElementById("edit_notes").value;
  save(DOG_KEY, dogs);
  showDogProfile(currentDogId);
}

function deleteDog() {
  if (!confirm("Delete this dog?")) return;
  dogs = dogs.filter(d => d.id !== currentDogId);
  // remove health map entry too
  if (health[currentDogId]) {
    delete health[currentDogId];
    save(HEALTH_KEY, health);
  }
  save(DOG_KEY, dogs);
  showDogs();
}

// ===== Health records =====
function addHealthRecord() {
  if (!currentDogId) return;
  const type = document.getElementById("health_type").value;
  const date = document.getElementById("health_date").value.trim();
  if (!date) { alert("Date required"); return; }
  const notes = document.getElementById("health_notes").value.trim();

  const rec = { id: Date.now(), type, date, notes };
  if (!health[currentDogId]) health[currentDogId] = [];
  health[currentDogId].push(rec);
  save(HEALTH_KEY, health);

  // convenience: if record type is Rabies, update profile field too
  if (type === "Rabies") {
    const d = dogs.find(x => x.id === currentDogId);
    if (d) {
      d.rabiesDate = date;
      save(DOG_KEY, dogs);
    }
  }
  showDogProfile(currentDogId);
}

function deleteHealthRecord(recId) {
  if (!currentDogId) return;
  if (!confirm("Delete this record?")) return;
  const list = health[currentDogId] || [];
  health[currentDogId] = list.filter(r => r.id !== recId);
  save(HEALTH_KEY, health);
  showDogProfile(currentDogId);
}

// ===== Inventory (unchanged, audited) =====
function showInventory() {
  let html = `<h2>Inventory</h2>
    <button onclick="addInventory()">Add Item</button>`;
  if (inventory.length === 0) html += "<p>No inventory yet.</p>";
  inventory.forEach(i => html += `<div class="card">${escapeHtml(i.name)} — ${i.qty}</div>`);
  view.innerHTML = html;
}
function addInventory() {
  const name = prompt("Item name");
  if (!name) return;
  inventory.push({ name, qty: 1 });
  save(INV_KEY, inventory);
  showInventory();
}

// ===== Scanner (stub) =====
function showScanner() {
  view.innerHTML = `<h2>Scanner</h2><p>Scanner ready (stub).</p>
  <button onclick="showDogs()">Back</button>`;
}

// ===== Utilities =====
function escapeHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escapeAttr(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Boot =====
showDogs();
