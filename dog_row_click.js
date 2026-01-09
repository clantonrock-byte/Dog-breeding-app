// dog_row_click.js
// Tap anywhere on a dog row -> click that row's existing "Open" button.
// Layout-agnostic: finds the nearest container that contains an Open button.

(function () {
  function isControl(el) {
    try {
      return !!el.closest("button,a,input,select,textarea,label");
    } catch (e) {
      return false;
    }
  }

  function findOpenButton(startEl) {
    // Walk up a few levels and look for a button whose text is "Open"
    let el = startEl;
    for (let i = 0; i < 6 && el; i++) {
      try {
        const btns = el.querySelectorAll ? el.querySelectorAll("button") : [];
        for (const b of btns) {
          const t = (b.textContent || "").trim().toLowerCase();
          if (t === "open") return b;
        }
      } catch (e) {}
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener("click", function (e) {
    // Don't hijack clicks on controls
    if (isControl(e.target)) return;

    const openBtn = findOpenButton(e.target);
    if (!openBtn) return;

    // Trigger the existing behavior
    openBtn.click();
  }, true);

  console.log("dog_row_click.js active");
})();
