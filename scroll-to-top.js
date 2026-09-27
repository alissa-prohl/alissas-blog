// "Nach oben" (Scroll-to-Top) Button Funktionalität
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scroll-to-top");
  if (!btn) return;

  const toggleVisibility = () => {
    if (window.scrollY > 250) {
      btn.classList.remove("opacity-0", "pointer-events-none", "translate-y-4");
      btn.classList.add("opacity-100", "pointer-events-auto", "translate-y-0");
    } else {
      btn.classList.remove("opacity-100", "pointer-events-auto", "translate-y-0");
      btn.classList.add("opacity-0", "pointer-events-none", "translate-y-4");
    }
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
