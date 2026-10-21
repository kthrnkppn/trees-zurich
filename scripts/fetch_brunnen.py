#!/usr/bin/env python3
"""Fetch Zürich's public fountains and write a slim brunnen.geojson.

Companion to update_data.py, but far simpler: fountains change rarely, so this
is meant to be run by hand every once in a while (not on the daily cron). It
pulls the city's open "Brunnen" WFS layer, trims the ~30 metadata fields down
to the few the map needs, rounds coordinates, and writes brunnen.geojson at
the repo root next to trees.geojson.

The map shows ALL fountains in the dataset (Katharina, 2026-10: "show every
fountain and let people judge for themselves"). The old usability pre-filter
(public only / trough required / no emergency wells) is gone — it kept
excluding perfectly usable fountains (e.g. street-facing ones classified
"privat" because they sit on private ground). The one remaining rule is
factual, not a judgment: fountains currently shut off (abgestellt) are
skipped, since a pin that promises water at a dry fountain is the only real
disappointment. Everything else — private courtyards, drinking columns,
emergency wells — is shown and left to the visitor.

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
        # Only skip fountains that are actually out of service right now —
        # a factual status, not a judgment about usability or access.
        if p.get("abgestellt") != "nein":
            continue
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
                # Water type (Züriwasser / Quellwasser / …), shown as-is in the
                # popup. NOT a drinking-water indicator — in Zürich almost all
                # fountains, spring water included, are drinkable; the "Kein
                # Trinkwasser" exceptions only exist as signs on site.
                "wasserart": p.get("wasserart"),
            },
        })
    return out


def main():
    print("Fetching fountains from WFS …")
    raw = fetch()
    feats = process(raw)
    print(f"  {len(raw.get('features', []))} total → {len(feats)} fountains kept (only shut-off ones skipped)")
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
