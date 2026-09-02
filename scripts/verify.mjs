// Runs the acceptance suite and records the result of this pass.
// Run it as often as you like; the last run is the one that counts.

import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.assessment');
const LOG = join(OUT, 'verify-runs.ndjson');

const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
};

const started = Date.now();
const startedAt = new Date(started).toISOString();
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], {
  cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300_000
});
const duration = Date.now() - started;
const output = `${result.stdout || ''}${result.stderr || ''}`;

const pick = (label) => {
  const m = output.match(new RegExp(`^# ${label} (\\d+)`, 'm'));
  return m ? Number(m[1]) : null;
};
const tests = pick('tests');
const pass = pick('pass');
const fail = pick('fail');
const green = result.status === 0;

let attempt = 1;
try {
  if (existsSync(LOG)) attempt = readFileSync(LOG, 'utf8').split('\n').filter(Boolean).length + 1;
} catch { /* first run */ }

try {
  mkdirSync(OUT, { recursive: true });
  appendFileSync(LOG, JSON.stringify({
    ts: new Date().toISOString(),
    started_at: startedAt,
    attempt,
    green,
    exit_code: result.status,
    tests, pass, fail,
    duration_ms: duration,
    node: process.version,
    head: git(['rev-parse', 'HEAD']),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    dirty: git(['status', '--porcelain'])?.length > 0,
    failed_tests: [...output.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim())
  }) + '\n');
} catch { /* never block the developer on bookkeeping */ }

process.stdout.write(output);
process.stdout.write(
  `\n${green ? 'PASS' : 'FAIL'}  ${pass ?? 0}/${tests ?? 0} checks  ` +
  `(${(duration / 1000).toFixed(1)}s, attempt ${attempt})\n`
);
if (!green) {
  process.stdout.write('Run `npm test` on its own for the detailed output.\n');
}
process.exitCode = result.status === 0 ? 0 : 1;
