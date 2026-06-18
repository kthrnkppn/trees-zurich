import { BaumgattungIds } from './BaumgattungIds.js';
import { BaumArtLatIds } from './BaumArtLatIds.js';
import { getPopupContent } from './helpers.js';

const layerId = 'tree-points-layer';
const sourceLayer = 'tree_points_layer';
let SelectedBaumGattungId = 0;

function fillBaumArtLatNames(baumgattung_id) {
  const baumartSelectElem = document.querySelector('#baumart_lat_id');
  baumartSelectElem.innerHTML = '<option value="0">Baumart</option>';
  const selected_baumartids = BaumArtLatIds[baumgattung_id];
  for (const key in selected_baumartids) {
    var option = document.createElement('option');
    option.value = key;
    option.text = selected_baumartids[key];
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

class YearRangeControl {
  onAdd(map) {
    this._map = map;

    this.inputMin = document.createElement('input');
    this.inputMax = document.createElement('input');
    this.setButton = document.createElement('button');

    for (const input of [this.inputMin, this.inputMax]) {
      input.type = 'number';
      input.min = 1665;
      input.max = 2023;
    }
    this.inputMin.value = 1665;
    this.inputMax.value = 2023;
    this.inputMin.setAttribute('aria-label', 'Pflanzjahr von');
    this.inputMax.setAttribute('aria-label', 'Pflanzjahr bis');

    this.setButton.textContent = 'Filtern';
    this.setButton.setAttribute('aria-label', 'Nach Pflanzjahr filtern');
    this.setButton.onclick = () => {
      let min = this.inputMin.value || 1665;
      let max = this.inputMax.value || 2023;

      mapFilters['PflanzJahr'] = [
        'all',
        ['>=', ['get', 'pflanzjahr'], Number(min)],
        ['<=', ['get', 'pflanzjahr'], Number(max)],
      ];

      UpdateFilters();
    };

    this._container = document.createElement('div');
    this._container.className = 'custom-control';
    this._container.appendChild(this.inputMin);
    this._container.appendChild(this.inputMax);
    this._container.appendChild(this.setButton);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

class TreeTypeSelectControl {
  onAdd(map) {
    this._map = map;

    /** Set up Baum Gattung select box */
    this.selectBaumGattung = document.createElement('select');
    this.selectBaumGattung.setAttribute('aria-label', 'Baumgattung');
    this.selectBaumGattung.innerHTML = '<option value=0>Baumgattung</option>';

    for (let key in BaumgattungIds) {
      var option = document.createElement('option');
      option.value = key;
      option.text = BaumgattungIds[key];
      this.selectBaumGattung.add(option);
    }

    this.selectBaumGattung.addEventListener('change', function (e) {
      mapFilters['BaumArtLatIds'] = []; // reset Baum Art so it doesn't try to filter for Baum Art for a different Baum Gattung
      SelectedBaumGattungId = e.target.value;
      if (SelectedBaumGattungId === '0') {
        // map.setFilter(layerId, null);
        mapFilters['BaumgattungIds'] = [];
      } else {
        mapFilters['BaumgattungIds'] = [
          '==',
          ['get', 'baumgattung_lat_id'],
          Number(SelectedBaumGattungId),
        ];
        fillBaumArtLatNames(SelectedBaumGattungId);
      }
      UpdateFilters();
    });

    /** Set up Baum Art select box */
    this.selectBaumArt = document.createElement('select');
    this.selectBaumArt.setAttribute('aria-label', 'Baumart');
    this.selectBaumArt.innerHTML = '<option value=0>Baumart</option>';
    this.selectBaumArt.id = 'baumart_lat_id';
    this.selectBaumArt.addEventListener('change', function (e) {
      const selectedBaumArtId = e.target.value;
      if (selectedBaumArtId === '0') {
        mapFilters['BaumArtLatIds'] = [];
      } else {
        mapFilters['BaumArtLatIds'] = [
          '==',
          ['get', 'baumart_lat_id'],
          Number(selectedBaumArtId),
        ];
      }
      UpdateFilters();
    });

    /** Add controls to container */
    this._container = document.createElement('div');
    this._container.className = 'custom-control baumselect';
    this._container.appendChild(this.selectBaumGattung);
    this._container.appendChild(this.selectBaumArt);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

mapboxgl.accessToken =
  'pk.eyJ1IjoibnVycCIsImEiOiJjajVkaWF0NnUwYTdsMnduejdpZjIydjd1In0.BTjYUbXCFa5UUhqdbficyg';

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true,
});

const map = new mapboxgl.Map({
  container: 'map', // container ID
  center: [8.5035171, 47.3579481], // starting position [lng, lat]
  style: 'mapbox://styles/nurp/clqzlon69018u01qwbfvv7wmp', //'mapbox://styles/nurp/clqxnrutg005s01pddzsbchyz', //'mapbox://styles/nurp/clqxnrutg005s01pddzsbchyz',
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
  .addControl(new YearRangeControl(), 'top-left')
  .addControl(new TreeTypeSelectControl(), 'top-left')
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
