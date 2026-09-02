import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import mock from '../mock/pipedrive-mock.js';
import { openStore } from '../src/store.js';
import { createApp } from '../src/server.js';
import {
  handleDelivery, readEnvelope, isSupportActivity,
  normaliseSubject, UnsupportedPayload
} from '../src/tickets.js';
import { slaDueAt, priorityForTier } from '../src/sla.js';

const ROOT = join(import.meta.dirname, '..');
const EVENTS = join(ROOT, 'fixtures', 'events');
const EXPECTED = join(ROOT, 'fixtures', 'expected');

const expectedOutcomes = JSON.parse(readFileSync(join(EXPECTED, 'outcomes.json'), 'utf8'));
const expectedTickets = JSON.parse(readFileSync(join(EXPECTED, 'tickets.json'), 'utf8'));

const eventFiles = readdirSync(EVENTS).filter((f) => f.endsWith('.json')).sort();
const loadEvent = (f) => JSON.parse(readFileSync(join(EVENTS, f), 'utf8'));

let scratch;
before(async () => {
  scratch = mkdtempSync(join(tmpdir(), 'ticket-forge-'));
  if (!mock.listening) await new Promise((r) => mock.once('listening', r));
});
after(() => {
  mock.close();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

describe('service levels', () => {
  test('tier maps to priority, unknown tiers fall back', () => {
    assert.equal(priorityForTier('gold'), 'urgent');
    assert.equal(priorityForTier('silver'), 'high');
    assert.equal(priorityForTier('bronze'), 'normal');
    assert.equal(priorityForTier(null), 'low');
    assert.equal(priorityForTier('platinum'), 'low');
  });

  test('a target lands inside the next working window', () => {
    assert.equal(slaDueAt('2026-09-14T08:00:00Z', 'normal'), '2026-09-15T08:00:00Z');
    assert.equal(slaDueAt('2026-09-15T05:30:00Z', 'high'), '2026-09-15T11:00:00Z');
    assert.equal(slaDueAt('2026-09-18T15:30:00Z', 'normal'), '2026-09-21T15:00:00Z');
  });

  test('the weekend does not consume the target', () => {
    assert.equal(slaDueAt('2026-09-12T09:00:00Z', 'urgent'), '2026-09-14T08:00:00Z');
    assert.equal(slaDueAt('2026-09-11T13:00:00Z', 'low'), '2026-09-15T13:00:00Z');
  });

  test('a target spanning late October still lands at the right wall-clock time', () => {
    assert.equal(slaDueAt('2026-10-23T14:30:00Z', 'urgent'), '2026-10-26T08:30:00Z');
    assert.equal(slaDueAt('2026-10-23T14:30:00Z', 'high'), '2026-10-26T11:30:00Z');
  });
});

describe('delivery envelope', () => {
  test('a supported delivery yields its parts', () => {
    const env = readEnvelope(loadEvent('event-01.json'));
    assert.equal(env.action, 'create');
    assert.equal(env.entity, 'activity');
    assert.equal(env.deliveryId, 'e1a00001-0000-4000-8000-000000000001');
    assert.equal(env.activity.id, 5001);
  });

  test('a delivery this service does not accept is refused, not guessed at', () => {
    assert.throws(() => readEnvelope(loadEvent('event-14.json')), UnsupportedPayload);
  });
});

describe('support filtering', () => {
  test('only tagged tasks count as support', () => {
    assert.equal(isSupportActivity(loadEvent('event-01.json').data), true);
    assert.equal(isSupportActivity(loadEvent('event-06.json').data), false);
  });

  test('the tag is stripped from the stored subject', () => {
    assert.equal(
      normaliseSubject('[SUPPORT] Barcode scanner drops connection in bay 3'),
      'Barcode scanner drops connection in bay 3'
    );
  });
});

describe('replaying the delivery log', () => {
  let store;
  const outcomes = [];

  before(async () => {
    store = openStore(join(scratch, 'replay.db'));
    for (const file of eventFiles) {
      let outcome;
      try {
        outcome = await handleDelivery(loadEvent(file), store);
      } catch (err) {
        if (!(err instanceof UnsupportedPayload)) throw err;
        outcome = { result: 'rejected', status: 400 };
      }
      outcomes.push({ event: file.replace('.json', ''), ...outcome });
    }
  });

  test('every delivery reaches the outcome it should', () => {
    assert.deepEqual(outcomes, expectedOutcomes);
  });

  test('the resulting tickets match the reference set', () => {
    const actual = store.all().map((row) => {
      const clean = {};
      for (const key of Object.keys(expectedTickets[0])) clean[key] = row[key] ?? null;
      return clean;
    });
    assert.deepEqual(actual, expectedTickets);
  });

  test('replaying the whole log a second time changes nothing', async () => {
    const before = JSON.stringify(store.all());
    for (const file of eventFiles) {
      try { await handleDelivery(loadEvent(file), store); }
      catch (err) { if (!(err instanceof UnsupportedPayload)) throw err; }
    }
    assert.equal(JSON.stringify(store.all()), before);
  });
});

describe('persistence', () => {
  test('tickets are still there after the store is reopened', async () => {
    const file = join(scratch, 'durable.db');
    const first = openStore(file);
    await handleDelivery(loadEvent('event-01.json'), first);
    const written = first.all();
    first.close();

    const second = openStore(file);
    assert.deepEqual(second.all(), written);
    assert.equal(second.all().length, 1);
    second.close();
  });
});

describe('http surface', () => {
  let server;
  let base;
  const creds = 'Basic ' + Buffer.from('pipedrive:tf_hook_secret').toString('base64');

  before(async () => {
    server = createApp(openStore(join(scratch, 'http.db')));
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server?.close());

  const post = (body, headers = {}) => fetch(`${base}/webhooks/pipedrive`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: creds, ...headers },
    body: JSON.stringify(body)
  });

  test('a delivery without valid credentials is turned away', async () => {
    const res = await post(loadEvent('event-01.json'), { authorization: 'Basic ' + Buffer.from('pipedrive:wrong').toString('base64') });
    assert.equal(res.status, 401);
  });

  test('an accepted delivery reports what it did', async () => {
    const res = await post(loadEvent('event-03.json'));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).result, 'created');
  });

  test('a delivery this service does not accept answers 400', async () => {
    const res = await post(loadEvent('event-14.json'));
    assert.equal(res.status, 400);
  });

  test('the ticket list is served', async () => {
    const res = await fetch(`${base}/tickets`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data[0].id, 'PD-5003');
  });
});
