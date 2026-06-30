# Skill: send-verification-wa

## Purpose

Send a WhatsApp message to the owner when a payment needs verification.

## Trigger

This skill is called by the backend when:

1. Payment clears (DOKU webhook)
2. Order transitions to `awaiting_payment_verification`
3. `system_config.wa_verification_enabled = true`

## Call from Backend

```json
{
  "type": "agent",
  "id": "<request_id>",
  "idempotency_key": "<uuid>",
  "input": {
    "skill": "send-verification-wa",
    "order_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "order_details": {
      "origin": "Pabrik Jakarta, PT Bumi Lancar",
      "destination": "Gudang Surabaya, CV Sinar Abadi",
      "vendor_name": "CV Maju Jaya",
      "total_price_idr": 4205000
    }
  }
}
```

## Expected Output

```json
{
  "type": "res.agent",
  "id": "<request_id>",
  "output": {
    "sent": true,
    "message_id": "<openclaw_message_id>",
    "message_preview": "🔔 Verifikasi Pembayaran..."
  }
}
```

## Message Template

```
🔔 Verifikasi Pembayaran

Ada pembayaran Rp {total_price} untuk order:
{origin} → {destination}
Vendor: {vendor_name}

Reply OK untuk approve.
```

## Implementation Notes

1. Get `owner_wa_number` from `system_config` (via internal config endpoint)
2. Format the message using the template
3. Send via OpenClaw `send` API
4. Return the message ID for tracking

## Error Handling

| Error                          | Action                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| Owner WA number not configured | Log warning, return `{sent: false, reason: "not_configured"}` |
| WA verification disabled       | Return `{sent: false, reason: "disabled"}`                    |
| OpenClaw send failed           | Log error, return `{sent: false, reason: "send_failed"}`      |
| Network timeout                | Retry once, then return failure                               |

## Dependencies

- OpenClaw Gateway connection
- `owner_wa_number` in `system_config`
- `wa_verification_enabled = true` in `system_config`

## Files

- `index.ts` - Main skill implementation
- `message-template.ts` - Message formatting
- `test.ts` - Unit tests
