
// === View All Active Dogs Patch ===
// Fixes "View All" button on Dog Profile page so it shows all active dogs

/**
 * Resets dog list state and navigates back to Dogs view.
 * Active dogs only (archived already excluded in renderDogs).
 */
function viewAllActiveDogs() {
  window.dogsViewMode = "All";
  window.dogsRouteFilter = "";

  if (typeof _go === "function") _go("Dogs");
  if (typeof renderDogs === "function") renderDogs();
}

/**
 * Robust button binding:
 * Works even if the button is injected dynamically.
 */
function bindViewAllDogsButton() {
  const btn =
    document.getElementById("btnViewAllDogs") ||
    document.getElementById("btnViewAll") ||
    document.getElementById("btnViewAllActiveDogs");

  if (!btn || btn._boundViewAll) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    viewAllActiveDogs();
  });

  btn._boundViewAll = true;
}

document.addEventListener("DOMContentLoaded", () => {
  bindViewAllDogsButton();
  setInterval(bindViewAllDogsButton, 800);
});
