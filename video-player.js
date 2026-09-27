// Video-Player: Autoplay beim Hineinscrollen, Stopp beim Wegscrollen & Klick-Ton-Umschaltung
function toggleVideoSound(triggerEl) {
  let video, container;

  if (triggerEl instanceof HTMLVideoElement) {
    video = triggerEl;
    container = video.closest(".video-container, .group, div") || video.parentElement;
  } else if (triggerEl instanceof HTMLElement) {
    container = triggerEl.closest(".video-container, .group, div") || triggerEl.parentElement;
    video = container ? container.querySelector("video") : null;
  }

  if (!video) {
    video = document.querySelector("article video");
    container = video ? (video.closest(".video-container, .group, div") || video.parentElement) : null;
  }
  if (!video) return;

  const btn = container ? container.querySelector("button[data-sound-btn], #sound-toggle-btn, button") : document.getElementById("sound-toggle-btn");
  const btnText = container ? container.querySelector("[data-sound-text], #sound-btn-text") : document.getElementById("sound-btn-text");
  const iconMuted = container ? container.querySelector("[data-icon-muted], #icon-muted") : document.getElementById("icon-muted");
  const iconSound = container ? container.querySelector("[data-icon-sound], #icon-sound") : document.getElementById("icon-sound");

  if (video.paused) {
    video.play().catch(() => {});
  }

  if (video.muted) {
    video.muted = false;
    video.volume = 1.0;
    if (btnText) btnText.textContent = "Ton aus";
    if (btn) btn.setAttribute("aria-label", "Ton ausschalten");
    if (iconMuted) iconMuted.classList.add("hidden");
    if (iconSound) iconSound.classList.remove("hidden");
  } else {
    video.muted = true;
    if (btnText) btnText.textContent = "Ton an";
    if (btn) btn.setAttribute("aria-label", "Ton einschalten");
    if (iconMuted) iconMuted.classList.remove("hidden");
    if (iconSound) iconSound.classList.add("hidden");
  }
}

// Global verfügbar machen
window.toggleVideoSound = toggleVideoSound;

function initBlogVideoPlayers() {
  const videos = document.querySelectorAll("article video");
  if (!videos.length) return;

  // Schwellenwerte für feinstufige Erkennung des Sichtbarkeitsgrads
  const thresholds = [0, 0.05, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        // Wenn das Video zu mind. 35% im Blickfeld ist -> automatisch abspielen
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        }
        // Sobald das Video nicht mehr im Fokus ist (< 15% sichtbar oder außerhalb) -> pausieren
        else if (!entry.isIntersecting || entry.intersectionRatio < 0.15) {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    },
    {
      threshold: thresholds,
    }
  );

  // Schnelles Scroll-Monitoring für sofortigen Stopp beim Verlassen des Viewports
  let scrollTicking = false;
  const onScroll = () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        videos.forEach((video) => {
          const rect = video.getBoundingClientRect();
          // Liegt das Video komplett oberhalb oder unterhalb des Bildschirms?
          const isOffscreen = rect.bottom <= 20 || rect.top >= windowHeight - 20;
          if (isOffscreen && !video.paused) {
            video.pause();
          }
        });
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  // Tab gewechselt / minimiert -> Videos pausieren
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      videos.forEach((v) => {
        if (!v.paused) v.pause();
      });
    }
  });

  videos.forEach((video) => {
    // Initialzustand: stummgeschaltet und kein natives Autoplay-Flag im HTML
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.removeAttribute("autoplay");

    // Klick / Tipp auf das Video schaltet den Ton an/aus
    if (!video.hasAttribute("onclick")) {
      video.addEventListener("click", () => {
        toggleVideoSound(video);
      });
    }

    observer.observe(video);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBlogVideoPlayers);
} else {
  initBlogVideoPlayers();
}
