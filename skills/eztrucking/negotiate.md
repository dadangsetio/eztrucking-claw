# Skill: negotiate

## Purpose

Conditional, reference-based **price** negotiation — exactly 1 round (PRD §5.3 step 5, §13.3).

## Trigger

Agent decision after a `price_quote` is parsed, where a reference suggests a counter helps.

## Tools

`message(action="send", to="<phone>", message="<text>")` — send one counter message. `memory`/`skill` write. **NO money/amount tool** — the counter is a negotiating message, not a payable figure.

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps

1. Fetch `escalation_pct` from `GET /api/v1/internal/config` before starting.
2. **If `escalation_pct == 0`:** Skip negotiation entirely. Emit `quote.accepted` with the vendor's original price. No counter message sent.
3. **If `escalation_pct > 0`:** Read the standing `price_quote.price`, `negotiation_ref` (`reference_price`, `route`, `observed_at`), and cross-vendor comparison via `kb-lookup`. Compute counter = `vendor_price × (1 − escalation_pct/100)`, rounded to nearest whole IDR. Send EXACTLY ONE reference-based counter. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, biasanya rute ini sekitar 3,8 jt. Bisa di angka itu?")`
4. On reply:
   - Vendor accepts → emit `quote.stored` with the deal price.
   - Vendor declines → emit `quote.stored` with the original vendor price (unchanged).
   - No second counter, no pressure.
5. POST via `quote.stored` webhook with the final price; `memory` write.

## Backend calls

POST accepted/standing price → updates the leg's `quoted_price` baseline (01 reconciliation baseline). No order transition. Expected: updated `quoted_price`.

## Guardrails

Read `escalation_pct` FIRST — if 0, no counter is ever sent. If > 0: EXACTLY 1 reference-based counter, then accept-or-drop — NEVER back-and-forth, NEVER pressure, NEVER force the price down. NEVER emit a payable amount (the counter is a negotiating figure, not a payable). Separate from `terms-check` (price vs payment-timing). NEVER disclose AI/bot.
