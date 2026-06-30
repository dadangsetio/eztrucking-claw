# Skill: collect-proof

## Purpose

Request and attach the vendor's invoice/quotation/price-proof document — the ONLY proof-related agent action (PRD §5.6, §9).

## Trigger

Leg enters the payout gate with `proof_status='none'` — pay-first at booking, after-delivery at `delivered` (02).

## Tools

`message(action="send", to="<phone>", message="<text>")` — ask the vendor for the document. **Collect-proof document-attach** (attach the received PDF/photo). **NO money/amount tool — NEVER states, computes, rounds, or restates the amount** (PRD §5.6 step 5, §8 Layer 2).

## Persona

Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps

1. Read the `order_vendor` leg awaiting proof and `vendor.phone`. Do NOT read or need any amount.
2. Ask the vendor for the invoice/quotation document. Example WhatsApp:
   - `message(action="send", to="<vendor_phone>", message="Pak, boleh minta invoice-nya?")`
   - `message(action="send", to="<vendor_phone>", message="Kirim ke sini aja ya, foto atau PDF sama saja")`
3. On receipt, attach the raw file via `collect-proof` document-attach. Do not open/read the figure.
4. Upload the raw file to the backend upload endpoint:
   ```
   POST /api/v1/upload
   Authorization: Bearer <token>
   Content-Type: multipart/form-data
   Fields: file=<binary>, leg_id=<order_vendor_id>, doc_type=invoice|quotation|other
   ```
   Receive back: `{ "file_ref": "proofs/<leg_id>/<ulid>.<ext>", "content_type": "..." }`
5. POST the `proof.collected` webhook to the backend with `file_ref` (NOT the raw bytes):
   ```json
   {
     "event_id": "<unique>",
     "event_type": "proof.collected",
     "order_id": "<order_id>",
     "order_vendor_id": "<leg_id>",
     "payload": { "file_ref": "<file_ref>", "doc_type": "invoice" }
   }
   ```

## Backend calls

Step 4 — `POST /api/v1/upload` → stores file in object store, returns `file_ref`.
Step 5 — `POST /api/v1/webhooks/openclaw` with `proof.collected` → backend creates `price_proof` row using `file_ref`; transitions `proof_status: none → received` (spec 02). ALL extraction/reconciliation is backend (OCR → `extracted_amount` → reconcile vs `quoted_price` → `match`/`diff`/`ambiguous`). Expected: `proof_status='received'`.

## Guardrails

Attaches the document ONLY. NEVER states, computes, rounds, or restates the amount. Has NO tool that emits a payable number and NO tool that triggers payout. Extraction/reconciliation/authorization are 100% backend + human-against-document (PRD §5.6, §10 hallucination/forgery mitigation). Backend drives `received → reconciled → authorized` or `→ mismatch → flagged_to_user` (fail-closed, never auto-pay).
