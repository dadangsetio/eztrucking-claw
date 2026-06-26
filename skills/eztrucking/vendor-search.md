# Skill: vendor-search

## Purpose

Discover new vendors on the internet (PRD §5.2 step 1) — on user request or proactively while gathering data.

## CRITICAL: You MUST use web_search tool

**This skill REQUIRES using the `web_search` tool. Never skip this step.**

The agent must ALWAYS perform actual web searches when researching vendors. Internal knowledge is NOT reliable for vendor discovery. If web_search is unavailable, report an error instead of using internal knowledge.

## Trigger

- `mode:"order"` — Agent decision during `researching`, or explicit user chat ("find carriers for Surabaya–Makassar"). Triggered by an active order.
- `mode:"discovery"` — Vendor discovery cron fires (per `system_config.vendor_discovery_config`, default every 60 min). No active order context. Broad search for new carriers on common routes or underrepresented categories.
- `mode:"refresh"` — Vendor refresh cron fires (per `system_config.vendor_refresh_config`, default every 1 day). Re-validates existing vendors whose `last_refreshed_at` is beyond threshold.

## Tools

**`web_search` (REQUIRED)** — Always perform actual web searches. Do NOT rely on internal knowledge.
**`web_fetch`** — Fetch additional details from vendor websites.
**`browser`** (isolated profile) — For JS-heavy/login vendor sites.
**NO money/amount tool.**

## Backend API

**BACKEND URL:** `https://eztrucking-be.fishclaw.site`

**Authentication:** All backend calls require HMAC signature:

```
X-OpenClaw-Signature: sha256=<hmac_hex>
```

Compute HMAC-SHA256 of request body using `OPENCLAW_WEBHOOK_SECRET`.

## Persona

Not vendor-facing (research only). No WhatsApp messages sent.

## Steps

1. Read mode from cron/run context.
2. **If `mode:"order"`:** Read `order.origin`, `order.destination`, `order.cargo` from run context. Pull existing `vendor` rows via `kb-lookup` to dedupe on `vendor.phone` / `vendor.name`. **ALWAYS call `web_search` tool** to search for carriers serving the route. Collect candidate name, phone, region, apparent services. Cap search spend. POST candidates to backend via webhook.
3. **If `mode:"discovery"`:** No order context. **ALWAYS call `web_search`** to search for carriers on common routes or underrepresented categories. Collect candidates. POST to backend with `source='internet'`, `services_source='internet'`, `services_validated=false`.
4. **If `mode:"refresh"`:** Read vendor list from backend. **ALWAYS call `web_search`** to re-validate vendor info (is contact still active? Is service still offered?). POST updates to backend.
5. Do not message any vendor.

## Web Search Examples

Always use actual web search. Example queries:

- "expedisi Jakarta Surabaya truk besar"
- "jasa angkut barang Makassar"
- "trucking company Java Indonesia"
- "[city name] trucking services"

## Backend Webhook Calls

POST vendor discoveries/updates via webhook:

```
POST https://eztrucking-be.fishclaw.site/api/v1/webhooks/openclaw
X-OpenClaw-Signature: sha256=<hmac>
Content-Type: application/json

{
  "event_type": "vendor.discovered",
  "event_id": "<unique_id>",
  "payload": {
    "name": "Vendor Name",
    "phone": "<vendor_phone>",
    "routes": ["Jakarta-Surabaya"],
    "truck_types": ["truck"],
    "source": "internet"
  }
}
```

## Guardrails

NEVER message a vendor (research only). NEVER use the user's real browser profile — isolated only, SSRF protections ON. NEVER take a money-adjacent web action. Does NOT itself commit `researching → awaiting_service_validation` (internet service data forces it; backend commits).
