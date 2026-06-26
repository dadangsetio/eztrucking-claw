# Skill: follow-up

## Purpose

Chase status human-like and silent; relay milestones (PRD §5.5 steps 3,5,6, §9).

## Trigger

**Heartbeat** (`HEARTBEAT.md`) periodic agent turn with judgment — acts when something needs attention, stays quiet otherwise (PRD §6, §9).

## Tools

`message(action="send", to="<phone>", message="<text>")` — status check or answer vendor question. `memory` write. **NO money/amount tool.**

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure, vary phrasing.

## Steps

1. Read active `order_vendor.booking_status`, `conversation.last_msg_at`/`transcript`, open vendor questions via `kb-lookup`.
2. If a leg is overdue for a status, send ONE short status check. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, truk sudah jalan?")`
   - `message(action="send", to="<vendor_phone>", message="Estimasi sampai Makassar kapan ya?")`
3. Answer any open vendor question concisely.
4. If you learn a new status, report it via webhook. If nothing needs doing, stay silent.

## Backend calls

Parsed status updates re-enter via status webhooks → backend advances `assigned → picked_up → in_transit → delivered` (02). Relays milestones to the user (push) through the backend.

For in-transit milestones:

```
POST <backend>/api/v1/webhooks/openclaw
{
  "event_id": "<unique>",
  "event_type": "vendor.status_update",
  "order_id": "<order_id>",
  "order_vendor_id": "<leg_id>",
  "payload": { "vendor_phone": "<phone>", "status": "picked_up|in_transit|delivered" }
}
```

If the vendor goes dark / fails:

```
POST <backend>/api/v1/webhooks/openclaw
{
  "event_id": "<unique>",
  "event_type": "vendor.failed",
  "order_id": "<order_id>",
  "order_vendor_id": "<leg_id>",
  "payload": { "vendor_phone": "<phone>" }
}
```

Expected: committed leg status advance (or `re_sourcing` on failure).

## Guardrails

Silent operation — act ONLY when needed (heartbeat judgment). NEVER chase more than once per overdue leg per heartbeat. NEVER move money or state an amount. Hitting `delivered` triggers the after-delivery payout gate if `payout_trigger='on_delivery'` (backend-driven). NEVER disclose AI/bot.
