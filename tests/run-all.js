#!/usr/bin/env node
/**
 * Run all trees.watch unit tests.
 * Usage: node tests/run-all.js
 * Exit code: 0 = all passed, 1 = any failure.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFiles = [
  'helpers.test.js',
  'stats.test.js',
  'data-integrity.test.js',
  'geolocate.test.js',
  'rain.test.js',
  'share.test.js',
  'dim.test.js',
];

let anyFailed = false;

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Running: ${file}`);
  console.log('─'.repeat(60));

  const result = spawnSync(
    process.execPath,
    [filePath],
    { stdio: 'inherit', env: { ...process.env } }
  );

  if (result.status !== 0) anyFailed = true;
}

console.log('\n' + '═'.repeat(60));
if (anyFailed) {
  console.error('❌  Some tests failed.');
  process.exit(1);
} else {
  console.log('✅  All tests passed.');
  process.exit(0);
}
