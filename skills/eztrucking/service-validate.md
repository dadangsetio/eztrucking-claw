# Skill: service-validate

## Purpose
Confirm internet-sourced service info with the user once, before first order (PRD §5.2 step 3, §3 first-time rule).

## Trigger
Backend signals a candidate leg vendor has `services_source='internet'` AND `services_validated=false`.

## Tools
None outbound to vendor — proposes a validation prompt to the USER via backend. No `web_search` needed. **NO money/amount tool.**

## Persona
Not vendor-facing. The prompt goes to the user in-app (Lane A), never to the vendor.

## Steps
1. Read `vendor` (`services_source`, `services_validated`) and `service_info` (`description`, `source`, `validated_by_user`) via run context / `kb-lookup`.
2. Build a short user-facing validation prompt: which vendor, what services were found on the internet, asking the user to confirm.
3. POST the validation request to the backend; the backend pushes it to the Flutter app.
4. Stop. The user's confirm is a Lane-A action, not a skill action.

## Backend calls
POST validation request → backend pushes prompt to Flutter (Lane A). Proposes `researching → awaiting_service_validation`. On user confirm the backend drives `awaiting_service_validation → researching`, sets `vendor.services_validated=true`, `service_info.validated_by_user/validated_at`.

```
POST <backend>/api/v1/webhooks/openclaw
{
  "event_id": "<unique>",
  "event_type": "service.validation_needed",
  "order_id": "<order_id>",
  "payload": {
    "vendor_id": "<vendor_id>",
    "service_info_id": "<service_info_id>"
  }
}
```

## Guardrails
NEVER message the vendor. NEVER assume validation — the leg cannot be `selected` until the user confirms (01 invariant 4, 02 invariant 4). One-time only per vendor. NEVER commit the transition itself (backend-committed).
