# Skill: cs-complaint-handoff

## Purpose

Capture a customer complaint and escalate it to a human; tell the user a human will
follow up.

## Trigger

Customer complains, is unhappy, reports a problem, or asks for a human.

## Tools

`web_fetch` (to POST the complaint webhook). NO money/amount tool.

## Steps

1. Acknowledge briefly and empathetically in one line.
2. Capture the complaint and log it via the backend webhook:

   POST https://eztrucking-be.fishclaw.site/api/v1/webhooks/openclaw
   {
   "event_id": "<unique>",
   "event_type": "customer.complaint",
   "order_id": "<order_id>",
   "payload": { "summary": "<short summary of the complaint>" }
   }

3. Tell the user a human will follow up. Do not promise a specific time or outcome.

## Guardrails

Do not resolve money disputes or state amounts. Do not promise refunds or compensation.
Escalate; never improvise a resolution. If the webhook fails, still tell the user it has
been noted and a human will follow up.
