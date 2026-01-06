// ===== Storage =====
const DOG_KEY = "breeder_dogs_v1";
const INV_KEY = "breeder_inventory_v1";

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ===== State =====
let dogs = load(DOG_KEY, []);
let inventory = load(INV_KEY, []);

const view = document.getElementById("view");

// ===== Dogs =====
function showDogs() {
  let html = `<h2>Dogs</h2>
  <button onclick="showAddDog()">Add Dog</button>`;

  if (dogs.length === 0) {
    html += "<p>No dogs yet.</p>";
  } else {
    dogs.forEach(d => {
      html += `<div class="card"><strong>${d.callName}</strong></div>`;
    });
  }
  view.innerHTML = html;
}

function showAddDog() {
  view.innerHTML = `
    <h2>Add Dog</h2>
    <div class="card">
      <label>Call Name<br>
        <input id="dog_name">
      </label><br><br>
      <button onclick="saveDog()">Save</button>
      <button onclick="showDogs()">Cancel</button>
    </div>
  `;
}

function saveDog() {
  const name = document.getElementById("dog_name").value.trim();
  if (!name) {
    alert("Call name required");
    return;
  }
  const dog = { id: Date.now(), callName: name };
  dogs.push(dog);
  save(DOG_KEY, dogs);
  showDogs();
}

// ===== Inventory =====
function showInventory() {
  let html = `<h2>Inventory</h2>
  <button onclick="addInventory()">Add Item</button>`;

  if (inventory.length === 0) {
    html += "<p>No inventory yet.</p>";
  } else {
    inventory.forEach(i => {
      html += `<div class="card">${i.name} — ${i.qty}</div>`;
    });
  }
  view.innerHTML = html;
}

function addInventory() {
  const name = prompt("Item name");
  if (!name) return;
  inventory.push({ name, qty: 1 });
  save(INV_KEY, inventory);
  showInventory();
}

// ===== Scanner (stub, safe) =====
function showScanner() {
  view.innerHTML = `
    <h2>Scanner</h2>
    <p>Scanner ready (stub).</p>
    <button onclick="showDogs()">Back</button>
  `;
}

// ===== Boot =====
showDogs();
