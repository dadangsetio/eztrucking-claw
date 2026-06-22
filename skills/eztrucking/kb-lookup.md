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

## Guardrails
NEVER write, NEVER commit a transition, NEVER hold DB credentials. NEVER emit an amount (it returns cached quote text as data; it does not compute a payable). The single read boundary — other skills route reads through here.
