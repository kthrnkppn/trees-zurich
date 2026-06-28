#!/usr/bin/env python3
"""
update_data.py — Zürich tree data auto-updater.

Downloads fresh data from the Stadt Zürich Baumkataster WFS, processes it,
and pushes to GitHub if the content changed. Reports to healthchecks.io.

HC_URL config (pick one):
  1. Environment variable:  HC_URL=https://hc-ping.com/xxx python3 update_data.py
  2. .env file next to this script:  HC_URL=https://hc-ping.com/xxx
  If neither is set, healthchecks.io pings are skipped.
"""

import hashlib
import json
import logging
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths  (everything relative to this script — self-sufficient)
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent.resolve()
REPO_DIR = SCRIPT_DIR.parent
TREES_GEOJSON = REPO_DIR / "trees.geojson"
TREE_META_JS = REPO_DIR / "treeMeta.js"
LOG_FILE = SCRIPT_DIR / "update.log"
HASH_FILE = SCRIPT_DIR / ".last_hash"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
WFS_URL = (
    "https://www.ogd.stadt-zuerich.ch/wfs/geoportal/Baumkataster"
    "?service=WFS&version=1.1.0&request=GetFeature"
    "&typename=baumkataster_baumstandorte&outputFormat=geojson"
)
KEEP_FIELDS = {"baumgattunglat", "baumartlat", "baumnamedeu", "baumnamelat", "pflanzjahr"}
COORD_PRECISION = 5
DOWNLOAD_TIMEOUT = 300  # seconds — WFS can be slow

# ---------------------------------------------------------------------------
# Logging  (file + stdout)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Healthchecks.io
# ---------------------------------------------------------------------------
def load_hc_url():
    url = os.environ.get("HC_URL")
    if url:
        return url.strip()
    env_file = SCRIPT_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("HC_URL="):
                return line[len("HC_URL="):].strip()
    return None


def hc_ping(hc_url, suffix=""):
    if not hc_url:
        return
    url = hc_url.rstrip("/") + (f"/{suffix}" if suffix else "")
    try:
        urllib.request.urlopen(url, timeout=10)
        log.info(f"HC ping sent: {url}")
    except Exception as e:
        log.warning(f"HC ping failed ({url}): {e}")


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
def download_geojson():
    log.info("Downloading WFS data …")
    try:
        with urllib.request.urlopen(WFS_URL, timeout=DOWNLOAD_TIMEOUT) as resp:
            data = resp.read().decode("utf-8")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Download failed: {e}") from e
    log.info(f"Downloaded {len(data) / 1_000_000:.1f} MB")
    return data


# ---------------------------------------------------------------------------
# Processing
# ---------------------------------------------------------------------------
def process(raw_json):
    """Parse GeoJSON, trim to 5 fields, round coordinates to 5 decimal places."""
    try:
        fc = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON from WFS: {e}") from e

    features = fc.get("features")
    if not features:
        raise RuntimeError("WFS response contains no features — aborting to protect current data")

    processed = []
    for f in features:
        coords = (f.get("geometry") or {}).get("coordinates", [])
        if len(coords) < 2:
            continue
        props = f.get("properties") or {}
        processed.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    round(coords[0], COORD_PRECISION),
                    round(coords[1], COORD_PRECISION),
                ],
            },
            "properties": {k: props.get(k) for k in KEEP_FIELDS},
        })

    if not processed:
        raise RuntimeError("No valid features after processing — aborting")

    log.info(f"Processed {len(processed):,} features")
    return processed


# ---------------------------------------------------------------------------
# Canonical hash  (order-independent)
# ---------------------------------------------------------------------------
def compute_hash(features):
    """
    Sort features by coordinates before hashing so the hash is stable
    regardless of the order the WFS server returns features.
    Coordinates are already rounded so ties are rare but handled by the
    secondary sort on both axes.
    """
    sorted_features = sorted(
        features,
        key=lambda f: (
            f["geometry"]["coordinates"][0],
            f["geometry"]["coordinates"][1],
        ),
    )
    canonical = json.dumps(
        sorted_features, sort_keys=True, ensure_ascii=False, separators=(",", ":")
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def load_last_hash():
    return HASH_FILE.read_text().strip() if HASH_FILE.exists() else None


def save_hash(h):
    HASH_FILE.write_text(h)


# ---------------------------------------------------------------------------
# Write trees.geojson
# ---------------------------------------------------------------------------
def write_geojson(features):
    fc = {"type": "FeatureCollection", "features": features}
    TREES_GEOJSON.write_text(
        json.dumps(fc, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    size_mb = TREES_GEOJSON.stat().st_size / 1_000_000
    log.info(f"Wrote trees.geojson ({size_mb:.1f} MB)")


# ---------------------------------------------------------------------------
# treeMeta.js  (genus/species dropdowns)
# ---------------------------------------------------------------------------
def build_tree_meta(features):
    """Derive genera list and speciesByGenus from the feature set."""
    # genus → { art → most-common German name }
    genus_species_names = {}
    genus_species_counts = {}

    for f in features:
        p = f["properties"]
        genus = p.get("baumgattunglat") or ""
        art = p.get("baumartlat") or ""
        german = p.get("baumnamedeu") or ""
        if not genus or not art:
            continue
        if genus not in genus_species_names:
            genus_species_names[genus] = {}
            genus_species_counts[genus] = {}
        if art not in genus_species_names[genus]:
            genus_species_names[genus][art] = {}
            genus_species_counts[genus][art] = {}
        genus_species_counts[genus][art][german] = (
            genus_species_counts[genus][art].get(german, 0) + 1
        )

    genera = sorted(genus_species_names.keys())
    species_by_genus = {}

    for genus in genera:
        entries = []
        for art, name_counts in genus_species_counts[genus].items():
            # Pick the most common German name for this species
            best_name = max(name_counts, key=name_counts.get) if name_counts else ""
            label = f"{best_name} ({art})" if best_name else art
            entries.append({"art": art, "label": label})
        entries.sort(key=lambda e: e["label"])
        species_by_genus[genus] = entries

    return {"genera": genera, "speciesByGenus": species_by_genus}


def extract_arts_from_meta_js():
    """Quick-parse the current treeMeta.js to get the set of known art values."""
    if not TREE_META_JS.exists():
        return set()
    content = TREE_META_JS.read_text(encoding="utf-8")
    return set(re.findall(r'"art":"([^"]+)"', content))


def write_tree_meta(meta):
    content = (
        "export const treeMeta = "
        + json.dumps(meta, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    TREE_META_JS.write_text(content, encoding="utf-8")
    log.info("Wrote treeMeta.js")


def maybe_update_tree_meta(features):
    """Regenerate treeMeta.js only when the species set has actually changed."""
    new_meta = build_tree_meta(features)
    new_arts = {
        e["art"]
        for entries in new_meta["speciesByGenus"].values()
        for e in entries
    }
    old_arts = extract_arts_from_meta_js()

    if new_arts == old_arts:
        log.info("treeMeta.js is up to date")
        return False

    added = new_arts - old_arts
    removed = old_arts - new_arts
    log.info(
        f"Species set changed (+{len(added)} added, -{len(removed)} removed) "
        f"— regenerating treeMeta.js"
    )
    if added:
        log.info(f"  New species: {sorted(added)}")
    write_tree_meta(new_meta)
    return True


# ---------------------------------------------------------------------------
# Git
# ---------------------------------------------------------------------------
def git(*args):
    result = subprocess.run(
        ["git", "-C", str(REPO_DIR)] + list(args),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr.strip()}")
    return result.stdout.strip()


def pull():
    """Pull latest changes before pushing to avoid conflicts."""
    log.info("Pulling latest changes from origin/main …")
    git("pull", "--ff-only", "origin", "main")


def commit_and_push(feature_count):
    pull()

    # Format number Swiss-style with apostrophe thousands separator
    count_str = f"{feature_count:,}".replace(",", "'")
    date_str = datetime.now().strftime("%Y-%m-%d")
    msg = f"Baumdaten aktualisiert: {date_str}, {count_str} Bäume"

    files_to_stage = [str(TREES_GEOJSON), str(TREE_META_JS)]
    git("add", *files_to_stage)

    # Double-check: git might see no diff even if our hash changed (rare edge case)
    status = git("status", "--porcelain")
    if not status:
        log.info("Git sees no diff — skipping commit")
        return

    git("commit", "-m", msg)
    log.info(f"Committed: {msg}")
    git("push", "origin", "main")
    log.info("Pushed to origin/main ✓")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log.info("=== update_data.py started ===")

    hc_url = load_hc_url()
    if not hc_url:
        log.warning("HC_URL not configured — healthchecks.io pings disabled")

    hc_ping(hc_url, "start")

    try:
        raw = download_geojson()
        features = process(raw)

        new_hash = compute_hash(features)
        old_hash = load_last_hash()

        if new_hash == old_hash:
            log.info("Hash unchanged — data is current, nothing to push")
            hc_ping(hc_url)
            return

        log.info("Hash differs — updating repository")
        write_geojson(features)
        maybe_update_tree_meta(features)
        save_hash(new_hash)
        commit_and_push(len(features))

    except Exception as e:
        log.error(f"Update failed: {e}", exc_info=True)
        hc_ping(hc_url, "fail")
        sys.exit(1)

    hc_ping(hc_url)
    log.info("=== Done ===")


if __name__ == "__main__":
    main()
