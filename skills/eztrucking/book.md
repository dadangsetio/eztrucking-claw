# Skill: book

## Purpose

Confirm the booking with each selected vendor over WhatsApp (PRD §5.5 step 1, §9).

## Trigger

Backend fires a booking webhook → OpenClaw cron **isolated run** after `paid` (02 `paid → booking`). One isolated run per selected leg (05 §4.1).

## Tools

`message(action="send", to="<phone>", message="<text>")` — WhatsApp booking confirmation. **NO money/amount tool** — booking is not payment; disbursement is backend + human-authorized.

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps

1. Read the selected `order_vendor` leg (`vendor_id`, `quoted_price`, `leg_scope`) and `vendor.phone` from the isolated-run context.
2. Confirm the booking for THIS leg only. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, kita jadi pakai armadanya ya. Surabaya–Makassar, jalan Kamis")`
   - `message(action="send", to="<vendor_phone>", message="Tolong kabari kalau truk sudah siap")`
3. On vendor confirmation, report it to the backend via webhook.

## Backend calls

Report vendor confirmation via webhook → backend `order_vendor.booking_status: planned → confirming → assigned` (02). Aggregate of legs drives `booking → in_transit`.

```
POST <backend>/api/v1/webhooks/openclaw
{
  "event_id": "<unique>",
  "event_type": "vendor.confirmed",
  "order_id": "<order_id>",
  "order_vendor_id": "<leg_id>",
  "payload": { "vendor_phone": "<phone>" }
}
```

Expected: committed leg `assigned`.

## Guardrails

Books ONLY; NEVER disburses (disbursement is backend + human-authorized). NEVER state/restate an amount in the confirmation. Confirm each leg of a split order separately (one isolated run per leg). NEVER disclose AI/bot. NEVER commit the booking transition itself (backend commits).
