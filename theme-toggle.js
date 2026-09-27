// Theme & Seasons Controller (Dark Mode & Automatische Astronomische Jahreszeiten)
// ==============================================================================

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

// Abwärtskompatibilität
const getMeteorologicalSeason = getAstronomicalSeason;

// 1. Frühe Prüfung beim Seitenladen: Verhindert jegliches Aufflackern
(function () {
  function safeLocalGet(key) {
    try {
      return window.localStorage ? localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  // --- Dark Mode ---
  const savedTheme = safeLocalGet("theme");
  if (
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // --- Automatische Astronomische Jahreszeit (ohne manuelle Buttons) ---
  const activeSeason = getAstronomicalSeason();
  document.documentElement.classList.remove("spring", "summer", "autumn", "christmas", "winter", "standard");
  if (activeSeason === "autumn" || activeSeason === "winter" || activeSeason === "christmas") {
    document.documentElement.classList.add(activeSeason);
  }
})();

// 2. Toggles aktivieren, sobald DOM bereit ist
function initToggles() {
  function safeLocalSet(key, val) {
    try {
      if (window.localStorage) localStorage.setItem(key, val);
    } catch (e) {}
  }

  // --- Dark Mode Button ---
  const themeBtns = document.querySelectorAll("#theme-toggle");
  themeBtns.forEach((btn) => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = "true";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isDark = document.documentElement.classList.toggle("dark");
      safeLocalSet("theme", isDark ? "dark" : "light");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initToggles);
} else {
  initToggles();
}