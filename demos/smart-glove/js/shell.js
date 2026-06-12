(function () {
  "use strict";

  function getPanels() {
    return document.querySelectorAll(".app-panel[data-panel]");
  }

  function getTriggers() {
    return document.querySelectorAll("[data-panel-target]");
  }

  function showPanel(id) {
    const panels = getPanels();
    const triggers = getTriggers();
    if (!panels.length) return;

    let found = false;
    panels.forEach((el) => {
      const match = el.dataset.panel === id;
      if (match) found = true;
      el.classList.toggle("is-active", match);
      if (match) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
      el.setAttribute("aria-hidden", match ? "false" : "true");
    });

    if (!found) {
      const first = panels[0];
      id = first.dataset.panel;
      panels.forEach((el) => {
        const match = el === first;
        el.classList.toggle("is-active", match);
        if (match) el.removeAttribute("hidden");
        else el.setAttribute("hidden", "");
        el.setAttribute("aria-hidden", match ? "false" : "true");
      });
    }

    triggers.forEach((btn) => {
      const match = btn.dataset.panelTarget === id;
      btn.classList.toggle("is-active", match);
      if (btn.tagName === "BUTTON") {
        btn.setAttribute("aria-pressed", match ? "true" : "false");
      }
    });

    const h = `#${id}`;
    if (location.hash !== h) {
      history.replaceState(null, "", h);
    }
  }

  function init() {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;

    getTriggers().forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = el.dataset.panelTarget;
        if (!id) return;
        if (el.tagName === "A" && el.getAttribute("href")?.startsWith("#")) {
          e.preventDefault();
        }
        showPanel(id);
      });
    });

    window.addEventListener("hashchange", () => {
      const id = location.hash.slice(1);
      const valid = [...getPanels()].some((p) => p.dataset.panel === id);
      if (valid) showPanel(id);
    });

    const id = location.hash.slice(1);
    const valid = [...getPanels()].some((p) => p.dataset.panel === id);
    showPanel(valid ? id : getPanels()[0]?.dataset.panel || "overview");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
