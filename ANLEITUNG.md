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
<img src="../img/mein-foto.webp" alt="Beschreibung des Fotos" />
```
* *Das Bild wird automatisch zentriert, abgerundet und bekommt einen sanften Schatten.*
* *Der Text in `alt="..."` dient als Bildunterschrift.*
* *Alle Bilder sind automatisch **anklickbar** und öffnen sich im Vollbild (Lightbox)!*

### Foto-Raster (Mehrere Bilder nebeneinander)
Wenn du mehrere Schnappschüsse nebeneinander zeigen willst, packe sie einfach in ein Raster:

* **2 Fotos nebeneinander:**
  ```html
  <div class="grid-2">
    <img src="../img/foto1.webp" alt="Foto 1" />
    <img src="../img/foto2.webp" alt="Foto 2" />
  </div>
  ```

* **3 Fotos nebeneinander:**
  ```html
  <div class="grid-3">
    <img src="../img/foto1.webp" alt="Foto 1" />
    <img src="../img/foto2.webp" alt="Foto 2" />
    <img src="../img/foto3.webp" alt="Foto 3" />
  </div>
  ```

* **4 Fotos nebeneinander (z. B. für viele Schnappschüsse wie 4×4):**
  ```html
  <div class="grid-4">
    <img src="../img/foto1.webp" alt="Foto 1" />
    <img src="../img/foto2.webp" alt="Foto 2" />
    ...
  </div>
  ```

---

## Schritt 4: Veröffentlichen (Build ausführen)
Sobald du deine Datei in `content/` gespeichert hast (`Cmd + S`), öffne das Terminal in VS Code und führe diesen Befehl aus:

```bash
npm run build
```

### Was passiert jetzt vollautomatisch?
1. **Bilder komprimieren:** Neue Fotos in `img/` werden blitzschnell in moderne, schlanke `.webp`-Dateien umgewandelt.
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
