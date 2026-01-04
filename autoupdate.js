// Breeder Pro auto-update watcher
(() => {
  const BUILD_URL = "./build.json";
  const CHECK_EVERY_MS = 45000;
  const COUNTDOWN_MS = 5000;

  function ensureOverlay() {
    let el = document.getElementById("bpUpdateOverlay");
    if (el) return el;
    el = document.createElement("div");
    el.id = "bpUpdateOverlay";
    el.style.position = "fixed";
    el.style.left = "12px";
    el.style.right = "12px";
    el.style.bottom = "12px";
    el.style.zIndex = "9999";
    el.style.background = "#fff";
    el.style.border = "1px solid #ddd";
    el.style.borderRadius = "12px";
    el.style.padding = "12px";
    el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu";
    el.style.display = "none";

    const title = document.createElement("div");
    title.style.fontWeight = "800";
    title.textContent = "New version available";

    const msg = document.createElement("div");
    msg.id = "bpUpdateMsg";
    msg.style.marginTop = "6px";
    msg.style.fontSize = "13px";
    msg.style.color = "#444";

    el.appendChild(title);
    el.appendChild(msg);
    document.body.appendChild(el);
    return el;
  }

  async function fetchBuild() {
    const res = await fetch(`${BUILD_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("build.json fetch failed");
    return await res.json();
  }

  let current = null;
  let timer = null;

  async function check() {
    try {
      const b = await fetchBuild();
      if (!current) {
        current = b;
        const buildId = document.getElementById("buildId");
        if (buildId && (b.build || b.sha)) {
          buildId.textContent = `• Build ${b.build || ""}`.trim();
        }
        return;
      }
      const changed =
        (b.sha && current.sha && b.sha !== current.sha) ||
        (b.build && current.build && String(b.build) !== String(current.build));

      if (!changed) return;

      const overlay = ensureOverlay();
      const msg = document.getElementById("bpUpdateMsg");
      let remaining = Math.ceil(COUNTDOWN_MS / 1000);

      overlay.style.display = "block";

      const tick = () => {
        msg.textContent = `Updating automatically in ${remaining}s...`;
        remaining -= 1;
        if (remaining < 0) {
          window.location.reload();
        } else {
          setTimeout(tick, 1000);
        }
      };
      tick();

      if (timer) clearInterval(timer);
    } catch (e) {
      // silent
    }
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await check();
    timer = setInterval(check, CHECK_EVERY_MS);
  });
})();
