# Architektur & Referenz

Technische Gesamtübersicht zu **Zürichs Stadtbäume** ([trees.watch](https://trees.watch)).
Diese Datei ist die kanonische Referenz: Was gibt es, wie hängt es zusammen, und
worauf muss man beim Weiterentwickeln achten.

---

## 1. Grundprinzipien

- **Statisch & client-seitig.** Kein Backend, kein Build-Schritt, kein Framework.
  Nur HTML + CSS + ES-Module + statische Daten. Gehostet auf **GitHub Pages**
  (Repo `kthrnkppn/trees-zurich`, Domain via `CNAME` → `trees.watch`).
- **Privacy-first.** Alles läuft im Browser. Keine Accounts, keine Tokens, keine
  eigenen Server, kein Tracking. Externe Aufrufe nur an OpenFreeMap (Kacheln) und
  Nominatim (Ortssuche).
- **Keine Abhängigkeit von Mapbox** (früher genutzt, komplett ersetzt).

## 2. Technologie

| Zweck | Womit |
|---|---|
| Karte | MapLibre GL JS 4.7.1 (unpkg) |
| Kartenstil | OpenFreeMap „bright" (`https://tiles.openfreemap.org/styles/bright`, keyless) |
| Ortssuche | @maplibre/maplibre-gl-geocoder + Nominatim (Zürich-biased) |
| Baumdaten | Baumkataster Stadt Zürich (WFS, Open Data) |

## 3. Datenfluss

```
Stadt Zürich WFS  ──(scripts/update_data.py auf Raspi, Cron)──►  Repo (GitHub)
                                                                     │
                                        GitHub Pages Deploy ◄────────┘
                                                                     │
                                     Browser lädt statische Dateien ◄┘
```

Die App lädt beim Start `trees.geojson` in den Speicher (`allFeatures`) und rechnet
**alles live daraus** — Zähler, Statistik, Sammlungen, Raritäten. Nach einem
Daten-Update stimmen daher alle Zahlen automatisch, ohne Code-Änderung.

## 4. Datendateien

| Datei | Inhalt | Wer schreibt sie |
|---|---|---|
| `trees.geojson` | ~81'000 Punkte, 5 Felder (s. u.), ~19 MB / ~1.1 MB gzip | Update-Script |
| `treeMeta.js` | `{ genera, speciesByGenus }` für die Dropdowns (generiert) | Update-Script |
| `data-version.json` | `{ pulled: "YYYY-MM-DD", count }` → „Datenstand" im Footer | Update-Script |
| `new-trees.json` | FeatureCollection der seit letztem Update neu hinzugekommenen Bäume | Update-Script |
| `gone-trees.json` | Akkumulierter „Friedhof": verschwundene Bäume, je mit `verschwunden`-Datum | Update-Script |

**Felder pro Baum** (getrimmt aus dem WFS, `KEEP_FIELDS` im Script):
`baumgattunglat` (lat. Gattung, z. B. `Acer`), `baumartlat` (lat. Artepitheton,
gruppiert Sorten), `baumnamedeu` (deutscher Name), `baumnamelat` (voller lat.
Name), `pflanzjahr`, **`baumnummer`** (stabile ID für den Diff neu/verschwunden).
Koordinaten auf 5 Dezimalstellen (~1 m) gerundet.

> **Neu/verschwunden-Diff:** `diff_trees()` vergleicht die neue mit der alten
> `trees.geojson` (vor dem Überschreiben). Identität = `baumnummer`, sonst
> Koordinaten. Verschwundene Bäume akkumulieren in `gone-trees.json` (mit
> Auferstehungs-Korrektur); die App enthüllt eine Jahres-Karte je ab 1. Dezember.

> Der WFS hat mehr Felder (`quartier`, `strasse`, `kategorie`, `baumtyptext`,
> `kronendurchmesser` …), die wir bewusst weggelassen haben. Zum Nutzen: in
> `KEEP_FIELDS` aufnehmen und Daten neu ziehen.

## 5. Front-End-Dateien

| Datei | Rolle |
|---|---|
| `index.html` | Sidebar-Struktur + Karten-Container + Statistik-Modal |
| `style.css` | Gesamtes Styling (Sidebar, Buttons, Popup, Modal, Chips) |
| `main.js` | Kern: Karte, Layer, Filter, alle Modi, Verdrahtung |
| `helpers.js` | `getPopupContent(props)` → HTML fürs Klick-Popup |
| `stats.js` | `computeStats(features)` + `renderStatsHTML(stats)` fürs „Wussten Sie?"-Modal |
| `GenusDeNames.js` | lat. Gattung → deutscher Name |
| `genusInfo.js` | pro Gattung: `desc` + `tags` (Attribut-Chips im Popup) |
| `trendReasons.js` | pro Gattung: Erklärsatz „warum im Kommen/Rückzug" (fürs Modal) |
| `collections.js` | kuratierte Themen-Sammlungen (Gattungslisten) |
| `curiosities.js` | kuratierte Exoten-Liste (`genus` + optional `art`, `label`, `emoji`) |
| `yearEvents.js` | Welt-Event pro Pflanzjahr (1665–2026) fürs Popup |
| `icon.svg` | Favicon (grüner Baum) |
| `server.mjs` | lokaler Dev-Server (Port 4178), **nicht** fürs Deploy nötig |

## 6. Karten-Layer (in `main.js`)

Alle aus einer GeoJSON-Source (`sourceId = 'zurich-trees'`), ausser den neuen Bäumen:

| Layer-ID | Typ | Zweck | Sichtbarkeit |
|---|---|---|---|
| `tree-points-layer` | circle | alle Bäume, nach Gattung eingefärbt | Standard sichtbar |
| `treasure-stars-layer` | symbol | goldene Sterne (Genbank / Einzelgänger) | `none`, Filter je Modus gesetzt |
| `new-trees-layer` | circle | grüne Punkte, eigene Source `new-trees` | `none`, per Button |

Der goldene Stern ist ein zur Laufzeit auf Canvas gezeichnetes Icon
(`makeStarImage()`) — unabhängig von Font-Glyphen.

## 7. Modi & Exklusivität

Es gibt mehrere sich gegenseitig ausschliessende „Ansichten". Nur eine ist aktiv.
Beim Aktivieren einer wird die jeweils andere sauber beendet.

- **Filter** (Gattung / Art / Pflanzjahr): setzen `filterState`, färben Layer per
  `applyFilters()`, zoomen via `fitToMatches()`.
- **Sammlungen** (`collections.js`): Chip setzt `filterState.collection` (Gattungs-Set).
- **Genbank / Einzelgänger** (Gold-Stern-Modi, `treasureModes`): blenden den
  Haupt-Layer aus, zeigen Sterne, Zähler zeigt Modus-Text.
- **Neue Bäume** (`new-trees-layer`): grüne Punkte, nur wenn `new-trees.json`
  Features hat (sonst Button `hidden`).

**Wichtig beim Erweitern:** Jeder neue Modus muss in den bestehenden
Umschalt-Punkten `exit…()` aufrufen (Genus-Dropdown-Change, Filtern, Zurücksetzen,
`toggleTreasure`, `toggleCollection`) und umgekehrt die anderen beenden. Suchmuster:
`grep -n "exitTreasureMode\|exitNewTreesMode" main.js`.

## 8. Discovery-Features

- **Baum-Suche** (Freitext, Auto-Suggest): Index aus `treeMeta` (deutsch + lat.),
  Auswahl setzt Dropdown(s) + zoomt. Reine Client-Logik.
- **Ortssuche** (Geocoder oben links): Auto-Suggest via Nominatim, `minLength: 3`,
  `debounceSearch: 350` (Fair-Use), Duplikate entdoppelt.
- **Sammlungen**: Obstbäume, Nadelbäume, Herbstfärbung, Frühlingsblüher.
- **Raritäten**: Lebende Genbank (293 einmalige Obstsorten), Einzelgänger (175
  einmalige Nicht-Obst-Arten) — Aufteilung nach `GENE_BANK_GENERA` in `main.js`.
- **Kuriositäten**: ausklappbare, anklickbare Liste seltener Exoten; `art` grenzt
  auf eine Art ein, wenn die Gattung mehrere hat (z. B. Zanthoxylum piperitum).
- **Zahlen & Trends** („💡 Wussten Sie schon …?"): Modal, live aus `allFeatures`
  berechnet (Jahrzehnt-Balken, häufigste Bäume, Auf-/Absteiger mit Begründung,
  Kurioses & Rekorde, Wussten-Sie-Fakten).
- **Neue Bäume**: s. o.

## 9. Update-Pipeline (`scripts/update_data.py`)

Läuft per Cron auf einem Raspberry Pi. Ablauf in `main()`:
1. `/start`-Ping an healthchecks.io (URL aus Env `HC_URL` oder `scripts/.env`).
2. WFS herunterladen → auf 5 Felder trimmen, Koordinaten runden.
3. **Kanonischer Hash** (Features nach Koordinaten sortiert) vs. `.last_hash`.
   Gleich → nichts zu tun, OK-Ping, Ende.
4. Geändert → **Diff** `compute_new_trees()` (VOR dem Überschreiben!) → schreibt
   `trees.geojson`, `new-trees.json`, ggf. `treeMeta.js`, `data-version.json`.
5. `git pull --ff-only` → commit → push. OK-Ping; bei Fehler `/fail`-Ping.

**Identität der Bäume** = gerundete Koordinaten (der getrimmte Datensatz hat keine
stabile ID). Darum wird der Diff vor `write_geojson()` berechnet.

### Bekannter Stolperstein: Selbst-Update-Reihenfolge
Das Script pullt sich erst **kurz vor dem Commit** selbst. Ändert man das Script,
läuft der Raspi im nächsten Zyklus **noch einmal mit der alten Version** (Ein-Zyklus-
Verzug). **Lösung:** im Cron **vor** dem Start pullen:
```bash
cd /home/pi/trees-zurich && git pull --ff-only origin main && python3 scripts/update_data.py
```
Details & Einrichtung: [scripts/README.md](scripts/README.md).

## 10. Lokale Entwicklung & Verifikation

- Dev-Server: `node server.mjs` → `http://localhost:4178` (oder `npx serve .`).
- Modul-Check: `node --check main.js` etc.
- Daten-/Statistiklogik ohne Browser testbar via `node --input-type=module`
  (importiert `stats.js`/`curiosities.js` und lädt `trees.geojson` mit `fs`).
- **Sandbox-Eigenheit:** OpenFreeMap drosselt nach vielen Reloads die Kacheln,
  dann feuert `map.on('load')` verzögert und `#tree-count` bleibt kurz leer —
  kein Code-Fehler.

## 11. Deploy & Caching

Push auf `main` → GitHub Pages deployt automatisch. GitHub Pages versioniert
Assets **nicht**, daher nach Updates ggf. **Hard-Refresh** (Cmd+Shift+R) nötig,
weil der Browser altes `style.css`/`main.js` cachen kann.

## 12. Workflow-Konventionen

- Direkt auf `main`, keine Branches/PRs (Einzelperson).
- Git-Identität: Name `Kath`, E-Mail `270940034+kthrnkppn@users.noreply.github.com`.
- Der Raspi pusht eigenständig → **vor jedem Push lokal `git pull --rebase`**
  (der Auto-Updater kann zwischendurch committet haben).
