# Skill: re-source

## Purpose
Leg-failure recovery — find an alternative vendor, propose for user confirm (PRD §5.5 step 7, §13.4, §9).

## Trigger
Backend signals a leg fell through (vendor cancels/no-shows) → leg `re_sourcing` (02).

## Tools
`web_search`/`web_fetch`/managed `browser` (find alternative), `send` (re-quote the alternative), `memory` write. **NO money/amount tool.**

## Persona
Vendor-facing when re-quoting the alternative — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps
1. Read the failed `order_vendor` leg and candidate alternatives (existing vendors via `kb-lookup`; may call `vendor-search`). Pull `negotiation_ref`/cache for comparable pricing.
2. Find an alternative vendor (isolated browser for web search).
3. Re-quote the alternative. Example WhatsApp:
   - "Pak, masih ada armada untuk Surabaya–Makassar minggu ini?"
   - "Muatan 8 ton, butuh cepat. Bisa bantu?"
4. POST the alternative to the backend; `memory` write.

## Backend calls
POST alternative → backend creates a replacement `order_vendor` with `replaces_order_vendor_id`, transition `re_sourcing → awaiting_user_confirm` (02). If pricier, backend surfaces the delta and issues a DOKU top-up (`awaiting_topup_payment`) — backend-only money action. On user confirm (+ top-up clear if pricier) the leg resumes at `confirming`.

```
POST <backend>/api/v1/webhooks/openclaw
{
  "event_id": "<unique>",
  "event_type": "resource.found",
  "order_id": "<order_id>",
  "order_vendor_id": "<failed_leg_id>",
  "payload": {
    "replacement_vendor_id": "<id>",
    "quoted_price": <integer>,
    "leg_scope": "<optional>"
  }
}
```
Expected: replacement leg created + `awaiting_user_confirm`.

## Guardrails
NEVER moves money — the top-up is Lane A, backend-only. NEVER emit an amount or the delta (backend surfaces it). Replacement re-runs the FULL proof gate — `proof_status` reset to `none` (01 invariant 5, 02 invariant 6). Other legs unaffected. Isolated browser profile only (PRD §10). NEVER disclose AI/bot.
