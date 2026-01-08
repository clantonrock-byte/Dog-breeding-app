// dog_photo_open.js — v8 (layout-proof)
// Finds ANY element that opens a dog profile by looking for "__openDog(" in onclick.
// Adds a thumbnail (photo or 📷 Add photo) next to it and hides the original "Open" control.

(function () {
  const DOG_KEYS = ["breederPro_dogs_store_v3", "breeder_dogs_v1", "breederPro_dogs_store_v1"];

  function loadDogsStore() {
    for (const k of DOG_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (Array.isArray(obj)) return { dogs: obj };
        if (obj && Array.isArray(obj.dogs)) return obj;
      } catch {}
    }
    return { dogs: [] };
  }

  function photoMap() {
    const store = loadDogsStore();
    const byId = new Map();
    (store.dogs || []).forEach(d => {
      const id = d.dogId || d.id;
      const photo = d.photoDataUrl || d.photo || d.photoUrl || d.photoURI || "";
      if (id) byId.set(String(id), photo);
    });
    return byId;
  }

  function injectCSS() {
    if (document.getElementById("rcDogThumbCssV8")) return;
    const css = document.createElement("style");
    css.id = "rcDogThumbCssV8";
    css.textContent = `
      .rc-thumb{
        width:66px;height:54px;border-radius:12px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(255,255,255,0.06);
        overflow:hidden;flex:0 0 auto;
        display:flex;align-items:center;justify-content:center;
        padding:6px;text-align:center;line-height:1.05;
        color:rgba(242,242,242,0.85);
        margin-right:10px;
      }
      .rc-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
      .rc-thumb .cam{font-size:16px;display:block;}
      .rc-thumb .txt{font-size:11px;opacity:.9;margin-top:2px;}
      .rc-openwrap{display:flex;align-items:center;gap:10px;}
    `;
    document.head.appendChild(css);
  }

  function mkThumb(src) {
    const el = document.createElement("div");
    el.className = "rc-thumb";
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Dog photo";
      el.appendChild(img);
    } else {
      el.innerHTML = `<span class="cam">📷</span><span class="txt">Add photo</span>`;
    }
    return el;
  }

  function dogIdFromOnclick(s) {
    try {
      const m = String(s || "").match(/__openDog\(['"]([^'"]+)['"]\)/);
      return m ? m[1] : "";
    } catch {
      return "";
    }
  }

  function enhance() {
    try {
      injectCSS();
      const byId = photoMap();

      // Look inside Dogs view if it exists; otherwise scan whole doc (safe fallback)
      const scope = document.getElementById("viewDogs") || document.body;

      // Find anything with onclick containing __openDog(
      const nodes = Array.from(scope.querySelectorAll("[onclick]"))
        .filter(el => String(el.getAttribute("onclick") || "").includes("__openDog("));

      nodes.forEach(openEl => {
        if (openEl._rcThumbDone) return;

        const oc = openEl.getAttribute("onclick") || "";
        const dogId = dogIdFromOnclick(oc);
        const src = dogId ? (byId.get(String(dogId)) || "") : "";

        // Wrap open element so we can place thumb beside it without breaking layout
        const wrap = document.createElement("span");
        wrap.className = "rc-openwrap";

        const thumb = mkThumb(src);
        thumb.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openEl.click();
        });

        // Insert wrapper in DOM
        const parent = openEl.parentNode;
        if (!parent) return;

        parent.insertBefore(wrap, openEl);
        wrap.appendChild(thumb);
        wrap.appendChild(openEl);

        // Hide original open label/button if it’s a visible button/link
        try { openEl.style.display = "none"; } catch {}

        // But keep the click target by cloning a hidden click proxy inside wrap
        const proxy = document.createElement("button");
        proxy.textContent = "Open";
        proxy.style.display = "none";
        proxy.addEventListener("click", () => openEl.click());
        wrap.appendChild(proxy);

        // Clicking the thumbnail should be the main path; also allow clicking wrapper
        wrap.addEventListener("click", (e) => {
          // avoid double triggers if click was on the thumb already
          if (e.target === thumb) return;
          openEl.click();
        });

        openEl._rcThumbDone = true;
      });
    } catch {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhance();
    // Keep enhancing as lists change (filters etc.)
    setInterval(enhance, 1200);
  });
})();
