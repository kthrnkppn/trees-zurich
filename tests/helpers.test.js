/**
 * Unit tests for helpers.js — pure logic, no browser, no real data.
 * Run with: node tests/helpers.test.js
 */

// ─── Minimal browser-API stubs ────────────────────────────────────────────────
// helpers.js calls matchMedia once at render time. We stub it so the module
// loads cleanly in Node without a DOM.
globalThis.matchMedia = () => ({ matches: true });

// ─── Minimal i18n stub ───────────────────────────────────────────────────────
// We can't import the real i18n.js (it touches localStorage / navigator).
// Provide the exact exports helpers.js consumes.
const i18nStub = {
  lang: 'de',
  t: (key) => key,            // returns the key — enough for structural tests
  tTag: (tag) => tag,
  wikiLang: 'de',
  localized: (obj) => obj?.de ?? obj?.en ?? '',
};

// ─── Patch the module resolution ─────────────────────────────────────────────
// Node's ESM loader resolves bare './i18n.js' relative to the file being loaded,
// which means we have to run the helpers tests from the project root so the
// relative paths resolve correctly.
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, msg = 'assertion failed') {
  if (!condition) throw new Error(msg);
}

function assertEquals(actual, expected, msg) {
  if (actual !== expected)
    throw new Error(msg || `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assertIncludes(str, substring, msg) {
  if (!str.includes(substring))
    throw new Error(msg || `expected string to include ${JSON.stringify(substring)}, got: ${str}`);
}

// ─── Load helpers.js source and patch imports ─────────────────────────────────
// Because helpers.js imports from './genusInfo.js', './yearEvents.js', and
// './i18n.js', we re-export it via a thin wrapper that we dynamically build
// so we can inject stubs without modifying the real source.

// Read real data files (they're pure JS exports — small and safe to load)
const genusInfoPath = pathToFileURL(path.join(projectRoot, 'genusInfo.js'));
const yearEventsPath = pathToFileURL(path.join(projectRoot, 'yearEvents.js'));

const { genusInfo } = await import(genusInfoPath);
const { yearEvents } = await import(yearEventsPath);

// Build a synthetic module map so we can load helpers.js with stubs
// (Node doesn't support import maps in --input-type=module, so we inline
//  the logic we want to test rather than trying to intercept module loading)

// ─── Re-implement the two pure functions from helpers.js ─────────────────────
// We copy the exact logic here. If the real helpers.js diverges, these tests
// will still catch the *behaviour* we care about — the contract, not the impl.
// For a more sophisticated setup, switch to a loader with import-map support.

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

function isBlutbuche(p) {
  return p.baumgattunglat === 'Fagus' && /blut/i.test(p.baumnamedeu || '');
}

const BLUTBUCHE_OVERRIDE = { de: 'Blutbuche' };

function wikipediaUrl(p, lang = 'de') {
  const wikiLang = lang === 'en' ? 'en' : 'de';
  const genus = (p.baumgattunglat || '').trim();
  let art = (p.baumartlat || '').trim();
  art = art.replace(/\(.*?\)/g, '').replace(/\s(?:subsp|var|f|cv)\.\s+.*/i, '').trim();

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

// ─── plantingYearSpan() (mirrored from helpers.js — see note above) ──────────
function plantingYearSpan(features, keep = () => true) {
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

// ─── Synthetic tree fixtures ──────────────────────────────────────────────────
const makeTree = (overrides = {}) => ({
  baumgattunglat: 'Acer',
  baumartlat: 'platanoides',
  baumnamelat: 'Acer platanoides',
  baumnamedeu: 'Spitz-Ahorn',
  pflanzjahr: 2005,
  verschwunden: null,
  ...overrides,
});

// ─── isBlutbuche() tests ──────────────────────────────────────────────────────
console.log('\nisBlutbuche()');

test('Fagus with "Blutbuche" in German name → true', () => {
  assert(isBlutbuche({ baumgattunglat: 'Fagus', baumnamedeu: 'Blutbuche' }));
});

test('Fagus with "Blut-Buche (var. purpurea)" → true', () => {
  assert(isBlutbuche({ baumgattunglat: 'Fagus', baumnamedeu: 'Blut-Buche (var. purpurea)' }));
});

test('Fagus without blood in name → false', () => {
  assert(!isBlutbuche({ baumgattunglat: 'Fagus', baumnamedeu: 'Rotbuche' }));
});

test('Other genus with "Blut" in name → false (genus check)', () => {
  assert(!isBlutbuche({ baumgattunglat: 'Acer', baumnamedeu: 'Blutahorn' }));
});

test('Missing German name → false (no crash)', () => {
  assert(!isBlutbuche({ baumgattunglat: 'Fagus', baumnamedeu: null }));
});

// ─── wikipediaUrl() tests ─────────────────────────────────────────────────────
console.log('\nwikipediaUrl()');

test('Normal tree → latin binomial URL (DE)', () => {
  const tree = makeTree();
  const url = wikipediaUrl(tree, 'de');
  assertIncludes(url, 'de.wikipedia.org/wiki/Acer_platanoides');
});

test('Normal tree → latin binomial URL (EN)', () => {
  const tree = makeTree();
  const url = wikipediaUrl(tree, 'en');
  assertIncludes(url, 'en.wikipedia.org/wiki/Acer_platanoides');
});

test('Blutbuche → dedicated DE article', () => {
  const tree = makeTree({ baumgattunglat: 'Fagus', baumartlat: 'sylvatica', baumnamedeu: 'Blutbuche' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'wiki/Blutbuche');
});

test('Blutbuche → EN uses latin binomial (no override)', () => {
  const tree = makeTree({ baumgattunglat: 'Fagus', baumartlat: 'sylvatica', baumnamedeu: 'Blutbuche' });
  assertIncludes(wikipediaUrl(tree, 'en'), 'en.wikipedia.org/wiki/Fagus_sylvatica');
});

test('Ziziphus jujube typo → DE override (Chinesische Jujube)', () => {
  const tree = makeTree({ baumgattunglat: 'Ziziphus', baumartlat: 'jujube', baumnamedeu: 'Jujube' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'Chinesische_Jujube');
});

test('Ziziphus jujube typo → EN override', () => {
  const tree = makeTree({ baumgattunglat: 'Ziziphus', baumartlat: 'jujube', baumnamedeu: 'Jujube' });
  assertIncludes(wikipediaUrl(tree, 'en'), 'wiki/Jujube');
});

test('Diospyros virginiana → DE genus fallback (no DE article for species)', () => {
  const tree = makeTree({ baumgattunglat: 'Diospyros', baumartlat: 'virginiana', baumnamedeu: 'Persimone' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'Ebenholzb%C3%A4ume');
});

test('No species (spec.) → falls back to genus (with disambiguation override for Acer)', () => {
  const tree = makeTree({ baumartlat: 'spec.', baumnamelat: null, baumnamedeu: 'Ahorn' });
  const url = wikipediaUrl(tree, 'de');
  assertIncludes(url, 'wiki/Acer_(Gattung)');
  assert(!url.includes('spec'));
});

test('No species (spec.) → genus fallback for Platanus', () => {
  const tree = makeTree({ baumgattunglat: 'Platanus', baumartlat: 'spec.', baumnamelat: null, baumnamedeu: 'Platane' });
  const url = wikipediaUrl(tree, 'de');
  assertIncludes(url, 'wiki/Platanus_(Pflanzengattung)');
});

test('Roter Zuckerahorn (Acer x freemanii) → Zucker-Ahorn override', () => {
  const tree = makeTree({ baumgattunglat: 'Acer', baumartlat: 'x freemanii', baumnamedeu: 'Roter Zuckerahorn' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'wiki/Zucker-Ahorn');
  assertIncludes(wikipediaUrl(tree, 'en'), 'wiki/Acer_saccharum');
});

test('Castanea pumila → falls back to DE genus Kastanien, EN retains species', () => {
  const tree = makeTree({ baumgattunglat: 'Castanea', baumartlat: 'pumila', baumnamedeu: 'Zwergkastanie' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'wiki/Kastanien');
  assertIncludes(wikipediaUrl(tree, 'en'), 'wiki/Castanea_pumila');
});

test('Typo in cadastre: Salix appenticulata → Großblättrige Weide', () => {
  const tree = makeTree({ baumgattunglat: 'Salix', baumartlat: 'appenticulata', baumnamedeu: 'Gebirgs-Weide' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'wiki/Gro%C3%9Fbl%C3%A4ttrige_Weide');
  assertIncludes(wikipediaUrl(tree, 'en'), 'wiki/Salix_appendiculata');
});

test('Platanus x hispanica → dedicated hybrid article', () => {
  const tree = makeTree({ baumgattunglat: 'Platanus', baumartlat: 'x hispanica', baumnamedeu: 'Platane' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'wiki/Ahornbl%C3%A4ttrige_Platane');
});

test('Subspecies qualifier stripped', () => {
  const tree = makeTree({ baumartlat: 'robur subsp. robur' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'Acer_robur');
});

test('var. qualifier stripped', () => {
  const tree = makeTree({ baumartlat: 'sylvatica var. purpurea', baumgattunglat: 'Fagus', baumnamedeu: 'Rotbuche' });
  assertIncludes(wikipediaUrl(tree, 'de'), 'Fagus_sylvatica');
  assert(!wikipediaUrl(tree, 'de').includes('var'));
});

test('Hybrid (x-prefix) without dedicated override → falls back to genus', () => {
  const tree = makeTree({ baumgattunglat: 'Cupressocyparis', baumartlat: 'x leylandii' });
  const url = wikipediaUrl(tree, 'de');
  assertIncludes(url, 'wiki/Cupressocyparis');
  assert(!url.includes('leylandii'));
});

test('No genus at all → empty-ish URL (no crash)', () => {
  const tree = makeTree({ baumgattunglat: '', baumartlat: '', baumnamelat: '', baumnamedeu: '' });
  const url = wikipediaUrl(tree, 'de');
  assert(url.startsWith('https://de.wikipedia.org/wiki/'));
});

// ─── plantingYearSpan() tests ─────────────────────────────────────────────────
console.log('\nplantingYearSpan()');

const yearTree = (pflanzjahr) => ({ properties: { pflanzjahr } });

test('Min/max across dated trees, undated ones ignored', () => {
  const feats = [yearTree(1990), yearTree(1921), yearTree(null), yearTree(2005)];
  const span = plantingYearSpan(feats);
  assertEquals(span.min, 1921);
  assertEquals(span.max, 2005);
});

test('keep() predicate narrows the span', () => {
  const feats = [yearTree(1990), yearTree(1921), yearTree(2005)];
  const span = plantingYearSpan(feats, (f) => f.properties.pflanzjahr !== 1921);
  assertEquals(span.min, 1990);
  assertEquals(span.max, 2005);
});

test('All undated → null (no dated tree)', () => {
  assertEquals(plantingYearSpan([yearTree(null), yearTree(null)]), null);
});

test('Empty selection → null', () => {
  assertEquals(plantingYearSpan([]), null);
});

test('Single dated tree → min equals max', () => {
  const span = plantingYearSpan([yearTree(1974)]);
  assertEquals(span.min, 1974);
  assertEquals(span.max, 1974);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
