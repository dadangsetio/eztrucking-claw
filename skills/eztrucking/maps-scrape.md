# Skill: maps-scrape

## Purpose

Discover carrier/ekspedisi vendors from Google Maps via the deployed scraper at
`https://map-scrape.fishclaw.site`. A high-yield structured source for
`vendor-search` (PRD §5.2 step 1). Research only.

## Trigger

Called from `vendor-search` step 3, or explicit user request to find carriers on
a route. Never runs vendor-facing actions.

## Tools

`maps_scrape` (the maps-scrape plugin tool — calls the scraper API server-side);
`web_fetch` (GET) for `kb-lookup` dedupe. **NO money/amount tool. NO messaging.
NO browser.**

## Steps

1. Read `order.origin`, `order.destination`, `order.cargo` from run context.
   Build 1–3 Google Maps phrases, e.g. `ekspedisi <city>`,
   `jasa angkutan truk <city>`, `cargo <city>`.
2. Call `maps_scrape` with those `keywords` (and optional `lat`/`lon` to bias to
   the origin city). Leave `lang=id`, `depth=1` defaults unless a wider sweep is
   needed. The tool runs create → poll → download against the API and returns
   `{ jobId, status, count, candidates: [{name, phone, region, website, service}] }`.
3. If `status` is `timeout` or the result has an `error` / no candidates, STOP
   using this source and let `vendor-search` fall back to `web_search`. Never
   retry in a loop.
4. **Dedupe:** pull existing `vendor` rows via `kb-lookup` and drop candidates
   matching on `vendor.phone` or `vendor.name`.
5. Hand the deduped candidates to `vendor-search`, which owns persisting them to
   the backend (`source='internet'`, `services_validated=false`). Do NOT persist
   or message from this skill.

## Backend calls

None directly. The `maps_scrape` tool talks to the scraper API; candidates flow
to the backend through `vendor-search`'s existing persist step. Backend reads
(`kb-lookup`) use the base URL in `AGENTS.md`.

## Guardrails

NEVER message a vendor (research only). NEVER take a money-adjacent action. The
`maps_scrape` tool returns public business data only — pass only the route city
in `keywords`, never private order details. Does NOT itself commit any
order-state transition (backend commits).

## Notes

- The tool blocks until the scrape job finishes or `maxWaitSec` (default 180s)
  elapses, then returns `status='timeout'`. Keep `depth` low for speed.
- The scraper service base URL is configurable via the `MAPS_SCRAPE_URL` env var
  on the gateway (defaults to `https://map-scrape.fishclaw.site`).
