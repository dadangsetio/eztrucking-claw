# Skill: quote-request

## Purpose
Send natural-language quote requests to vendors over WhatsApp (PRD §5.3 step 4, §9).

## Trigger
Agent decision when `kb-lookup` reports a stale/missing cache for a route, or for newly discovered vendors.

## Tools
`send` (WhatsApp). **NO money/amount tool.**

## Persona
Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure, vary phrasing per vendor (no template).

## Steps
1. Read `order` (`origin`, `destination`, `cargo`, `pickup_date`) and target `vendor.phone`.
2. Send a natural quote-ask. Vary phrasing per vendor. Example WhatsApp:
   - "Pak, minta tolong harga kirim Surabaya ke Makassar"
   - "Muatan 8 ton, rencana jalan Kamis. Ada armada?"
3. Await the vendor reply (re-enters via `parse-reply`).

## Backend calls
None to commit. Replies re-enter via `parse-reply`. May append to `conversation.transcript` through the backend relay.

## Guardrails
NEVER send identical boilerplate to every vendor — vary phrasing. NEVER state or imply a price/amount. NEVER disclose AI/bot. Respect rate-limit/typing cadence (PRD §10 ban mitigation). No transition (research in progress under the +2h cron).
