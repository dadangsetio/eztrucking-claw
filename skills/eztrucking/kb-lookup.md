# Skill: kb-lookup

## Purpose

Check the price cache + read backend data; the hybrid-KB read skill (PRD §5.3 step 3, §9).

## Trigger

Agent decision before messaging vendors; freely callable by other skills needing a backend read.

## Tools

`web_fetch` (GET only). **NO exec/psql. NO money/amount tool. READ ONLY.**

## Backend API Base URL

**CRITICAL:** All backend calls use `https://eztrucking-be.fishclaw.site`

**Authentication:** Append `?agent_key=<OPENCLAW_AGENT_KEY>` to every URL.
`web_fetch` cannot send custom headers, so the key travels as a query parameter.
The backend also accepts the key via `X-Agent-Key` header when the caller can set headers.

## Available Endpoints

**Agent Read Endpoints (GET with X-Agent-Key):**

- `GET /api/v1/agent/vendors/kb?origin=X&destination=Y&order_id=Z` - Fresh price cache
- `GET /api/v1/agent/vendors?route=X-Y&order_id=Z` - Vendor list for route
- `GET /api/v1/agent/orders/:id` - Order details
- `GET /api/v1/agent/legs/:order_vendor_id/status` - Leg state

**Platform Config (GET):**

- `GET /api/v1/internal/config` - escalation_pct, vendor_discovery, heartbeat config

## Steps

1. Receive a read request from the calling skill (route, vendor, order, state).
2. Build the appropriate API URL with query parameters, appending `&agent_key=eztrucking-agent-key-2026`.
3. Call the endpoint using `web_fetch` (no custom header needed — key is in the URL).
4. A price*quote row is a \_fresh* hit only when `captured_at + ttl > now()`; older rows are cold.
5. Return fresh-quote hits vs cold routes to the caller. Read-only — no writes, no transitions.
6. Stale/missing route ⇒ tell the caller to invoke `quote-request`.

## Example API Calls

Fresh price cache for a route:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/vendors/kb?origin=Jakarta&destination=Surabaya&order_id=01HZ...&agent_key=eztrucking-agent-key-2026
```

Full vendor list for a route:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/vendors?route=Jakarta-Surabaya&order_id=01HZ...&agent_key=eztrucking-agent-key-2026
```

Order details:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/orders/01HZ...?agent_key=eztrucking-agent-key-2026
```

Current leg state:

```
GET https://eztrucking-be.fishclaw.site/api/v1/agent/legs/01HZ.../status?agent_key=eztrucking-agent-key-2026
```

Platform config (escalation_pct):

```
GET https://eztrucking-be.fishclaw.site/api/v1/internal/config?agent_key=eztrucking-agent-key-2026
```

## Guardrails

READ ONLY — NEVER POST/PUT/DELETE. All write operations (webhooks, uploads) require separate HMAC authentication. NEVER emit a payable amount — `price` is returned as cached quote data, never computed or restated as money. The single read boundary — other skills route reads through here.
