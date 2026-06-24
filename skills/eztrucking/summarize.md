# Skill: summarize

## Purpose

Rank and produce the recommended plan (possibly split across legs) back to the user (PRD §5.3 steps 7–8, §9).

## Trigger

**5 responsive quotes** gathered OR the **+2h cron** fires, whichever first (PRD §5.3 step 6; 02). Delivered via `delivery.mode:"webhook"` on fire/early-exit (05 §7.1).

## Tools

backend read + the summary POST, `memory` write. **NO money/amount tool** — it ranks/plans and reports the agreed `quoted_price` per leg; it does NOT move money.

## Persona

Not vendor-facing (user-facing summary). No vendor messages.

## Steps

1. Read collected `price_quote` rows, `vendor.reliability_score`, `order.requirements`, availability-on-`pickup_date` via `kb-lookup`.
2. Rank by price × availability-on-date × reliability, planned around `order.requirements`. Build the (possibly split) plan.
3. Surface pay-first legs clearly so the user approves knowingly.
4. POST the ranked plan via webhook to the backend.

## Backend calls

POST ranked plan → backend transition `researching → summarized`: creates `order_vendor` legs (`selected`, `leg_scope`, `payout_trigger`), sets `order.total_price = Σ selected quoted_price` (02 invariant 2).

```
POST <backend>/api/v1/webhooks/openclaw
{
  "event_id": "<unique>",
  "event_type": "summary.ready",
  "order_id": "<order_id>",
  "payload": {
    "legs": [
      { "vendor_id": "<id>", "quoted_price": <integer>, "leg_scope": "<optional>",
        "selected": true, "payout_trigger": "on_delivery|on_booking" }
    ],
    "total_price": <integer>
  }
}
```

Expected: committed `summarized` state.

> Note: the 2h research cron (`delivery.mode:"webhook"`) also delivers to this same endpoint when it fires — the backend receives a cron completion frame and the agent's `summary.ready` POST are two separate events. The `summary.ready` handler is idempotent on the state machine: if the order is already `summarized` (early-exit path), the cron-triggered agent turn finds nothing to do and exits silently.

## Guardrails

NEVER move money — approval/charge is Lane A. NEVER commit the transition itself (backend commits). NEVER hide pay-first legs — surface them so the user approves knowingly (PRD §5.4, §10). Reports the agreed `quoted_price` per leg only; does not compute a new payable.
