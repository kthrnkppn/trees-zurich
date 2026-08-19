#!/usr/bin/env python3
"""Fetch Zürich's public fountains and write a slim brunnen.geojson.

Companion to update_data.py, but far simpler: fountains change rarely, so this
is meant to be run by hand every once in a while (not on the daily cron). It
pulls the city's open "Brunnen" WFS layer, keeps only fountains that are
actually usable for filling a watering can, trims the ~30 metadata fields down
to the few the map needs, rounds coordinates, and writes brunnen.geojson at the
repo root next to trees.geojson.

"Usable for watering" means all of: active (not shut off), public, has a trough
(material_trog — a basin you can scoop from, not a bare drinking spout), and not
a Notwasserbrunnen (an emergency groundwater well that normally isn't running).
Of ~1288 fountains this leaves ~783.

Source: Stadt Zürich, Wasserversorgung (WVZ) — Open Government Data.
"""

import json
import sys
import urllib.request
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
OUT_FILE = REPO_DIR / "brunnen.geojson"

WFS_URL = (
    "https://www.ogd.stadt-zuerich.ch/wfs/geoportal/Brunnen"
    "?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature"
    "&TYPENAME=wvz_brunnen&OUTPUTFORMAT=GeoJSON&SRSNAME=EPSG:4326"
)
COORD_PRECISION = 5  # ~1 m, plenty for a fountain pin
DOWNLOAD_TIMEOUT = 120


def fetch():
    with urllib.request.urlopen(WFS_URL, timeout=DOWNLOAD_TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def process(raw):
    out = []
    for f in raw.get("features", []):
        p = f.get("properties", {})
        # Only fountains the public can actually use to fill a watering can.
        if p.get("abgestellt") != "nein":
            continue
        if p.get("art") != "öffentlich":
            continue
        if not p.get("material_trog"):
            continue  # no trough/basin to scoop from — a bare spout
        if p.get("brunnenart") == "Notwasserbrunnen":
            continue  # emergency groundwater well, normally not running
        geom = f.get("geometry")
        if not geom or geom.get("type") != "Point":
            continue
        lon, lat = geom["coordinates"][:2]
        out.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(lon, COORD_PRECISION), round(lat, COORD_PRECISION)],
            },
            "properties": {
                "nummer": p.get("brunnennummer"),
                "name": p.get("ortsbezeichnung"),
                # Raw water-type classification (Züriwasser / Quellwasser / …).
                # NOT a drinking-water indicator — in Zürich almost all fountains,
                # spring water included, are drinkable; the "Kein Trinkwasser"
                # exceptions only exist as signs on site. Kept as raw data; the
                # app no longer surfaces it.
                "wasserart": p.get("wasserart"),
            },
        })
    return out


def main():
    print(f"Fetching fountains from WFS …")
    raw = fetch()
    feats = process(raw)
    print(f"  {len(raw.get('features', []))} total → {len(feats)} usable public fountains kept")
    fc = {"type": "FeatureCollection", "features": feats}
    OUT_FILE.write_text(
        json.dumps(fc, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    size_kb = OUT_FILE.stat().st_size / 1024
    print(f"  Wrote {OUT_FILE.name} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Failed: {e}", file=sys.stderr)
        sys.exit(1)
