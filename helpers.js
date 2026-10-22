import { genusInfo } from './genusInfo.js';
import { yearEvents } from './yearEvents.js';
import { lang, t, tTag, wikiLang, localized } from './i18n.js';

const CURRENT_YEAR = new Date().getFullYear();

// Manual overrides for the naive latin-binomial guess below, keyed by
// "genus art" or by genus exactly as it appears in the Baumkataster fields.
// Only needed per-language where the naive guess doesn't resolve or hits a disambiguation page.
const WIKI_GENUS_OVERRIDES = {
  Acer: { de: 'Acer_(Gattung)' },
  Platanus: { de: 'Platanus_(Pflanzengattung)' },
  Abies: { de: 'Tannen' },
  Aralia: { de: 'Aralia_(Gattung)' },
  Buxus: { de: 'Buchsbäume' },
  Castanea: { de: 'Kastanien' },
  Catalpa: { de: 'Trompetenbäume' },
  Celtis: { de: 'Zürgelbäume' },
  Cercidiphyllum: { de: 'Kuchenbäume' },
  Cornus: { de: 'Hartriegel' },
  Cydonia: { de: 'Quitte' },
  Elaeagnus: { de: 'Ölweiden' },
  Eucommia: { de: 'Eucommia_ulmoides' },
  Fagus: { de: 'Buchen' },
  Ficus: { de: 'Feigen' },
  Ilex: { de: 'Stechpalmen' },
  Juglans: { de: 'Walnüsse' },
  Larix: { de: 'Lärchen' },
  Magnolia: { de: 'Magnolien' },
  Malus: { de: 'Äpfel' },
  Morus: { de: 'Maulbeeren' },
  Nyssa: { de: 'Tupelobäume' },
  Populus: { de: 'Pappeln' },
  Ptelea: { de: 'Kleeulmen' },
  Pyrus: { de: 'Birnen' },
  Rhamnus: { de: 'Kreuzdorn' },
  Salix: { de: 'Weiden_(Gattung)' },
  Sambucus: { de: 'Holunder' },
  Taxus: { de: 'Eiben' },
  Broussonetia: { de: 'Papiermaulbeerbaum' },
  Cladrastis: { de: 'Gelbholz' },
  Firmiana: { de: 'Chinesischer_Sonnenschirmbaum' },
  Parrotia: { de: 'Parrotia_persica' },
};

const WIKI_TITLE_OVERRIDES = {
  'Ziziphus jujube': { de: 'Chinesische Jujube', en: 'Jujube' },
  'Diospyros virginiana': { de: 'Ebenholzbäume' },
  'Cephalotaxus harringtonii': { de: 'Kopfeiben' },
  'Salix appenticulata': { de: 'Großblättrige_Weide', en: 'Salix_appendiculata' },
  'Picea polita': { de: 'Tigerschwanz-Fichte', en: 'Picea_torano' },
  'Poncirus trifoliata': { de: 'Dreiblättrige_Orange', en: 'Trifoliate_orange' },
  'Cupressocyparis leylandii': { de: 'Leyland-Zypresse', en: 'Leyland_cypress' },
  'Amelanchier arborea': { de: 'Felsenbirnen' },
  'Castanea pumila': { de: 'Kastanien' },
  'Lonicera maackii': { de: 'Heckenkirschen' },
  'Pterocarya rhoifolia': { de: 'Flügelnüsse' },
  'Tilia amurensis': { de: 'Linden_(Gattung)' },
  'Acer x freemanii': { de: 'Zucker-Ahorn', en: 'Acer saccharum' },
  'Aesculus x carnea': { de: 'Fleischrote_Rosskastanie', en: 'Aesculus × carnea' },
  'Magnolia x soulangeana': { de: 'Tulpen-Magnolie', en: 'Magnolia × soulangeana' },
  'Platanus x hispanica': { de: 'Ahornblättrige_Platane', en: 'Platanus × hispanica' },
  'Populus x canadensis': { de: 'Kanadische_Schwarz-Pappel', en: 'Populus × canadensis' },
  'Populus x canescens': { de: 'Grau-Pappel', en: 'Populus × canescens' },
  'Quercus x turneri': { de: 'Immergrüne_Eiche', en: 'Quercus × turneri' },
  'Tilia x europaea': { de: 'Holländische_Linde', en: 'Tilia × europaea' },
  'Ulmus x hollandica': { de: 'Holländische_Ulme', en: 'Ulmus × hollandica' },
};

// Best-effort Wikipedia article for the tree, in the UI language's edition. The
// latin binomial reliably redirects to the named article (e.g. "Quercus robur"
// → "Stiel-Eiche" on de, "Pedunculate oak" on en); for unspecified/hybrid
// species we fall back to the genus article.
// Copper/blood beech cultivars (Fagus sylvatica 'Atropunicea', 'Riversii',
// 'Purpurea Pendula', ...) carry no dedicated field in the cadastre — only
// the curated German name calls them out ("Blutbuche" / "Blut-Buche ...");
// genus+species is plain "Fagus sylvatica" like any ordinary beech. Used
// both to route the Wikipedia link and to show the popup fun fact below.
function isBlutbuche(p) {
  return p.baumgattunglat === 'Fagus' && /blut/i.test(p.baumnamedeu || '');
}

// Earliest and latest planting year among the features passing `keep`
// (undated trees — pflanzjahr null — never count). Returns { min, max }, or
// null when no dated tree passes. Used to auto-fill the year filter fields
// with the real span of the current selection ("oldest oak: 1900").
export function plantingYearSpan(features, keep = () => true) {
  let min = Infinity;
  let max = -Infinity;
  for (const f of features) {
    if (!keep(f)) continue;
    const y = f.properties.pflanzjahr;
    if (y == null) continue;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return min === Infinity ? null : { min, max };
}

// Watering season: May through September — the months in which thirsty young
// trees (and the drought context around them) are relevant in Zürich,
// including late-spring and early-autumn dry spells. Drives the seasonal
// placement of the "Im Sommer" sidebar section: high in season, lower
// (below the Sammlungen) the rest of the year. Pure date logic so it can be
// unit-tested; the DOM move lives in main.js.
export function isWateringSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1 = January … 12 = December
  return month >= 5 && month <= 9;
}

// de.wikipedia has its own dedicated "Blutbuche" article (unlike English,
// which only disambiguates/mentions it in passing) — route those trees
// specifically to it instead of the generic "Rotbuche" naive guess.
const BLUTBUCHE_OVERRIDE = { de: 'Blutbuche' };

function wikipediaUrl(p) {
  const genus = (p.baumgattunglat || '').trim();
  let art = (p.baumartlat || '').trim();
  // Strip a trailing "subsp./var./f./cv. ..." qualifier — the period is
  // required so this only matches the actual abbreviation (with a following
  // qualifier name), not species epithets that merely start with "f" (e.g.
  // "fortunei", "floribunda", which the old bare-letter alternative used to
  // eat whole).
  art = art.replace(/\(.*?\)/g, '').replace(/\s(?:subsp|var|f|cv)\.\s+.*/i, '').trim();

  // Explicit title override (including hybrids like Acer x freemanii)
  const fullSpeciesKey = genus && art ? `${genus} ${art}` : '';
  const override = isBlutbuche(p)
    ? BLUTBUCHE_OVERRIDE
    : fullSpeciesKey && WIKI_TITLE_OVERRIDES[fullSpeciesKey];

  const usableArt = art && !/^spec\.?$/i.test(art) && !art.startsWith('x ');
  const genusOverride = genus && WIKI_GENUS_OVERRIDES[genus];

  let title;
  if (override?.[wikiLang]) {
    title = override[wikiLang];
  } else if (genus && usableArt) {
    title = `${genus} ${art}`;
  } else if (genusOverride?.[wikiLang]) {
    title = genusOverride[wikiLang];
  } else if (genus) {
    title = genus;
  } else {
    title = p.baumnamelat || p.baumnamedeu || '';
  }
  return `https://${wikiLang}.wikipedia.org/wiki/` + encodeURIComponent(title.replace(/\s+/g, '_'));
}

export const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

// Share icon as an inline SVG (thin strokes, currentColor) so it takes on the
// popup's muted text colour and matches the page's minimal look — an emoji
// glyph renders in the OS's own style and clashes with the rest of the UI.
export const SHARE_ICON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3v12" /><path d="M8 7l4-4 4 4" />' +
  '<path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>';

export const getPopupContent = (p) => {
  const { pflanzjahr, baumnamelat, baumnamedeu, baumgattunglat } = p;
  const info = genusInfo[baumgattunglat];

  // English mode names trees by their Latin name (we only translate the genus);
  // German mode prefers the curated German tree name.
  const title =
    (lang === 'en' ? baumnamelat || baumnamedeu : baumnamedeu || baumnamelat) ||
    t('popup.unknown');

  // Planting year and a friendly computed age.
  const metaParts = [];
  if (pflanzjahr) {
    metaParts.push(t('popup.planted', { year: pflanzjahr }));
    const age = CURRENT_YEAR - pflanzjahr;
    if (age >= 0 && age < 1000) metaParts.push(t('popup.age', { age }));
  } else {
    metaParts.push(t('popup.yearUnknown'));
  }

  const tags = (info?.tags || [])
    .map((tag) => `<span class="tp-tag">${esc(tTag(tag))}</span>`)
    .join('');

  // The generic Fagus blurb ("silbergraue Rinde ... im Herbst kupferbraun")
  // describes an ordinary green beech and doesn't fit a cultivar whose
  // leaves stay red-purple year-round — swap it out entirely rather than
  // show both.
  const desc = isBlutbuche(p) ? t('popup.factBlutbuche') : localized(info?.desc);

  // "What happened in the world the year this tree was planted."
  let eventBlock = '';
  const ev = pflanzjahr && yearEvents[pflanzjahr];
  if (ev) {
    const evText = localized(ev);
    eventBlock = `<div class="tp-event">
      <div class="tp-event-label">${esc(t('popup.eventLabel', { year: pflanzjahr }))}</div>
      <div class="tp-event-text">${esc(evText)}</div>
      <a class="tp-event-link" href="https://${wikiLang}.wikipedia.org/wiki/${pflanzjahr}" target="_blank" rel="noopener">${esc(t('popup.eventMore', { year: pflanzjahr }))}</a>
    </div>`;
  }

  const wikiUrl = wikipediaUrl(p);

  // For a "gone" tree from the memorial layer: when it disappeared.
  const goneBlock = p.verschwunden
    ? `<div class="tp-gone">${esc(t('popup.gone', { year: String(p.verschwunden).slice(0, 4) }))}</div>`
    : '';

  // Description + world event are the longest parts of the popup, so on mobile
  // they're tucked behind a native <details> disclosure (title, age, tags and
  // the Wikipedia link stay visible immediately either way). Desktop keeps
  // today's behaviour — everything visible immediately — via the `open`
  // attribute decided here at render time; the summary toggle is then hidden
  // by CSS on wide screens (see .tp-more in style.css). Deciding `open` here
  // (rather than fighting the native collapsed-<details> rendering with a CSS
  // override) is the reliable approach — some browsers render collapsed
  // <details> content through an internal content-visibility mechanism that
  // author CSS can't force back open.
  const isWideScreen = matchMedia('(min-width: 761px)').matches;
  const moreContent = `${desc ? `<p class="tp-desc">${esc(desc)}</p>` : ''}${eventBlock}`;
  const moreBlock = moreContent
    ? `<details class="tp-more"${isWideScreen ? ' open' : ''}><summary>${esc(t('popup.more'))}</summary>${moreContent}</details>`
    : '';

  return `<div class="tree-popup">
    <header class="tp-head">
      <a class="tp-title" href="${wikiUrl}" target="_blank" rel="noopener">${esc(title)}</a>${p.baumnummer ? `<button class="tp-share" type="button" title="${esc(t('popup.share'))}" aria-label="${esc(t('popup.share'))}">${SHARE_ICON}</button>` : ''}
      ${baumnamelat ? `<div class="tp-lat"><em>${esc(baumnamelat)}</em></div>` : ''}
      ${goneBlock}
      <div class="tp-meta">${metaParts.map(esc).join(' · ')}</div>
    </header>
    <div class="tp-body">
      ${tags ? `<div class="tp-tags">${tags}</div>` : ''}
      <a class="tp-wiki" href="${wikiUrl}" target="_blank" rel="noopener">${esc(t('popup.wiki'))}</a>
      ${moreBlock}
    </div>
  </div>`;
};

// ─── Geolocation error messaging ─────────────────────────────────────────────
// The map library's location button fails silently on iOS when the phone
// refuses a location (it only greys out the icon). These pure helpers turn
// the failure into the right plain-language message, so the tests can cover
// the mapping without a browser.

// Best-effort browser name for the "allow location" instructions. iOS browsers
// report their app name via the *iOS tokens (FxiOS = Firefox on iPhone etc.),
// desktop browsers via the usual tokens. The name is interpolated into the
// i18n strings ({browser} placeholder).
export function detectBrowserName(ua) {
  if (/FxiOS|Firefox\//.test(ua)) return 'Firefox';
  if (/EdgiOS|Edg\//.test(ua)) return 'Edge';
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome';
  if (/OPiOS|OPR\//.test(ua)) return 'Opera';
  return 'Safari';
}

// True on iPhone / iPad / iPod — including iPads running iPadOS 13+ in
// "desktop mode", which report a Macintosh UA but still have a touchscreen.
// Decides between the touch-OS settings wording and the desktop address-bar
// wording for the permission-denied message.
export function isIOSDevice(ua, hasTouch) {
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && !!hasTouch;
}

// Maps a GeolocationPositionError code (1 = permission denied, 2 = position
// unavailable, 3 = timeout) to its i18n string key. Anything unexpected is
// treated as a timeout — the least alarming of the three messages.
// `insecure` covers plain-http origins: there browsers block location outright
// and report it as a denial, so the real cause gets its own message.
// `isIOS` picks between the touch-OS settings wording and the desktop
// address-bar wording for the permission-denied message.
export function geolocateErrorKey(code, { unsupported = false, insecure = false, isIOS = true } = {}) {
  if (unsupported) return 'geo.unsupported';
  if (insecure) return 'geo.insecure';
  if (code === 1) return isIOS ? 'geo.denied' : 'geo.deniedDesktop';
  if (code === 2) return 'geo.unavailable';
  return 'geo.timeout';
}

// Sum of the last 30 days (mm) from one station's daily-recent CSV, or null if
// the file can't be parsed / has no usable rows. Each station uses its own last
// available day as the window's end, since they don't all publish in lockstep.
export function station30DaySum(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(';');
  const iDate = header.indexOf('reference_timestamp');
  const iRain = header.indexOf('rre150d0'); // daily precipitation total, mm
  if (iDate < 0 || iRain < 0) return null;
  const rows = [];
  for (let k = 1; k < lines.length; k++) {
    const c = lines[k].split(';');
    if (c.length <= iRain) continue;
    const [dd, mm, yyyy] = (c[iDate].split(' ')[0] || '').split('.');
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const v = c[iRain].trim();
    if (isNaN(d.getTime()) || v === '' || v === '-') continue; // skip missing values
    rows.push({ t: d.getTime(), val: Number(v) });
  }
  if (!rows.length) return null;
  let last = 0;
  for (const r of rows) if (r.t > last) last = r.t;
  const cutoff = last - 29 * 86400000; // 30 days inclusive of the last
  let sum = 0;
  for (const r of rows) if (r.t >= cutoff && r.t <= last) sum += r.val;
  return sum;
}

// ─── Selection dimming ──────────────────────────────────────────────────────
// While a tree popup is open, every other tree on the map fades so the selected
// one reads as the clear focus (share links auto-select their tree, so they get
// the same spotlight for free). This builds the MapLibre paint expression used
// for that: features whose id matches keep their normal opacity, all others
// drop to the dimmed one.
export const selectionDimExpr = (idField, selectedId, bright, dim) => [
  'case',
  ['==', ['get', idField], ['literal', selectedId]],
  bright,
  dim,
];

// ─── Share links ────────────────────────────────────────────────────────────
// Two link types: `?baum=<baumnummer>` for a single tree, `?f=<compact JSON>`
// for the filter state (encode/decode below). Links never carry language or
// any other state.

// One pass over a location.search string → the shared tree id, or null.
// Unknown params are ignored; a `f=` param belongs to the filter link below.
export function parseSharedLink(search) {
  const baum = new URLSearchParams(search).get('baum');
  return baum ? String(baum) : null;
}

// ─── Shareable filters ──────────────────────────────────────────────────────
// `?f=` carries the sidebar's filter state as compact JSON — the same state
// shape the controls mirror (see DECISIONS.md). Curated collections travel
// by id (the receiving site resolves them against its own collections.js, so
// later edits propagate); search-derived genus groups travel as their raw
// query + genus list, since they exist in no dataset. Language never travels.

// Filter-state snapshot → the value for the `f` URL parameter, or '' when
// nothing is set. Only active dimensions are written, and the year window is
// omitted when the unknown-year checkbox or the young-tree toggle owns it —
// a tree can't be both "no recorded year" and "within a range".
export function encodeShareFilter(state) {
  const out = {};
  const c = state.collection;
  if (c) {
    out.c = c.search
      ? { q: c.query || '', g: c.genera }
      : c.id;
  }
  if (state.genus) out.g = state.genus;
  // Species are scoped to a genus — without one they are meaningless.
  if (state.genus && state.species) out.s = state.species;
  if (state.yearUnknown) out.u = 1;
  if (state.youngTree) out.w = 1;
  if (!state.yearUnknown && !state.youngTree) {
    if (state.yearMin != null) out.ym = state.yearMin;
    if (state.yearMax != null) out.yx = state.yearMax;
  }
  if (state.blutbuche) out.b = 1;
  return Object.keys(out).length ? encodeURIComponent(JSON.stringify(out)) : '';
}

// `f` parameter value → a sanitized filter snapshot, or null when absent,
// malformed, or carrying nothing usable. Stale links (from old builds or
// since-changed data) degrade to the plain map: unknown keys are ignored,
// invalid values are dropped individually, everything is length- and
// range-checked. The two year-window toggles stay mutually exclusive
// (unknown-year wins, matching the UI's own order), and Blutbuche is
// standalone by design — jumpToBlutbuche() resets everything else.
export function decodeShareFilter(value) {
  if (!value) return null;
  let raw;
  try {
    raw = JSON.parse(value);
  } catch (e) {
    return null;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.b) return { blutbuche: true };
  const out = {};
  const name = (v) => (typeof v === 'string' && v && v.length <= 64 ? v : null);
  const c = raw.c;
  if (typeof c === 'string') {
    if (name(c)) out.collection = { id: c };
  } else if (c && typeof c === 'object' && !Array.isArray(c)) {
    const genera = Array.isArray(c.g)
      ? c.g.map(name).filter(Boolean).slice(0, 64)
      : [];
    if (genera.length) {
      out.collection = {
        search: true,
        query: typeof c.q === 'string' ? c.q.slice(0, 80) : '',
        genera,
      };
    }
  }
  const genus = name(raw.g);
  if (genus) out.genus = genus;
  const species = name(raw.s);
  if (genus && species) out.species = species;
  if (raw.u) out.yearUnknown = true;
  else if (raw.w) out.youngTree = true;
  else {
    const year = (v) =>
      (Number.isInteger(v) && v >= 1665 && v <= 2100 ? v : null);
    const ym = year(raw.ym);
    if (ym != null) out.yearMin = ym;
    const yx = year(raw.yx);
    if (yx != null) out.yearMax = yx;
  }
  return Object.keys(out).length ? out : null;
}

// One pass over a location.search string → the decoded filter snapshot, or
// null (no `f=` param, or one that fails validation above).
export function parseFilterLink(search) {
  const f = new URLSearchParams(search).get('f');
  return f ? decodeShareFilter(f) : null;
}
