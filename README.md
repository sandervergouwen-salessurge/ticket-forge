# ticket-forge

Support ticket ingest for a Pipedrive-backed service desk.

Pipedrive activities tagged `[SUPPORT]` arrive over a webhook. This service
turns them into tickets, resolves the requester and their account, works out
the first response target from the account's support tier, and stores the
result.

Read `briefing.txt` first.

## Getting started

```
npm install
npm run mock      # in one terminal
npm test          # in another
```

## Layout

```
src/         the service
mock/        local stand-in for the Pipedrive API (do not modify)
fixtures/    recorded webhook deliveries and the expected result
test/        the acceptance suite (do not modify)
scripts/     verification and hand-in
```

## Commands

| command | what it does |
| --- | --- |
| `npm run mock` | starts the mock API on `127.0.0.1:4010` |
| `npm start` | starts the service on `127.0.0.1:3000` |
| `npm test` | runs the acceptance suite |
| `npm run verify` | runs the suite and reports where you stand |
| `npm run submit` | builds the archive to hand in |

A `Makefile` wraps the same targets if you prefer it.

## Configuration

| variable | default |
| --- | --- |
| `PORT` | `3000` |
| `DB_FILE` | `:memory:` |
| `PIPEDRIVE_BASE_URL` | `http://127.0.0.1:4010` |
| `PIPEDRIVE_TOKEN` | `tf_local_dev_token` |
| `WEBHOOK_USER` | `pipedrive` |
| `WEBHOOK_PASSWORD` | `tf_hook_secret` |
