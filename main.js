import { GenusDeNames } from './GenusDeNames.js';
import { treeMeta } from './treeMeta.js';
import { getPopupContent } from './helpers.js';
import { collections } from './collections.js';
import { curiosities } from './curiosities.js';
import { computeStats, renderStatsHTML } from './stats.js';

const layerId = 'tree-points-layer';
const treasureLayerId = 'treasure-stars-layer';
const sourceId = 'zurich-trees';

// Field names from the official Stadt Zürich Baumkataster GeoJSON.
const GENUS_FIELD = 'baumgattunglat'; // latin genus, e.g. "Acer"
const SPECIES_FIELD = 'baumartlat'; // latin species epithet — groups all cultivars
const YEAR_FIELD = 'pflanzjahr';

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

// Full latin species name (baumnamelat → baumnamelat) field, used for rarity.
const LATIN_NAME_FIELD = 'baumnamelat';

// Active filter values (null = inactive). `collection` holds the active
// collection object (or null); it's mutually exclusive with genus/species.
const filterState = { collection: null, genus: null, species: null, yearMin: null, yearMax: null };

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
    filterState.yearMax != null
  );
}

function matchesFilter(f) {
  const p = f.properties;
  if (filterState.collection && !matchesCollection(p, filterState.collection)) return false;
  if (filterState.genus && p[GENUS_FIELD] !== filterState.genus) return false;
  if (filterState.species && p[SPECIES_FIELD] !== filterState.species) return false;
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
        'accept-language': 'de',
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
      customAttribution: 'Baumdaten: Stadt Zürich (Baumkataster)',
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
      placeholder: 'Ort suchen',
      marker: false,
      // Auto-suggest: show matching places while typing. minLength + a generous
      // debounce keep us within Nominatim's fair-use policy (~1 request/sec).
      showResultsWhileTyping: true,
      minLength: 3,
      debounceSearch: 350,
    }),
    'top-left'
  );

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
  renderCuriosities();

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

  const showPopup = (e) => {
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(getPopupContent(e.features[0].properties))
      .addTo(map);
  };
  for (const id of [layerId, treasureLayerId]) {
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
const numberFormat = new Intl.NumberFormat('de-CH');

// Show when the tree data was last pulled from the city's WFS (written by the
// update script into data-version.json). Silently skipped if unavailable.
fetch('./data-version.json')
  .then((r) => (r.ok ? r.json() : null))
  .then((v) => {
    const dateEl = document.querySelector('#data-date');
    if (!dateEl || !v?.pulled) return;
    const [y, m, d] = v.pulled.split('-');
    if (y && m && d) dateEl.textContent = ` · Datenstand: ${d}.${m}.${y}`;
  })
  .catch(() => {});

// Stable total across all of Zurich (not just the viewport): how many trees
// match the active filter. With no filter it's simply the grand total.
function updateTreeCount(matchCount) {
  if (!treeCountElem) return;
  const total = allFeatures.length;
  treeCountElem.textContent = hasActiveFilter()
    ? `${numberFormat.format(matchCount)} von ${numberFormat.format(total)} Bäumen`
    : `${numberFormat.format(total)} Bäume`;
}

/* ------------------------------------------------------------------ *
 * Sidebar wiring
 * ------------------------------------------------------------------ */
const genusSelect = document.querySelector('#baumgattung_id');
const artSelect = document.querySelector('#baumart_lat_id');
const yearMinInput = document.querySelector('#year_min');
const yearMaxInput = document.querySelector('#year_max');

const MIN_YEAR = 1665;
const MAX_YEAR = new Date().getFullYear();
for (const input of [yearMinInput, yearMaxInput]) {
  input.min = MIN_YEAR;
  input.max = MAX_YEAR;
}
yearMinInput.value = MIN_YEAR;
yearMaxInput.value = MAX_YEAR;

// Genus dropdown: German name with Latin in parentheses where known, else Latin.
for (const genus of treeMeta.genera) {
  const de = GenusDeNames[genus];
  const option = document.createElement('option');
  option.value = genus;
  option.textContent = de ? `${de} (${genus})` : genus;
  genusSelect.appendChild(option);
}

function fillSpecies(genus) {
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  for (const { art, label } of treeMeta.speciesByGenus[genus] || []) {
    const option = document.createElement('option');
    option.value = art; // baumartlat — selecting it shows all cultivars
    option.textContent = label;
    artSelect.appendChild(option);
  }
}

genusSelect.addEventListener('change', (e) => {
  exitTreasureMode();
  const genus = e.target.value;
  filterState.species = null; // species are scoped to a genus
  // Genus and collections are mutually exclusive.
  filterState.collection = null;
  clearCollectionUI();
  if (genus === '0') {
    filterState.genus = null;
    artSelect.innerHTML = '<option value="0">Alle Arten</option>';
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
  exitTreasureMode();
  filterState.yearMin = Number(yearMinInput.value) || MIN_YEAR;
  filterState.yearMax = Number(yearMaxInput.value) || MAX_YEAR;
  applyFilters({ fit: true });
});

document.querySelector('#reset_filters').addEventListener('click', () => {
  exitTreasureMode();
  genusSelect.value = '0';
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  yearMinInput.value = MIN_YEAR;
  yearMaxInput.value = MAX_YEAR;
  clearCollectionUI();
  filterState.collection = null;
  filterState.genus = null;
  filterState.species = null;
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
    label: (n) => `🍎 ${numberFormat.format(n)} alte Obstsorten – lebende Genbank`,
  },
  loner: {
    btn: document.querySelector('#loner-toggle'),
    names: () => loanerNames,
    label: (n) => `💎 ${numberFormat.format(n)} Einzelgänger – je nur 1× in Zürich`,
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
  exitTreasureMode(); // turn off the other mode if it was active

  // A gold-star mode is its own view — clear any active filters/collections.
  clearCollectionUI();
  genusSelect.value = '0';
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  filterState.collection = null;
  filterState.genus = null;
  filterState.species = null;

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
  const counts = new Map();
  for (const f of allFeatures) {
    const g = f.properties[GENUS_FIELD];
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  curiosityListEl.innerHTML = '';
  for (const c of curiosities) {
    const n = counts.get(c.genus) || 0;
    if (!n) continue; // skip genera not present in the current data
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'curio-item';
    btn.innerHTML =
      `<span class="curio-name">${c.emoji} ${c.label}</span>` +
      `<span class="curio-count">${numberFormat.format(n)}×</span>`;
    btn.addEventListener('click', () => jumpToGenus(c.genus));
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
  exitTreasureMode();
  const wasActive = filterState.collection?.id === c.id;
  clearCollectionUI();
  if (wasActive) {
    filterState.collection = null;
    applyFilters(); // toggling off: no auto-zoom, back to full city
    return;
  }
  filterState.collection = c;
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed', 'true');
  // A collection replaces any manual genus/species selection.
  filterState.genus = null;
  filterState.species = null;
  genusSelect.value = '0';
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  applyFilters({ fit: true });
}

for (const c of collections) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'collection-chip';
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = c.emoji ? `${c.emoji} ${c.label}` : c.label;
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
  const de = GenusDeNames[genus];
  searchIndex.push({
    kind: 'genus',
    genus,
    label: de ? `${de} (${genus})` : genus,
    sub: 'Gattung',
    search: `${de || ''} ${genus}`.toLowerCase(),
  });
  for (const { art, label } of treeMeta.speciesByGenus[genus] || []) {
    searchIndex.push({
      kind: 'species',
      genus,
      art,
      label,
      sub: `Art · ${de || genus}`,
      search: `${label} ${genus} ${de || ''}`.toLowerCase(),
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

// Legend from the same GENUS_COLORS source as the map.
const legendEl = document.querySelector('#legend');
for (const { name, color } of [...GENUS_COLORS, { name: 'Andere', color: OTHER_COLOR }]) {
  const row = document.createElement('div');
  row.className = 'legend-row';
  const swatch = document.createElement('span');
  swatch.className = 'legend-swatch';
  swatch.style.background = color;
  const label = document.createElement('span');
  label.textContent = name;
  row.append(swatch, label);
  legendEl.appendChild(row);
}

/* ------------------------------------------------------------------ *
 * Zahlen & Trends modal
 * ------------------------------------------------------------------ */
const statsModal = document.querySelector('#stats-modal');
const statsBody = document.querySelector('#stats-body');

function openStats() {
  if (!allFeatures.length) {
    statsBody.innerHTML = '<p class="stats-lead">Daten werden noch geladen …</p>';
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

// Mobile: toggle the sidebar and let the map reclaim the space.
const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebar-toggle');
sidebarToggle.addEventListener('click', () => {
  const willHide = !sidebar.hasAttribute('hidden');
  sidebar.toggleAttribute('hidden', willHide);
  sidebarToggle.setAttribute('aria-expanded', String(!willHide));
  map.resize();
});
