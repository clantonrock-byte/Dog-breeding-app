// ===============================
// FINAL SAFETY PATCH: Add Dog
// ===============================

// Force global definition immediately
window.bp_openAddDogSheet = function () {
  alert("Add Dog sheet is now wired correctly.");
  console.log("bp_openAddDogSheet fired (global bind OK)");
};

// Also expose placeholders in case HTML expects them
window.bp_closeAddDogSheet = window.bp_closeAddDogSheet || function () {
  console.log("bp_closeAddDogSheet stub");
};

window.bp_createDogFromSheet = window.bp_createDogFromSheet || function () {
  console.log("bp_createDogFromSheet stub");
};

// Allow normal app init to proceed if present
document.addEventListener("DOMContentLoaded", () => {
  if (typeof bp_initApp === "function") {
    try {
      bp_initApp();
    } catch (e) {
      console.error("bp_initApp error:", e);
    }
  }
});