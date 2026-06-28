# Zürichs Stadtbäume

Interaktive Karte aller ~81'000 Stadtbäume Zürichs. Filter nach Gattung, Art und Pflanzjahr. Klick auf einen Baum zeigt Alter, Artbeschreibung, Eigenschaften und ein historisches Welt-Event aus dem Pflanzjahr.

**Vollständig im Browser – kein Account, kein API-Token, keine Serverdaten.**

## Technologie

| Was | Womit |
|-----|-------|
| Karte | [MapLibre GL JS](https://maplibre.org/) 4.7.1 |
| Kartenstil | [OpenFreeMap](https://openfreemap.org/) "bright" (MIT, kein Token) |
| Geocoder | [Nominatim](https://nominatim.org/) (OpenStreetMap, fair use) |
| Baumdaten | [Baumkataster Stadt Zürich](https://www.ogd.stadt-zuerich.ch/) – Open Data, wöchentlich aktualisiert |

## Dateien

```
index.html       Einstiegspunkt
style.css        Layout, Sidebar, Popup-Styles
main.js          Karte, Filter, Zähler, Auto-Zoom
helpers.js       Popup-HTML generieren
GenusDeNames.js  Lateinischer Gattungsname → deutscher Name
genusInfo.js     Beschreibungen und Eigenschaften pro Gattung
treeMeta.js      Gattungen und Arten für die Dropdowns (generiert)
yearEvents.js    Welt-Event pro Pflanzjahr (1665–2026)
trees.geojson    Baumdaten (~19 MB, 81'048 Punkte)
server.mjs       Lokaler Entwicklungsserver (nur für lokales Testen)
```

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

```bash
# Aktuelle Daten herunterladen (dauert je nach Verbindung 1–2 Minuten)
curl "https://www.ogd.stadt-zuerich.ch/wfs/geoportal/Baumkataster?service=WFS&version=1.1.0&request=GetFeature&typename=baumkataster_baumstandorte&outputFormat=geojson" \
  -o trees_raw.geojson

# Danach: trees_raw.geojson auf die 5 benötigten Felder kürzen und
# Koordinaten auf 5 Dezimalstellen runden → trees.geojson ersetzen.
# treeMeta.js muss neu generiert werden, falls neue Gattungen/Arten dazukamen.
```

## Lizenzen

- **MapLibre GL JS** – BSD-3-Clause
- **OpenFreeMap** – MIT (Kacheln und Stil)
- **OpenStreetMap** – ODbL (Namensnennung im Kartenattribut vorhanden)
- **Baumkataster Stadt Zürich** – Open Government Data (freie Nutzung mit Quellenangabe)
- **yearEvents.js, genusInfo.js** – eigene Texte, keine Drittlizenz
