# Skill: collect-contract

## Purpose

Receive the vendor's signed contract document over WhatsApp and upload it for admin signing in the console (gap item 4 — contract signing flow).

## Trigger

Agent detects the vendor has sent a document (PDF, image) after negotiation has resolved and the leg is awaiting a contract.

## Tools

`collect_contract` (receive WA media → upload to object store → POST webhook). **NO money/amount tool.**

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure, vary phrasing.

## Steps

1. Detect inbound vendor document (PDF or image) in an active conversation where contract is expected.
2. Receive the raw file via `collect_contract` tool — do NOT read or extract any figure from the document.
3. Upload file to object store via `collect_contract` tool. Obtain `file_ref`.
4. POST to backend: `POST /webhooks/openclaw` with `event_type:"contract.received"`, `order_vendor_id`, `file_ref`.
5. Optionally acknowledge the vendor. Example WhatsApp:
   - "Sudah kami terima, ditunggu ya"
   - "Makasih, kami proses dulu"

## Backend calls

POST `contract.received` → backend writes `contract_document` row (`unsigned_ref=file_ref`, `status='unsigned'`), notifies admin console. Expected: `{received:true}`.

## Guardrails

Attaches the DOCUMENT ONLY — never reads, computes, or states any amount from it. NEVER discloses AI/bot. NEVER triggers a payout or payment. Does not commit any order/leg transition (backend-only).
