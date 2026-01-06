// ===== Storage helpers =====
const DOG_KEY = "breeder_dogs_v1";
const INV_KEY = "breeder_inventory_v1";

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ===== State =====
let dogs = load(DOG_KEY, []);
let inventory = load(INV_KEY, []);
let currentDogId = null;

const view = document.getElementById("view");

// ===== Dogs =====
function showDogs() {
  let html = `<h2>Dogs</h2>
    <button onclick="showAddDog()">Add Dog</button>`;

  if (dogs.length === 0) {
    html += "<p>No dogs yet.</p>";
  } else {
    dogs.forEach(d => {
      html += `<div class="card">
        <div class="row">
          <strong>${d.callName}</strong>
          <button onclick="showDogDetail(${d.id})">Open</button>
        </div>
      </div>`;
    });
  }
  view.innerHTML = html;
}

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
  const dog = { id: Date.now(), callName: name, sex:"", dob:"", color:"", notes:"" };
  dogs.push(dog);
  save(DOG_KEY, dogs);
  showDogs();
}

function showDogDetail(id) {
  const dog = dogs.find(d => d.id === id);
  if (!dog) return;
  currentDogId = id;
  view.innerHTML = `
    <h2>Dog Detail</h2>
    <div class="card">
      <label>Call Name<br><input id="edit_name" value="${dog.callName}"></label><br><br>
      <label>Sex<br><input id="edit_sex" value="${dog.sex || ""}"></label><br><br>
      <label>DOB<br><input id="edit_dob" value="${dog.dob || ""}"></label><br><br>
      <label>Color<br><input id="edit_color" value="${dog.color || ""}"></label><br><br>
      <label>Notes<br><textarea id="edit_notes">${dog.notes || ""}</textarea></label><br><br>
      <button onclick="updateDog()">Save Changes</button>
      <button onclick="deleteDog()">Delete</button>
      <button onclick="showDogs()">Back</button>
    </div>`;
}

function updateDog() {
  const d = dogs.find(x => x.id === currentDogId);
  if (!d) return;
  d.callName = document.getElementById("edit_name").value.trim();
  d.sex = document.getElementById("edit_sex").value;
  d.dob = document.getElementById("edit_dob").value;
  d.color = document.getElementById("edit_color").value;
  d.notes = document.getElementById("edit_notes").value;
  save(DOG_KEY, dogs);
  showDogs();
}

function deleteDog() {
  if (!confirm("Delete this dog?")) return;
  dogs = dogs.filter(d => d.id !== currentDogId);
  save(DOG_KEY, dogs);
  showDogs();
}

// ===== Inventory (unchanged) =====
function showInventory() {
  let html = `<h2>Inventory</h2>
    <button onclick="addInventory()">Add Item</button>`;
  if (inventory.length === 0) html += "<p>No inventory yet.</p>";
  inventory.forEach(i => html += `<div class="card">${i.name} — ${i.qty}</div>`);
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

// ===== Boot =====
showDogs();
