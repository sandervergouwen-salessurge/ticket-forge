// Workspace bootstrap.
//
// Records what this checkout was set up on and wires up the repository's
// git hooks. Everything it writes stays in .assessment/ on this machine.
// It never fails the install.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.assessment');

const HOME = os.homedir();
const redact = (s) => (typeof s === 'string' && HOME ? s.split(HOME).join('~') : s);

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: 4000
    }).trim().split('\n')[0];
  } catch {
    return null;
  }
}

function toolchain() {
  const probes = {
    git: ['git', ['--version']],
    make: ['make', ['--version']],
    brew: ['brew', ['--version']],
    python3: ['python3', ['--version']],
    docker: ['docker', ['--version']],
    npm: ['npm', ['--version']],
    pnpm: ['pnpm', ['--version']],
    yarn: ['yarn', ['--version']],
    bun: ['bun', ['--version']],
    nvm: ['nvm', ['--version']],
    fnm: ['fnm', ['--version']],
    asdf: ['asdf', ['--version']],
    volta: ['volta', ['--version']],
    mise: ['mise', ['--version']],
    jq: ['jq', ['--version']]
  };
  const found = {};
  for (const [name, [cmd, args]] of Object.entries(probes)) found[name] = run(cmd, args);
  return found;
}

// Names only. Values are never read: they can hold credentials.
function assistantSignals() {
  const pattern = /(CLAUDE|CURSOR|COPILOT|CODEX|AIDER|WINDSURF|CONTINUE|ANTHROPIC|OPENAI|GEMINI|ZED)/i;
  return Object.keys(process.env).filter((k) => pattern.test(k)).sort();
}

function gitFacts() {
  return {
    user_name: run('git', ['config', 'user.name']),
    user_email: run('git', ['config', 'user.email']),
    head: run('git', ['rev-parse', 'HEAD']),
    branch: run('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
    remote: run('git', ['config', '--get', 'remote.origin.url'])
  };
}

function installHooks() {
  if (!existsSync(join(ROOT, '.git'))) return 'no-repository';
  try {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: ROOT, stdio: 'ignore' });
    for (const hook of ['post-commit', 'post-checkout']) {
      const p = join(ROOT, '.githooks', hook);
      if (existsSync(p)) execFileSync('chmod', ['+x', p], { stdio: 'ignore' });
    }
    return 'configured';
  } catch {
    return 'failed';
  }
}

try {
  mkdirSync(OUT, { recursive: true });

  const snapshot = {
    schema: 1,
    captured_at: new Date().toISOString(),
    node: {
      version: process.version,
      exec_path: redact(process.execPath),
      versions: process.versions
    },
    platform: {
      type: os.type(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory_gb: Math.round(os.totalmem() / 1024 ** 3),
      shell: redact(process.env.SHELL || process.env.ComSpec || null),
      terminal: process.env.TERM_PROGRAM || null,
      terminal_version: process.env.TERM_PROGRAM_VERSION || null,
      ci: Boolean(process.env.CI)
    },
    locale: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      lang: process.env.LANG || null
    },
    package_manager: process.env.npm_config_user_agent || null,
    toolchain: toolchain(),
    assistant_env_keys: assistantSignals(),
    git: gitFacts(),
    hooks: installHooks()
  };

  writeFileSync(join(OUT, 'env.json'), JSON.stringify(snapshot, null, 2) + '\n');
  appendFileSync(join(OUT, 'timeline.ndjson'), JSON.stringify({
    ts: snapshot.captured_at, kind: 'install', node: process.version, head: snapshot.git.head
  }) + '\n');

  const major = Number(process.version.slice(1).split('.')[0]);
  if (Number.isFinite(major) && major < 24) {
    process.stdout.write(
      '\n  note: this project targets the Node.js version declared in package.json.\n\n'
    );
  }
} catch {
  // A bootstrap problem must never block installation.
}
