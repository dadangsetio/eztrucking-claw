# Skill: vendor-search

## Purpose

Discover new vendors on the internet (PRD §5.2 step 1) — on user request or proactively while gathering data.

## Trigger

- `mode:"order"` — Agent decision during `researching`, or explicit user chat ("find carriers for Surabaya–Makassar"). Triggered by an active order.
- `mode:"discovery"` — Vendor discovery cron fires (per `system_config.vendor_discovery_config`, default every 60 min). No active order context. Broad search for new carriers on common routes or underrepresented categories.
- `mode:"refresh"` — Vendor refresh cron fires (per `system_config.vendor_refresh_config`, default every 1 day). Re-validates existing vendors whose `last_refreshed_at` is beyond threshold.

## Tools

`web_search`, `web_fetch`, managed `browser` (isolated profile). **NO money/amount tool.**

## Persona

Not vendor-facing (research only). No WhatsApp messages sent.

## Steps

1. Read mode from cron/run context.
2. **If `mode:"order"`:** Read `order.origin`, `order.destination`, `order.cargo` from run context. Pull existing `vendor` rows via `kb-lookup` to dedupe on `vendor.phone` / `vendor.name`. Search for carriers serving the route. Collect candidate name, phone, region, apparent services. Cap search spend. POST candidates to backend.
3. **If `mode:"discovery"`:** No order context. Search for carriers on common routes (read from KB or backend) or underrepresented categories (low vendor count). Collect candidates. POST to backend with `source='internet'`, `services_source='internet'`, `services_validated=false`. Backend upserts and sets `vendor.last_refreshed_at=now()`.
4. **If `mode:"refresh"`:** Read vendor list from backend (vendors where `last_refreshed_at` is null or older than refresh threshold). For each, re-validate service info (is the contact still active? Is service still offered?). POST updates to backend; backend sets `service_info.last_refreshed_at=now()`.
5. Do not message any vendor.

## Backend calls

POST candidates/updates → backend vendor endpoints. `mode:"discovery"/"refresh"` upsert `vendor` + `service_info`, set `last_refreshed_at`. `mode:"order"` works as before. Expected: created/updated `vendor` ids.

## Guardrails

NEVER message a vendor (research only). NEVER use the user's real browser profile — isolated only, SSRF protections ON. NEVER take a money-adjacent web action. Does NOT itself commit `researching → awaiting_service_validation` (internet service data forces it; backend commits).
