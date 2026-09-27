// Bild-Zoom (Lightbox) für Blogbeiträge
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll("article img");
  if (!images.length) return;

  // Erstelle Modal-Element falls noch nicht vorhanden
  let modal = document.getElementById("lightbox-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "lightbox-modal";
    modal.className =
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300 cursor-zoom-out";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <button
        id="lightbox-close"
        aria-label="Schließen"
        class="absolute top-4 right-4 text-white/80 hover:text-white p-2 text-2xl font-bold transition-colors cursor-pointer"
      >
        ✕
      </button>
      <img
        id="lightbox-img"
        src=""
        alt=""
        class="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl object-contain transition-transform duration-300 scale-95 select-none"
      />
      <p id="lightbox-caption" class="text-white/80 text-sm mt-3 text-center max-w-md font-mono"></p>
    `;
    document.body.appendChild(modal);
  }

  const lightboxImg = modal.querySelector("#lightbox-img");
  const lightboxCaption = modal.querySelector("#lightbox-caption");
  const closeBtn = modal.querySelector("#lightbox-close");

  const openLightbox = (img) => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || "";
    if (img.alt && !img.alt.toLowerCase().includes("bildbeschreibung")) {
      lightboxCaption.textContent = img.alt;
      lightboxCaption.classList.remove("hidden");
    } else {
      lightboxCaption.textContent = "";
      lightboxCaption.classList.add("hidden");
    }

    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.classList.add("opacity-100", "pointer-events-auto");
    lightboxImg.classList.remove("scale-95");
    lightboxImg.classList.add("scale-100");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    modal.classList.remove("opacity-100", "pointer-events-auto");
    modal.classList.add("opacity-0", "pointer-events-none");
    lightboxImg.classList.remove("scale-100");
    lightboxImg.classList.add("scale-95");
    document.body.style.overflow = "";
  };

  images.forEach((img) => {
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(img);
    });
  });

  // Schließen bei Klick ins Modal oder auf Schließen-Button
  modal.addEventListener("click", closeLightbox);
  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }

  // Schließen bei Escape-Taste
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("opacity-0")) {
      closeLightbox();
    }
  });
});
