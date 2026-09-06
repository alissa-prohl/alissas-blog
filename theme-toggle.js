// Theme Toggle (Dark Mode / Light Mode)
// 1. Frühe Prüfung beim Seitenladen: Verhindert weißes Aufflackern
if (
  localStorage.getItem("theme") === "dark" ||
  (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// 2. Klick-Event für Theme-Toggle Button
function attachThemeToggle() {
  const toggleBtns = document.querySelectorAll("#theme-toggle");
  if (!toggleBtns.length) return;

  toggleBtns.forEach((btn) => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = "true";

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachThemeToggle);
} else {
  attachThemeToggle();
}