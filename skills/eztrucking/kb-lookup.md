# Skill: kb-lookup

## Purpose

Check the price cache + read backend data; the hybrid-KB read skill (PRD §5.3 step 3, §9).

## Trigger

Agent decision before messaging vendors; freely callable by other skills needing a backend read.

## Tools

`web_fetch` with HMAC authentication. **NO exec/psql. NO money/amount tool. READ ONLY.**

## Backend API Base URL

**CRITICAL:** All backend calls use `https://eztrucking-be.fishclaw.site`

**Authentication Required:** All requests must include HMAC signature header:

```
X-OpenClaw-Signature: sha256=<hmac_hex>
```

Compute HMAC-SHA256 of request body (empty string for GET) using `OPENCLAW_WEBHOOK_SECRET`.

## Available Endpoints

**Agent Read Endpoints (GET with HMAC auth):**

- `GET /api/v1/agent/vendors/kb?origin=X&destination=Y&order_id=Z` - Fresh price cache
- `GET /api/v1/agent/vendors?route=X-Y&order_id=Z` - Vendor list for route
- `GET /api/v1/agent/orders/:id` - Order details
- `GET /api/v1/agent/legs/:order_vendor_id/status` - Leg state

**Platform Config (GET with HMAC auth):**

- `GET /api/v1/internal/config` - escalation_pct, vendor_discovery, heartbeat config

## Steps

1. Receive a read request from the calling skill (route, vendor, order, state).
2. Build the appropriate API URL with query parameters.
3. Compute HMAC signature for authentication.
4. Call the endpoint using `web_fetch` with the HMAC header.
5. A price_quote row is a _fresh_ hit only when `captured_at + ttl > now()`; older rows are cold.
6. Return fresh-quote hits vs cold routes to the caller. Read-only — no writes, no transitions.
7. Stale/missing route ⇒ tell the caller to invoke `quote-request`.

## Example API Calls

Fresh price cache for a route:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/vendors/kb?origin=Jakarta&destination=Surabaya&order_id=01HZ...
Headers: X-OpenClaw-Signature: sha256=<computed_hmac>
```

Full vendor list for a route:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/vendors?route=Jakarta-Surabaya&order_id=01HZ...
Headers: X-OpenClaw-Signature: sha256=<computed_hmac>
```

Order details:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/orders/01HZ...
Headers: X-OpenClaw-Signature: sha256=<computed_hmac>
```

Current leg state:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/legs/01HZ.../status
Headers: X-OpenClaw-Signature: sha256=<computed_hmac>
```

Platform config (escalation_pct):

```
GET https://eztrucking-be.fishclaw.site/api/v1/internal/config
Headers: X-OpenClaw-Signature: sha256=<computed_hmac>
```

## Guardrails

READ ONLY — NEVER POST/PUT/DELETE without proper HMAC auth. All write operations require valid HMAC signature. NEVER emit a payable amount — `price` is returned as cached quote data, never computed or restated as money. The single read boundary — other skills route reads through here.
