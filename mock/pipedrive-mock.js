// Local stand-in for the Pipedrive REST API.
// Runs offline on http://127.0.0.1:4010 and serves a fixed dataset.

import { createServer } from 'node:http';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { organizations, persons, users } from './dataset.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PORT = Number(process.env.MOCK_PORT || 4010);
const TOKEN = process.env.PIPEDRIVE_TOKEN || 'tf_local_dev_token';

const RATE_WINDOW_MS = 5_000;
const RATE_MAX = 10;
const hits = [];

const LOG = join(ROOT, '.assessment', 'api-calls.ndjson');
function record(entry) {
  try {
    mkdirSync(dirname(LOG), { recursive: true });
    appendFileSync(LOG, JSON.stringify(entry) + '\n');
  } catch { /* logging must never break a request */ }
}

function send(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    ...extraHeaders
  });
  res.end(payload);
  return status;
}

function ok(res, data, additional_data) {
  const body = { success: true, data };
  if (additional_data) body.additional_data = additional_data;
  return send(res, 200, body);
}

function fail(res, status, error, error_info) {
  const body = { success: false, error };
  if (error_info) body.error_info = error_info;
  return send(res, status, body);
}

function paginate(rows, url) {
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
  const cursor = url.searchParams.get('cursor');
  const startIdx = cursor ? rows.findIndex((r) => String(r.id) === String(cursor)) : 0;
  if (cursor && startIdx === -1) return null;
  const slice = rows.slice(startIdx, startIdx + limit);
  const nextRow = rows[startIdx + limit];
  return {
    data: slice,
    additional_data: { next_cursor: nextRow ? String(nextRow.id) : null }
  };
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const started = Date.now();

  let status = 0;
  const finish = () => record({
    ts: new Date().toISOString(),
    method: req.method,
    path,
    query: Object.fromEntries(url.searchParams),
    auth: req.headers.authorization ? req.headers.authorization.split(' ')[0] : null,
    status,
    ms: Date.now() - started
  });

  // Retired API surface. Everything under /v1 was switched off on 2026-07-31.
  if (path === '/v1' || path.startsWith('/v1/') || path.startsWith('/api/v1/')) {
    status = fail(res, 410, 'Gone', 'https://developers.pipedrive.com/changelog');
    return finish();
  }

  if (!path.startsWith('/api/v2')) {
    status = fail(res, 404, 'Not found');
    return finish();
  }

  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${TOKEN}`) {
    status = fail(res, 401, 'Unauthorized', 'Missing or invalid bearer credentials');
    return finish();
  }

  const now = Date.now();
  while (hits.length && now - hits[0] > RATE_WINDOW_MS) hits.shift();
  if (hits.length >= RATE_MAX) {
    const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - hits[0])) / 1000));
    status = send(res, 429, { success: false, error: 'Rate limit exceeded' }, {
      'retry-after': String(retryAfter),
      'x-ratelimit-limit': String(RATE_MAX),
      'x-ratelimit-remaining': '0'
    });
    return finish();
  }
  hits.push(now);

  const rest = path.slice('/api/v2'.length) || '/';
  const seg = rest.split('/').filter(Boolean);

  if (seg.length === 0) {
    status = ok(res, {
      resources: ['/api/v2/persons', '/api/v2/persons/{id}', '/api/v2/organizations',
                  '/api/v2/organizations/{id}', '/api/v2/users', '/api/v2/users/{id}']
    });
    return finish();
  }

  const collections = { persons, organizations, users };
  const [name, id] = seg;
  const rows = collections[name];

  if (!rows) {
    status = fail(res, 404, 'Not found');
    return finish();
  }
  if (req.method !== 'GET') {
    status = fail(res, 405, 'Method not allowed');
    return finish();
  }

  if (id === undefined) {
    const page = paginate(rows, url);
    if (!page) { status = fail(res, 400, 'Invalid cursor'); return finish(); }
    status = ok(res, page.data, page.additional_data);
    return finish();
  }

  const row = rows.find((r) => String(r.id) === id);
  if (!row) { status = fail(res, 404, 'Not found'); return finish(); }
  status = ok(res, row);
  return finish();
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`mock api listening on http://127.0.0.1:${PORT}\n`);
});

export default server;
