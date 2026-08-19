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
| Brunnendaten | Wasserversorgung Zürich (WVZ), Brunnen-WFS (Open Data) |
| Niederschlag *(geplant)* | MeteoSchweiz-Station Zürich/Fluntern (Tages-mm, Open Data, CORS-offen) |

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
| `brunnen.geojson` | 783 gieß-taugliche öffentliche Brunnen, Felder `nummer`/`name`/`wasserart`, ~121 KB | `scripts/fetch_brunnen.py` (**manuell**, nicht auf dem Cron) |

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
| `i18n.js` | Sprachschicht DE/EN: `lang`, `t(key, params)`, `setLang()` (Reload), `applyStaticI18n()`, `numberFormat`, `genusName()`, `tTag()`, `wikiLang` |
| `helpers.js` | `getPopupContent(props)` → HTML fürs Klick-Popup |
| `stats.js` | `computeStats(features)` + `renderStatsHTML(stats)` fürs „Wussten Sie?"-Modal |
| `GenusDeNames.js` | lat. Gattung → deutscher Name |
| `GenusEnNames.js` | lat. Gattung → englischer Name |
| `genusInfo.js` | pro Gattung: `desc` ({de,en}) + `tags` (Attribut-Chips im Popup) |
| `trendReasons.js` | pro Gattung: Erklärsatz „warum im Kommen/Rückzug" ({de,en}, fürs Modal) |
| `collections.js` | kuratierte Themen-Sammlungen (Gattungslisten, `label` {de,en}) |
| `curiosities.js` | kuratierte Exoten-Liste (`genus` + optional `art`, `label` {de,en}, `emoji`) |
| `yearEvents.js` | Welt-Event pro Pflanzjahr 1665–2026 ({de,en}) fürs Popup |
| `icon.svg` | Favicon (grüner Baum) |
| `fonts/` | Bricolage Grotesque (Titel/Panel-Header, variable WOFF2, SIL OFL) + Iosevka Charon (übriger UI-Text, Light/Regular WOFF2, MIT) — beide selbst gehostet, Lizenzen liegen daneben |
| `server.mjs` | lokaler Dev-Server (Port 4178), **nicht** fürs Deploy nötig |

### Zweisprachigkeit (DE/EN)

Keine i18n-Bibliothek. `i18n.js` löst die Sprache einmalig beim Laden auf
(`localStorage.lang`, sonst `navigator.language`); der DE|EN-Umschalter im
Sidebar-Header setzt `localStorage` und **lädt die Seite neu** — bei einer
statischen App wird dabei alles ohnehin frisch gerendert. Statisches Markup ist
auf Deutsch verfasst und wird via `data-i18n`/`-placeholder`/`-title`/`-aria-label`
von `applyStaticI18n()` übersetzt (Deutsch ohne Flash, Englisch mit kurzem
Wechsel). Kuratierte Inhalte (`yearEvents`, `genusInfo`, `trendReasons`,
`collections`, `curiosities`) tragen `{de,en}`; `t(key, params)` liefert die
UI-Texte. Die vom Raspi generierte `treeMeta.js` bleibt deutsch — im
Englisch-Modus werden Gattungen über `GenusEnNames` benannt und Artnamen als
lateinisches Binomial (`genus art`) dargestellt; Popup-Titel nutzen den
lateinischen Namen. Wikipedia-Links und Zahlenformat (`de-CH` ↔ `en-GB`) folgen
der Sprache.

## 6. Karten-Layer (in `main.js`)

Alle aus einer GeoJSON-Source (`sourceId = 'zurich-trees'`), ausser den neuen und
verschwundenen Bäumen (je eigene, kleine Source):

| Layer-ID | Typ | Zweck | Sichtbarkeit |
|---|---|---|---|
| `tree-points-layer` | circle | alle Bäume, nach Gattung eingefärbt | Standard sichtbar |
| `treasure-stars-layer` | symbol | goldene Sterne (Genbank / Einzelgänger) | `none`, Filter je Modus gesetzt |
| `new-trees-layer` | circle | grüne Punkte, eigene Source `new-trees` | `none`, per Button |
| `gone-trees-layer` | circle | graue „Geister", eigene Source `gone-trees` | `none`, per Button (nur wenn Jahr enthüllt) |
| `fountains-layer` | symbol | dunkelblaue Tropfen-Pins (öffentliche Brunnen), eigene Source `zurich-fountains` | `none`, **an den „Durstige Jungbäume"-Filter gekoppelt** (s. §7) |

Der goldene Stern (`makeStarImage()`) und der dunkelblaue Brunnen-Tropfen
(`makeDropImage()`, Bulb oben, Spitze markiert den Ort) sind zur Laufzeit auf
Canvas gezeichnete Icons — unabhängig von Font-Glyphen.

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
- **Verschwundene Bäume** (`gone-trees-layer`): graue „Geister" des aktuell
  **enthüllten** Jahres (s. Abschnitt 8). Der Footer-Button ist immer sichtbar —
  entweder aktiv (enthülltes Jahr mit Daten) oder als ausgegrauter **Teaser**
  (`aria-disabled`, Tooltip „Verfügbar ab Dezember …") vor der Enthüllung.

**Boolean-Filter-Toggles** (kein eigener Modus — Gates in `filterState`, die
frei mit Gattung/Art/Sammlung kombinieren):
- `yearUnknown` — „Nur Bäume mit unbekanntem Pflanzjahr".
- `youngTree` — „Durstige Jungbäume" (bis 5. Standjahr, s. Abschnitt 8).
- `blutbuche` — isoliert die Blutbuchen-Sorten über `BLUTBUCHE_DE_NAMES` (Genus
  + Art sind wie bei jeder Buche `Fagus sylvatica`, nur der deutsche Name trennt).

  `yearUnknown` und `youngTree` besetzen beide das Jahr-Fenster und sind daher
  **gegenseitig ausschliessend** (das Aktivieren des einen deaktiviert das andere).

**Öffentliche Brunnen** (`fountains-layer`) haben **kein eigenes Bedienelement**:
Sie werden allein vom **„Durstige Jungbäume"-Filter** ein-/ausgeblendet (Filter
an → Brunnen an, Filter aus → Brunnen aus). Brunnen ergeben nur neben durstigen
Jungbäumen Sinn, darum fahren sie mit dieser Ansicht mit, statt einen separaten
Button zu bekommen. Technisch bleibt es ein **eigenständiger Overlay-Layer**:
`setFountainsVisible(visible)` schaltet nur die Layer-Sichtbarkeit, **ohne**
`filterState` oder den `exit…()`-Reigen zu berühren. Gerufen aus dem
`youngTreeToggle`-Handler (`setFountainsVisible(active)`) und aus
`deactivateYoungTree()` (→ `false`). **Nicht** in die `exit…()`-Logik einbauen.

**Wichtig beim Erweitern:** Jeder neue Modus muss in den bestehenden
Umschalt-Punkten `exit…()` aufrufen (Genus-Dropdown-Change, Filtern, Zurücksetzen,
`toggleTreasure`, `toggleCollection`, `toggleNewTreesMode`) und umgekehrt die
anderen beenden. Suchmuster:
`grep -n "exitTreasureMode\|exitNewTreesMode\|exitGoneMode" main.js`.

## 8. Discovery-Features

- **Baum-Suche** (Freitext, Auto-Suggest): Index aus `treeMeta` (deutsch + lat.),
  Auswahl setzt Dropdown(s) + zoomt. Reine Client-Logik.
- **Ortssuche** (Geocoder oben links): Auto-Suggest via Nominatim, `minLength: 3`,
  `debounceSearch: 350` (Fair-Use), Duplikate entdoppelt.
- **Klickbare Legende**: jede Gattungs-Zeile ist ein Toggle-Button (`jumpToGenus`
  bei Auswahl, „Alle Gattungen" bei erneutem Klick auf die aktive Zeile). Die
  aktive Gattung wird hervorgehoben (`updateLegendHighlight()`), synchron mit
  Dropdown, Suche und Kuriositäten-Liste.
- **Sammlungen**: Obstbäume, Nadelbäume, Herbstfärbung, Frühlingsblüher.
- **Raritäten**: Lebende Genbank (293 einmalige Obstsorten), Einzelgänger (175
  einmalige Nicht-Obst-Arten) — Aufteilung nach `GENE_BANK_GENERA` in `main.js`.
- **Kuriositäten**: ausklappbare, anklickbare Liste seltener Exoten; `art` grenzt
  auf eine Art ein, wenn die Gattung mehrere hat (z. B. Zanthoxylum piperitum).
- **„Durstige Jungbäume"** (`youngTree`-Toggle bei den Pflanzjahr-Feldern):
  isoliert Bäume **bis zum 5. Standjahr** = `pflanzjahr ≥ aktuelles Jahr − 4`
  (`YOUNG_TREE_MIN_YEAR`, das Pflanzjahr zählt als 1. Standjahr; Grün Stadt Zürich
  giesst bis zum 5. Standjahr). Blauer CSS-Tropfen-Marker; Tooltip zu
  Durst-Anzeichen (hängende/braune Blätter); bei Aktivierung erscheint ein
  **Wasserbedarf-Hinweis** (~50–70 L je Gabe, bei Trockenheit bis 3×/Woche,
  **langsam** giessen, damit es tief einsickert statt abzulaufen) **und** die
  Brunnen werden mit eingeblendet.
- **Blutbuche**: eigener Such-Eintrag + Filter (`filterState.blutbuche`,
  `BLUTBUCHE_DE_NAMES`), da die Sorten in den Dropdowns nicht auffindbar sind
  (gleiche Gattung/Art wie jede Rotbuche). `isBlutbuche()` in `helpers.js` treibt
  zusätzlich den Wikipedia-Link (dedizierter de-Artikel „Blutbuche" statt
  generischem „Rotbuche") und einen Popup-Fakt (Blattfarbe + Herkunft).
- **Öffentliche Brunnen (Wasserstellen)**: dunkelblaue Tropfen-Pins, erscheinen
  zusammen mit dem „Durstige Jungbäume"-Filter (kein eigener Button, s. §7).
  Klick-Popup zeigt Name + Wasserart („Trinkwasser (Züriwasser)" bzw. „Kein
  Trinkwasser – zum Giessen geeignet"). Datenherkunft/Filter s. §9.
- **Zahlen & Trends** („💡 Wussten Sie schon …?"): Modal, live aus `allFeatures`
  berechnet (Jahrzehnt-Balken, häufigste Bäume, Auf-/Absteiger mit Begründung,
  Kurioses & Rekorde, Wussten-Sie-Fakten). Alle Einträge sind klickbar: Balken/
  Trends/Fakten filtern nach Gattung (`data-genus`), Jahrzehnt-Balken filtern
  nach Pflanzjahr-Bereich (`data-year-min/-max`), der „Ältester Baum"-Eintrag
  fliegt direkt zum Baum (`data-lng/-lat`) — Klick schliesst das Modal zuerst
  (`handleStatsAction()` in `main.js`, delegierter Listener auf `#stats-body`).
- **Neue Bäume**: s. Abschnitt 6/7.
- **Verschwundene Bäume** („In Memoriam"): jährlicher Gedenk-Layer, s. Abschnitt 9.
- **Popup-Zusatz**: Link zum Wikipedia-Artikel in der aktiven Sprache
  (`wikipediaUrl()` in `helpers.js`, lat. Binomial → Redirect auf den de- bzw.
  en-Artikelnamen); bei Bäumen aus dem Gedenk-Layer zusätzlich „† Verschwunden {Jahr}".
- **Attribution**: „Baumdaten: …" unten rechts verlinkt zum Open-Data-Datensatz
  (`customAttribution` in der `AttributionControl`, main.js).

## 9. Update-Pipeline (`scripts/update_data.py`)

Läuft per Cron auf einem Raspberry Pi. Ablauf in `main()`:
1. `/start`-Ping an healthchecks.io (URL aus Env `HC_URL` oder `scripts/.env`).
2. WFS herunterladen → auf 6 Felder trimmen (s. Abschnitt 4), Koordinaten runden.
3. **Kanonischer Hash** (Features nach Koordinaten sortiert) vs. `.last_hash`.
   Gleich → nichts zu tun, OK-Ping, Ende.
4. Geändert → **`diff_trees(old, new)`** (VOR dem Überschreiben!) liefert
   `added`/`removed` → schreibt `trees.geojson`, `new-trees.json` (= `added`),
   akkumuliert `removed` in `gone-trees.json` (s. u.), ggf. `treeMeta.js`,
   `data-version.json`.
5. `git pull --ff-only` → commit → push. OK-Ping; bei Fehler `/fail`-Ping.

**Identität der Bäume** = `baumnummer` (stabil), Fallback auf gerundete
Koordinaten falls die *alte* Snapshot-Datei noch keine `baumnummer` hat (fängt
den Übergangs-Lauf ab). Darum wird der Diff vor `write_geojson()` berechnet.

### Gedenk-Layer: `accumulate_gone_trees()`
`gone-trees.json` ist kein Diff, sondern ein **wachsender Friedhof**: jeder neu
verschwundene Baum wird mit `properties.verschwunden = "YYYY-MM-DD"` markiert und
dauerhaft angehängt (dedupliziert nach Identität). Taucht ein Baum später wieder
auf (Auferstehung = Daten-Glitch), wird er wieder entfernt. Die App gruppiert die
Einträge nach Jahr (`pickRevealedGoneYear()` in `main.js`) und zeigt nur ein
Jahr, sobald `heute >= 1. Dezember` dieses Jahres — bis dahin ein ausgegrauter
Teaser-Button. `GONE_INCOMPLETE_THROUGH_YEAR` (main.js) steuert den
Unvollständigkeits-Hinweis, da die Erfassung erst Mitte 2026 begann.

### Bekannter Stolperstein: Selbst-Update-Reihenfolge
Das Script pullt sich erst **kurz vor dem Commit** selbst. Ändert man das Script,
läuft der Raspi im nächsten Zyklus **noch einmal mit der alten Version** (Ein-Zyklus-
Verzug). **Lösung:** im Cron **vor** dem Start pullen:
```bash
cd /home/pi/trees-zurich && git pull --ff-only origin main && python3 scripts/update_data.py
```
Details & Einrichtung: [scripts/README.md](scripts/README.md).

### Brunnen: `scripts/fetch_brunnen.py` (separat, manuell)
Brunnen ändern sich selten, daher **kein Cron** — das Script wird bei Bedarf von
Hand ausgeführt und schreibt `brunnen.geojson`. Es zieht den WVZ-Brunnen-WFS und
behält nur die **gieß-tauglichen**: `abgestellt=nein` **und** `art=öffentlich`
**und** ein `material_trog` (Becken zum Schöpfen) **und** kein
`brunnenart=Notwasserbrunnen` (Grundwasser-Notfallquelle) → von ~1288 bleiben
**~783**. Behaltene Felder: `nummer`, `name`, `wasserart`.

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

## 13. Giess-Projekt / Bewässerung (Kontext & Ausblick)

Ein zusammenhängender Strang, der Bürger:innen beim **Giessen von Jungbäumen**
unterstützen soll. Fachlicher Kern: Bei **alten** Bäumen bringt privates Giessen
kaum etwas (das Wasser erreicht die tiefen Wurzeln nicht) — bei **Jungbäumen**
(flache, noch nicht etablierte Wurzeln nach dem Verpflanzen) hilft es dagegen
wirklich. Darum der Fokus auf die ersten Standjahre.

**Schon gebaut:**
- „Durstige Jungbäume"-Filter (bis 5. Standjahr) + Wasserbedarf-Richtwert (§8).
- Öffentliche Brunnen als Wasserstellen, gekoppelt an den Jungbaum-Filter (§7/§8).

**Geplant (recherchiert, noch nicht gebaut):**
- **Niederschlag** einbinden, um „wie trocken war es zuletzt?" zu zeigen. Quelle:
  MeteoSchweiz-Station **Zürich/Fluntern** (`ogd-smn_sma_d_recent.csv`, Spalte
  `rre150d0` = Tages-mm; CORS-offen). Entschieden: **client-seitiger Live-Abruf**
  (letzte 30 Tage summieren), bei Fehler still degradieren — kein Backend.
- Achtung Datenfalle: Die Stadt-Stationen (UGZ Stampfenbach/Schimmel/Rosengarten)
  liefern nur `RainDur` (Regen*dauer*), **nicht** die Menge in mm — dafür ist
  MeteoSchweiz die richtige Quelle.

**Vorbild:** „Gieß den Kiez" (Berlin). Bewusster Unterschied hier: **kein
Backend, rein informativ** — keine Nutzer-Accounts, keine Gieß-Protokolle
(passt zum Privacy-first-Prinzip, §1).
