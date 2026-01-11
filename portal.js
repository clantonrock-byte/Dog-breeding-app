// === Combined Dogs Patch ===
// 1) Dog list: profile photo thumbnail + clickable route pill (auto-detect route field)
// 2) Dog profile: "View all" shows all active dogs + closes profile modal/panel if present
//
// How to apply:
// - Merge into your existing portal.js (recommended) OR replace portal.js if you already use our patch versions.
// - Ensure renderDogs() is called from your Dogs view and that _openDog(dogId) exists.

const DOG_KEY = window.DOG_KEY || "breederPro_dogs_store_v3";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function loadDogsStore() {
  try {
    const raw = localStorage.getItem(DOG_KEY);
    return raw ? JSON.parse(raw) : { dogs: [] };
  } catch {
    return { dogs: [] };
  }
}

function ensureDog(d) {
  if (!d) return d;
  d.immunizationEvents ||= [];
  d.microchip ||= { value: "", locked: false, lockedAt: null };
  if (typeof d.photoDataUrl !== "string") d.photoDataUrl = "";
  return d;
}

function getDogPhotoUrl(d) {
  return typeof d?.photoDataUrl === "string" ? d.photoDataUrl.trim() : "";
}

function isPrintableScalar(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0 && v.length <= 80;
  if (typeof v === "number") return Number.isFinite(v);
  return false;
}

function detectRouteKey(dogs) {
  if (window.__routeKeyDetected) return window.__routeKeyDetected;

  const sample = (dogs || []).slice(0, 200);
  const counts = new Map();

  for (const d of sample) {
    if (!d || typeof d !== "object") continue;

    for (const [key, val] of Object.entries(d)) {
      if (!isPrintableScalar(val)) continue;

      const kl = key.toLowerCase();
      let score = 0;

      if (/(route|truck|run|pen|kennel|location|stall|area|zone)/.test(kl)) score += 5;
      if (/(name|note|status|breed|sex|dob|id|photo)/.test(kl)) score -= 2;

      const s = String(val).trim();
      if (s.length >= 2 && s.length <= 24) score += 1;

      counts.set(key, (counts.get(key) || 0) + score);
    }
  }

  let bestKey = "";
  let bestScore = 0;
  for (const [k, sc] of counts.entries()) {
    if (sc > bestScore) {
      bestScore = sc;
      bestKey = k;
    }
  }

  window.__routeKeyDetected = bestScore > 0 ? bestKey : "";
  return window.__routeKeyDetected;
}

function getDogRoute(d, routeKey) {
  if (!d || typeof d !== "object") return "";

  if (routeKey && isPrintableScalar(d[routeKey])) return String(d[routeKey]).trim();

  const candidates = [
    d.route,
    d.routeName,
    d.currentRoute,
    d.location,
    d.kennel,
    d.pen,
    d.run,
  ];

  for (const c of candidates) {
    if (isPrintableScalar(c)) return String(c).trim();
  }
  return "";
}

/**
 * Default route click behavior: filter dog list by route.
 * You can replace this with navigation to your Routes view later.
 */
function openRoute(route) {
  const r = String(route || "").trim();
  if (!r) return;

  window.dogsRouteFilter = r;
  if (typeof _go === "function") _go("Dogs");
  if (typeof renderDogs === "function") renderDogs();
}

function clearRouteFilter() {
  window.dogsRouteFilter = "";
  if (typeof renderDogs === "function") renderDogs();
}

/**
 * Close dog profile panel/modal if present.
 * Safe no-op if your UI uses different IDs.
 */
function closeDogProfileUI() {
  const dialogIds = ["dlgDog", "dlgDogProfile", "dlgDogDetail", "dlgDogView"];
  for (const id of dialogIds) {
    const el = document.getElementById(id);
    if (el && typeof el.close === "function") {
      try { el.close(); } catch {}
    }
  }

  const hideIds = ["dogProfileWrap", "dogDetailWrap", "dogPageWrap", "dogViewWrap"];
  for (const id of hideIds) {
    const el = document.getElementById(id);
    if (el && el.classList) {
      try { el.classList.add("hide"); } catch {}
    }
  }
}

/**
 * "View all" on dog profile:
 * - shows all active dogs (archived already excluded in renderDogs)
 * - resets view/filter state
 * - closes profile UI if still open
 */
function viewAllActiveDogs() {
  window.dogsViewMode = "All";
  window.dogsRouteFilter = "";

  closeDogProfileUI();

  if (typeof _go === "function") _go("Dogs");
  if (typeof renderDogs === "function") renderDogs();

  try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
}

/**
 * Robust binding: works even if button is injected after view switch.
 */
function bindViewAllDogsButton() {
  const btn =
    document.getElementById("btnViewAllDogs") ||
    document.getElementById("btnViewAll") ||
    document.getElementById("btnViewAllActiveDogs") ||
    document.querySelector('[data-action="view-all-dogs"]');

  if (!btn || btn._viewAllBound) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    viewAllActiveDogs();
  });

  btn._viewAllBound = true;
}

/**
 * Dog list renderer (active dogs only):
 * - thumbnail from photoDataUrl
 * - no Open button
 * - clickable route pill
 *
 * Requirements in your app:
 * - #dogsList exists
 * - _openDog(dogId) exists
 * - sexCategory() exists if you use dogsViewMode filters
 */
function renderDogs() {
  const store = loadDogsStore();
  const all = (store.dogs || []).map(ensureDog);

  let list = all.filter((d) => !d.archived);

  if (window.dogsViewMode === "Males") list = list.filter((d) => sexCategory(d.sex) === "male");
  if (window.dogsViewMode === "Females") list = list.filter((d) => sexCategory(d.sex) === "female");
  if (window.dogsViewMode === "Unassigned") list = list.filter((d) => sexCategory(d.sex) === "unknown");

  const routeKey = detectRouteKey(all);

  const rf = String(window.dogsRouteFilter || "").trim();
  if (rf) {
    list = list.filter((d) => getDogRoute(d, routeKey).toLowerCase() === rf.toLowerCase());
  }

  if (typeof sortDogsIntactFirst === "function") list.sort(sortDogsIntactFirst);

  const container = document.getElementById("dogsList");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="muted small">
        No dogs found.${rf ? ` <button class="route-pill" onclick="clearRouteFilter()">Clear route filter</button>` : ""}
      </div>`;
    return;
  }

  container.innerHTML = list.map((d) => {
    const photo = getDogPhotoUrl(d);
    const route = getDogRoute(d, routeKey);

    const thumbHtml = photo
      ? `<img class="dog-thumb" src="${esc(photo)}" alt="Photo of ${esc(d.callName || "dog")}" />`
      : `<div class="dog-thumb placeholder" aria-label="No photo"></div>`;

    const routeHtml = route
      ? `<button class="route-pill" type="button"
          onclick="event.stopPropagation(); openRoute(${JSON.stringify(route)})"
          title="Filter by route: ${esc(route)}">${esc(route)}</button>`
      : `<span class="route-pill is-empty" title="No route set">No route</span>`;

    return `
      <div class="timeline-item dog-row" onclick="_openDog('${esc(d.dogId)}')">
        <div class="dog-row-left">${thumbHtml}</div>
        <div class="dog-row-mid">
          <div class="dog-row-title">
            <strong>${esc(d.callName || "")}</strong>
            <span class="muted small">${d.breed ? `• ${esc(d.breed)}` : ""}</span>
          </div>
          <div class="muted small">
            Sex: ${esc(d.sex || "unknown")} • Status: ${esc(d.status || "Adult")}
          </div>
        </div>
        <div class="dog-row-right">${routeHtml}</div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  bindViewAllDogsButton();
  setInterval(bindViewAllDogsButton, 800);
});
