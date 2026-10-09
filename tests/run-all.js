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
];

let anyFailed = false;

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Running: ${file}`);
  console.log('─'.repeat(60));

  const result = spawnSync(process.execPath, ['--input-type=module'], {
    input: `import ${JSON.stringify(pathToFileURL(filePath).href)}`,
    stdio: ['pipe', 'inherit', 'inherit'],
    env: { ...process.env },
  });

  // spawnSync with --input-type=module + import() is clunky; use direct script invocation
  const result2 = spawnSync(
    process.execPath,
    [filePath],
    { stdio: 'inherit', env: { ...process.env } }
  );

  if (result2.status !== 0) anyFailed = true;
}

console.log('\n' + '═'.repeat(60));
if (anyFailed) {
  console.error('❌  Some tests failed.');
  process.exit(1);
} else {
  console.log('✅  All tests passed.');
  process.exit(0);
}

function pathToFileURL(p) {
  return new URL(`file://${p}`);
}
