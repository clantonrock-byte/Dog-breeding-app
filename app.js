// app.js — stable navigation stack (Back = 1 step, Home = Home)

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

    if (typeof window.__afterShow === "function") {
      try { window.__afterShow(name); } catch (_) {}
    }
  }

  window.__go = function (name) {
    if (!name || name === current) return;
    if (views.includes(current)) stack.push(current);
    show(name);
  };

  window.__back = function () {
    if (stack.length === 0) return show("Home");
    show(stack.pop());
  };

  window.__home = function () {
    stack.length = 0;
    show("Home");
  };

  document.addEventListener("DOMContentLoaded", () => show("Home"));
})();
