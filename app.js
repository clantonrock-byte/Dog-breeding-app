// app.js — navigation with 1-step Back stack (cuz human)

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

  let current = "Home";
  const stack = []; // navigation history

  function show(name) {
    views.forEach(v => {
      const el = document.getElementById("view" + v);
      if (el) el.classList.toggle("hide", v !== name);
    });
    current = name;
  }

  // Go to a view and remember where we came from
  window.__go = function (name) {
    if (!name || name === current) return;

    // Only push if current is a valid view
    if (views.includes(current)) stack.push(current);

    show(name);
  };

  // Back goes one step back
  window.__back = function () {
    if (stack.length === 0) {
      show("Home");
      return;
    }
    const prev = stack.pop();
    show(prev);
  };

  // Home resets the stack
  window.__home = function () {
    stack.length = 0;
    show("Home");
  };

  document.addEventListener("DOMContentLoaded", () => {
    show("Home");
  });
})();
