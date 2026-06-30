# Skill: send-contract

## Purpose

Send the admin-signed contract back to the vendor over WhatsApp (gap item 4 — contract signing flow, step 5).

## Trigger

Backend fires a `contract.signed` webhook (to OpenClaw gateway) containing `{order_vendor_id, signed_file_ref}`. The agent receives this as a run context parameter.

## IMPORTANT: Implementation Note

This skill uses the `message` tool with the `media` parameter for sending file attachments. The backend provides a presigned URL for the signed document.

## Tools

`web_fetch` (get the signed document URL from backend). `message(action="send", to="<phone>", message="<text>", media="<url>")` — send document to vendor WA. **NO money/amount tool.**

## Backend API

**BACKEND URL:** `https://eztrucking-be.fishclaw.site`

**Authentication:** All backend calls require HMAC signature:

```
X-OpenClaw-Signature: sha256=<hmac_hex>
```

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps

1. Receive `contract.signed` event from backend with `order_vendor_id` and `signed_file_ref`.
2. Get vendor phone from backend:
   ```
   GET https://eztrucking-be.fishclaw.site/api/v1/agent/legs/{order_vendor_id}/status
   Headers: X-OpenClaw-Signature: sha256=<hmac>
   ```
3. Build the signed document URL from backend (provided in webhook event as `signed_file_ref`).
4. Send the file to the vendor's WhatsApp as a document via `message` tool:
   ```
   message(action="send", to="<vendor_phone>", message="", media="<signed_document_url>")
   ```
5. Brief confirmation message. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, ini kontraknya sudah ditandatangani")`
   - `message(action="send", to="<vendor_phone>", message="Tolong dicek ya")`

## Backend calls

Backend provides the signed document URL through the webhook event. The agent downloads and sends via WhatsApp. On successful send, backend updates `contract_document.status='sent_back'`.

## Guardrails

Sends document ONLY — never reads, computes, or states any amount. NEVER discloses AI/bot. NEVER triggers a payout or payment. This is the final step of the contract flow; the leg can proceed to booking after this.
