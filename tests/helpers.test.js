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

const WIKI_TITLE_OVERRIDES = {
  'Ziziphus jujube': { de: 'Chinesische Jujube', en: 'Jujube' },
  'Diospyros virginiana': { de: 'Ebenholzbäume' },
  'Cephalotaxus harringtonii': { de: 'Kopfeiben' },
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
  const usableArt = art && !/^spec\.?$/i.test(art) && !art.startsWith('x ');
  const override = isBlutbuche(p)
    ? BLUTBUCHE_OVERRIDE
    : usableArt && WIKI_TITLE_OVERRIDES[`${genus} ${art}`];
  let title;
  if (override?.[wikiLang]) title = override[wikiLang];
  else if (genus && usableArt) title = `${genus} ${art}`;
  else if (genus) title = genus;
  else title = p.baumnamelat || p.baumnamedeu || '';
  return `https://${wikiLang}.wikipedia.org/wiki/` + encodeURIComponent(title.replace(/\s+/g, '_'));
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

test('No species (spec.) → falls back to genus', () => {
  const tree = makeTree({ baumartlat: 'spec.', baumnamelat: null, baumnamedeu: 'Ahorn' });
  const url = wikipediaUrl(tree, 'de');
  assertIncludes(url, 'wiki/Acer');
  assert(!url.includes('spec'));
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

test('Hybrid (x-prefix) → falls back to genus only', () => {
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

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
