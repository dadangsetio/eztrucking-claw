# Skill: kb-lookup

## Purpose

Check the price cache + read backend data; the hybrid-KB read skill (PRD §5.3 step 3, §9).

## Trigger

Agent decision before messaging vendors; freely callable by other skills needing a backend read.

## Tools

backend read only. **NO money/amount tool.**

## Persona

Not vendor-facing. The single read boundary for all skills.

## Steps

1. Receive a read request from the calling skill (route, vendor, order, state).
2. GET the relevant backend read endpoint: `price_quote` cache (hit = `captured_at + ttl > now()` for the route), `vendor`, `order`, `order_vendor`, `negotiation_ref`, state.
3. Return fresh-quote hits vs cold routes to the caller. Read-only — no writes, no transitions.
4. Stale/missing route ⇒ tell the caller to invoke `quote-request`.

## Backend calls

GET cache/vendor/order/state read endpoints (03). Read-only. Expected: requested rows or a cache-miss indicator. No transition.

Key endpoints (base: `https://eztrucking-be.fishclaw.site`):

- `GET /api/v1/agent/vendors/kb?origin=<city>&destination=<city>&order_id=<order_id>` — returns fresh price_quote rows (within source-specific TTL) joined with vendor name and phone. Use this first to identify which vendors already have current prices, and invoke `quote-request` only for the rest.
- `GET /api/v1/agent/vendors?route=<origin>-<destination>&order_id=<order_id>` — full vendor list for a route.
- `GET /api/v1/agent/orders/:id` — order details and requirements.
- `GET /api/v1/agent/legs/:order_vendor_id/status` — current leg state.

All agent GET requests must include the HMAC signature header (sign empty string with `OPENCLAW_WEBHOOK_SECRET`):
`X-OpenClaw-Signature: sha256=<hmac-sha256-of-empty-body>`

## Guardrails

NEVER write, NEVER commit a transition, NEVER hold DB credentials. NEVER emit an amount (it returns cached quote text as data; it does not compute a payable). The single read boundary — other skills route reads through here.
