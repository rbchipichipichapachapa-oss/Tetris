# Tetris-ähnlich (statisches Webspiel)

Dieses Repository enthält ein einfaches, tetris-ähnliches Spiel in reinem HTML/CSS/JS, das du direkt auf GitHub Pages hosten kannst.

Dateien:
- `index.html` – Einstiegspunkt
- `style.css` – Styling
- `main.js` – Spiel-Logik

Lokales Testen:
1. Öffne `index.html` in deinem Browser (doppelklick) oder starte einen einfachen lokalen Server, z.B. mit Python:

```powershell
python -m http.server 8000
```

Öffne dann `http://localhost:8000`.

Veröffentlichen auf GitHub Pages:
1. Erstelle ein neues Repository auf GitHub oder verwende dieses. Push die Dateien in den `main`-Branch.
2. In den Repository-Einstellungen (Settings) → Pages: wähle als Source `main` branch / root und speichere. GitHub baut die Seite und stellt sie unter `https://<username>.github.io/<repo>/` bereit.

Alternativ kannst du den Branch `gh-pages` verwenden und die Dateien dort pushen.

Hinweis: Dieses Spiel ist ein einfacher Prototyp. Wenn du möchtest, kann ich:
- Steuerung erweitern (Hard drop, hold)
- Mobile Touch-Unterstützung hinzufügen
- Highscore-Speicherung (localStorage)
