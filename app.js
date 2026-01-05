// === PATCH: Ensure Add Dog function exists ===

// If the Add Dog sheet function is missing, define a safe default
if (typeof bp_openAddDogSheet !== "function") {
  function bp_openAddDogSheet() {
    alert("Add Dog sheet opened (patch stub).");
    console.log("bp_openAddDogSheet called successfully.");
  }
}

// Ensure app initializes
document.addEventListener("DOMContentLoaded", () => {
  if (typeof bp_initApp === "function") {
    bp_initApp();
  }
});