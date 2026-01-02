// app.js — navigation only (stable on mobile)

(function () {
  const views = [
    "Home",
    "InventoryMenu",
    "InventoryAvailable",
    "InventoryAdd",
    "InventoryAddStock",
    "InventoryTransfer",
    "Dogs",
    "Care",
    "Feeding",
    "Helpers",
    "Records"
  ];

  window.__go = function (name) {
    views.forEach(v => {
      const el = document.getElementById("view" + v);
      if (el) el.classList.toggle("hide", v !== name);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    // Always start on Home
    window.__go("Home");
  });
})();
