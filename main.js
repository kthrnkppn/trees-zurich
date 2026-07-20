import { treeMeta } from './treeMeta.js';
import { getPopupContent } from './helpers.js';
import { collections } from './collections.js';
import { curiosities } from './curiosities.js';
import { computeStats, renderStatsHTML } from './stats.js';
import { lang, t, genusName, numberFormat, setLang, applyStaticI18n, localized } from './i18n.js';
import { GENUS_FIELD, SPECIES_FIELD, YEAR_FIELD, LATIN_NAME_FIELD } from './fields.js';

// Rewrite the static German markup for the active language and wire the DE|EN
// switch. Runs first so every dynamically built string below matches.
applyStaticI18n();
for (const btn of document.querySelectorAll('.lang-btn')) {
  const isActive = btn.dataset.lang === lang;
  btn.setAttribute('aria-pressed', String(isActive));
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
}

// In English mode the species dropdowns/labels use the Latin binomial (we only
// translate the genus): "Quercus robur" instead of the German "Stiel-Eiche".
const speciesLabel = (genus, art, deLabel) => (lang === 'en' ? `${genus} ${art}` : deLabel);
const allSpeciesOption = () => `<option value="0">${t('filter.allSpecies')}</option>`;

const layerId = 'tree-points-layer';
const treasureLayerId = 'treasure-stars-layer';
const newTreesLayerId = 'new-trees-layer';
const newTreesSourceId = 'new-trees';
const goneTreesLayerId = 'gone-trees-layer';
const goneTreesSourceId = 'gone-trees';
const sourceId = 'zurich-trees';

// Single source of truth for genus colouring — drives both the map paint
// expression and the legend. Keyed by latin genus name (matches GENUS_FIELD).
// Tuned for contrast on the light street base: saturated, medium-dark tones.
const GENUS_COLORS = [
  { genus: 'Acer', name: 'Ahorn (Acer)', color: '#e11900' },
  { genus: 'Tilia', name: 'Linde (Tilia)', color: '#ef6c00' },
  { genus: 'Carpinus', name: 'Hainbuche (Carpinus)', color: '#00897b' },
  { genus: 'Betula', name: 'Birke (Betula)', color: '#3949ab' },
  { genus: 'Quercus', name: 'Eiche (Quercus)', color: '#1e88e5' },
  { genus: 'Fraxinus', name: 'Esche (Fraxinus)', color: '#6a3d9a' },
  { genus: 'Platanus', name: 'Platane (Platanus)', color: '#9c27b0' },
  { genus: 'Prunus', name: 'Kirsche (Prunus)', color: '#c2185b' },
  { genus: 'Aesculus', name: 'Rosskastanie (Aesculus)', color: '#607d8b' },
  { genus: 'Fagus', name: 'Buche (Fagus)', color: '#212121' },
];
const OTHER_COLOR = '#2e7d32'; // forest green for every other genus

// The map colour for a genus — a named legend colour, else the "Andere" green.
// Used so the collection legend shows the same dot colour as the map.
const GENUS_COLOR_BY_GENUS = new Map(GENUS_COLORS.map((g) => [g.genus, g.color]));
const genusColor = (genus) => GENUS_COLOR_BY_GENUS.get(genus) || OTHER_COLOR;

function buildGenusColorExpression() {
  const pairs = GENUS_COLORS.flatMap(({ genus, color }) => [genus, color]);
  return ['match', ['get', GENUS_FIELD], ...pairs, OTHER_COLOR];
}

// Draw a gold five-pointed star on a canvas for the treasure-map markers.
// Returns ImageData (+ pixelRatio) so MapLibre can use it as an icon, without
// relying on a star glyph being present in the map font.
function makeStarImage(size = 34) {
  const pixelRatio = 2;
  const s = size * pixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d');
  const cx = s / 2;
  const cy = s / 2;
  const spikes = 5;
  const outer = s * 0.44;
  const inner = s * 0.19;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#f4b400'; // gold
  ctx.strokeStyle = '#6b4a00'; // dark outline for contrast on the light map
  ctx.lineWidth = s * 0.07;
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  return { image: ctx.getImageData(0, 0, s, s), pixelRatio };
}

// All tree features, kept in memory so we can count and zoom to matches across
// the whole city — not just what's currently on screen.
let allFeatures = [];

// genus → number of trees in the city (filled on load). Drives the collection
// legend (which genera of a collection are actually present, and how many).
let genusCounts = new Map();
const genusCount = (genus) => genusCounts.get(genus) || 0;

// Trees added since the last successful data update (see newTreesLayerId).
let newTreesFeatures = [];

// "Verschwundene Bäume" — the annual memorial. Trees the update script recorded
// as gone. Only the trees of a *revealed* year (see goneRevealYear) are shown;
// a year is revealed from 1 December of that year.
let goneTreesFeatures = []; // the features of the currently revealed year
let goneRevealYear = null; // the year those features belong to (or null = teaser)

// Active filter values (null/false = inactive). `collection` holds the active
// collection object (or null); it's mutually exclusive with genus/species.
// `yearUnknown` ("nur Bäume ohne erfasstes Pflanzjahr") is mutually exclusive
// with yearMin/yearMax but combines freely with genus/species/collection —
// it's a toggle next to the year fields, not a themed collection, since it's a
// data-quality filter rather than a kind of tree (see the sidebar's year-field).
const filterState = { collection: null, genus: null, species: null, yearMin: null, yearMax: null, yearUnknown: false };

// Classic orchard-fruit genera — used to split the single-specimen trees into
// the "living gene bank" (old fruit varieties) versus the exotic "Einzelgänger".
const GENE_BANK_GENERA = new Set(['Malus', 'Prunus', 'Pyrus', 'Cydonia', 'Juglans', 'Mespilus']);

// Latin names (baumnamelat) that occur exactly once in the whole city, split by
// kind. Filled once the data is loaded; drive the two gold-star map modes.
let genbankNames = new Set(); // unique old fruit varieties
let loanerNames = new Set(); // unique non-fruit exotics

function computeSpeciesCounts() {
  const counts = new Map();
  const genusOf = new Map(); // latin name → genus (unambiguous for unique names)
  for (const f of allFeatures) {
    const n = f.properties[LATIN_NAME_FIELD];
    if (!n) continue;
    counts.set(n, (counts.get(n) || 0) + 1);
    genusOf.set(n, f.properties[GENUS_FIELD]);
  }
  const genbank = new Set();
  const loner = new Set();
  for (const [name, count] of counts) {
    if (count !== 1) continue;
    if (GENE_BANK_GENERA.has(genusOf.get(name))) genbank.add(name);
    else loner.add(name);
  }
  return { genbank, loner };
}

// True if a feature belongs to the active collection (a curated genus set).
function matchesCollection(p, c) {
  return c.genera.includes(p[GENUS_FIELD]);
}

function hasActiveFilter() {
  return !!(
    filterState.collection ||
    filterState.genus ||
    filterState.species ||
    filterState.yearMin != null ||
    filterState.yearMax != null ||
    filterState.yearUnknown
  );
}

function matchesFilter(f) {
  const p = f.properties;
  if (filterState.collection && !matchesCollection(p, filterState.collection)) return false;
  if (filterState.genus && p[GENUS_FIELD] !== filterState.genus) return false;
  if (filterState.species && p[SPECIES_FIELD] !== filterState.species) return false;
  if (filterState.yearUnknown) return p[YEAR_FIELD] == null;
  if (filterState.yearMin != null && !(p[YEAR_FIELD] >= filterState.yearMin)) return false;
  if (filterState.yearMax != null && !(p[YEAR_FIELD] <= filterState.yearMax)) return false;
  return true;
}

function buildMapFilter() {
  const e = ['all'];
  const c = filterState.collection;
  if (c) e.push(['in', ['get', GENUS_FIELD], ['literal', c.genera]]);
  if (filterState.genus) e.push(['==', ['get', GENUS_FIELD], filterState.genus]);
  if (filterState.species) e.push(['==', ['get', SPECIES_FIELD], filterState.species]);
  if (filterState.yearUnknown) e.push(['==', ['get', YEAR_FIELD], null]);
  if (filterState.yearMin != null) e.push(['>=', ['get', YEAR_FIELD], filterState.yearMin]);
  if (filterState.yearMax != null) e.push(['<=', ['get', YEAR_FIELD], filterState.yearMax]);
  return e;
}

// Frame the matching trees. maxZoom caps how far it zooms in, so a single match
// doesn't slam to street level; a city-wide match set just frames the whole
// city (exactly as you'd expect — many spread-out results = zoomed out).
function fitToMatches(matches) {
  if (!matches.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of matches) {
    const [x, y] = f.geometry.coordinates;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  map.fitBounds(
    [[minX, minY], [maxX, maxY]],
    { padding: 60, maxZoom: 16, duration: 800 }
  );
}

function applyFilters({ fit = false } = {}) {
  if (map.getLayer(layerId)) map.setFilter(layerId, buildMapFilter());
  const matches = hasActiveFilter() ? allFeatures.filter(matchesFilter) : allFeatures;
  updateTreeCount(matches.length);
  refreshLegend();
  if (fit && hasActiveFilter()) fitToMatches(matches);
}

// Free, keyless geocoding via OpenStreetMap Nominatim, biased to Zurich. Note
// Nominatim's usage policy: light use only, max ~1 request/second.
const geocoderApi = {
  forwardGeocode: async (config) => {
    const features = [];
    try {
      const params = new URLSearchParams({
        q: config.query,
        format: 'geojson',
        limit: '5',
        'accept-language': lang,
        viewbox: '8.44,47.30,8.63,47.44',
        bounded: '1',
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`
      );
      const geojson = await res.json();
      const seen = new Set(); // drop duplicate display names (e.g. street segments)
      for (const f of geojson.features || []) {
        const name = f.properties.display_name;
        if (seen.has(name)) continue;
        seen.add(name);
        const center =
          f.geometry?.type === 'Point'
            ? f.geometry.coordinates
            : f.bbox
              ? [(f.bbox[0] + f.bbox[2]) / 2, (f.bbox[1] + f.bbox[3]) / 2]
              : null;
        if (!center) continue;
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: center },
          place_name: f.properties.display_name,
          text: f.properties.display_name,
          properties: f.properties,
          center,
          place_type: ['place'],
        });
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }
    return { features };
  },
};

const map = new maplibregl.Map({
  container: 'map',
  // Keyless, account-free street map from OpenFreeMap (OpenStreetMap data).
  style: 'https://tiles.openfreemap.org/styles/bright',
  center: [8.5035171, 47.3579481],
  zoom: 12,
  attributionControl: false,
})
  .addControl(
    new maplibregl.AttributionControl({
      customAttribution: t('map.attribution'),
    })
  )
  .addControl(new maplibregl.FullscreenControl())
  .addControl(
    new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    })
  )
  .addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')
  .addControl(
    new MaplibreGeocoder(geocoderApi, {
      maplibregl,
      placeholder: t('geo.placeholder'),
      marker: false,
      // Auto-suggest: show matching places while typing. minLength + a generous
      // debounce keep us within Nominatim's fair-use policy (~1 request/sec).
      showResultsWhileTyping: true,
      minLength: 3,
      debounceSearch: 350,
    }),
    'top-left'
  );

// MapLibre picks a popup's anchor once, purely from which third of the map
// container the anchor point falls in — it has no idea how tall the popup's
// *content* is, and never revisits the decision once chosen. That's fine
// until the "Mehr anzeigen" <details> toggle grows the popup after the fact,
// which can push it past the edge of the screen with no way back (mobile).
// So instead of fighting MapLibre's own positioning, nudge the map itself by
// exactly however many pixels the popup now overflows by.
function keepPopupOnScreen(popup) {
  requestAnimationFrame(() => {
    const rect = popup.getElement().getBoundingClientRect();
    const mapRect = map.getContainer().getBoundingClientRect();
    const margin = 16;
    const overflowBottom = rect.bottom - (mapRect.bottom - margin);
    const overflowTop = mapRect.top + margin - rect.top;
    if (overflowBottom > 0) map.panBy([0, overflowBottom], { duration: 300 });
    else if (overflowTop > 0) map.panBy([0, -overflowTop], { duration: 300 });
  });
}

// Opens a tree's popup and keeps it on-screen as its content resizes (see
// keepPopupOnScreen above).
function openTreePopup(lngLat, properties) {
  const popup = new maplibregl.Popup()
    .setLngLat(lngLat)
    .setHTML(getPopupContent(properties))
    .addTo(map);
  popup.getElement().querySelector('.tp-more')?.addEventListener('toggle', () => {
    keepPopupOnScreen(popup);
  });
  return popup;
}

map.on('load', async () => {
  let treesData;
  try {
    treesData = await fetch('./trees.geojson').then((r) => r.json());
  } catch (e) {
    console.error('Could not load tree data:', e);
    return;
  }
  allFeatures = treesData.features;
  ({ genbank: genbankNames, loner: loanerNames } = computeSpeciesCounts());
  genusCounts = new Map();
  for (const f of allFeatures) {
    const g = f.properties[GENUS_FIELD];
    genusCounts.set(g, (genusCounts.get(g) || 0) + 1);
  }
  renderCuriosities();

  // Trees added since the last successful data update (written by the update
  // script as a small diff). Optional file — missing/empty just hides the button.
  let newTreesData = { type: 'FeatureCollection', features: [] };
  try {
    const r = await fetch('./new-trees.json');
    if (r.ok) newTreesData = await r.json();
  } catch (e) {
    /* optional — silently skip */
  }
  newTreesFeatures = newTreesData.features || [];
  setupNewTreesButton();

  // "Verschwundene Bäume" — the accumulated graveyard, grouped by the year each
  // tree vanished. Only a revealed year (from 1 December) is displayed.
  let goneTreesData = { type: 'FeatureCollection', features: [] };
  try {
    const r = await fetch('./gone-trees.json');
    if (r.ok) goneTreesData = await r.json();
  } catch (e) {
    /* optional — silently skip */
  }
  const revealed = pickRevealedGoneYear(goneTreesData.features || []);
  goneRevealYear = revealed.year;
  goneTreesFeatures = revealed.features;
  setupGoneTreesButton();

  map.addSource(sourceId, { type: 'geojson', data: treesData });

  map.addLayer({
    id: layerId,
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-color': buildGenusColorExpression(),
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 13, 3.5, 16, 5, 22, 9],
      // Opaque white halo so dots stay legible on any background.
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 13, 1, 16, 1.5, 22, 2],
      'circle-stroke-opacity': 1,
    },
  });

  // Gold star marker for the treasure map (drawn on a canvas so we don't depend
  // on a font glyph being available).
  if (!map.hasImage('treasure-star')) {
    const star = makeStarImage();
    map.addImage('treasure-star', star.image, { pixelRatio: star.pixelRatio });
  }

  // Treasure layer: rare trees as gold stars. The filter is set per mode
  // (gene bank / Einzelgänger) on activation; starts matching nothing.
  map.addLayer({
    id: treasureLayerId,
    type: 'symbol',
    source: sourceId,
    filter: ['in', ['get', LATIN_NAME_FIELD], ['literal', []]],
    layout: {
      'icon-image': 'treasure-star',
      'icon-allow-overlap': true,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 13, 0.55, 16, 0.75, 20, 1],
      visibility: 'none',
    },
  });

  // New-trees layer: its own small source (not filtered from the main one),
  // since "new since last update" isn't a property of a tree — it's a diff
  // result computed once by the update script. Hidden until toggled on.
  map.addSource(newTreesSourceId, { type: 'geojson', data: newTreesData });
  map.addLayer({
    id: newTreesLayerId,
    type: 'circle',
    source: newTreesSourceId,
    paint: {
      'circle-color': '#22c55e',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 13, 6, 16, 8, 22, 13],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-stroke-opacity': 1,
    },
    layout: { visibility: 'none' },
  });

  // Gone-trees layer: muted grey "ghosts" of the revealed year. Hidden until toggled.
  map.addSource(goneTreesSourceId, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: goneTreesFeatures },
  });
  map.addLayer({
    id: goneTreesLayerId,
    type: 'circle',
    source: goneTreesSourceId,
    paint: {
      'circle-color': '#8a938c',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 13, 5, 16, 7, 22, 11],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-stroke-opacity': 1,
      'circle-opacity': 0.85,
    },
    layout: { visibility: 'none' },
  });

  const showPopup = (e) => {
    openTreePopup(e.lngLat, e.features[0].properties);
  };
  for (const id of [layerId, treasureLayerId, newTreesLayerId, goneTreesLayerId]) {
    map.on('mouseenter', id, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', id, () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('click', id, showPopup);
  }

  applyFilters(); // initial count (whole city, no zoom)
});

/* ------------------------------------------------------------------ *
 * Live count of distinct visible trees
 * ------------------------------------------------------------------ */
const treeCountElem = document.querySelector('#tree-count');

// Show when the tree data was last pulled from the city's WFS (written by the
// update script into data-version.json), plus the next scheduled check — the
// Raspi cron runs on fixed calendar dates, the 1st and the 15th of each month
// (not "every 15 days"), so this finds the next of those two dates after today.
function nextScheduledUpdate(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  while (d.getDate() !== 1 && d.getDate() !== 15) d.setDate(d.getDate() + 1);
  return d;
}
fetch('./data-version.json')
  .then((r) => (r.ok ? r.json() : null))
  .then((v) => {
    const dateEl = document.querySelector('#data-date');
    const nextEl = document.querySelector('#next-update');
    if (!v?.pulled) return;
    const [y, m, d] = v.pulled.split('-').map(Number);
    if (!y || !m || !d) return;
    // German: DD.MM.YYYY; English: "15 Jul 2026".
    const fmt = (dt) =>
      lang === 'en'
        ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
    if (dateEl) dateEl.textContent = t('footer.dataDate', { date: fmt(new Date(y, m - 1, d)) });
    if (nextEl) nextEl.textContent = t('footer.nextUpdate', { date: fmt(nextScheduledUpdate()) });
  })
  .catch(() => {});

// Stable total across all of Zurich (not just the viewport): how many trees
// match the active filter. With no filter it's simply the grand total.
function updateTreeCount(matchCount) {
  if (!treeCountElem) return;
  const total = allFeatures.length;
  treeCountElem.textContent = hasActiveFilter()
    ? t('count.filtered', { n: numberFormat.format(matchCount), total: numberFormat.format(total) })
    : t('count.total', { total: numberFormat.format(total) });
}

/* ------------------------------------------------------------------ *
 * Sidebar wiring
 * ------------------------------------------------------------------ */
const genusSelect = document.querySelector('#baumgattung_id');
const artSelect = document.querySelector('#baumart_lat_id');
const yearMinInput = document.querySelector('#year_min');
const yearMaxInput = document.querySelector('#year_max');
const yearUnknownToggle = document.querySelector('#year-unknown-toggle');

const MIN_YEAR = 1665;
const MAX_YEAR = new Date().getFullYear();
for (const input of [yearMinInput, yearMaxInput]) {
  input.min = MIN_YEAR;
  input.max = MAX_YEAR;
}
yearMinInput.value = MIN_YEAR;
yearMaxInput.value = MAX_YEAR;

// Genus dropdown: curated name (de/en) with Latin in parentheses where known,
// else Latin only.
for (const genus of treeMeta.genera) {
  const name = genusName(genus);
  const option = document.createElement('option');
  option.value = genus;
  option.textContent = name !== genus ? `${name} (${genus})` : genus;
  genusSelect.appendChild(option);
}

function fillSpecies(genus) {
  artSelect.innerHTML = allSpeciesOption();
  for (const { art, label } of treeMeta.speciesByGenus[genus] || []) {
    const option = document.createElement('option');
    option.value = art; // baumartlat — selecting it shows all cultivars
    option.textContent = speciesLabel(genus, art, label);
    artSelect.appendChild(option);
  }
}

genusSelect.addEventListener('change', (e) => {
  exitAllModes();
  const genus = e.target.value;
  filterState.species = null; // species are scoped to a genus
  // Genus and collections are mutually exclusive.
  filterState.collection = null;
  clearCollectionUI();
  if (genus === '0') {
    filterState.genus = null;
    artSelect.innerHTML = allSpeciesOption();
  } else {
    filterState.genus = genus;
    fillSpecies(genus);
  }
  applyFilters({ fit: true });
});

artSelect.addEventListener('change', (e) => {
  const name = e.target.value;
  filterState.species = name === '0' ? null : name;
  applyFilters({ fit: true });
});

document.querySelector('#apply_filters').addEventListener('click', () => {
  exitAllModes();
  if (!filterState.yearUnknown) {
    filterState.yearMin = Number(yearMinInput.value) || MIN_YEAR;
    filterState.yearMax = Number(yearMaxInput.value) || MAX_YEAR;
  }
  applyFilters({ fit: true });
});

// "Nur Bäume mit unbekanntem Pflanzjahr" — a toggle next to the year fields
// rather than a themed collection, since it's a data-quality filter (helps
// spot gaps in the city's archive), not a kind of tree. Combines freely with
// genus/species/collection, but is mutually exclusive with a year range —
// a tree can't both have no recorded year and fall within one.
yearUnknownToggle.addEventListener('click', () => {
  exitAllModes();
  const active = yearUnknownToggle.getAttribute('aria-pressed') !== 'true';
  filterState.yearUnknown = active;
  yearUnknownToggle.classList.toggle('is-active', active);
  yearUnknownToggle.setAttribute('aria-pressed', String(active));
  yearMinInput.disabled = active;
  yearMaxInput.disabled = active;
  if (active) {
    filterState.yearMin = null;
    filterState.yearMax = null;
  }
  applyFilters({ fit: true });
});

document.querySelector('#reset_filters').addEventListener('click', () => {
  exitAllModes();
  resetFilterSelection();
  yearMinInput.value = MIN_YEAR;
  yearMaxInput.value = MAX_YEAR;
  filterState.yearMin = null;
  filterState.yearMax = null;
  applyFilters(); // no auto-zoom on reset
});

/* ------------------------------------------------------------------ *
 * Rarities — gold-star map modes (gene bank & Einzelgänger)
 * ------------------------------------------------------------------ */
const treasureModes = {
  genbank: {
    btn: document.querySelector('#genbank-toggle'),
    names: () => genbankNames,
    label: (n) => t('count.genbank', { n: numberFormat.format(n) }),
  },
  loner: {
    btn: document.querySelector('#loner-toggle'),
    names: () => loanerNames,
    label: (n) => t('count.loner', { n: numberFormat.format(n) }),
  },
};
let activeTreasure = null; // 'genbank' | 'loner' | null

// Restore the normal map without touching the filter state (used when the user
// switches to a regular filter while a gold-star mode is open).
function exitTreasureMode() {
  if (!activeTreasure) return;
  const { btn } = treasureModes[activeTreasure];
  btn.classList.remove('is-active');
  btn.setAttribute('aria-pressed', 'false');
  activeTreasure = null;
  if (map.getLayer(treasureLayerId)) map.setLayoutProperty(treasureLayerId, 'visibility', 'none');
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'visible');
}

function toggleTreasure(modeKey) {
  if (activeTreasure === modeKey) {
    exitTreasureMode();
    applyFilters();
    return;
  }
  if (!allFeatures.length) return; // data not loaded yet
  exitAllModes(); // turn off any other mode if it was active

  // A gold-star mode is its own view — clear any active filters/collections.
  resetFilterSelection();
  refreshLegend();

  const mode = treasureModes[modeKey];
  const names = mode.names();
  activeTreasure = modeKey;
  mode.btn.classList.add('is-active');
  mode.btn.setAttribute('aria-pressed', 'true');
  map.setFilter(treasureLayerId, ['in', ['get', LATIN_NAME_FIELD], ['literal', [...names]]]);
  map.setLayoutProperty(layerId, 'visibility', 'none');
  map.setLayoutProperty(treasureLayerId, 'visibility', 'visible');

  const matches = allFeatures.filter((f) => names.has(f.properties[LATIN_NAME_FIELD]));
  if (treeCountElem) treeCountElem.textContent = mode.label(matches.length);
  fitToMatches(matches);
}

treasureModes.genbank.btn.addEventListener('click', () => toggleTreasure('genbank'));
treasureModes.loner.btn.addEventListener('click', () => toggleTreasure('loner'));

/* ------------------------------------------------------------------ *
 * New trees — highlight what was added since the last data update
 * ------------------------------------------------------------------ */
const newTreesBtn = document.querySelector('#new-trees-toggle');
let newTreesModeActive = false;

function newTreesLabel(n) {
  return n === 1 ? t('new.one') : t('new.many', { n: numberFormat.format(n) });
}

// Show the button only if the last update actually added trees — nothing to
// see otherwise, so no point cluttering the sidebar with a dead button.
function setupNewTreesButton() {
  if (!newTreesFeatures.length) {
    newTreesBtn.hidden = true;
    return;
  }
  newTreesBtn.hidden = false;
  newTreesBtn.textContent = newTreesLabel(newTreesFeatures.length);
}

function exitNewTreesMode() {
  if (!newTreesModeActive) return;
  newTreesModeActive = false;
  newTreesBtn.classList.remove('is-active');
  newTreesBtn.setAttribute('aria-pressed', 'false');
  if (map.getLayer(newTreesLayerId)) map.setLayoutProperty(newTreesLayerId, 'visibility', 'none');
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'visible');
}

function toggleNewTreesMode() {
  if (newTreesModeActive) {
    exitNewTreesMode();
    applyFilters();
    return;
  }
  if (!newTreesFeatures.length) return;
  exitAllModes();

  // Its own view — clear any active filters/collections, same as the other modes.
  resetFilterSelection();
  refreshLegend();

  newTreesModeActive = true;
  newTreesBtn.classList.add('is-active');
  newTreesBtn.setAttribute('aria-pressed', 'true');
  map.setLayoutProperty(layerId, 'visibility', 'none');
  map.setLayoutProperty(newTreesLayerId, 'visibility', 'visible');

  if (treeCountElem) treeCountElem.textContent = newTreesLabel(newTreesFeatures.length);
  fitToMatches(newTreesFeatures);
}

newTreesBtn.addEventListener('click', toggleNewTreesMode);

/* ------------------------------------------------------------------ *
 * Verschwundene Bäume — annual "In Memoriam", revealed each December
 * ------------------------------------------------------------------ */
const goneTreesBtn = document.querySelector('#gone-trees-toggle');
const goneNoteEl = document.querySelector('#gone-note');
let goneModeActive = false;

// Tracking of vanished trees began mid-2026, so 2026's memorial is partial.
// Years after this are tracked for the full year → complete, no disclaimer.
const GONE_INCOMPLETE_THROUGH_YEAR = 2026;

// Group the graveyard by disappearance year and pick the newest year that is
// already "revealed" — a year is revealed from 1 December of that year onward.
function pickRevealedGoneYear(features) {
  const byYear = new Map();
  for (const f of features) {
    const d = f.properties?.verschwunden;
    const y = d ? Number(String(d).slice(0, 4)) : 0;
    if (!y) continue;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(f);
  }
  const now = new Date();
  const revealed = [...byYear.keys()]
    .filter((y) => now >= new Date(y, 11, 1)) // month 11 = December
    .sort((a, b) => b - a);
  const year = revealed[0] ?? null;
  return { year, features: year ? byYear.get(year) : [] };
}

function goneLabel(year, n) {
  const key = n === 1 ? 'gone.one' : 'gone.many';
  return t(key, { n: numberFormat.format(n), year });
}

// Button is always visible. Active once a year is revealed and has data; a teaser
// (greyed, not clickable, tooltip) otherwise so the feature is already visible.
function setupGoneTreesButton() {
  if (goneRevealYear && goneTreesFeatures.length) {
    goneTreesBtn.classList.remove('is-teaser');
    goneTreesBtn.setAttribute('aria-disabled', 'false');
    goneTreesBtn.removeAttribute('title');
    goneTreesBtn.textContent = goneLabel(goneRevealYear, goneTreesFeatures.length);
  } else {
    const year = new Date().getFullYear();
    goneTreesBtn.classList.add('is-teaser');
    goneTreesBtn.setAttribute('aria-disabled', 'true');
    goneTreesBtn.title = t('gone.teaserTitle', { year });
    goneTreesBtn.textContent = t('gone.teaser', { year });
  }
}

function exitGoneMode() {
  if (!goneModeActive) return;
  goneModeActive = false;
  goneTreesBtn.classList.remove('is-active');
  goneTreesBtn.setAttribute('aria-pressed', 'false');
  if (goneNoteEl) goneNoteEl.hidden = true;
  if (map.getLayer(goneTreesLayerId)) map.setLayoutProperty(goneTreesLayerId, 'visibility', 'none');
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'visible');
}

// The three exclusive map "views" (gold-star rarities, new trees, gone trees)
// are mutually exclusive with each other and with a regular filter — entering
// any one of them, or applying a regular filter, first backs out of whichever
// of these might currently be active. Each exit function already guards
// against exiting a mode that isn't active, so calling all three unconditionally
// is always safe.
function exitAllModes() {
  exitTreasureMode();
  exitNewTreesMode();
  exitGoneMode();
}

// Clears any active genus/species/collection/year-unknown filter and resets
// the matching UI controls (dropdown, collection chips, year-unknown toggle).
// None of the three exclusive modes above mix with a manual filter selection,
// so this runs alongside exitAllModes() whenever entering one of them or resetting.
function resetFilterSelection() {
  clearCollectionUI();
  genusSelect.value = '0';
  artSelect.innerHTML = allSpeciesOption();
  filterState.collection = null;
  filterState.genus = null;
  filterState.species = null;
  filterState.yearUnknown = false;
  yearUnknownToggle.classList.remove('is-active');
  yearUnknownToggle.setAttribute('aria-pressed', 'false');
  yearMinInput.disabled = false;
  yearMaxInput.disabled = false;
}

function toggleGoneMode() {
  if (goneTreesBtn.getAttribute('aria-disabled') === 'true') return; // teaser: not yet available
  if (goneModeActive) {
    exitGoneMode();
    applyFilters();
    return;
  }
  if (!goneTreesFeatures.length) return;
  exitAllModes();

  // Its own view — clear any active filters/collections, same as the other modes.
  resetFilterSelection();
  refreshLegend();

  goneModeActive = true;
  goneTreesBtn.classList.add('is-active');
  goneTreesBtn.setAttribute('aria-pressed', 'true');
  map.setLayoutProperty(layerId, 'visibility', 'none');
  map.setLayoutProperty(goneTreesLayerId, 'visibility', 'visible');

  if (treeCountElem) treeCountElem.textContent = goneLabel(goneRevealYear, goneTreesFeatures.length);
  if (goneNoteEl) {
    if (goneRevealYear <= GONE_INCOMPLETE_THROUGH_YEAR) {
      goneNoteEl.textContent = t('gone.note', { year: goneRevealYear });
      goneNoteEl.hidden = false;
    } else {
      goneNoteEl.hidden = true;
    }
  }
  fitToMatches(goneTreesFeatures);
}

goneTreesBtn.addEventListener('click', toggleGoneMode);

/* ------------------------------------------------------------------ *
 * Curiosities — a clickable list that jumps to an exotic genus
 * ------------------------------------------------------------------ */
const curiosityListEl = document.querySelector('#curiosities-list');

// Select a genus the same way the dropdown does (clears treasure mode /
// collections, zooms to the matches) — reuses the dropdown change handler.
function jumpToGenus(genus) {
  genusSelect.value = genus;
  genusSelect.dispatchEvent(new Event('change'));
}

function renderCuriosities() {
  if (!curiosityListEl) return;
  // Genus counts are already available in the module-level genusCounts map
  // (computed once on data load); only genus+species pairs need counting
  // here, so curiosities can be pinned to a single species when the genus
  // holds several (e.g. Zanthoxylum piperitum).
  const speciesCounts = new Map();
  for (const f of allFeatures) {
    const key = `${f.properties[GENUS_FIELD]}|${f.properties[SPECIES_FIELD]}`;
    speciesCounts.set(key, (speciesCounts.get(key) || 0) + 1);
  }
  curiosityListEl.innerHTML = '';
  for (const c of curiosities) {
    const n = c.art
      ? speciesCounts.get(`${c.genus}|${c.art}`) || 0
      : genusCount(c.genus);
    if (!n) continue; // skip entries not present in the current data
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'curio-item';
    // Most emoji fit either language; a few are {de,en} where the German and
    // English names evoke different imagery (e.g. Geweihbaum → 🦌 vs. Kentucky
    // coffeetree → ☕).
    const emoji = typeof c.emoji === 'string' ? c.emoji : localized(c.emoji);
    btn.innerHTML =
      `<span class="curio-name">${emoji} ${localized(c.label)}</span>` +
      `<span class="curio-count">${numberFormat.format(n)}×</span>`;
    btn.addEventListener('click', () =>
      c.art ? jumpToSpecies(c.genus, c.art) : jumpToGenus(c.genus)
    );
    li.appendChild(btn);
    curiosityListEl.appendChild(li);
  }
}

/* ------------------------------------------------------------------ *
 * Collections — curated theme chips (mutually exclusive with genus)
 * ------------------------------------------------------------------ */
const collectionsEl = document.querySelector('#collections');
const collectionChips = new Map(); // id → button

function clearCollectionUI() {
  for (const btn of collectionChips.values()) {
    btn.classList.remove('is-active');
    btn.setAttribute('aria-pressed', 'false');
  }
}

function toggleCollection(c, btn) {
  exitAllModes();
  const wasActive = filterState.collection?.id === c.id;
  clearCollectionUI();
  if (wasActive) {
    // Toggling off: drop the collection and any genus drilled into within it.
    filterState.collection = null;
    filterState.genus = null;
    filterState.species = null;
    applyFilters(); // no auto-zoom, back to full city
    return;
  }
  filterState.collection = c;
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed', 'true');
  // A collection replaces any manual genus/species selection.
  filterState.genus = null;
  filterState.species = null;
  genusSelect.value = '0';
  artSelect.innerHTML = allSpeciesOption();
  applyFilters({ fit: true });
}

for (const c of collections) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'collection-chip';
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = localized(c.label); // chips are UI chrome — typographic only (emojis stay in content lists)
  btn.addEventListener('click', () => toggleCollection(c, btn));
  collectionsEl.appendChild(btn);
  collectionChips.set(c.id, btn);
}

/* ------------------------------------------------------------------ *
 * Tree search with auto-suggest (genera + species, German & Latin)
 * ------------------------------------------------------------------ */
const treeSearchInput = document.querySelector('#tree-search');
const treeSuggestionsEl = document.querySelector('#tree-suggestions');

// Build a search index once: one entry per genus and per species, each with a
// lowercased haystack of German + Latin names.
const searchIndex = [];
for (const genus of treeMeta.genera) {
  const name = genusName(genus);
  const named = name !== genus ? name : '';
  searchIndex.push({
    kind: 'genus',
    genus,
    label: named ? `${name} (${genus})` : genus,
    sub: t('search.genus'),
    // Include both curated names so search works regardless of UI language.
    search: `${named} ${genus}`.toLowerCase(),
  });
  for (const { art, label } of treeMeta.speciesByGenus[genus] || []) {
    searchIndex.push({
      kind: 'species',
      genus,
      art,
      label: speciesLabel(genus, art, label),
      sub: `${t('search.species')} · ${name}`,
      // German label kept in the haystack so German names still match in EN mode.
      search: `${label} ${genus} ${art} ${named}`.toLowerCase(),
    });
  }
}

let suggestions = [];
let activeSuggestion = -1;

function searchTrees(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts = [];
  const contains = [];
  for (const e of searchIndex) {
    const i = e.search.indexOf(q);
    if (i === -1) continue;
    if (i === 0 || e.search.includes(' ' + q)) starts.push(e);
    else contains.push(e);
  }
  return [...starts, ...contains].slice(0, 8);
}

function hideSuggestions() {
  treeSuggestionsEl.hidden = true;
  treeSuggestionsEl.innerHTML = '';
  treeSearchInput.setAttribute('aria-expanded', 'false');
  activeSuggestion = -1;
}

function renderSuggestions() {
  if (!suggestions.length) {
    hideSuggestions();
    return;
  }
  treeSuggestionsEl.innerHTML = '';
  suggestions.forEach((e, idx) => {
    const li = document.createElement('li');
    li.className = 'tree-suggestion' + (idx === activeSuggestion ? ' is-active' : '');
    li.setAttribute('role', 'option');
    li.innerHTML = `<span class="ts-label">${e.label}</span><span class="ts-sub">${e.sub}</span>`;
    li.addEventListener('mousedown', (ev) => {
      ev.preventDefault(); // keep focus so blur doesn't fire first
      selectSuggestion(idx);
    });
    treeSuggestionsEl.appendChild(li);
  });
  treeSuggestionsEl.hidden = false;
  treeSearchInput.setAttribute('aria-expanded', 'true');
}

function jumpToSpecies(genus, art) {
  genusSelect.value = genus;
  genusSelect.dispatchEvent(new Event('change')); // fills species options + sets genus
  artSelect.value = art;
  artSelect.dispatchEvent(new Event('change')); // sets species filter + zooms
}

function selectSuggestion(idx) {
  const e = suggestions[idx];
  if (!e) return;
  treeSearchInput.value = e.label;
  hideSuggestions();
  if (e.kind === 'genus') jumpToGenus(e.genus);
  else jumpToSpecies(e.genus, e.art);
}

treeSearchInput.addEventListener('input', () => {
  suggestions = searchTrees(treeSearchInput.value);
  activeSuggestion = -1;
  renderSuggestions();
});

treeSearchInput.addEventListener('keydown', (ev) => {
  if (treeSuggestionsEl.hidden) return;
  if (ev.key === 'ArrowDown') {
    ev.preventDefault();
    activeSuggestion = Math.min(activeSuggestion + 1, suggestions.length - 1);
    renderSuggestions();
  } else if (ev.key === 'ArrowUp') {
    ev.preventDefault();
    activeSuggestion = Math.max(activeSuggestion - 1, 0);
    renderSuggestions();
  } else if (ev.key === 'Enter') {
    ev.preventDefault();
    selectSuggestion(activeSuggestion >= 0 ? activeSuggestion : 0);
  } else if (ev.key === 'Escape') {
    hideSuggestions();
  }
});

treeSearchInput.addEventListener('focus', () => {
  if (treeSearchInput.value.trim().length >= 2) {
    suggestions = searchTrees(treeSearchInput.value);
    renderSuggestions();
  }
});
treeSearchInput.addEventListener('blur', () => setTimeout(hideSuggestions, 150));

// Legend from the same GENUS_COLORS source as the map. Each named genus is a
// clickable filter (jumps to that genus like the dropdown); "Andere" is the
// catch-all fallback and stays a plain, non-clickable row.
const legendEl = document.querySelector('#legend');

function makeSwatch(color) {
  const s = document.createElement('span');
  s.className = 'legend-swatch';
  s.style.background = color;
  return s;
}
function makeLabel(name) {
  const l = document.createElement('span');
  l.textContent = name;
  return l;
}

const legendHintEl = document.querySelector('.legend-hint');
const legendButtons = new Map(); // genus → button, for active-state highlighting

// Drill into a single genus while staying inside the active collection: set (or
// clear) the genus filter without touching the collection, so the collection
// legend stays put and you can hop from one genus to the next. Collection ∩ genus
// equals just that genus (it's a member), so the map shows only it.
function selectGenusInCollection(genus) {
  const select = filterState.genus !== genus;
  filterState.genus = select ? genus : null;
  filterState.species = null;
  applyFilters({ fit: select }); // zoom in when picking; stay put when clearing
}

// One clickable genus row (swatch + name + optional count). In collection mode a
// click drills within the collection; otherwise it isolates that genus on the
// map (or, if already the active filter, clears it).
function makeGenusRow(genus, count, collectionMode) {
  const name = `${genusName(genus)} (${genus})`;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'legend-row legend-btn';
  btn.dataset.name = name;
  btn.title = t('legend.onlyShow', { name });
  btn.append(makeSwatch(genusColor(genus)), makeLabel(name));
  if (count != null) {
    const c = document.createElement('span');
    c.className = 'legend-count';
    c.textContent = numberFormat.format(count);
    btn.appendChild(c);
  }
  btn.addEventListener('click', () => {
    if (collectionMode) {
      selectGenusInCollection(genus);
    } else if (filterState.genus === genus) {
      genusSelect.value = '0';
      genusSelect.dispatchEvent(new Event('change'));
    } else {
      jumpToGenus(genus);
    }
  });
  legendButtons.set(genus, btn);
  return btn;
}

// Default legend: the fixed set of colour-coded genera + an "Andere" catch-all.
// Doubles as the map's colour key.
function renderDefaultLegend() {
  legendEl.innerHTML = '';
  legendButtons.clear();
  for (const { genus, color } of GENUS_COLORS) {
    legendEl.appendChild(makeGenusRow(genus));
  }
  const row = document.createElement('div');
  row.className = 'legend-row';
  row.append(makeSwatch(OTHER_COLOR), makeLabel(t('legend.other')));
  legendEl.appendChild(row);
}

// Collection legend: the genera of the active collection that actually occur in
// the data, most common first, each with its count and clickable to isolate.
function renderCollectionLegend(collection) {
  legendEl.innerHTML = '';
  legendButtons.clear();
  const present = collection.genera
    .filter((g) => genusCount(g) > 0)
    .sort((a, b) => genusCount(b) - genusCount(a));
  for (const genus of present) {
    legendEl.appendChild(makeGenusRow(genus, genusCount(genus), true));
  }
}

// Keep the legend in sync with filterState: the collection's genera when a
// collection is active, otherwise the fixed default. Only rebuilds when the mode
// actually changes (guarded by renderedLegendKey) to avoid needless DOM churn.
let renderedLegendKey = null;
function refreshLegend() {
  const key = filterState.collection?.id ?? '__default__';
  if (key !== renderedLegendKey) {
    if (filterState.collection) renderCollectionLegend(filterState.collection);
    else renderDefaultLegend();
    if (legendHintEl) {
      legendHintEl.textContent = filterState.collection
        ? t('legend.hintCollection')
        : t('legend.hint');
    }
    renderedLegendKey = key;
  }
  updateLegendHighlight();
}

// Highlight the legend row of the currently filtered genus (if it's shown).
function updateLegendHighlight() {
  for (const [genus, btn] of legendButtons) {
    const active = filterState.genus === genus;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.title = active ? t('legend.clear') : t('legend.onlyShow', { name: btn.dataset.name });
  }
}

renderDefaultLegend();
renderedLegendKey = '__default__';

/* ------------------------------------------------------------------ *
 * Zahlen & Trends modal
 * ------------------------------------------------------------------ */
const statsModal = document.querySelector('#stats-modal');
const statsBody = document.querySelector('#stats-body');

function openStats() {
  if (!allFeatures.length) {
    statsBody.innerHTML = `<p class="stats-lead">${t('stats.loading')}</p>`;
  } else {
    statsBody.innerHTML = renderStatsHTML(computeStats(allFeatures));
  }
  statsModal.hidden = false;
}

function closeStats() {
  statsModal.hidden = true;
}

document.querySelector('#open-stats').addEventListener('click', openStats);
statsModal.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close')) closeStats();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !statsModal.hidden) closeStats();
});

/* ------------------------------------------------------------------ *
 * First-visit onboarding — shown once, reopenable via the "?" button
 * ------------------------------------------------------------------ */
const INTRO_SEEN_KEY = 'introSeen';
const introModal = document.querySelector('#intro-modal');
const introBody = document.querySelector('#intro-body');

function renderIntroHTML() {
  return `
    <h2 id="intro-title">${t('intro.title')}</h2>
    <p>${t('intro.lead')}</p>
    <ul>
      <li>${t('intro.point1')}</li>
      <li>${t('intro.point2')}</li>
      <li>${t('intro.point3')}</li>
    </ul>
    <button id="intro-cta" type="button" class="btn btn-primary intro-cta">${t('intro.cta')}</button>
  `;
}

function openIntro() {
  introBody.innerHTML = renderIntroHTML();
  introModal.hidden = false;
  document.querySelector('#intro-cta').addEventListener('click', closeIntro);
}

function closeIntro() {
  introModal.hidden = true;
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch (e) {
    /* private mode / storage blocked — intro just reopens next visit */
  }
}

document.querySelector('#intro-help').addEventListener('click', openIntro);
introModal.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close')) closeIntro();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !introModal.hidden) closeIntro();
});

// Onboarding is a mobile concern — on desktop the filter sidebar is already
// fully visible, so there's nothing to "discover" behind a collapsed panel.
let introSeen = false;
try {
  introSeen = localStorage.getItem(INTRO_SEEN_KEY) === '1';
} catch (e) {
  /* private mode / storage blocked — treat as not seen */
}
if (!introSeen && matchMedia('(max-width: 760px)').matches) openIntro();

// Fly to a specific tree (by coordinates) and open its popup.
function flyToTree(lng, lat) {
  map.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
  const f = allFeatures.find((ft) => {
    const [x, y] = ft.geometry.coordinates;
    return Math.abs(x - lng) < 1e-6 && Math.abs(y - lat) < 1e-6;
  });
  if (f) {
    openTreePopup([lng, lat], f.properties);
  }
}

// Filter to a planting-year range (used by the decade bars in the stats modal).
function applyYearRange(min, max) {
  exitAllModes();
  resetFilterSelection();
  filterState.yearMin = min;
  filterState.yearMax = max;
  yearMinInput.value = min;
  yearMaxInput.value = max;
  applyFilters({ fit: true });
}

// Clickable stats: genus → filter, coords → fly to tree, year → year filter.
// The modal closes first so the result is visible on the map.
function handleStatsAction(el) {
  if (el.dataset.genus) {
    closeStats();
    jumpToGenus(el.dataset.genus);
  } else if (el.dataset.lng) {
    closeStats();
    flyToTree(parseFloat(el.dataset.lng), parseFloat(el.dataset.lat));
  } else if (el.dataset.yearMin) {
    closeStats();
    applyYearRange(Number(el.dataset.yearMin), Number(el.dataset.yearMax));
  }
}
statsBody.addEventListener('click', (e) => {
  const el = e.target.closest('[data-genus],[data-lng],[data-year-min]');
  if (el) handleStatsAction(el);
});
statsBody.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[data-genus],[data-lng],[data-year-min]');
  if (el) {
    e.preventDefault();
    handleStatsAction(el);
  }
});

// Mobile: toggle the sidebar and let the map reclaim the space.
const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebar-toggle');
sidebarToggle.addEventListener('click', () => {
  const willHide = !sidebar.hasAttribute('hidden');
  sidebar.toggleAttribute('hidden', willHide);
  sidebarToggle.setAttribute('aria-expanded', String(!willHide));
  map.resize();
});
