/**
 * Integrity checks for curated data files — collections.js and curiosities.js.
 * Verifies that every entry has the required structure.
 * Run with: node tests/data-integrity.test.js
 */

import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

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

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

// ─── Load data files ──────────────────────────────────────────────────────────
const { collections } = await import(pathToFileURL(path.join(projectRoot, 'collections.js')));
const { curiosities } = await import(pathToFileURL(path.join(projectRoot, 'curiosities.js')));

// ─── collections.js ───────────────────────────────────────────────────────────
console.log('\ncollections.js structure');

test('is a non-empty array', () => {
  assert(Array.isArray(collections) && collections.length > 0);
});

for (const col of collections) {
  test(`collection "${col.id}" has required fields`, () => {
    assert(typeof col.id === 'string' && col.id.length > 0, `missing id`);
    assert(typeof col.label?.de === 'string' && col.label.de.length > 0, `missing label.de`);
    assert(typeof col.label?.en === 'string' && col.label.en.length > 0, `missing label.en`);
    assert(Array.isArray(col.genera) && col.genera.length > 0, `missing or empty genera`);
  });

  test(`collection "${col.id}" genera are non-empty strings`, () => {
    for (const g of col.genera) {
      assert(typeof g === 'string' && g.length > 0, `invalid genus entry: ${JSON.stringify(g)}`);
      assert(!g.includes(' '), `genus should be a single word (latin genus), got: "${g}"`);
    }
  });
}

// ─── curiosities.js ───────────────────────────────────────────────────────────
console.log('\ncuriosities.js structure');

test('is a non-empty array', () => {
  assert(Array.isArray(curiosities) && curiosities.length > 0);
});

for (const cur of curiosities) {
  const id = cur.genus + (cur.art ? ` ${cur.art}` : '');
  test(`curiosity "${id}" has required fields`, () => {
    assert(typeof cur.genus === 'string' && cur.genus.length > 0, `missing genus`);
    assert(typeof cur.label?.de === 'string' && cur.label.de.length > 0, `missing label.de`);
    assert(typeof cur.label?.en === 'string' && cur.label.en.length > 0, `missing label.en`);
  });
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
