/**
 * Session & Inactivity Controller für Alissas Blog
 * ================================================
 * - Automatischer Logout nach 1 Stunde Inaktivität
 * - Drosselung der Schreibzugriffe auf localStorage (alle 15 Sek.)
 * - Tab-übergreifende Synchronisation via storage-Events
 * - Dezentes Abmelden über [data-action="logout"]
 */
(function () {
  var TIMEOUT_MS = 60 * 60 * 1000; // 1 Stunde = 3.600.000 ms
  var KEY_ACTIVITY = "alissas_blog_last_activity";
  var KEY_REASON = "alissas_blog_logout_reason";
  var THROTTLE_MS = 15 * 1000; // Höchstens alle 15 Sekunden localStorage aktualisieren
  var lastWrite = 0;

  function safeStorageGet(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  }

  function safeStorageRemove(key) {
    try {
      if (window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  }

  function safeSessionSet(key, value) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {}
  }

  function performLogout(reason) {
    safeStorageRemove(KEY_ACTIVITY);
    if (reason) {
      safeSessionSet(KEY_REASON, reason);
    }

    // Wenn auf dem Server unter /alissas-blog/ gehostet, Apache-Logout ansteuern:
    if (window.location.pathname.indexOf("/alissas-blog/") === 0) {
      window.location.href = "/alissas-blog/dologout" + (reason ? "?reason=" + encodeURIComponent(reason) : "");
    } else {
      // Lokale Entwicklung / Test-Fallback
      var isPost = window.location.pathname.indexOf("/posts/") !== -1;
      var target = (isPost ? "../login.html" : "login.html") + "?logout=1" + (reason === "timeout" ? "&timeout=1" : "");
      window.location.href = target;
    }
  }

  function checkInactivity() {
    var raw = safeStorageGet(KEY_ACTIVITY);
    if (!raw) {
      // Falls noch keine Aktivität erfasst wurde, jetzt initialisieren
      var now = Date.now();
      safeStorageSet(KEY_ACTIVITY, String(now));
      lastWrite = now;
      return;
    }

    var lastActivity = parseInt(raw, 10);
    if (isNaN(lastActivity)) {
      safeStorageSet(KEY_ACTIVITY, String(Date.now()));
      return;
    }

    if (Date.now() - lastActivity > TIMEOUT_MS) {
      performLogout("timeout");
    }
  }

  function recordActivity() {
    var now = Date.now();
    if (now - lastWrite > THROTTLE_MS) {
      lastWrite = now;
      safeStorageSet(KEY_ACTIVITY, String(now));
    }
  }

  // 1. Frühe Prüfung beim Seitenladen
  checkInactivity();

  // 2. Intervallprüfung alle 15 Sekunden
  setInterval(checkInactivity, 15 * 1000);

  // 3. Aktivität bei Benutzerinteraktionen erfassen
  var activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
  activityEvents.forEach(function (evt) {
    window.addEventListener(evt, recordActivity, { passive: true });
  });

  // 4. Tab-Wechsel / Aufwecken aus Standby prüfen
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkInactivity();
    }
  });
  window.addEventListener("focus", checkInactivity);

  // 5. Tab-übergreifende Synchronisation:
  // Wenn ein anderer Tab abgemeldet wurde, sofort synchronisieren
  window.addEventListener("storage", function (e) {
    if (e.key === KEY_ACTIVITY && e.newValue === null) {
      // Aktivität wurde in einem anderen Tab gelöscht -> ebenfalls weiterleiten
      performLogout();
    }
  });

  // 6. Klicks auf Abmelde-Links abfangen
  document.addEventListener("click", function (e) {
    var logoutLink = e.target.closest && e.target.closest('[data-action="logout"]');
    if (logoutLink) {
      e.preventDefault();
      performLogout();
    }
  });
})();
