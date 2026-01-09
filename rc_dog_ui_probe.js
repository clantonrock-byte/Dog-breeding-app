(function () {
  function badge(msg) {
    let el = document.getElementById("rcDogProbe");
    if (!el) {
      el = document.createElement("div");
      el.id = "rcDogProbe";
      el.style.position = "fixed";
      el.style.top = "10px";
      el.style.left = "10px";
      el.style.right = "10px";
      el.style.zIndex = "999999";
      el.style.background = "rgba(0,0,0,0.75)";
      el.style.color = "#f2f2f2";
      el.style.border = "1px solid rgba(255,255,255,0.18)";
      el.style.borderRadius = "12px";
      el.style.padding = "10px 12px";
      el.style.fontSize = "14px";
      document.body.appendChild(el);
    }
    el.textContent = msg;
  }

  function run() {
    try {
      const scope = document.getElementById("viewDogs") || document.body;
      const cards = scope.querySelectorAll(".card");
      const openBtns = Array.from(document.querySelectorAll("button"))
        .filter(b => (b.textContent || "").trim().toLowerCase() === "open");

      badge("DOG UI PROBE ✅  cards:" + cards.length + "  openBtns:" + openBtns.length);
    } catch (e) {
      badge("DOG UI PROBE ❌ " + (e.message || e));
    }
  }

  document.addEventListener("DOMContentLoaded", run);
  setInterval(run, 1500);
})();
