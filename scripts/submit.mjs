// Packages this checkout for hand-in.
//
// Produces submission-<name>.tgz in the repository root, containing your
// working tree, your full commit history, and the workspace metadata that
// the project's scripts recorded while you worked. Nothing is uploaded;
// the archive is written to disk for you to send on.

import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, rmSync, cpSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const git = (args, opts = {}) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();

let who = 'candidate';
try {
  who = (git(['config', 'user.name']) || 'candidate')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidate';
} catch { /* fall back */ }

if (!existsSync(join(ROOT, '.git'))) {
  process.stderr.write('No git repository found here. Commit your work first.\n');
  process.exit(1);
}

const dirty = git(['status', '--porcelain']);
if (dirty) {
  process.stdout.write('Uncommitted changes are present:\n' + dirty + '\n\nCommit them, then run this again.\n');
  process.exit(1);
}

const stage = join(tmpdir(), `ticket-forge-submit-${Date.now()}`);
const payload = join(stage, 'submission');
mkdirSync(payload, { recursive: true });

git(['bundle', 'create', join(payload, 'history.bundle'), '--all']);

for (const dir of ['src', 'test', 'mock', 'fixtures', 'scripts', '.assessment']) {
  const from = join(ROOT, dir);
  if (existsSync(from)) cpSync(from, join(payload, dir), { recursive: true });
}
for (const file of ['package.json', 'README.md', 'briefing.txt', 'Makefile', '.nvmrc', '.tool-versions']) {
  const from = join(ROOT, file);
  if (existsSync(from)) cpSync(from, join(payload, file));
}
if (existsSync(join(ROOT, 'NOTES.md'))) cpSync(join(ROOT, 'NOTES.md'), join(payload, 'NOTES.md'));

writeFileSync(join(payload, 'MANIFEST.json'), JSON.stringify({
  built_at: new Date().toISOString(),
  head: git(['rev-parse', 'HEAD']),
  branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
  commits: Number(git(['rev-list', '--count', 'HEAD'])),
  author_name: git(['config', 'user.name']) || null,
  author_email: git(['config', 'user.email']) || null,
  first_commit_at: git(['log', '--reverse', '--format=%aI', '--max-count=1']) || null,
  last_commit_at: git(['log', '-1', '--format=%aI']) || null,
  node: process.version
}, null, 2) + '\n');

const archive = join(ROOT, `submission-${who}.tgz`);
rmSync(archive, { force: true });
execSync(`tar -czf ${JSON.stringify(archive)} -C ${JSON.stringify(stage)} submission`);
rmSync(stage, { recursive: true, force: true });

process.stdout.write(`\nWrote ${archive}\nSend that file back to us.\n\n`);
