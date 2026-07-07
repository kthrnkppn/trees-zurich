# Zürichs Stadtbäume

**Live: [trees.watch](https://trees.watch)**

Interaktive Karte aller ~81'000 Stadtbäume Zürichs. Filter nach Gattung, Art und Pflanzjahr. Klick auf einen Baum zeigt Alter, Artbeschreibung, Eigenschaften und ein historisches Welt-Event aus dem Pflanzjahr.

**Vollständig im Browser – kein Account, kein API-Token, keine Serverdaten.**

## Technologie

| Was | Womit |
|-----|-------|
| Karte | [MapLibre GL JS](https://maplibre.org/) 4.7.1 |
| Kartenstil | [OpenFreeMap](https://openfreemap.org/) "bright" (MIT, kein Token) |
| Geocoder | [Nominatim](https://nominatim.org/) (OpenStreetMap, fair use) |
| Baumdaten | [Baumkataster Stadt Zürich](https://www.ogd.stadt-zuerich.ch/) – Open Data, wöchentlich aktualisiert |

## Funktionen

- Filter nach **Gattung, Art, Pflanzjahr** + Freitext-**Baum-Suche** mit Auto-Suggest
- **Ortssuche** (Auto-Suggest) auf der Karte
- **Klickbare Legende**: Gattung antippen filtert die Karte, nochmal antippen hebt die Auswahl wieder auf
- **Sammlungen** (Obstbäume, Nadelbäume, Herbstfärbung, Frühlingsblüher)
- **Raritäten**: Lebende Genbank (alte Obstsorten) & Einzelgänger (goldene Sterne)
- **Kuriositäten**: anklickbare Liste exotischer Bäume, springt direkt hin
- **Zahlen & Trends**-Modal – live aus den Daten berechnet, alle Werte anklickbar (springen direkt zur Gattung/zum Jahr/zum Baum)
- **Neue Bäume** seit dem letzten Update hervorheben
- **Verschwundene Bäume**: jährliches „In Memoriam" – wird jeweils ab Dezember für das laufende Jahr enthüllt
- Reiches **Klick-Popup**: Alter, Beschreibung, Eigenschaften, Welt-Event im Pflanzjahr, Link zum deutschen Wikipedia-Artikel
- Datenquelle unten rechts verlinkt zu [Open Data Zürich](https://data.stadt-zuerich.ch/dataset/geo_baumkataster)

## Dateien

```
index.html         Einstiegspunkt (Sidebar + Karte + Statistik-Modal)
style.css          Gesamtes Styling
main.js            Karte, Layer, Filter, alle Modi
helpers.js         Popup-HTML
stats.js           „Zahlen & Trends" berechnen + rendern
GenusDeNames.js    Lateinischer Gattungsname → deutscher Name
genusInfo.js       Beschreibung + Attribut-Tags pro Gattung
trendReasons.js    „Warum"-Erklärungen zu den Trends
collections.js     Themen-Sammlungen
curiosities.js     Kuratierte Exoten-Liste
treeMeta.js        Gattungen/Arten für die Dropdowns (generiert)
yearEvents.js      Welt-Event pro Pflanzjahr (1665–2026)
trees.geojson      Baumdaten (~19 MB, ~81'000 Punkte)
data-version.json  Datenstand (Datum + Anzahl)
new-trees.json     Seit letztem Update neu dazugekommene Bäume
gone-trees.json    Akkumulierter „Friedhof" verschwundener Bäume (In-Memoriam-Layer)
server.mjs         Lokaler Entwicklungsserver (nur zum Testen)
```

**Technische Gesamtübersicht:** → [ARCHITECTURE.md](ARCHITECTURE.md)

## Lokal starten

Node.js wird nur für den lokalen Entwicklungsserver benötigt, nicht für die App selbst.

```bash
# Repository klonen
git clone https://github.com/kthrnkppn/trees-zurich.git
cd trees-zurich

# Server starten
node server.mjs
```

Dann im Browser öffnen: [http://localhost:4178](http://localhost:4178)

> Alternativ funktioniert auch `npx serve .` oder `python3 -m http.server 4178` — kein Node nötig.

## Baumdaten aktualisieren

Die Daten kommen direkt vom WFS-Endpunkt der Stadt Zürich und werden wöchentlich aktualisiert.

Für automatische Updates gibt es ein Python-Script für den Raspberry Pi (oder einen anderen Server) — es lädt neue Daten, vergleicht per Hash und pusht Änderungen selbstständig auf GitHub.

→ **[scripts/README.md](scripts/README.md)**

## Lizenzen

- **MapLibre GL JS** – BSD-3-Clause
- **OpenFreeMap** – MIT (Kacheln und Stil)
- **OpenStreetMap** – ODbL (Namensnennung im Kartenattribut vorhanden)
- **Baumkataster Stadt Zürich** – Open Government Data (freie Nutzung mit Quellenangabe)
- **yearEvents.js, genusInfo.js** – eigene Texte, keine Drittlizenz
