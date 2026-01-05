// Safe init hook for GitHub Pages / Chrome
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (typeof bp_initApp === "function") {
      bp_initApp();
    } else {
      console.error("bp_initApp not found");
    }
  } catch (e) {
    console.error("App init failed:", e);
  }
});