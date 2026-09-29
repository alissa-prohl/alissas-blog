/**
 * Session & Inactivity Controller für Alissas Blog
 * ================================================
 * - Automatischer Logout nach 1 Stunde Inaktivität
 * - Drosselung der Schreibzugriffe auf localStorage (alle 15 Sek.)
 * - Tab-übergreifende Synchronisation via storage-Events
 * - Sicheres Abmelden zur login.html ohne 404-Fehler
 */
(function () {
  var TIMEOUT_MS = 60 * 60 * 1000; // 1 Stunde = 3.600.000 ms
  var KEY_ACTIVITY = "alissas_blog_last_activity";
  var KEY_LOGGED_OUT = "alissas_blog_logged_out";
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

  function clearCookies() {
    try {
      var paths = ["/", "/alissas-blog", "/alissas-blog/"];
      var domain = window.location.hostname;
      var cookies = document.cookie.split(";");
      cookies.forEach(function (c) {
        var eqPos = c.indexOf("=");
        var name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
          paths.forEach(function (p) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" + p;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" + p + ";domain=" + domain;
          });
        }
      });
      ["session", "session_cookie", "mod_auth_form", "apache_session"].forEach(function (name) {
        paths.forEach(function (p) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" + p;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" + p + ";domain=" + domain;
        });
      });
    } catch (e) {}
  }

  function getLoginUrl(reason) {
    var isPost = window.location.pathname.indexOf("/posts/") !== -1;
    var base = isPost ? "../login.html" : "login.html";
    if (window.location.pathname.indexOf("/alissas-blog/") === 0) {
      base = "/alissas-blog/login.html";
    }
    return base + "?logout=1" + (reason === "timeout" ? "&timeout=1" : "");
  }

  function performLogout(reason) {
    safeStorageRemove(KEY_ACTIVITY);
    safeStorageSet(KEY_LOGGED_OUT, "true");
    clearCookies();
    if (reason) {
      safeSessionSet(KEY_REASON, reason);
    }
    window.location.href = getLoginUrl(reason);
  }

  function checkSession() {
    // 1. Wenn als abgemeldet markiert, direkt zur Login-Seite
    if (safeStorageGet(KEY_LOGGED_OUT) === "true") {
      performLogout();
      return;
    }

    // 2. Inaktivität prüfen
    var raw = safeStorageGet(KEY_ACTIVITY);
    if (!raw) {
      // Wenn frisch eingeloggt, Aktivität jetzt initialisieren
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

  // 1. Frühe Prüfung beim Laden
  checkSession();

  // 2. Intervallprüfung alle 15 Sekunden
  setInterval(checkSession, 15 * 1000);

  // 3. Benutzeraktionen erfassen
  var activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
  activityEvents.forEach(function (evt) {
    window.addEventListener(evt, recordActivity, { passive: true });
  });

  // 4. Tab-Wechsel / Aufwecken aus Standby prüfen
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkSession();
    }
  });
  window.addEventListener("focus", checkSession);

  // 5. Tab-übergreifende Synchronisation:
  // Wenn ein anderer Tab abgemeldet wurde, sofort synchronisieren
  window.addEventListener("storage", function (e) {
    if (e.key === KEY_LOGGED_OUT && e.newValue === "true") {
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
