// HTTP surface.
//
//   POST /webhooks/pipedrive   receives deliveries from Pipedrive
//   GET  /tickets              lists the tickets held by this service
//   GET  /health               liveness

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 3000);

export function createApp(store) {
  return createServer((req, res) => {
    res.writeHead(501, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not implemented' }));
  });
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  process.stdout.write('server entrypoint is not wired up yet\n');
  process.exitCode = 1;
}
