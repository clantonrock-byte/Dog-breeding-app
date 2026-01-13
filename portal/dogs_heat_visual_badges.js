(() => {
  "use strict";

  function placeBadge(container, type) {
    if (!container || container.querySelector(".heat-photo-badge")) return;
    const badge = document.createElement("div");
    badge.className = "heat-photo-badge " + (type === "heat" ? "heat-now" : "heat-soon");
    badge.textContent = type === "heat" ? "HEAT" : "HEAT SOON";
    container.style.position = "relative";
    container.appendChild(badge);
  }

  function clearBadges(root) {
    root.querySelectorAll(".heat-photo-badge").forEach(b => b.remove());
  }

  function applyToList() {
    const list = document.getElementById("dogsList");
    if (!list) return;
    clearBadges(list);
    list.querySelectorAll(".dog-card").forEach(card => {
      const type = card.querySelector(".heat-badge") ? "heat"
        : card.querySelector(".heat-soon-badge") ? "soon" : null;
      if (!type) return;
      const photo = card.querySelector(".dog-card-left");
      if (photo) placeBadge(photo, type);
    });
  }

  function applyToProfile() {
    const profile = document.getElementById("viewDogProfile");
    if (!profile) return;
    clearBadges(profile);
    const type = profile.querySelector(".heat-badge") ? "heat"
      : profile.querySelector(".heat-soon-badge") ? "soon" : null;
    if (!type) return;
    const photo = profile.querySelector("img");
    if (photo && photo.parentElement) placeBadge(photo.parentElement, type);
  }

  function hook() {
    const prev = window.__afterShow;
    if (prev && prev._heatVisualWrapped) return;
    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      setTimeout(() => { applyToList(); applyToProfile(); }, 0);
    };
    window.__afterShow._heatVisualWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hook();
    setTimeout(() => { applyToList(); applyToProfile(); }, 500);
  });
})();
