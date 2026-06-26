# Vendor Discovery Cron

## Schedule

Per `system_config.vendor_discovery_config`. Default: `{"interval_minutes":60}` (every hour). Read from `GET /api/v1/internal/config` at startup; re-read on each tick to pick up admin changes.

## What it does

Runs `vendor-search(mode:"discovery")` — broad search for new carriers on common freight routes or underrepresented service categories. No active order context.

## Persona

Not vendor-facing. No WhatsApp messages sent.

## Guardrails

NEVER message vendors. NEVER emit an amount. Runs independently of active orders. Discovery results are upserted by the backend; existing vendor rows are never deleted.
