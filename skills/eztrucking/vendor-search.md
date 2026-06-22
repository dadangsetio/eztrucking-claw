# Skill: vendor-search

## Purpose
Discover new vendors on the internet (PRD §5.2 step 1) — on user request or proactively while gathering data.

## Trigger
Agent decision during `researching`, or explicit user chat ("find carriers for Surabaya–Makassar").

## Tools
`web_search`, `web_fetch`, managed `browser` (isolated profile). **NO money/amount tool.**

## Persona
Not vendor-facing (research only). No WhatsApp messages sent.

## Steps
1. Read `order.origin`, `order.destination`, `order.cargo` from run context.
2. Pull existing `vendor` rows via `kb-lookup` to dedupe on `vendor.phone` / `vendor.name`.
3. `web_search` / `web_fetch` for carriers serving the route; use isolated `browser` for JS-heavy/login sites.
4. Collect candidate name, phone, region, apparent services. Cap search spend (PRD §10).
5. POST candidates to backend; do not message any vendor.

## Backend calls
POST candidates → backend "create/enrich vendor" endpoint. Rows written with `source='internet'`, `services_source='internet'`, `services_validated=false`. Expected: created/updated `vendor` ids.

## Guardrails
NEVER message a vendor (research only). NEVER use the user's real browser profile — isolated only, SSRF protections ON. NEVER take a money-adjacent web action. Does NOT itself commit `researching → awaiting_service_validation` (internet service data forces it; backend commits).
