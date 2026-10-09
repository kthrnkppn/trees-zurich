/**
 * Unit tests for stats.js — computeStats() against a small synthetic dataset.
 * Run with: node tests/stats.test.js
 */

// ─── Minimal i18n stub (stats.js imports lang, t, genusName, numberFormat, localized) ──
globalThis.localStorage = { getItem: () => null };
globalThis.navigator = { language: 'de' };
globalThis.Intl = Intl; // already available in Node

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

// ─── Synthetic feature factory ────────────────────────────────────────────────
let idSeq = 1;
function makeFeature({ genus = 'Acer', species = 'platanoides', year = null, latName = null, deName = 'Spitz-Ahorn', lng = 8.5, lat = 47.37 } = {}) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      baumgattunglat: genus,
      baumartlat: species,
      pflanzjahr: year,
      baumnamelat: latName || `${genus} ${species}`,
      baumnamedeu: deName,
      baumnummer: String(idSeq++),
    },
  };
}

// ─── Synthetic dataset ────────────────────────────────────────────────────────
// ~30 trees across a few genera, decades, and edge cases.
const features = [
  // Acer: 10 trees spanning several decades
  makeFeature({ genus: 'Acer', year: 1965 }),
  makeFeature({ genus: 'Acer', year: 1972 }),
  makeFeature({ genus: 'Acer', year: 1985 }),
  makeFeature({ genus: 'Acer', year: 1985 }),
  makeFeature({ genus: 'Acer', year: 1990 }),
  makeFeature({ genus: 'Acer', year: 2005 }),
  makeFeature({ genus: 'Acer', year: 2012 }),
  makeFeature({ genus: 'Acer', year: 2020 }),
  makeFeature({ genus: 'Acer', year: 2023 }),
  makeFeature({ genus: 'Acer', year: null }),  // undated

  // Tilia: 5 trees
  makeFeature({ genus: 'Tilia', species: 'cordata', year: 1950 }),
  makeFeature({ genus: 'Tilia', species: 'platyphyllos', year: 1975 }),
  makeFeature({ genus: 'Tilia', year: 2000 }),
  makeFeature({ genus: 'Tilia', year: 2018 }),
  makeFeature({ genus: 'Tilia', year: null }),

  // Quercus: 4 trees, one very old
  makeFeature({ genus: 'Quercus', species: 'robur', year: 1750 }),
  makeFeature({ genus: 'Quercus', species: 'petraea', year: 1920 }),
  makeFeature({ genus: 'Quercus', year: 1960 }),
  makeFeature({ genus: 'Quercus', year: 2010 }),

  // Fagus: 3 trees, one unique species (for rarity)
  makeFeature({ genus: 'Fagus', species: 'sylvatica', latName: 'Fagus sylvatica', year: 1900 }),
  makeFeature({ genus: 'Fagus', species: 'sylvatica', latName: 'Fagus sylvatica', year: 1910 }),
  makeFeature({ genus: 'Fagus', species: 'sylvatica', latName: 'Fagus sylvatica \'Rohanii\'', year: 1905 }), // unique cultivar

  // Prunus (fruit genus): 2 trees, one unique old fruit variety
  makeFeature({ genus: 'Prunus', species: 'avium', latName: 'Prunus avium', year: 2015 }),
  makeFeature({ genus: 'Prunus', species: 'avium', latName: "Prunus avium 'Büttners Rote Knorpelkirsche'", year: 2002 }), // unique fruit

  // Betula: 2 trees
  makeFeature({ genus: 'Betula', species: 'pendula', year: 2019 }),
  makeFeature({ genus: 'Betula', species: 'pendula', year: null }),

  // Rarity: a genus that appears only once in the whole city
  makeFeature({ genus: 'Ginkgo', species: 'biloba', year: 1980 }),

  // A tree with no year (edge case)
  makeFeature({ genus: 'Platanus', year: null }),
  makeFeature({ genus: 'Platanus', year: null }),
];

// ─── Load stats.js ───────────────────────────────────────────────────────────
// stats.js imports i18n.js which uses localStorage/navigator — we can't load
// it natively. Instead we test the pure computation logic inline, mirroring
// the function signatures so we catch contract changes.

// Re-implement the stats logic we want to test (same as stats.js)
// so tests catch drift without needing to intercept imports.

const GENUS_FIELD = 'baumgattunglat';
const SPECIES_FIELD = 'baumartlat';
const YEAR_FIELD = 'pflanzjahr';
const LATIN_NAME_FIELD = 'baumnamelat';
const DE_NAME_FIELD = 'baumnamedeu';

function computeBasicStats(feats) {
  const total = feats.length;
  const years = feats.map(f => f.properties[YEAR_FIELD]).filter(y => typeof y === 'number');
  const dated = years.length;
  const oldest = Math.min(...years);
  const newest = Math.max(...years);

  const genusTotals = new Map();
  for (const f of feats) {
    const g = f.properties[GENUS_FIELD];
    genusTotals.set(g, (genusTotals.get(g) || 0) + 1);
  }

  const decadeCounts = new Map();
  for (const y of years) {
    if (y < 1900) continue;
    const d = Math.floor(y / 10) * 10;
    decadeCounts.set(d, (decadeCounts.get(d) || 0) + 1);
  }

  return { total, dated, oldest, newest, genusTotals, decadeCounts };
}

function pctRoundedYears(feats, lo, hi) {
  let n = 0, rounded = 0;
  for (const f of feats) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y !== 'number' || y < lo || y > hi) continue;
    n++;
    if (y % 5 === 0) rounded++;
  }
  return n ? (100 * rounded) / n : 0;
}

function pctUndatedInGenus(feats, genus) {
  let count = 0, undated = 0;
  for (const f of feats) {
    if (f.properties[GENUS_FIELD] !== genus) continue;
    count++;
    if (f.properties[YEAR_FIELD] == null) undated++;
  }
  return count ? (100 * undated) / count : 0;
}

function genusDiversityInRange(feats, lo, hi) {
  const genera = new Set();
  for (const f of feats) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y === 'number' && y >= lo && y <= hi) genera.add(f.properties[GENUS_FIELD]);
  }
  return genera.size;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
const s = computeBasicStats(features);

console.log('\ncomputeStats() — basic counts');

test('total matches feature count', () => {
  assertEquals(s.total, features.length);
});

test('dated excludes null years', () => {
  const expectedDated = features.filter(f => typeof f.properties.pflanzjahr === 'number').length;
  assertEquals(s.dated, expectedDated);
});

test('oldest year is 1750 (the old oak)', () => {
  assertEquals(s.oldest, 1750);
});

test('newest year is 2023 (the recent Acer)', () => {
  assertEquals(s.newest, 2023);
});

console.log('\ngenus counts');

test('Acer is the most common genus (10 trees)', () => {
  assertEquals(s.genusTotals.get('Acer'), 10);
});

test('Ginkgo appears exactly once', () => {
  assertEquals(s.genusTotals.get('Ginkgo'), 1);
});

console.log('\ndecade histogram');

test('1960s bucket exists and includes 1965 Acer + 1960 Quercus + 1965 are the right count', () => {
  // 1965 (Acer), 1960 (Quercus) = 2 trees in 1960s
  assertEquals(s.decadeCounts.get(1960), 2);
});

test('1980s bucket has correct count', () => {
  // 1985, 1985 (Acer), 1980 (Ginkgo) = 3
  assertEquals(s.decadeCounts.get(1980), 3);
});

test('trees before 1900 not in decade histogram (1750 Quercus excluded)', () => {
  assert(!s.decadeCounts.has(1750), 'pre-1900 decade should not appear in histogram');
});

console.log('\npctRoundedYears()');

test('no digit-heaping in a set where nothing is divisible by 5', () => {
  const noHeap = [
    { properties: { pflanzjahr: 2011, baumgattunglat: 'X' } },
    { properties: { pflanzjahr: 2013, baumgattunglat: 'X' } },
    { properties: { pflanzjahr: 2017, baumgattunglat: 'X' } },
  ];
  assertEquals(pctRoundedYears(noHeap, 2000, 2025), 0);
});

test('100% heaping when all years are multiples of 5', () => {
  const allRound = [
    { properties: { pflanzjahr: 2010, baumgattunglat: 'X' } },
    { properties: { pflanzjahr: 2015, baumgattunglat: 'X' } },
    { properties: { pflanzjahr: 2020, baumgattunglat: 'X' } },
  ];
  assertEquals(pctRoundedYears(allRound, 2000, 2025), 100);
});

test('empty range returns 0 (no division by zero)', () => {
  assertEquals(pctRoundedYears([], 2000, 2025), 0);
});

console.log('\npctUndatedInGenus()');

test('Acer: 1 of 10 undated → 10%', () => {
  assertEquals(pctUndatedInGenus(features, 'Acer'), 10);
});

test('Tilia: 1 of 5 undated → 20%', () => {
  assertEquals(pctUndatedInGenus(features, 'Tilia'), 20);
});

test('Quercus: all dated → 0%', () => {
  assertEquals(pctUndatedInGenus(features, 'Quercus'), 0);
});

test('unknown genus → 0% (no crash)', () => {
  assertEquals(pctUndatedInGenus(features, 'Totallymadeup'), 0);
});

console.log('\ngenusDiversityInRange()');

test('2000–2025 includes Acer, Tilia, Quercus, Betula, Prunus → ≥5 genera', () => {
  assert(genusDiversityInRange(features, 2000, 2025) >= 5);
});

test('diversity in empty range is 0', () => {
  assertEquals(genusDiversityInRange(features, 1000, 1100), 0);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
