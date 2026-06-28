# update_data.py

Automatisches Update-Script für die Baumdaten. Lädt frische Daten vom WFS der Stadt Zürich, vergleicht sie mit der aktuellen Version und pusht Änderungen auf GitHub. Gedacht für einen Raspberry Pi als Cronjob.

## Voraussetzungen

- Python 3.7+
- Git (mit SSH-Key oder gespeichertem HTTPS-Token für GitHub)
- Internetzugang zum WFS-Endpunkt der Stadt Zürich

Keine externen Python-Pakete nötig — nur Standardbibliothek.

## Einrichtung

**1. Repo klonen (einmalig)**
```bash
git clone https://github.com/kthrnkppn/trees-zurich.git
cd trees-zurich
```

**2. HC-URL konfigurieren (optional aber empfohlen)**

Kopiere die Beispieldatei und trage deine [healthchecks.io](https://healthchecks.io) Ping-URL ein:
```bash
cp scripts/.env.example scripts/.env
nano scripts/.env
```

Alternativ kannst du die URL auch direkt als Umgebungsvariable im Crontab setzen (siehe unten). Wenn keine URL konfiguriert ist, läuft das Script trotzdem — nur ohne Benachrichtigungen.

**3. Manuell testen**
```bash
python3 scripts/update_data.py
```

Das Script loggt alles nach `scripts/update.log` und auf stdout.

## Als Cronjob einrichten

```bash
crontab -e
```

Beispiel: jeden Sonntag um 03:00 Uhr ausführen:
```
0 3 * * 0 /usr/bin/python3 /home/pi/trees-zurich/scripts/update_data.py
```

Mit HC-URL als Umgebungsvariable (Alternative zu .env):
```
0 3 * * 0 HC_URL=https://hc-ping.com/deine-uuid /usr/bin/python3 /home/pi/trees-zurich/scripts/update_data.py
```

## Was das Script tut

1. **`/start`-Ping** an healthchecks.io
2. **Download** der aktuellen Baumdaten vom WFS der Stadt Zürich (~19 MB)
3. **Verarbeitung**: kürzt auf 5 Felder, rundet Koordinaten auf 5 Dezimalstellen
4. **Hash-Vergleich**: berechnet einen kanonischen SHA-256-Hash (sortiert, stabil) und vergleicht mit dem letzten bekannten Hash in `scripts/.last_hash`
5. **Keine Änderung** → OK-Ping, fertig
6. **Änderung erkannt** → `trees.geojson` schreiben, `treeMeta.js` prüfen und ggf. neu generieren
7. **`git pull`** (Fast-Forward) um lokale Konflikte zu vermeiden
8. **Commit & Push** nach `origin/main` → GitHub Pages aktualisiert sich automatisch
9. **OK-Ping** bei Erfolg, **`/fail`-Ping** bei jedem Fehler

## Lokale Dateien (nicht im Repo)

| Datei | Zweck |
|-------|-------|
| `scripts/.env` | HC-URL (aus `.gitignore`) |
| `scripts/.last_hash` | Hash des letzten bekannten Datenstands |
| `scripts/update.log` | Logfile aller Läufe |

## Daten manuell erzwingen

Wenn du ein Update erzwingen willst ohne auf eine Datenänderung zu warten (z.B. nach Code-Änderungen am Script), lösche einfach `.last_hash`:
```bash
rm scripts/.last_hash
python3 scripts/update_data.py
```
