const $ = (s) => document.querySelector(s);

const VIEWS = [
  "Home",
  "InventoryMenu",
  "InventoryCurrent",
  "InventoryAdd",
  "InventoryTransfer",
  "InventoryReview",
  "Dogs",
  "Care",
  "Feeding",
  "Helpers",
  "Records",
];

function showView(name) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view${v}`);
    if (el) el.classList.toggle("hide", v !== name);
  });
}

function bindNav() {
  // Home buttons
  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dest = btn.dataset.go;
      if (dest === "inventory") showView("InventoryMenu");
      else if (dest === "dogs") showView("Dogs");
      else if (dest === "care") showView("Care");
      else if (dest === "feeding") showView("Feeding");
      else if (dest === "helpers") showView("Helpers");
      else if (dest === "records") showView("Records");
      else showView("Home");
    });
  });

  // Inventory menu action buttons
  document.querySelectorAll("[data-inv]").forEach(btn => {
    btn.addEventListener("click", () => {
      const a = btn.dataset.inv;
      if (a === "current") showView("InventoryCurrent");
      if (a === "add") showView("InventoryAdd");
      if (a === "transfer") showView("InventoryTransfer");
      if (a === "review") showView("InventoryReview");
    });
  });

  // Back buttons
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      const backTo = btn.dataset.back;
      if (backTo === "home") showView("Home");
      if (backTo === "inventoryMenu") showView("InventoryMenu");
    });
  });

  // Home buttons (explicit)
  document.querySelectorAll("[data-home]").forEach(btn => {
    btn.addEventListener("click", () => showView("Home"));
  });

  // Start on Home
  showView("Home");
}

document.addEventListener("DOMContentLoaded", bindNav);
