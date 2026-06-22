# Skill: collect-proof

## Purpose
Request and attach the vendor's invoice/quotation/price-proof document — the ONLY proof-related agent action (PRD §5.6, §9).

## Trigger
Leg enters the payout gate with `proof_status='none'` — pay-first at booking, after-delivery at `delivered` (02).

## Tools
`send` (ask the vendor for the document) + `collect-proof` document-attach (attach the received PDF/photo). **NO money/amount tool — NEVER states, computes, rounds, or restates the amount** (PRD §5.6 step 5, §8 Layer 2).

## Persona
Vendor-facing — §7a persona required: short, natural Bahasa Indonesia, no emoji, no bot disclosure.

## Steps
1. Read the `order_vendor` leg awaiting proof and `vendor.phone`. Do NOT read or need any amount.
2. Ask the vendor for the invoice/quotation document. Example WhatsApp:
   - "Pak, boleh minta invoice-nya?"
   - "Kirim ke sini aja ya, foto atau PDF sama saja"
3. On receipt, attach the raw file via `collect-proof` document-attach. Do not open/read the figure.
4. POST the raw file to the backend.

## Backend calls
POST raw file → backend writes `price_proof.file_ref` (+ `doc_type`); transition `proof_status: none → received` (02). ALL extraction/reconciliation is backend (OCR → `extracted_amount` → reconcile vs `quoted_price` → `match`/`diff`/`ambiguous`). Expected: `proof_status='received'`.

## Guardrails
Attaches the document ONLY. NEVER states, computes, rounds, or restates the amount. Has NO tool that emits a payable number and NO tool that triggers payout. Extraction/reconciliation/authorization are 100% backend + human-against-document (PRD §5.6, §10 hallucination/forgery mitigation). Backend drives `received → reconciled → authorized` or `→ mismatch → flagged_to_user` (fail-closed, never auto-pay).
