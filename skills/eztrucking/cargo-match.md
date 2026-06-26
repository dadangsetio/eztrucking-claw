# Skill: cargo-match

## Purpose

Ask-based cargo-fit matching, no fixed catalog (PRD §5.3 step 2, §13.5).

## Trigger

Agent decision during `researching` when a candidate vendor's `cargo_fit` for this goods type is unknown/stale.

## Tools

`message(action="send", to="<phone>", message="<text>")` — ask the vendor about fit. `memory`/`skill` write. **NO money/amount tool.**

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure, vary phrasing.

## Steps

1. Read `order.cargo` (`goods_type`, `weight_kg`, `volume_m3`, `handling`) and existing `cargo_fit` rows via `kb-lookup`.
2. If fit unknown/stale, ask the vendor about capacity, goods type, special handling. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, ada truk untuk muatan sekitar 8 ton ke Makassar?")`
   - `message(action="send", to="<vendor_phone>", message="Barangnya elektronik, butuh yang tertutup. Bisa handle?")`
3. On reply, learn the fit (capacity / goods type / handling).
4. POST learned fit to backend; `memory` write the learning.

## Backend calls

POST learned fit → backend writes `cargo_fit` with `learned_from='ask'` (01 `cargo_learned_from`). No order-status transition. Expected: stored `cargo_fit` row.

## Guardrails

NEVER use a rigid catalog — match against learned vendor knowledge (PRD §13.5). NEVER state or negotiate price here (that's `negotiate`). NEVER emit an amount. NEVER disclose AI/bot.
