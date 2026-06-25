# Skill: kb-lookup

## Purpose

Check the price cache + read backend data directly from Postgres; the hybrid-KB read skill (PRD §5.3 step 3, §9).

## Trigger

Agent decision before messaging vendors; freely callable by other skills needing a backend read.

## Tools

`exec` → `psql "$DATABASE_URL"`, **SELECT only**. **NO money/amount tool, NO writes.**

## Persona

Not vendor-facing. The single read boundary for all skills.

## Steps

1. Receive a read request from the calling skill (route, vendor, order, state).
2. Run the matching read query below with `psql "$DATABASE_URL" -A -F'|' --csv -c "<SELECT ...>"`.
3. A price_quote row is a _fresh_ hit only when `captured_at + ttl > now()`; older rows are cold.
4. Return fresh-quote hits vs cold routes to the caller. Read-only — no writes, no transitions.
5. Stale/missing route ⇒ tell the caller to invoke `quote-request`.

## Queries

Always parameterize through psql safely — pass values with `--set` and reference as `:'name'` so they are quoted/escaped; never string-concatenate caller input into SQL.

Fresh price cache for a route (replaces `GET /api/v1/vendors/kb`):

```bash
psql "$DATABASE_URL" --csv \
  --set origin="$ORIGIN" --set destination="$DESTINATION" -c "
  SELECT q.id, v.name, v.phone, q.price, q.cargo_type, q.captured_at, q.source, q.confidence
  FROM price_quote q JOIN vendor v ON v.id = q.vendor_id
  WHERE q.origin = :'origin' AND q.destination = :'destination'
    AND q.captured_at + q.ttl > now()
  ORDER BY q.captured_at DESC;"
```

Full vendor list for a route (replaces `GET /api/v1/vendors?route=`):

```bash
psql "$DATABASE_URL" --csv --set route="$ORIGIN-$DESTINATION" -c "
  SELECT id, name, phone, truck_types, cargo_capabilities, services_validated, payment_terms
  FROM vendor WHERE :'route' = ANY(routes);"
```

Order details and requirements (replaces `GET /api/v1/orders/:id`):

```bash
psql "$DATABASE_URL" --csv --set oid="$ORDER_ID" -c "
  SELECT id, origin, destination, cargo, pickup_date, requirements, status
  FROM \"order\" WHERE id = :'oid';"
```

Current leg state (replaces `GET /api/v1/legs/:order_vendor_id/status`):

```bash
psql "$DATABASE_URL" --csv --set ov="$ORDER_VENDOR_ID" -c "
  SELECT id, order_id, vendor_id, booking_status, payout_status, proof_status, selected
  FROM order_vendor WHERE id = :'ov';"
```

## Guardrails

SELECT only — NEVER INSERT/UPDATE/DELETE, NEVER commit a transition. The `$DATABASE_URL` role must itself be read-restricted (no finance/credential tables); do not rely on this skill's discipline alone. NEVER emit a payable amount — `price` is returned as cached quote data, never computed or restated as money. The single read boundary — other skills route reads through here.
