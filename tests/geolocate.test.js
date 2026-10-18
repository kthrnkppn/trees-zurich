/**
 * Unit tests for the geolocation error messaging helpers in helpers.js —
 * pure logic, no browser, no map.
 * Run with: node tests/geolocate.test.js
 */

// helpers.js calls matchMedia once at render time — stub so the module loads
// in Node without a DOM. The real i18n.js is imported (its localStorage /
// navigator access is try/caught and falls back to German).
globalThis.matchMedia = () => ({ matches: true });

import { detectBrowserName, isIOSDevice, geolocateErrorKey } from '../helpers.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function assertEquals(actual, expected, msg) {
  if (actual !== expected)
    throw new Error(msg || `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assert(condition, msg = 'assertion failed') {
  if (!condition) throw new Error(msg);
}

// ─── Realistic user agents ───────────────────────────────────────────────────
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FIREFOX_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/605.1.15';
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/121.0.6167.138 Mobile/15E148 Safari/604.1';
const FIREFOX_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0';
const CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const EDGE_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0';
const SAFARI_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

// ─── detectBrowserName: names the browser for the settings instructions ──────
test('detectBrowserName: Firefox on iPhone', () => {
  assertEquals(detectBrowserName(FIREFOX_IOS), 'Firefox');
});

test('detectBrowserName: Chrome on iPhone', () => {
  assertEquals(detectBrowserName(CHROME_IOS), 'Chrome');
});

test('detectBrowserName: Safari on iPhone', () => {
  assertEquals(detectBrowserName(SAFARI_IOS), 'Safari');
});

test('detectBrowserName: desktop Firefox / Chrome / Edge', () => {
  assertEquals(detectBrowserName(FIREFOX_DESKTOP), 'Firefox');
  assertEquals(detectBrowserName(CHROME_DESKTOP), 'Chrome');
  assertEquals(detectBrowserName(EDGE_DESKTOP), 'Edge');
});

test('detectBrowserName: desktop Safari', () => {
  assertEquals(detectBrowserName(SAFARI_DESKTOP), 'Safari');
});

// ─── isIOSDevice: picks the touch-OS vs desktop wording ──────────────────────
test('isIOSDevice: iPhone UA', () => {
  assertEquals(isIOSDevice(SAFARI_IOS, true), true);
  assertEquals(isIOSDevice(FIREFOX_IOS, true), true);
});

test('isIOSDevice: iPad in desktop mode (Macintosh UA + touch)', () => {
  assertEquals(isIOSDevice(IPAD_DESKTOP_MODE, true), true);
});

test('isIOSDevice: desktop Mac without touch is not iOS', () => {
  assertEquals(isIOSDevice(SAFARI_DESKTOP, false), false);
  assertEquals(isIOSDevice(FIREFOX_DESKTOP, false), false);
});

test('isIOSDevice: Windows desktop', () => {
  assertEquals(isIOSDevice(CHROME_DESKTOP, false), false);
});

// ─── geolocateErrorKey: maps the standard error codes to message keys ───────
test('geolocateErrorKey: permission denied on iOS → geo.denied', () => {
  assertEquals(geolocateErrorKey(1, { isIOS: true }), 'geo.denied');
});

test('geolocateErrorKey: permission denied on desktop → geo.deniedDesktop', () => {
  assertEquals(geolocateErrorKey(1, { isIOS: false }), 'geo.deniedDesktop');
});

test('geolocateErrorKey: position unavailable → geo.unavailable', () => {
  assertEquals(geolocateErrorKey(2), 'geo.unavailable');
});

test('geolocateErrorKey: timeout → geo.timeout', () => {
  assertEquals(geolocateErrorKey(3), 'geo.timeout');
});

test('geolocateErrorKey: unknown code falls back to timeout', () => {
  assertEquals(geolocateErrorKey(undefined), 'geo.timeout');
  assertEquals(geolocateErrorKey(99), 'geo.timeout');
});

test('geolocateErrorKey: unsupported device → geo.unsupported', () => {
  assertEquals(geolocateErrorKey(1, { unsupported: true }), 'geo.unsupported');
});

test('geolocateErrorKey: insecure (http) origin → geo.insecure, regardless of code', () => {
  assertEquals(geolocateErrorKey(1, { insecure: true }), 'geo.insecure');
  assertEquals(geolocateErrorKey(2, { insecure: true }), 'geo.insecure');
  assertEquals(geolocateErrorKey(3, { insecure: true }), 'geo.insecure');
  assertEquals(geolocateErrorKey(1, { insecure: true, isIOS: false }), 'geo.insecure');
});

// ─── i18n strings: both languages define the keys, {browser} is present ──────
test('i18n: geolocation strings exist in both languages with {browser}', () => {
  const src = readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
  for (const key of [
    'geo.denied',
    'geo.deniedDesktop',
    'geo.unavailable',
    'geo.timeout',
    'geo.unsupported',
    'geo.insecure',
  ]) {
    const occurrences = src.split(`'${key}':`).length - 1;
    assertEquals(occurrences, 2, `expected '${key}': in both de and en blocks, found ${occurrences}`);
  }
  assert(src.includes('{browser}'), 'permission messages should name the browser');
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(40));
console.log(`Geolocate tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
