# Vendor Refresh Cron

## Schedule

Per `system_config.vendor_refresh_config`. Default: `{"interval_days":1}` (daily). Read from `GET /api/v1/internal/config` at startup; re-read on each tick to pick up admin changes.

## What it does

Runs `vendor-search(mode:"refresh")` — re-validates existing vendors whose `last_refreshed_at` is null or beyond the refresh threshold. Confirms service info still valid and vendor contact still active.

## Persona

Not vendor-facing. No WhatsApp messages sent.

## Guardrails

NEVER message vendors. NEVER emit an amount. Does NOT delete vendors — only updates `last_refreshed_at` and `service_info`. Runs independently of active orders.
