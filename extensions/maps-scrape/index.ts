import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "typebox";

/**
 * maps-scrape — vendor discovery via the deployed google-maps-scraper API.
 *
 * The EzTrucking freight agent runs the `messaging` tool profile: web_fetch is
 * GET-only and exec is denied, so the agent cannot POST a scrape job itself.
 * This plugin runs the full create -> poll -> download cycle server-side (in the
 * gateway process, where fetch can POST) and exposes a single `maps_scrape`
 * agent tool returning vendor candidates. Research only — it never messages a
 * vendor and never persists; `vendor-search` owns persistence.
 *
 * API contract: https://map-scrape.fishclaw.site/static/spec/spec.yaml
 *   POST /api/v1/jobs            -> { id }
 *   GET  /api/v1/jobs/{id}       -> { status, ... }
 *   GET  /api/v1/jobs/{id}/download -> CSV
 */

const DEFAULT_BASE_URL = "https://map-scrape.fishclaw.site";
const POLL_INTERVAL_MS = 5000;

function baseUrl(): string {
  const raw = (process.env.MAPS_SCRAPE_URL ?? DEFAULT_BASE_URL).trim();
  return raw.replace(/\/+$/, "");
}

const MapsScrapeSchema = Type.Object({
  keywords: Type.Array(Type.String(), {
    minItems: 1,
    description:
      "Google Maps search phrases for carriers/ekspedisi, e.g. ['ekspedisi Surabaya','cargo Surabaya','jasa angkutan truk Surabaya']. 1-3 phrases recommended.",
  }),
  lang: Type.Optional(Type.String({ description: "Result language code; default 'id'." })),
  depth: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 10,
      description: "Scroll depth 1-10; default 1 (fast, fewer results). Higher is slower.",
    }),
  ),
  zoom: Type.Optional(
    Type.Integer({ minimum: 0, maximum: 21, description: "Map zoom; default 14." }),
  ),
  lat: Type.Optional(Type.String({ description: "Bias latitude (origin city), optional." })),
  lon: Type.Optional(Type.String({ description: "Bias longitude (origin city), optional." })),
  maxResults: Type.Optional(
    Type.Integer({ minimum: 1, description: "Cap candidates returned; default 30." }),
  ),
  maxWaitSec: Type.Optional(
    Type.Integer({ minimum: 10, description: "Max seconds to wait for the job; default 180." }),
  ),
});

type Candidate = {
  name: string;
  phone: string;
  region: string;
  website: string;
  service: string;
};

/** Minimal RFC-4180-ish CSV parser: handles quoted fields, embedded commas/newlines, and "" escapes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      // Skip blank lines produced by trailing newlines.
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

/** Find a column index by any of the candidate header names (case-insensitive). */
function colIndex(header: string[], names: string[]): number {
  const lower = header.map((h) => h.trim().toLowerCase());
  for (const n of names) {
    const idx = lower.indexOf(n);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Map the scraper CSV to vendor candidates. Keeps only rows that have a phone. */
export function candidatesFromCsv(csv: string, maxResults: number): Candidate[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];
  const header = rows[0];
  const iName = colIndex(header, ["title", "name"]);
  const iPhone = colIndex(header, ["phone", "phone_number", "phonenumber"]);
  const iAddr = colIndex(header, ["address", "complete_address", "full_address"]);
  const iSite = colIndex(header, ["website", "web_site", "url"]);
  const iCat = colIndex(header, ["category", "categories", "main_category"]);
  const out: Candidate[] = [];
  for (let r = 1; r < rows.length && out.length < maxResults; r++) {
    const row = rows[r];
    const phone = iPhone >= 0 ? (row[iPhone] ?? "").trim() : "";
    if (!phone) continue;
    out.push({
      name: iName >= 0 ? (row[iName] ?? "").trim() : "",
      phone,
      region: iAddr >= 0 ? (row[iAddr] ?? "").trim() : "",
      website: iSite >= 0 ? (row[iSite] ?? "").trim() : "",
      service: iCat >= 0 ? (row[iCat] ?? "").trim() : "",
    });
  }
  return out;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScrape(params: {
  keywords: string[];
  lang?: string;
  depth?: number;
  zoom?: number;
  lat?: string;
  lon?: string;
  maxResults?: number;
  maxWaitSec?: number;
}): Promise<{ jobId: string; status: string; count: number; candidates: Candidate[] }> {
  const base = baseUrl();
  const maxResults = params.maxResults ?? 30;
  const maxWaitMs = (params.maxWaitSec ?? 180) * 1000;

  const body = {
    name: `ezt-discover-${Date.now()}`,
    keywords: params.keywords,
    lang: params.lang ?? "id",
    zoom: params.zoom ?? 14,
    depth: params.depth ?? 1,
    fast_mode: true,
    max_time: Math.ceil(maxWaitMs / 1000),
    ...(params.lat ? { lat: params.lat } : {}),
    ...(params.lon ? { lon: params.lon } : {}),
  };

  const createRes = await fetch(`${base}/api/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    throw new Error(
      `create job failed: HTTP ${createRes.status} ${(await createRes.text()).slice(0, 200)}`,
    );
  }
  const created = (await createRes.json()) as { id?: string };
  const jobId = created?.id;
  if (!jobId) throw new Error("create job returned no id");

  const deadline = Date.now() + maxWaitMs;
  let status = "pending";
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(`${base}/api/v1/jobs/${jobId}`);
    if (!res.ok) continue;
    const job = (await res.json()) as { status?: string };
    status = (job?.status ?? "").toLowerCase();
    if (status === "ok") break;
    if (status === "failed" || status === "error") {
      throw new Error(`job ${jobId} ${status}`);
    }
  }
  if (status !== "ok") {
    // Timed out — let the agent fall back to web_search rather than hang.
    return { jobId, status: status || "timeout", count: 0, candidates: [] };
  }

  const dl = await fetch(`${base}/api/v1/jobs/${jobId}/download`);
  if (!dl.ok) throw new Error(`download failed: HTTP ${dl.status}`);
  const csv = await dl.text();
  const candidates = candidatesFromCsv(csv, maxResults);
  return { jobId, status, count: candidates.length, candidates };
}

export default definePluginEntry({
  id: "maps-scrape",
  name: "Maps Scrape",
  description: "Vendor discovery via the deployed google-maps-scraper API",
  register(api: OpenClawPluginApi) {
    api.registerTool(() => ({
      name: "maps_scrape",
      label: "Maps Scrape",
      description:
        "Discover carrier/ekspedisi vendors from Google Maps via the deployed scraper API. Runs the create/poll/download cycle server-side and returns candidates [{name, phone, region, website, service}] (rows without a phone are dropped). Research only: it never messages a vendor and never persists — hand the candidates to vendor-search. Keep depth low (1) for fast results; the call blocks until the job finishes or maxWaitSec elapses (then returns status='timeout' with no candidates, so fall back to web_search).",
      parameters: MapsScrapeSchema,
      async execute(_toolCallId, params) {
        const p = (params ?? {}) as Parameters<typeof runScrape>[0];
        try {
          const result = await runScrape(p);
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: message, candidates: [] }, null, 2),
              },
            ],
            isError: true,
          };
        }
      },
    }));
  },
});
