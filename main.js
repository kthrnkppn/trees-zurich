import { BaumgattungIds } from './BaumgattungIds.js';
import { BaumArtLatIds } from './BaumArtLatIds.js';
import { GenusDeNames } from './GenusDeNames.js';
import { getPopupContent } from './helpers.js';

const layerId = 'tree-points-layer';

// Single source of truth for genus colouring: drives BOTH the map paint
// expression and the legend, so they can never drift apart. We highlight the
// most common / iconic Zurich genera; everything else falls back to "Andere".
// `id` is the baumgattung_lat_id from BaumgattungIds.js. Labels read German
// (Latin), matching the rest of the UI.
// Colours are tuned for contrast on the LIGHT street base map: saturated,
// medium-dark tones only. Deliberately no pale tints (washed out), no yellow
// (clashes with roads), no brown (blends with land), no light cyan (blends with
// water). Every dot also gets a white halo (see the layer paint below).
const GENUS_COLORS = [
  { id: 17, name: 'Ahorn (Acer)', color: '#e11900' }, // red
  { id: 14, name: 'Linde (Tilia)', color: '#ef6c00' }, // orange
  { id: 9, name: 'Hainbuche (Carpinus)', color: '#00897b' }, // teal
  { id: 10, name: 'Birke (Betula)', color: '#3949ab' }, // indigo
  { id: 5, name: 'Eiche (Quercus)', color: '#1e88e5' }, // blue
  { id: 6, name: 'Esche (Fraxinus)', color: '#6a3d9a' }, // violet
  { id: 31, name: 'Platane (Platanus)', color: '#9c27b0' }, // purple
  { id: 4, name: 'Kirsche (Prunus)', color: '#c2185b' }, // rose
  { id: 23, name: 'Rosskastanie (Aesculus)', color: '#607d8b' }, // blue-grey
  { id: 21, name: 'Buche (Fagus)', color: '#212121' }, // near-black
];
// Everything not highlighted keeps a green (not grey — grey reads like dead/
// burnt trees), but a deeper forest green so it stays visible on light land and
// park greens rather than the lighter moss tone.
const OTHER_COLOR = '#2e7d32';

// Build a Mapbox "match" expression: baumgattung_lat_id -> colour, default grey.
function buildGenusColorExpression() {
  const matchPairs = GENUS_COLORS.flatMap(({ id, color }) => [id, color]);
  return ['match', ['get', 'baumgattung_lat_id'], ...matchPairs, OTHER_COLOR];
}

// Source strings look like "domestica (Apfel-Obstgehölz 'Spartan')", i.e.
// "<latin epithet> (<German name>)". Reformat to German first, with the full
// Latin binomial (genus + epithet) in parentheses: "Apfel… (Malus domestica)".
function formatArtLabel(raw, genusLat) {
  const m = raw.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (!m) return raw;
  const latinEpithet = m[1].trim();
  const german = m[2].trim();
  const latinFull = genusLat ? `${genusLat} ${latinEpithet}` : latinEpithet;
  return `${german} (${latinFull})`;
}

function fillBaumArtLatNames(baumgattung_id) {
  const baumartSelectElem = document.querySelector('#baumart_lat_id');
  baumartSelectElem.innerHTML = '<option value="0">Alle Arten</option>';
  const genusLat = BaumgattungIds[baumgattung_id];
  const selected_baumartids = BaumArtLatIds[baumgattung_id];
  for (const key in selected_baumartids) {
    var option = document.createElement('option');
    option.value = key;
    option.text = formatArtLabel(selected_baumartids[key], genusLat);
    baumartSelectElem.add(option);
  }
}

const mapFilters = {
  BaumgattungIds: [],
  BaumArtLatIds: [],
  PflanzJahr: [],
};

const UpdateFilters = () => {
  let filters = ['all'];
  if (mapFilters['BaumgattungIds'].length) {
    filters.push(mapFilters['BaumgattungIds']);
  }
  if (mapFilters['BaumArtLatIds'].length) {
    filters.push(mapFilters['BaumArtLatIds']);
  }
  if (mapFilters['PflanzJahr'].length) {
    filters.push(mapFilters['PflanzJahr']);
  }

  map.setFilter(layerId, filters);
  updateTreeCount();
};

mapboxgl.accessToken =
  'pk.eyJ1IjoibnVycCIsImEiOiJjajVkaWF0NnUwYTdsMnduejdpZjIydjd1In0.BTjYUbXCFa5UUhqdbficyg';

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true,
});

const map = new mapboxgl.Map({
  container: 'map', // container ID
  center: [8.5035171, 47.3579481], // starting position [lng, lat]
  // Street map (outlines/roads, Google-Maps-like). The trees are no longer part
  // of the base style — we re-add them as their own source/layer on style.load.
  // Swap to 'mapbox://styles/mapbox/light-v11' for a more muted base.
  style: 'mapbox://styles/mapbox/streets-v12',
  zoom: 12, // starting zoom
  attributionControl: false,
})
  .addControl(
    new mapboxgl.AttributionControl({
      customAttribution:
        'Tree database is provided by Zurich City. Quelle: Stadt Zürich',
    })
  )
  .addControl(
    new mapboxgl.FullscreenControl({
      container: document.querySelector('body'),
    })
  )
  .addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    })
  )
  .addControl(nav, 'bottom-right')
  .addControl(
    new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      proximity: 'ip',
      language: 'de',
      placeholder: 'Ort suchen',
    }),
    'top-left'
  )
  .on('mouseenter', layerId, function () {
    map.getCanvas().style.cursor = 'pointer';
  })
  .on('mouseleave', layerId, function () {
    map.getCanvas().style.cursor = '';
  })
  .on('click', layerId, function (e) {
    var markerProperties = e.features[0].properties;

    var popup = new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(getPopupContent(markerProperties))
      .addTo(map);
  });

// Show how many trees are currently rendered in the viewport. This reflects
// the active filters and the current map extent, and is announced via the
// aria-live region in index.html.
const treeCountElem = document.querySelector('#tree-count');
const numberFormat = new Intl.NumberFormat('de-CH');

function updateTreeCount() {
  if (!treeCountElem) return;
  const count = map.queryRenderedFeatures(null, { layers: [layerId] }).length;
  treeCountElem.textContent = `${numberFormat.format(count)} Bäume im Ausschnitt`;
}

// Recount whenever the map settles after panning, zooming or filtering.
map.on('idle', updateTreeCount);

// The tree tileset (published on the nurp Mapbox account) used to be welded
// into the satellite style. We now add it on top of whatever base style is
// active, so the base can be a plain street map. Runs on every style.load so it
// survives base-style swaps.
map.on('style.load', () => {
  if (!map.getSource('zurich-trees')) {
    map.addSource('zurich-trees', {
      type: 'vector',
      url: 'mapbox://nurp.zurich-trees',
    });
  }
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: 'zurich-trees',
      'source-layer': 'tree_points_layer',
      paint: {
        'circle-color': buildGenusColorExpression(),
        // Slightly larger dots at city/neighbourhood zoom so colours read.
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 2, 13, 3.5, 16, 5, 22, 9,
        ],
        // Opaque white halo around every dot — guarantees separation from the
        // map regardless of what the dot sits on (road, water, park, label).
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.5, 13, 1, 16, 1.5, 22, 2,
        ],
        'circle-stroke-opacity': 1,
      },
    });
  }
  // Re-apply any active filters (also covers the initial load).
  UpdateFilters();
});

/* ------------------------------------------------------------------ *
 * Sidebar wiring
 * ------------------------------------------------------------------ */

const genusSelect = document.querySelector('#baumgattung_id');
const artSelect = document.querySelector('#baumart_lat_id');
const yearMinInput = document.querySelector('#year_min');
const yearMaxInput = document.querySelector('#year_max');

// Populate the genus dropdown: German name with Latin in parentheses where a
// German name is known, otherwise the Latin name alone. Sorted alphabetically
// by the visible label so users can scan it.
const genusOptions = Object.entries(BaumgattungIds)
  .map(([id, lat]) => {
    const de = GenusDeNames[lat];
    return { id, label: de ? `${de} (${lat})` : lat };
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'de'));

for (const { id, label } of genusOptions) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = label;
  genusSelect.appendChild(option);
}

genusSelect.addEventListener('change', (e) => {
  const id = e.target.value;
  // Reset species filter — species ids are scoped to a genus.
  mapFilters.BaumArtLatIds = [];
  if (id === '0') {
    mapFilters.BaumgattungIds = [];
    artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  } else {
    mapFilters.BaumgattungIds = ['==', ['get', 'baumgattung_lat_id'], Number(id)];
    fillBaumArtLatNames(id);
  }
  UpdateFilters();
});

artSelect.addEventListener('change', (e) => {
  const id = e.target.value;
  mapFilters.BaumArtLatIds =
    id === '0' ? [] : ['==', ['get', 'baumart_lat_id'], Number(id)];
  UpdateFilters();
});

document.querySelector('#apply_filters').addEventListener('click', () => {
  const min = Number(yearMinInput.value) || 1665;
  const max = Number(yearMaxInput.value) || 2023;
  mapFilters.PflanzJahr = [
    'all',
    ['>=', ['get', 'pflanzjahr'], min],
    ['<=', ['get', 'pflanzjahr'], max],
  ];
  UpdateFilters();
});

document.querySelector('#reset_filters').addEventListener('click', () => {
  genusSelect.value = '0';
  artSelect.innerHTML = '<option value="0">Alle Arten</option>';
  yearMinInput.value = 1665;
  yearMaxInput.value = 2023;
  mapFilters.BaumgattungIds = [];
  mapFilters.BaumArtLatIds = [];
  mapFilters.PflanzJahr = [];
  UpdateFilters();
});

// Render the legend from the same GENUS_COLORS source as the map.
const legendEl = document.querySelector('#legend');
for (const { name, color } of [
  ...GENUS_COLORS,
  { name: 'Andere', color: OTHER_COLOR },
]) {
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
