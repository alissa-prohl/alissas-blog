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

  // --- Jahreszeit: Immer astronomisch starten (Neuladen setzt auf aktuell zurück) ---
  localStorage.removeItem("season");
  const activeSeason = getAstronomicalSeason();

  document.documentElement.classList.remove("spring", "summer", "autumn", "christmas", "winter", "standard");
  if (activeSeason === "autumn" || activeSeason === "winter" || activeSeason === "christmas") {
    document.documentElement.classList.add(activeSeason);
  }
})();

// 2. Buttons aktivieren, sobald DOM bereit ist
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

  // --- Jahreszeiten-Buttons UI (im Footer) ---
  function updateSeasonButtonsUI(selectedSeason) {
    document.querySelectorAll("[data-season-btn]").forEach((btn) => {
      const s = btn.getAttribute("data-season-btn");
      const isSelected = s === selectedSeason;

      if (isSelected) {
        btn.className = "season-footer-btn px-2 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs font-semibold cursor-pointer whitespace-nowrap bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10";
      } else {
        btn.className = "season-footer-btn px-2 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs font-medium cursor-pointer whitespace-nowrap text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40";
      }
    });
  }

  // Manuelle Umschaltung durch den Nutzer (ohne Speichern im localStorage, damit Reload zurücksetzt)
  function setSeason(season) {
    document.documentElement.classList.remove("spring", "summer", "autumn", "christmas", "winter", "standard");
    if (season === "autumn" || season === "winter" || season === "christmas") {
      document.documentElement.classList.add(season);
    }
    updateSeasonButtonsUI(season);
  }

  // Beim Laden aktuellen Zustand (astronomisch) im Button markieren
  updateSeasonButtonsUI(getAstronomicalSeason());

  // Klick-Events binden
  document.querySelectorAll("[data-season-btn]").forEach((btn) => {
    if (btn.dataset.seasonBound) return;
    btn.dataset.seasonBound = "true";

    btn.addEventListener("click", () => {
      const s = btn.getAttribute("data-season-btn");
      setSeason(s);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initToggles);
} else {
  initToggles();
}