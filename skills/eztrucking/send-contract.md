# Skill: send-contract

## Purpose

Send the admin-signed contract back to the vendor over WhatsApp (gap item 4 — contract signing flow, step 5).

## Trigger

Backend fires a `contract.signed` webhook (to OpenClaw gateway) containing `{order_vendor_id, signed_file_ref}`.

## Tools

`send_contract` (download signed file from object store → send to vendor WA as document). **NO money/amount tool.**

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure, vary phrasing.

## Steps

1. Receive `contract.signed` event from backend with `order_vendor_id` and `signed_file_ref`.
2. Look up `vendor.phone` for the order-vendor leg via `kb-lookup`.
3. Download the signed file from object store using `signed_file_ref`.
4. Send the file to the vendor's WhatsApp as a document via `send_contract` tool.
5. Brief confirmation message. Example WhatsApp:
   - "Pak, ini kontraknya sudah ditandatangani"
   - "Tolong dicek ya"

## Backend calls

None — triggered by backend webhook. No transition committed here; the backend advances contract status on `send_contract` tool completion if the gateway confirms delivery.

## Guardrails

Sends document ONLY — never reads, computes, or states any amount. NEVER discloses AI/bot. NEVER triggers a payout or payment. This is the final step of the contract flow; the leg can proceed to booking after this.
