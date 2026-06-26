# Skill: collect-contract

## Purpose

Receive the vendor's signed contract document over WhatsApp and upload it for admin signing in the console (gap item 4 — contract signing flow).

## Trigger

Agent detects the vendor has sent a document (PDF, image) after negotiation has resolved and the leg is awaiting a contract.

## IMPORTANT: Implementation Note

This skill requires WhatsApp media handling. For now, the workflow is:

1. Vendor sends contract document via WhatsApp (standard WA message)
2. Backend receives the media through WhatsApp webhook
3. Agent uses this skill to confirm the document was received and trigger the flow

## Tools

`web_fetch` (call backend to confirm document received). `message(action="send", to="<phone>", message="<text>")` — acknowledge vendor. **NO money/amount tool.**

## Backend API

**BACKEND URL:** `https://eztrucking-be.fishclaw.site`

**Authentication:** All backend calls require HMAC signature:

```
X-OpenClaw-Signature: sha256=<hmac_hex>
```

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps

1. Detect inbound vendor document (PDF or image) in an active conversation where contract is expected.
2. Confirm with backend that document is received:
   ```
   GET https://eztrucking-be.fishclaw.site/api/v1/agent/legs/{order_vendor_id}/status
   Headers: X-OpenClaw-Signature: sha256=<hmac>
   ```
3. Send acknowledgment to vendor. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Sudah kami terima, ditunggu ya")`
   - `message(action="send", to="<vendor_phone>", message="Makasih, kami proses dulu")`
4. Backend will handle the document processing and notify admin console.

## Backend Integration

The WhatsApp plugin forwards inbound media to the backend via webhook. The backend stores the file and creates a `contract_document` row with `status='pending_signature'`. Admin then signs in the console, and `send-contract` skill handles sending back.

## Guardrails

Attaches the DOCUMENT ONLY — never reads, computes, or states any amount from it. NEVER discloses AI/bot. NEVER triggers a payout or payment. Does not commit any order/leg transition (backend-only).
