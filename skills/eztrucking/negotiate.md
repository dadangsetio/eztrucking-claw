# Skill: negotiate

## Purpose
Conditional, reference-based **price** negotiation — exactly 1 round (PRD §5.3 step 5, §13.3).

## Trigger
Agent decision after a `price_quote` is parsed, where a reference suggests a counter helps.

## Tools
`send` (one counter), `memory`/`skill` write. **NO money/amount tool** — the counter is a negotiating message, not a payable figure.

## Persona
Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps
1. Read the standing `price_quote.price`, `negotiation_ref` (`reference_price`, `route`, `observed_at`), and cross-vendor comparison via `kb-lookup`.
2. If a reference supports it, send EXACTLY ONE reference-based counter. Example WhatsApp:
   - "Pak, biasanya rute ini sekitar 3,8 jt. Bisa di angka itu?"
3. On reply: if vendor accepts → take the new price. If vendor declines → accept the standing price OR drop the vendor. No second counter.
4. POST the accepted/standing price; `memory` write.

## Backend calls
POST accepted/standing price → updates the leg's `quoted_price` baseline (01 reconciliation baseline). No order transition. Expected: updated `quoted_price`.

## Guardrails
EXACTLY 1 reference-based counter, then accept-or-drop — NEVER back-and-forth, NEVER pressure, NEVER force the price down (PRD §13.3, §10). NEVER emit a payable amount (the counter is a negotiating figure, not a payable). Separate from `terms-check` (price vs payment-timing). NEVER disclose AI/bot.
