import { GenusDeNames } from './GenusDeNames.js';
import { treeMeta } from './treeMeta.js';
import { getPopupContent } from './helpers.js';

const layerId = 'tree-points-layer';
const sourceId = 'zurich-trees';

// Field names from the official Stadt Zürich Baumkataster GeoJSON.
const GENUS_FIELD = 'baumgattunglat'; // latin genus, e.g. "Acer"
const SPECIES_FIELD = 'baumnamedeu'; // German (cultivar-level) name
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

// Active filter expressions (null = inactive).
const mapFilters = { genus: null, species: null, year: null };

function updateFilters() {
  if (!map.getLayer(layerId)) return;
  const filters = ['all'];
  if (mapFilters.genus) filters.push(mapFilters.genus);
  if (mapFilters.species) filters.push(mapFilters.species);
  if (mapFilters.year) filters.push(mapFilters.year);
  map.setFilter(layerId, filters);
  updateTreeCount();
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

map.on('load', () => {
  map.addSource(sourceId, {
    type: 'geojson',
    data: './trees.geojson',
    generateId: true, // stable ids for deduped counting
  });

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

  updateFilters();
});

/* ------------------------------------------------------------------ *
 * Live count of distinct visible trees
 * ------------------------------------------------------------------ */
const treeCountElem = document.querySelector('#tree-count');
const numberFormat = new Intl.NumberFormat('de-CH');

// queryRenderedFeatures returns a feature once per (internal) tile, so trees on
// tile boundaries appear multiple times. Dedupe by feature id, falling back to
// exact coordinates (boundary duplicates share coordinates).
function countDistinctTrees(features) {
  const seen = new Set();
  for (const f of features) {
    const key = f.id != null ? f.id : f.geometry?.coordinates?.join(',');
    if (key != null) seen.add(key);
  }
  return seen.size;
}

function updateTreeCount() {
  if (!treeCountElem || !map.getLayer(layerId)) return;
  const features = map.queryRenderedFeatures({ layers: [layerId] });
  treeCountElem.textContent = `${numberFormat.format(countDistinctTrees(features))} Bäume im Ausschnitt`;
}

map.on('idle', updateTreeCount);

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
  for (const name of treeMeta.speciesByGenus[genus] || []) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    artSelect.appendChild(option);
  }
}

genusSelect.addEventListener('change', (e) => {
  const genus = e.target.value;
  mapFilters.species = null; // species are scoped to a genus
  if (genus === '0') {
    mapFilters.genus = null;
    artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  } else {
    mapFilters.genus = ['==', ['get', GENUS_FIELD], genus];
    fillSpecies(genus);
  }
  updateFilters();
});

artSelect.addEventListener('change', (e) => {
  const name = e.target.value;
  mapFilters.species = name === '0' ? null : ['==', ['get', SPECIES_FIELD], name];
  updateFilters();
});

document.querySelector('#apply_filters').addEventListener('click', () => {
  const min = Number(yearMinInput.value) || MIN_YEAR;
  const max = Number(yearMaxInput.value) || MAX_YEAR;
  mapFilters.year = [
    'all',
    ['>=', ['get', YEAR_FIELD], min],
    ['<=', ['get', YEAR_FIELD], max],
  ];
  updateFilters();
});

document.querySelector('#reset_filters').addEventListener('click', () => {
  genusSelect.value = '0';
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  yearMinInput.value = MIN_YEAR;
  yearMaxInput.value = MAX_YEAR;
  mapFilters.genus = null;
  mapFilters.species = null;
  mapFilters.year = null;
  updateFilters();
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
