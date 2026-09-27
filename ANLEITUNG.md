# 📖 Anleitung: So erstellst du einen neuen Blogbeitrag

Mit dem neuen Master-Layout-System brauchst du keine HTML-Gerüste oder CSS-Klassen mehr kopieren. Du schreibst einfach deinen reinen Text in den Ordner `content/`!

---

## Schritt 1: Neue Datei anlegen
1. Öffne in VS Code den Ordner **`content/`**.
2. Klicke mit der rechten Maustaste auf **`template.html`** ➔ **Kopieren** und im selben Ordner **Einfügen** (duplizieren).
3. Benenne die neue Datei passend um (z. B. `mein-ausflug.html` oder `neuer-song.html`).
   * *Tipp: Verwende Kleinbuchstaben, Bindestriche und keine Umlaute/Leerzeichen.*

---

## Schritt 2: Titel, Datum, Kategorie & Vorschaubild eintragen
Öffne deine neue Datei in `content/`. Sie sieht in etwa so aus:

```html
<article data-category="Abenteuer" data-image="../img/mein-foto.webp">
  <time>05.09.2026</time>
  <h1>Dein Beitragstitel hier</h1>

  <p>
    Hier schreibst du deinen ersten Absatz...
  </p>
</article>
```

Passe die Angaben oben an:
1. **`data-category="..."`**: Wähle genau eine der drei Kategorien:
   * `Abenteuer`
   * `Musik`
   * `Projekte`
2. **`data-image="..."`** *(optional)*:
   * Bestimmt das **Vorschaubild (Cover)** für die Startseite und die Kategorieseite (z. B. `data-image="../img/mein-foto.webp"`).
   * Wenn du es weglässt, nimmt das System automatisch das allererste `<img>`, das im Text vorkommt!
3. **`<time>TT.MM.JJJJ</time>`**: Trage das Datum ein (z. B. `<time>15.08.2026</time>`).
   * *Danach werden deine Beiträge automatisch von neu nach alt sortiert!*
4. **`<h1>Dein Titel</h1>`**: Schreibe die Überschrift deines Beitrags.
   * *Dieser Titel wird automatisch für die Seite, den Browsertab und die Vorschaukarte übernommen.*
5. **`data-draft="true"`** *(optional - Entwurf verstecken)*:
   * Wenn du noch an einem Beitrag schreibst und ihn noch **nicht** veröffentlichen willst:
     ```html
     <article data-category="Abenteuer" data-draft="true">
     ```
   * **Alternativ:** Benenne die Datei einfach mit einem Unterstrich am Anfang (z. B. `content/_mein-ausflug.html`).
   * **Der Clou:** Solange ein Beitrag als Entwurf markiert ist (oder mit `_` beginnt), wird er beim Bauen der Website komplett übersprungen. Du kannst nach Herzenslust `npm run build` und `git push` machen – niemand sieht den unfertigen Beitrag, bis du `data-draft="true"` (oder den Unterstrich) entfernst!

---

## Schritt 3: Text & Fotos einfügen

### Fließtext
Schreibe deine Texte einfach in `<p>`-Tags:
```html
<p>
  Hier steht dein Text. Blocksatz, Zeilenabstand und automatische Silbentrennung
  werden ganz automatisch angewendet – du brauchst keine Klassen!
</p>
```
* *Hinweis: Der erste Absatz wird automatisch als kurzer Vorschautext auf der Startseite genutzt.*

### Einzelne Fotos einbinden
1. Lege deine Bilddateien (JPG oder PNG) in den Ordner **`img/`** (du kannst dort auch Unterordner wie `img/MeinAusflug/` anlegen).
2. Binde das Bild im HTML ein:
```html
<img src="../img/mein-foto.webp" />
```
* *Das Bild wird automatisch zentriert, abgerundet und bekommt einen sanften Schatten.*
* *Alle Bilder sind automatisch **anklickbar** und öffnen sich im Vollbild (Lightbox)!*

### Foto-Raster (Mehrere Bilder nebeneinander)
Wenn du mehrere Schnappschüsse nebeneinander zeigen willst, packe sie einfach in ein Raster:

* **2 Fotos nebeneinander:**
  ```html
  <div class="grid-2">
    <img src="../img/foto1.webp" />
    <img src="../img/foto2.webp" />
  </div>
  ```

* **3 Fotos nebeneinander:**
  ```html
  <div class="grid-3">
    <img src="../img/foto1.webp" />
    <img src="../img/foto2.webp" />
    <img src="../img/foto3.webp" />
  </div>
  ```

* **4 Fotos nebeneinander (z. B. für viele Schnappschüsse wie 4×4):**
  ```html
  <div class="grid-4">
    <img src="../img/foto1.webp" />
    <img src="../img/foto2.webp" />
    ...
  </div>
  ```

### Videos einbinden (mit Autoplay bei Sichtbarkeit & Klick-Ton)
Videos starten automatisch stumm, sobald man im Browser zu ihnen scrollt. Durch Klicken oder Antippen auf das Video oder den Button wird der Ton an- oder ausgeschaltet:

```html
<div class="relative group my-6 overflow-hidden rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 bg-black max-w-2xl mx-auto">
  <video
    loop
    muted
    playsinline
    preload="metadata"
    class="w-full h-auto block rounded-lg cursor-pointer"
    title="Klicken oder tippen, um Ton an- oder auszuschalten"
  >
    <source src="../img/mein-ordner/video.mp4" type="video/mp4" />
    Dein Browser unterstützt dieses Video leider nicht.
  </video>

  <!-- Ton an/aus Button -->
  <button
    type="button"
    data-sound-btn
    onclick="toggleVideoSound(this)"
    class="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-sans px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs transition-all duration-200 cursor-pointer shadow-md select-none border border-white/20 active:scale-95 z-10"
    aria-label="Ton an- oder ausschalten"
  >
    <svg data-icon-muted class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
    <svg data-icon-sound class="w-4 h-4 text-emerald-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
    <span data-sound-text>Ton an</span>
  </button>
</div>
```

---

## Schritt 4: Veröffentlichen (Build ausführen)
Sobald du deine Datei in `content/` gespeichert hast (`Cmd + S`), öffne das Terminal in VS Code und führe diesen Befehl aus:

```bash
npm run build
```

### Was passiert jetzt vollautomatisch?
1. **Bilder optimieren & aufräumen:** Neue Fotos (`.jpg`, `.png`, `.heic`) und Videos (`.mov`) in `img/` werden blitzschnell in schlanke `.webp`-Dateien (und `.mp4`-Videos) umgewandelt. Sobald das Web-Bild fertig ist, wird die schwere Originaldatei im Blog automatisch gelöscht – dein Blog bleibt dauerhaft winzig klein!
2. **Webseite bauen:** Dein Text wird in das Master-Layout mit Header, Bergen, Navigation und Footer eingesetzt und als fertige Seite in `posts/` abgelegt.
3. **Übersichtsseite aktualisieren:** Dein Beitrag landet automatisch als schicke Vorschaukarte in der richtigen Kategorie (`adventures.html`, `music.html` oder `projects.html`).
4. **Startseite aktualisieren:** Falls es dein neuester Beitrag ist, wird er direkt als Top-Highlight auf `index.html` eingebunden.

---

## Schritt 5: Online stellen (GitHub Pages)
Wenn du mit dem Ergebnis zufrieden bist, lädst du deine Änderungen zu GitHub hoch:

```bash
git add .
git commit -m "Neuer Blogbeitrag: Mein Ausflug"
git push
```

Nach etwa einer Minute ist dein neuer Beitrag live im Internet für jeden sichtbar! 🎉
