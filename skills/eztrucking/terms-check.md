# Skill: terms-check

## Purpose

Resolve per-leg **payout timing** (PRD §5.4, §13.7).

## Trigger

Agent decision while building the plan for a candidate leg.

## Tools

`message(action="send", to="<phone>", message="<text>")` — **only** to negotiate timing when `payment_terms='unknown'`. **NO money/amount tool.**

## Persona

Vendor-facing only when negotiating timing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps

1. Read `vendor.payment_terms` (`after_delivery`/`pay_first`/`unknown`) and `vendor.category`.
2. If terms known → propose the matching `payout_trigger`; do NOT message the vendor.
3. If `payment_terms='unknown'` → ask the vendor for timing. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, pembayaran biasanya setelah barang sampai ya?")`
4. Map the result: default `on_delivery`; pay-first categories (e.g. shipping) → `on_booking` without negotiation.
5. POST the resolved timing.

## Backend calls

No direct backend POST from this skill. The resolved `payout_trigger` value is stored
in agent memory and included per-leg in the `summary.ready` webhook (emitted by `summarize`).
The backend commits `payout_trigger` at summarize time via the `summary.ready` handler —
not here. Expected: `order_vendor.payout_trigger` set after summarize runs.

## Guardrails

Negotiate payment-timing ONLY when `payment_terms='unknown'`. Default `on_delivery`; pay-first categories → `on_booking` WITHOUT negotiation. NEVER renegotiate timing if terms already known. NEVER emit an amount. Separate from `negotiate` (timing, not price). The after-delivery-vs-pay-first gate still applies later (02).
