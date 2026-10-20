/**
 * Unit tests for the share-link helper in helpers.js (parseSharedLink).
 * Run with: node tests/share.test.js
 */

// helpers.js calls matchMedia once at render-time — stub so the module loads in Node.
globalThis.matchMedia = () => ({ matches: true });

import { parseSharedLink } from '../helpers.js';

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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
