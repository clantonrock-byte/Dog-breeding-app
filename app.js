// ===== Storage =====
const DOG_KEY = "breeder_dogs_v1";
const INV_KEY = "breeder_inventory_v1";
const HEALTH_KEY = "breeder_health_v1"; // { [dogId]: [records...] }
const DOG_EVENTS_KEY = "breeder_dog_events_v1"; // { [dogId]: [events...] }

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function nowIso() { return new Date().toISOString(); }

// ===== State =====
let dogs = load(DOG_KEY, []);
let inventory = load(INV_KEY, []);
let health = load(HEALTH_KEY, {});
let dogEvents = load(DOG_EVENTS_KEY, {});
let currentDogId = null;

// Sex filter and status filter
let dogSexFilter = "all"; // all|male|female|unknown
let dogStatusFilter = "active"; // active|archived|transferred|all

const view = document.getElementById("view");

// ===== Normalization =====
function normSex(v) {
  v = String(v || "").trim().toLowerCase();
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  return ""; // unknown
}
function sexLabel(v) {
  v = normSex(v);
  return v === "male" ? "Male" : v === "female" ? "Female" : "Unknown";
}
function statusLabel(v) {
  v = String(v || "active");
  if (v === "archived") return "Archived";
  if (v === "transferred") return "Transferred";
  return "Active";
}

function ensureDogDefaults(d) {
  d.status = d.status || "active";
  d.createdAt = d.createdAt || nowIso();
  d.updatedAt = d.updatedAt || d.createdAt;
  d.sex = normSex(d.sex);
  d.microchip = d.microchip || "";
  d.rabiesDate = d.rabiesDate || "";
  d.photoDataUrl = d.photoDataUrl || "";
  d.transferredAt = d.transferredAt || "";
  d.transferNotes = d.transferNotes || "";
  d.archivedAt = d.archivedAt || "";
  d.callName = d.callName || "";
  d.dob = d.dob || "";
  d.color = d.color || "";
  d.notes = d.notes || "";
  return d;
}

// Migrate existing dogs to include defaults
dogs = dogs.map(ensureDogDefaults);
save(DOG_KEY, dogs);

// ===== Events / timeline =====
function addDogEvent(dogId, type, data) {
  if (!dogEvents[dogId]) dogEvents[dogId] = [];
  dogEvents[dogId].push({ id: Date.now(), type, at: nowIso(), data: data || {} });
  save(DOG_EVENTS_KEY, dogEvents);
}

// ===== Dogs List =====
function showDogs() {
  let html = `<h2>Dogs</h2>
    <button onclick="showAddDog()">Add Dog</button>

    <div class="filterbar">
      <span class="pill">Status: ${statusLabel(dogStatusFilter)}</span>
      <button onclick="setStatusFilter('active')">Active</button>
      <button onclick="setStatusFilter('archived')">Archived</button>
      <button onclick="setStatusFilter('transferred')">Transferred</button>
      <button onclick="setStatusFilter('all')">All</button>
    </div>

    <div class="filterbar">
      <span class="pill">Sex: ${sexLabel(dogSexFilter)}</span>
      <button onclick="setSexFilter('all')">All</button>
      <button onclick="setSexFilter('male')">Males</button>
      <button onclick="setSexFilter('female')">Females</button>
      <button onclick="setSexFilter('unknown')">Unknown</button>
    </div>
  `;

  const filtered = dogs.filter(d => {
    // status
    if (dogStatusFilter !== "all" && d.status !== dogStatusFilter) return false;
    // sex
    const sx = normSex(d.sex);
    if (dogSexFilter === "male" && sx !== "male") return false;
    if (dogSexFilter === "female" && sx !== "female") return false;
    if (dogSexFilter === "unknown" && sx !== "") return false;
    return true;
  });

  if (filtered.length === 0) {
    html += "<p>No dogs in this view.</p>";
  } else {
    filtered.forEach(d => {
      const tags = [
        `<span class="pill">${statusLabel(d.status)}</span>`,
        `<span class="pill">${sexLabel(d.sex)}</span>`
      ].join(" ");
      html += `<div class="card">
        <div class="row">
          <div>
            <strong>${escapeHtml(d.callName)}</strong><br>
            <span class="small">${tags}</span>
          </div>
          <button onclick="showDogProfile(${d.id})">Open</button>
        </div>
      </div>`;
    });
  }

  view.innerHTML = html;
}

function setSexFilter(v) { dogSexFilter = v; showDogs(); }
function setStatusFilter(v) { dogStatusFilter = v; showDogs(); }

// ===== Add Dog =====
function showAddDog() {
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
function saveDog() {
  const name = document.getElementById("dog_name").value.trim();
  if (!name) { alert("Call name required"); return; }
  const sex = normSex(document.getElementById("dog_sex").value);
  const dog = ensureDogDefaults({
    id: Date.now(),
    callName: name,
    sex: sex
  });
  dogs.push(dog);
  save(DOG_KEY, dogs);
  addDogEvent(dog.id, "dog_created", { callName: name, sex });
  showDogs();
}

// ===== Dog Profile =====
function showDogProfile(id) {
  const dog = dogs.find(d => d.id === id);
  if (!dog) return;
  currentDogId = id;

  const records = (health[id] || []);
  const events = (dogEvents[id] || []).slice().reverse();

  const photo = dog.photoDataUrl
    ? `<img class="photo" src="${dog.photoDataUrl}" alt="Dog photo">`
    : `<div class="card" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;">No Photo</div>`;

  const statusExtra = dog.status === "transferred"
    ? `<label>Transfer Date<br><input id="edit_transferredAt" value="${escapeAttr(dog.transferredAt || "")}" placeholder="YYYY-MM-DD"></label><br><br>
       <label>Transfer Notes<br><textarea id="edit_transferNotes">${escapeHtml(dog.transferNotes || "")}</textarea></label><br><br>`
    : dog.status === "archived"
    ? `<label>Archived At<br><input id="edit_archivedAt" value="${escapeAttr(dog.archivedAt || "")}" placeholder="YYYY-MM-DD"></label><br><br>`
    : ``;

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
          <button onclick="deleteHealthRecord(${r.id})">Remove</button>
        </div>
      </div>
    `).join("");
  }

  let evHtml = "";
  if (events.length === 0) {
    evHtml = "<p class='small'>No timeline entries yet.</p>";
  } else {
    evHtml = events.map(e => `
      <div class="card">
        <strong>${escapeHtml(e.type)}</strong><br>
        <span class="small">${escapeHtml(e.at)}</span>
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

        <label>Sex<br>
          <select id="edit_sex">
            <option value="" ${dog.sex===""?"selected":""}>Unknown</option>
            <option value="male" ${dog.sex==="male"?"selected":""}>Male</option>
            <option value="female" ${dog.sex==="female"?"selected":""}>Female</option>
          </select>
        </label><br><br>

        <label>DOB<br><input id="edit_dob" value="${escapeAttr(dog.dob || "")}" placeholder="YYYY-MM-DD"></label><br><br>
        <label>Color<br><input id="edit_color" value="${escapeAttr(dog.color || "")}"></label><br><br>

        <label>Microchip<br><input id="edit_microchip" value="${escapeAttr(dog.microchip || "")}" placeholder="chip #"></label><br><br>
        <label>Rabies Date<br><input id="edit_rabies" value="${escapeAttr(dog.rabiesDate || "")}" placeholder="YYYY-MM-DD"></label><br><br>

        <label>Status<br>
          <select id="edit_status">
            <option value="active" ${dog.status==="active"?"selected":""}>Active</option>
            <option value="archived" ${dog.status==="archived"?"selected":""}>Archived</option>
            <option value="transferred" ${dog.status==="transferred"?"selected":""}>Transferred</option>
          </select>
        </label><br><br>

        ${statusExtra}

        <label>Notes<br><textarea id="edit_notes">${escapeHtml(dog.notes || "")}</textarea></label><br><br>

        <div class="card">
          <div class="small">Created: <span class="pill">${escapeHtml(dog.createdAt)}</span></div>
          <div class="small" style="margin-top:6px;">Updated: <span class="pill">${escapeHtml(dog.updatedAt)}</span></div>
        </div>

        <button onclick="saveDogProfile()">Save Changes</button>
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

    <hr>
    <h3>Timeline</h3>
    ${evHtml}
  `;

  // Wire photo upload
  const f = document.getElementById("photo_file");
  if (f) {
    f.onchange = async () => {
      const file = f.files && f.files[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      const d = dogs.find(x => x.id === currentDogId);
      if (!d) return;
      d.photoDataUrl = dataUrl;
      d.updatedAt = nowIso();
      save(DOG_KEY, dogs);
      addDogEvent(currentDogId, "photo_updated", {});
      showDogProfile(currentDogId);
    };
  }
}

function saveDogProfile() {
  const d = dogs.find(x => x.id === currentDogId);
  if (!d) return;

  const oldStatus = d.status;
  const oldMicro = d.microchip;

  d.callName = document.getElementById("edit_name").value.trim();
  d.sex = normSex(document.getElementById("edit_sex").value);
  d.dob = document.getElementById("edit_dob").value.trim();
  d.color = document.getElementById("edit_color").value.trim();
  d.microchip = document.getElementById("edit_microchip").value.trim();
  d.rabiesDate = document.getElementById("edit_rabies").value.trim();
  d.status = document.getElementById("edit_status").value;
  d.notes = document.getElementById("edit_notes").value;

  // status-specific fields
  if (d.status === "transferred") {
    d.transferredAt = document.getElementById("edit_transferredAt")?.value.trim() || d.transferredAt;
    d.transferNotes = document.getElementById("edit_transferNotes")?.value || d.transferNotes;
    if (!d.transferredAt) d.transferredAt = nowIso().slice(0,10);
  } else if (d.status === "archived") {
    d.archivedAt = document.getElementById("edit_archivedAt")?.value.trim() || d.archivedAt;
    if (!d.archivedAt) d.archivedAt = nowIso().slice(0,10);
  }

  d.updatedAt = nowIso();
  save(DOG_KEY, dogs);

  // timeline events
  addDogEvent(currentDogId, "profile_saved", {});
  if (d.microchip && d.microchip !== oldMicro) addDogEvent(currentDogId, "microchip_set", { microchip: d.microchip });
  if (d.status !== oldStatus) addDogEvent(currentDogId, "status_changed", { from: oldStatus, to: d.status });

  showDogProfile(currentDogId);
}

// ===== Health =====
function addHealthRecord() {
  if (!currentDogId) return;
  const type = document.getElementById("health_type").value;
  const date = document.getElementById("health_date").value.trim();
  if (!date) { alert("Date required"); return; }
  const notes = document.getElementById("health_notes").value.trim();

  const rec = { id: Date.now(), type, date, notes, loggedAt: nowIso() };
  if (!health[currentDogId]) health[currentDogId] = [];
  health[currentDogId].push(rec);
  save(HEALTH_KEY, health);

  addDogEvent(currentDogId, "health_record_added", { type, date });

  // convenience: if Rabies record, set rabiesDate too
  if (type === "Rabies") {
    const d = dogs.find(x => x.id === currentDogId);
    if (d) {
      d.rabiesDate = date;
      d.updatedAt = nowIso();
      save(DOG_KEY, dogs);
      addDogEvent(currentDogId, "rabies_updated", { date });
    }
  }
  showDogProfile(currentDogId);
}

function deleteHealthRecord(recId) {
  if (!currentDogId) return;
  if (!confirm("Remove this record?")) return;
  const list = health[currentDogId] || [];
  health[currentDogId] = list.filter(r => r.id !== recId);
  save(HEALTH_KEY, health);
  addDogEvent(currentDogId, "health_record_removed", { id: recId });
  showDogProfile(currentDogId);
}

// ===== Inventory (audited base) =====
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
  inventory.push({ name, qty: 1, createdAt: nowIso() });
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
