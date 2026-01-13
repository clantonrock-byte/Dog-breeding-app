(() => {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function findProfileView() {
    return $("viewDogProfile") || document.querySelector('section[id*="DogProfile" i]');
  }

  function showMoreAlways() {
    const panel = $("dogMorePanel");
    const btnMore = $("btnMoreDog");
    if (panel) panel.classList.remove("hide");
    if (btnMore) btnMore.classList.add("hide");
  }

  function findSaveButton(profile) {
    if (!profile) return null;

    const byId = $("btnSaveDog") || $("btnSaveStatus") || $("btnSave");
    if (byId && profile.contains(byId)) return byId;

    const byPrefix = Array.from(profile.querySelectorAll('button[id^="btnSave"]'));
    if (byPrefix.length) return byPrefix[0];

    const byText = Array.from(profile.querySelectorAll("button"))
      .find((b) => /save/i.test((b.textContent || "").trim()));
    if (byText) return byText;

    return null;
  }

  function ensureActionBar(profile) {
    if (!profile) return null;
    let bar = $("bpDogProfileActions");
    if (bar) return bar;

    bar = document.createElement("div");
    bar.id = "bpDogProfileActions";
    bar.className = "bp-dog-actions";
    profile.appendChild(bar);
    profile.style.paddingBottom = "84px";
    return bar;
  }

  function moveSaveIntoBar() {
    const profile = findProfileView();
    if (!profile) return;

    showMoreAlways();

    const bar = ensureActionBar(profile);
    if (!bar) return;

    if (bar.querySelector("button")) return;

    const saveBtn = findSaveButton(profile);
    if (!saveBtn) return;

    saveBtn.textContent = "Save & Done";
    saveBtn.classList.add("primary", "bp-dog-save");

    // Let original handler run; then navigate back.
    saveBtn.addEventListener("click", () => {
      setTimeout(() => {
        try { if (typeof window.__back === "function") return window.__back(); } catch {}
        try { if (typeof window.__go === "function") return window.__go("Dogs"); } catch {}
      }, 250);
    }, false);

    bar.appendChild(saveBtn);
  }

  function apply() { moveSaveIntoBar(); }

  function hookAfterShow() {
    const prev = window.__afterShow;
    if (prev && prev._bpDogProfilePolishV2Wrapped) return;

    window.__afterShow = function (view) {
      try { if (typeof prev === "function") prev(view); } catch {}
      if (view === "DogProfile") setTimeout(apply, 0);
    };
    window.__afterShow._bpDogProfilePolishV2Wrapped = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    hookAfterShow();
    setTimeout(apply, 400);
    setInterval(apply, 1200);
  });
})();
