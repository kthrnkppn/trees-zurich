/**
 * Unit tests for the selection-dimming helper in helpers.js
 * (selectionDimExpr).
 * Run with: node tests/dim.test.js
 */

// helpers.js calls matchMedia once at render-time — stub so the module loads in Node.
globalThis.matchMedia = () => ({ matches: true });

import { selectionDimExpr } from '../helpers.js';

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

console.log('selectionDimExpr()');

test('builds a MapLibre case expression matching the selected tree', () => {
  assertEquals(
    selectionDimExpr('baumnummer', 'WD-13806', 1, 0.25),
    ['case', ['==', ['get', 'baumnummer'], ['literal', 'WD-13806']], 1, 0.25]
  );
});

test('bright value reflects the layer base opacity (gone trees: 0.85)', () => {
  const expr = selectionDimExpr('baumnummer', 'WD-1', 0.85, 0.25);
  assertEquals(expr[2], 0.85);
  assertEquals(expr[3], 0.25);
});

test('different selected ids produce different match clauses', () => {
  const a = selectionDimExpr('baumnummer', 'WD-1', 1, 0.25);
  const b = selectionDimExpr('baumnummer', 'WD-2', 1, 0.25);
  assertEquals(a[1][2][1], 'WD-1');
  assertEquals(b[1][2][1], 'WD-2');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
