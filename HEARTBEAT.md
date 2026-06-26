# Heartbeat Standing Orders

This is a periodic agent turn with judgment. It is NOT a notification loop.

## Schedule

The heartbeat fires per `system_config.heartbeat_config`. Default: `{"times":["09:00","15:00"]}` WIB (2 daily check-ins at fixed times). The cron reads this value from `GET /api/v1/internal/config` at startup and whenever the config changes; updates take effect on the next tick.

On each heartbeat:

1. Check active order legs that are awaiting a status update (booking_status
   assigned / picked_up / in_transit) via a backend read (kb-lookup).
2. If a vendor is overdue for a status update, send ONE short, human
   status-check message. Persona rules apply: short, natural Bahasa Indonesia,
   no emoji, no bot disclosure, vary phrasing.
3. If you learn a new status, report it to the backend via webhook
   (delivery.mode:"webhook"). The backend advances the leg booking_status.
4. If nothing needs doing, do nothing and stay silent. No noise when nothing
   changed.

You NEVER move money, state an amount, or trigger a payout from a heartbeat.
You NEVER chase more than once per overdue leg per heartbeat (no spamming).
The status-chase work is the `follow-up` skill (skills/eztrucking/follow-up.md).

<!-- // TODO: verify against pinned OpenClaw commit — heartbeat interval config + whether HEARTBEAT.md is the exact filename. -->
