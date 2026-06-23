# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                    # Install dependencies (Node 24+ or 22.19+)
pnpm openclaw setup             # First-run setup: provision gateway, configure channels
pnpm gateway:watch              # Start gateway in dev/watch mode
pnpm build                      # Production build
```

This is a **pnpm workspace**. Run all commands from the repo root.

## What This Is

An OpenClaw fork acting as the EzTrucking AI freight agent. OpenClaw is a multi-channel messaging gateway with an extensible agent runtime. For EzTrucking it runs as the backend's Lane B counterpart: the Go backend (`eztrucking-backend`) connects over WebSocket (`OPENCLAW_WS_URL`) as an operator client, sends agent turns, and fans out streamed `event:agent` frames to the Flutter chat screen.

## EzTrucking-Specific Files

These three files are the EzTrucking customization layer on top of stock OpenClaw:

| File | Role |
|---|---|
| `AGENTS.md` | **Standing orders** — injected into every agent turn as the agent's system prompt. Defines scope, persona, money rules, and negotiation limits. Read this before modifying any agent behavior. |
| `HEARTBEAT.md` | **Periodic task orders** — the heartbeat agent turn checks overdue legs, sends one status-check message per overdue vendor, and reports status changes to the backend. |
| `skills/eztrucking/` | **13 skill files** — each is a SKILL.md loaded into the agent's skill workspace. |

> TODO: verify against pinned OpenClaw commit — confirm that `AGENTS.md` is the injected-instructions filename and that `HEARTBEAT.md` is the heartbeat config filename.

## Skills (`skills/eztrucking/`)

| Skill | Purpose |
|---|---|
| `vendor-search.md` | Discover new vendors via web search / browser (research only, no messaging) |
| `service-validate.md` | Verify internet-sourced vendor services before selection |
| `cargo-match.md` | Match cargo requirements to vendor capabilities |
| `kb-lookup.md` | Read active orders, legs, and vendors from the backend |
| `quote-request.md` | Message vendors requesting freight quotes |
| `parse-reply.md` | Parse vendor replies (price, availability, terms) |
| `negotiate.md` | One-round counter-offer using cross-vendor price references |
| `terms-check.md` | Check payment timing terms (default: on-delivery) |
| `summarize.md` | Summarize vendor options for the user before approval |
| `book.md` | Confirm booking with a vendor after user approval |
| `collect-proof.md` | Collect invoice/quotation document from vendor; pass file ref to backend |
| `follow-up.md` | Send one status-check message to an overdue vendor leg |
| `re-source.md` | Initiate leg replacement when a vendor fails or cancels |

## Hard Constraints (from `AGENTS.md`)

These are non-negotiable. Do not modify them without understanding the full payment security model.

**Money:** The agent has no money-moving tool and must never claim otherwise. It never states, computes, restates, or negotiates a payable amount. It collects invoice documents only — the backend extracts the amount, the user authorizes it in the app.

**Persona:** Every vendor message must read like a human logistics professional texting on WhatsApp. No emoji. No markdown, symbols, or bot-like formatting. Never reveal AI, bot, or automation. Natural Bahasa Indonesia (or vendor's language). Vary phrasing — no boilerplate.

**Negotiation:** Exactly one counter-offer round, reference-based (cross-vendor comparison). If declined, accept the standing price or drop the vendor. Never pressure.

**Scope:** Freight/trucking only. Decline anything else.

**Heartbeat:** One status-check message per overdue leg per heartbeat. Never spam. Never move money from a heartbeat turn.

## Backend Connection

The Go backend connects as an operator client via WebSocket (`OPENCLAW_WS_URL`). Protocol: connect.challenge → connect (with Ed25519 device identity + bearer token) → hello-ok. Session key = `order_id`. Agent turns are idempotency-keyed. The backend fans out `event:agent` stream frames to the Flutter chat screen (Lane B).

Env vars the backend uses to connect here:
- `OPENCLAW_WS_URL` — this instance's gateway WS URL
- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_OPERATOR_TOKEN` — operator bearer token
- `OPENCLAW_BOOTSTRAP_TOKEN` — one-time device pairing (first connect only)
