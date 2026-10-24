/**
 * Unit tests for the share-link helper in helpers.js (parseSharedLink).
 * Run with: node tests/share.test.js
 */

// helpers.js calls matchMedia once at render-time — stub so the module loads in Node.
globalThis.matchMedia = () => ({ matches: true });

import { parseSharedLink, encodeShareFilter, decodeShareFilter, parseFilterLink } from '../helpers.js';

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

function assertEquals(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(msg || `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log('parseSharedLink()');

test('empty / bare search → null (plain map)', () => {
  assertEquals(parseSharedLink(''), null);
  assertEquals(parseSharedLink('?'), null);
});

test('tree link → the baumnummer', () => {
  assertEquals(parseSharedLink('?baum=nn-1851'), 'nn-1851');
  assertEquals(parseSharedLink('?baum=WD-13806'), 'WD-13806');
});

test('URL-encoded baumnummer is decoded by URLSearchParams', () => {
  assertEquals(parseSharedLink('?baum=WD%2D14473'), 'WD-14473');
});

test('stale filter param from an old build is ignored', () => {
  assertEquals(parseSharedLink('?f=%7B%22g%22%3A%22Acer%22%7D'), null);
  assertEquals(parseSharedLink('?f=not-json'), null);
});

test('tree link wins alongside any other params', () => {
  assertEquals(parseSharedLink('?baum=nn-1851&f=%7B%22g%22%3A%22Acer%22%7D'), 'nn-1851');
});

test('empty baum value → null', () => {
  assertEquals(parseSharedLink('?baum='), null);
});

console.log('\nencodeShareFilter() / decodeShareFilter()');

test('empty state encodes to nothing', () => {
  assertEquals(encodeShareFilter({}), '');
  assertEquals(decodeShareFilter(''), null);
});

test('curated collection travels by id, roundtrip intact', () => {
  const enc = encodeShareFilter({ collection: { id: 'allergie' } });
  assertEquals(enc, encodeURIComponent(JSON.stringify({ c: 'allergie' })));
  assertEquals(parseFilterLink(`?f=${enc}`), { collection: { id: 'allergie' } });
});

test('search group travels as query + genus list', () => {
  const enc = encodeShareFilter({
    collection: { search: true, query: 'Kastanie', genera: ['Castanea'] },
  });
  assertEquals(parseFilterLink(`?f=${enc}`), {
    collection: { search: true, query: 'Kastanie', genera: ['Castanea'] },
  });
});

test('genus + species roundtrip; species without genus is dropped on both ends', () => {
  const enc = encodeShareFilter({ genus: 'Quercus', species: 'robur' });
  assertEquals(parseFilterLink(`?f=${enc}`), { genus: 'Quercus', species: 'robur' });
  assertEquals(encodeShareFilter({ species: 'robur' }), '');
  assertEquals(decodeShareFilter(JSON.stringify({ s: 'robur' })), null);
});

test('year window omitted when a toggle owns it; unknown-year wins over young-tree', () => {
  assertEquals(
    encodeShareFilter({ youngTree: true, yearMin: 1900, yearMax: 1950 }),
    encodeURIComponent(JSON.stringify({ w: 1 }))
  );
  assertEquals(
    decodeShareFilter(JSON.stringify({ u: 1, w: 1 })),
    { yearUnknown: true }
  );
  assertEquals(
    decodeShareFilter(JSON.stringify({ w: 1 })),
    { youngTree: true }
  );
});

test('year range roundtrip; out-of-range or fractional years dropped', () => {
  const enc = encodeShareFilter({ yearMin: 1900, yearMax: 1950 });
  assertEquals(parseFilterLink(`?f=${enc}`), { yearMin: 1900, yearMax: 1950 });
  assertEquals(decodeShareFilter(JSON.stringify({ ym: 1600, yx: 2200 })), null);
  assertEquals(decodeShareFilter(JSON.stringify({ ym: 1900.5 })), null);
  assertEquals(decodeShareFilter(JSON.stringify({ ym: '1900' })), null);
});

test('Blutbuche is standalone — other keys are ignored alongside it', () => {
  assertEquals(
    decodeShareFilter(JSON.stringify({ b: 1, g: 'Fagus', w: 1 })),
    { blutbuche: true }
  );
  assertEquals(encodeShareFilter({ blutbuche: true }), encodeURIComponent('{"b":1}'));
});

test('collection + drilled-down genus roundtrip', () => {
  const enc = encodeShareFilter({
    collection: { id: 'nadel' },
    genus: 'Picea',
  });
  assertEquals(parseFilterLink(`?f=${enc}`), {
    collection: { id: 'nadel' },
    genus: 'Picea',
  });
});

test('rarity scope travels by id; a picked variety rides along as its latin name', () => {
  // No variety picked: the scope is a plain id, like a curated collection.
  assertEquals(parseFilterLink(`?f=${encodeURIComponent('{"c":"genbank"}')}`), {
    collection: { id: 'genbank' },
  });
  // Variety picked: id + latin name roundtrip.
  const enc = encodeShareFilter({
    collection: { id: 'genbank', variety: "Malus domestica 'Boskoop'" },
  });
  assertEquals(parseFilterLink(`?f=${enc}`), {
    collection: { id: 'genbank', variety: "Malus domestica 'Boskoop'" },
  });
  // An overlong "variety" is dropped, the scope itself survives.
  assertEquals(
    decodeShareFilter(JSON.stringify({ c: { id: 'loner', v: 'x'.repeat(65) } })),
    { collection: { id: 'loner' } }
  );
  // An object without a usable id is not mistaken for a search group.
  assertEquals(decodeShareFilter(JSON.stringify({ c: { v: 'Malus domestica' } })), null);
});

test('malformed / hostile payloads degrade to null or a sanitized subset', () => {
  assertEquals(decodeShareFilter('not-json'), null);
  assertEquals(decodeShareFilter('[]'), null);
  assertEquals(decodeShareFilter('null'), null);
  assertEquals(decodeShareFilter('"x"'), null);
  // Non-string genera entries are filtered, not trusted.
  assertEquals(
    decodeShareFilter(JSON.stringify({ c: { q: 'x', g: ['Abies', 5, '', { a: 1 }] } })),
    { collection: { search: true, query: 'x', genera: ['Abies'] } }
  );
  // Overlong values are dropped; a payload with nothing left → null (plain map).
  assertEquals(decodeShareFilter(JSON.stringify({ g: 'x'.repeat(65) })), null);
  assertEquals(decodeShareFilter(JSON.stringify({ g: 'x'.repeat(64) })), { genus: 'x'.repeat(64) });
});

test('parseFilterLink reads f= end-to-end and ignores its absence', () => {
  const f = encodeURIComponent(JSON.stringify({ g: 'Quercus' }));
  assertEquals(parseFilterLink(`?f=${f}`), { genus: 'Quercus' });
  assertEquals(parseFilterLink('?f=not-json'), null);
  assertEquals(parseFilterLink(''), null);
  assertEquals(parseFilterLink('?baum=nn-1851'), null);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
