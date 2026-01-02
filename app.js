// app.js — navigation with one-step Back stack + Home reset + afterShow hook

(function () {
  const views = [
    "Home",
    "InventoryMenu",
    "InventoryAvailable",
    "InventoryAdd",
    "InventoryAddStock",
    "InventoryReduceStock",
    "InventoryTransfer",
    "Dogs",
    "Care",
    "Feeding",
    "Helpers",
    "Records"
  ];

  let current = "Home";
  const stack = [];

  function show(name) {
    views.forEach(v => {
      const el = document.getElementById("view" + v);
      if (el) el.classList.toggle("hide", v !== name);
    });
    current = name;

    // Let index.html refresh lists whenever a page is shown
    if (typeof window.__afterShow === "function") {
      try { window.__afterShow(name); } catch (e) {}
    }
  }

  window.__go = function (name) {
    if (!name || name === current) return;
    if (views.includes(current)) stack.push(current);
    show(name);
  };

  window.__back = function () {
    if (stack.length === 0) {
      show("Home");
      return;
    }
    show(stack.pop());
  };

  window.__home = function () {
    stack.length = 0;
    show("Home");
  };

  document.addEventListener("DOMContentLoaded", () => {
    show("Home");
  });
})();
