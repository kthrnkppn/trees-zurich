/**
 * Unit tests for station30DaySum() in helpers.js — parses MeteoSwiss
 * daily-recent CSV (semicolon-separated, reference_timestamp + rre150d0).
 * Run with: node tests/rain.test.js
 */

// helpers.js calls matchMedia once at render-time — stub so the module loads in Node.
globalThis.matchMedia = () => ({ matches: true });

import { station30DaySum } from '../helpers.js';

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
  if (actual !== expected)
    throw new Error(msg || `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function csv(rows) {
  return 'reference_timestamp;rre150d0\n' + rows.join('\n');
}

console.log('station30DaySum()');

test('sums the last 30 days, inclusive of the last row', () => {
  // 30 days: 1.0 + 2.0 + ... + 30.0 = 465; a 31-day-old outlier must not count.
  const rows = [];
  for (let i = 30; i >= 1; i--) rows.push(`01.03.2024 06:00;${i}.0`);
  rows.push('01.01.2024 06:00;999.0'); // 60 days before 01.03 — outside the window
  assertEquals(station30DaySum(csv(rows)), 465);
});

test('missing values ("-") are skipped, not summed as zero-day rows', () => {
  assertEquals(station30DaySum(csv(['01.02.2024 06:00;-', '02.02.2024 06:00;5.5'])), 5.5);
});

test('empty value is skipped like "-"', () => {
  assertEquals(station30DaySum(csv(['01.02.2024 06:00;', '02.02.2024 06:00;2.0'])), 2.0);
});

test('garbage date is skipped', () => {
  assertEquals(station30DaySum(csv(['not-a-date;10.0', '02.02.2024 06:00;3.0'])), 3.0);
});

test('missing columns → null (header without rain column)', () => {
  assertEquals(station30DaySum('reference_timestamp;other\n01.02.2024;5'), null);
});

test('no usable rows → null', () => {
  assertEquals(station30DaySum(csv(['01.02.2024 06:00;-'])), null);
});

test('real-shape row (extra columns, full timestamp) parses', () => {
  const text =
    'station;reference_timestamp;rre150d0;extra\n' +
    'TAE;29.02.2024 06:00;1.5;x\n' +
    'TAE;01.03.2024 06:00;2.5;x\n';
  assertEquals(station30DaySum(text), 4.0);
});

console.log(`\nRain tests: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
