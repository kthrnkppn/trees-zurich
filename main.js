import { GenusDeNames } from './GenusDeNames.js';
import { treeMeta } from './treeMeta.js';
import { getPopupContent } from './helpers.js';

const layerId = 'tree-points-layer';
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

// All tree features, kept in memory so we can count and zoom to matches across
// the whole city — not just what's currently on screen.
let allFeatures = [];

// Active filter values (null = inactive).
const filterState = { genus: null, species: null, yearMin: null, yearMax: null };

function hasActiveFilter() {
  return !!(
    filterState.genus ||
    filterState.species ||
    filterState.yearMin != null ||
    filterState.yearMax != null
  );
}

function matchesFilter(f) {
  const p = f.properties;
  if (filterState.genus && p[GENUS_FIELD] !== filterState.genus) return false;
  if (filterState.species && p[SPECIES_FIELD] !== filterState.species) return false;
  if (filterState.yearMin != null && !(p[YEAR_FIELD] >= filterState.yearMin)) return false;
  if (filterState.yearMax != null && !(p[YEAR_FIELD] <= filterState.yearMax)) return false;
  return true;
}

function buildMapFilter() {
  const e = ['all'];
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
      for (const f of geojson.features || []) {
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
      showResultsWhileTyping: false,
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

  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
  });
  map.on('click', layerId, (e) => {
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(getPopupContent(e.features[0].properties))
      .addTo(map);
  });

  applyFilters(); // initial count (whole city, no zoom)
});

/* ------------------------------------------------------------------ *
 * Live count of distinct visible trees
 * ------------------------------------------------------------------ */
const treeCountElem = document.querySelector('#tree-count');
const numberFormat = new Intl.NumberFormat('de-CH');

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
  const genus = e.target.value;
  filterState.species = null; // species are scoped to a genus
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
  filterState.yearMin = Number(yearMinInput.value) || MIN_YEAR;
  filterState.yearMax = Number(yearMaxInput.value) || MAX_YEAR;
  applyFilters({ fit: true });
});

document.querySelector('#reset_filters').addEventListener('click', () => {
  genusSelect.value = '0';
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  yearMinInput.value = MIN_YEAR;
  yearMaxInput.value = MAX_YEAR;
  filterState.genus = null;
  filterState.species = null;
  filterState.yearMin = null;
  filterState.yearMax = null;
  applyFilters(); // no auto-zoom on reset
});

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

// Mobile: toggle the sidebar and let the map reclaim the space.
const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebar-toggle');
sidebarToggle.addEventListener('click', () => {
  const willHide = !sidebar.hasAttribute('hidden');
  sidebar.toggleAttribute('hidden', willHide);
  sidebarToggle.setAttribute('aria-expanded', String(!willHide));
  map.resize();
});
