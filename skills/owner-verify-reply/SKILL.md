# Skill: owner-verify-reply

## Purpose

Forward owner's WhatsApp reply to the backend webhook for payment verification approval.

## Trigger

Incoming WhatsApp message from the configured `owner_wa_number` in `system_config`.

## Flow

```
1. OpenClaw receives WA message from owner
2. Skill identifies it as an owner reply (sender matches owner_wa_number)
3. Skill forwards the message to backend webhook: POST /api/v1/webhooks/owner-wa-reply
4. Backend processes the reply (approve/reject/log)
5. Backend sends confirmation WA back to owner (optional)
```

## Request to Backend

```
POST /api/v1/webhooks/owner-wa-reply
Headers:
  Content-Type: application/json
  X-OpenClaw-Signature: sha256=<hmac_hex>

Body:
{
  "event_id": "<unique_event_id>",
  "from": "+6281234567890",
  "message": "ok lanjutkan",
  "timestamp": "2024-05-28T10:30:00Z"
}
```

## Backend Response

```
200 OK
{
  "received": true
}
```

## Message Patterns

| Owner sends                                  | Action                                       |
| -------------------------------------------- | -------------------------------------------- |
| `ok`, `oke`, `iya`, `ya`, `yes`              | Forward to backend as approval               |
| `approve`, `setuju`                          | Forward to backend as approval               |
| `lanjutkan`, `ok lanjutkan`, `oke lanjutkan` | Forward to backend as approval               |
| `tolak`, `reject`, `batal`, `cancel`         | Forward to backend (logged, no action in v1) |
| Other                                        | Ignore / send help message                   |

## Backend Processing

The backend will:

1. Verify the sender is the configured owner number
2. Find the latest pending `owner_wa_verification` record
3. Check if the verification is not expired (30 minute timeout)
4. If approval: update status to `approved`, trigger AD13 equivalent (order → booking)
5. If rejection: update status to `cancelled` (logged for audit)
6. Send confirmation WA back to owner

## Configuration

Requires `system_config` fields:

- `owner_wa_number`: Owner's WhatsApp number (E.164 format)
- `wa_verification_enabled`: Boolean flag to enable/disable

## Notes

- The skill only processes messages from the configured owner number
- Messages from other numbers are ignored
- The backend is responsible for all business logic (approval, rejection, timeout)
- This skill is a simple forwarder only

## Example WA Messages

**Verification Request (sent by backend → owner):**

```
🔔 Verifikasi Pembayaran

Ada pembayaran Rp 4.2jt untuk order:
Pabrik Jakarta, PT Bumi Lancar → Gudang Surabaya, CV Sinar Abadi
Vendor: CV Maju Jaya

Reply OK untuk approve.
```

**Owner Response:**

```
ok lanjutkan
```

**Confirmation (sent by backend → owner):**

```
✅ Pembayaran untuk order 01ARZ3... telah diapprove.
```
