// Theme & Seasons Controller (Dark Mode & Astronomische Jahreszeiten)
// ====================================================================

function getAstronomicalSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1 - 12
  const day = date.getDate();

  // 1. Weihnachten: 1. Dezember bis einschließlich 25. Dezember (Winterlook + Rentiere im Dark Mode)
  if (month === 12 && day >= 1 && day <= 25) {
    return "christmas";
  }

  // 2. Winter (Astronomisch): 26. Dezember bis 19. März (Frühlingsäquinoktium am 20. März)
  if ((month === 12 && day >= 26) || month === 1 || month === 2 || (month === 3 && day < 20)) {
    return "winter";
  }

  // 3. Herbst (Astronomisch): 23. September (Herbstäquinoktium) bis 30. November
  if ((month === 9 && day >= 23) || month === 10 || month === 11) {
    return "autumn";
  }

  // 4. Frühling & Sommer (Astronomisch): 20. März bis 22. September (Standard Alpengrün)
  return "standard";
}

// Abwärtskompatibilität falls woanders referenziert
const getMeteorologicalSeason = getAstronomicalSeason;

// 1. Frühe Prüfung beim Seitenladen: Verhindert jegliches Aufflackern
(function () {
  // --- Dark Mode ---
  if (
    localStorage.getItem("theme") === "dark" ||
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // --- Jahreszeit: Bei Reload auf astronomisch zurücksetzen, in der Session merken ---
  try {
    const navEntry = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType("navigation")[0];
    if (navEntry && navEntry.type === "reload") {
      sessionStorage.removeItem("season");
    }
  } catch (e) {}

  const activeSeason = sessionStorage.getItem("season") || getAstronomicalSeason();

  document.documentElement.classList.remove("spring", "summer", "autumn", "christmas", "winter", "standard");
  if (activeSeason === "autumn" || activeSeason === "winter" || activeSeason === "christmas") {
    document.documentElement.classList.add(activeSeason);
  }
})();

// 2. Toggles & Menüs aktivieren, sobald DOM bereit ist
function initToggles() {
  // --- Dark Mode Button ---
  const themeBtns = document.querySelectorAll("#theme-toggle");
  themeBtns.forEach((btn) => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = "true";

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  });

  // --- Jahreszeiten-Auswahl (Dropup Menü im Footer der Startseite) ---
  const seasonMenuBtn = document.getElementById("season-menu-btn");
  const seasonDropdown = document.getElementById("season-menu-dropdown");
  const seasonPickerContainer = document.getElementById("season-picker-container");
  const seasonIcon = document.getElementById("season-menu-icon");
  const seasonLabel = document.getElementById("season-menu-label");
  const seasonArrow = document.getElementById("season-menu-arrow");

  const seasonMeta = {
    standard: { icon: "🌱", label: "Standard" },
    autumn: { icon: "🍂", label: "Herbst" },
    christmas: { icon: "🎄", label: "Weihnachten" },
    winter: { icon: "❄️", label: "Winter" }
  };

  function updateSeasonUI(currentSeason) {
    const meta = seasonMeta[currentSeason] || seasonMeta.standard;

    // Trigger Button aktualisieren
    if (seasonIcon) seasonIcon.textContent = meta.icon;
    if (seasonLabel) seasonLabel.textContent = meta.label;

    // Optionen im Dropdown hervorheben
    document.querySelectorAll("[data-season-btn]").forEach((btn) => {
      const s = btn.getAttribute("data-season-btn");
      const isSelected = s === currentSeason;
      const checkEl = btn.querySelector(".season-check");

      if (isSelected) {
        btn.classList.add("bg-slate-100", "dark:bg-slate-700/80", "font-semibold");
        if (checkEl) checkEl.classList.remove("hidden");
      } else {
        btn.classList.remove("bg-slate-100", "dark:bg-slate-700/80", "font-semibold");
        if (checkEl) checkEl.classList.add("hidden");
      }
    });
  }

  function setSeason(season) {
    document.documentElement.classList.remove("spring", "summer", "autumn", "christmas", "winter", "standard");
    if (season === "autumn" || season === "winter" || season === "christmas") {
      document.documentElement.classList.add(season);
    }
    sessionStorage.setItem("season", season);
    updateSeasonUI(season);
    closeDropdown();
  }

  function toggleDropdown() {
    if (!seasonDropdown) return;
    const isHidden = seasonDropdown.classList.contains("hidden");
    if (isHidden) {
      openDropdown();
    } else {
      closeDropdown();
    }
  }

  function openDropdown() {
    if (!seasonDropdown) return;
    seasonDropdown.classList.remove("hidden");
    if (seasonMenuBtn) seasonMenuBtn.setAttribute("aria-expanded", "true");
    if (seasonArrow) seasonArrow.classList.add("rotate-180");
  }

  function closeDropdown() {
    if (!seasonDropdown) return;
    seasonDropdown.classList.add("hidden");
    if (seasonMenuBtn) seasonMenuBtn.setAttribute("aria-expanded", "false");
    if (seasonArrow) seasonArrow.classList.remove("rotate-180");
  }

  if (seasonMenuBtn) {
    seasonMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  // Klick auf eine Jahreszeit
  document.querySelectorAll("[data-season-btn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const s = btn.getAttribute("data-season-btn");
      setSeason(s);
    });
  });

  // Klick außerhalb schließt das Dropdown
  document.addEventListener("click", (e) => {
    if (seasonPickerContainer && !seasonPickerContainer.contains(e.target)) {
      closeDropdown();
    }
  });

  // ESC schließt das Dropdown
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  });

  // Initiale Markierung
  const initialSeason = sessionStorage.getItem("season") || getAstronomicalSeason();
  updateSeasonUI(initialSeason);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initToggles);
} else {
  initToggles();
}