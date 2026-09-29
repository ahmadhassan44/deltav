// Google rank + AI Overview check via SerpApi: `npm run serp`.
// Key in ~/.serpapi/key. Each query costs 1–2 searches (2 when the AI Overview
// loads separately), so run it weekly on the free tier. Results append to
// data/serp.jsonl (gitignored) to build history.

import { readFile, mkdir, appendFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const QUERIES = ["delta v", "deltav", "deltav build", "delta v build", "deltav software", "deltav software team"];
const DOMAIN = "deltav.build";

const key = (await readFile(path.join(os.homedir(), ".serpapi", "key"), "utf8")).trim();
const serp = async (params) => {
  const url = `https://serpapi.com/search.json?${new URLSearchParams({ ...params, api_key: key })}`;
  const body = await (await fetch(url)).json();
  // An empty results page comes back as an error; treat it as "not ranking".
  if (body.error && !body.error.includes("hasn't returned any results")) throw new Error(body.error);
  return body;
};

const date = new Date().toISOString().slice(0, 10);
const rows = [];
for (const q of QUERIES) {
  const result = await serp({ engine: "google", q, gl: "us", hl: "en", num: "20" });
  let overview = result.ai_overview ?? null;
  if (overview?.page_token) {
    overview = (await serp({ engine: "google_ai_overview", page_token: overview.page_token })).ai_overview ?? null;
  }
  const organic = result.organic_results ?? [];
  const ours = organic.find((r) => r.link?.includes(DOMAIN));
  const aoText = JSON.stringify(overview ?? "");
  const firstLine = overview?.text_blocks?.find((b) => b.snippet)?.snippet ?? "";
  rows.push({
    date,
    q,
    rank: ours?.position ?? null,
    url: ours?.link ?? null,
    organicCount: organic.length,
    aiOverview: Boolean(overview),
    aiCitesUs: aoText.includes(DOMAIN),
    aiMentionsEmerson: aoText.includes("Emerson"),
    aiLead: firstLine.slice(0, 140),
    aiSources: (overview?.references ?? []).map((r) => r.link).slice(0, 8),
  });
}

await mkdir("data", { recursive: true });
await appendFile("data/serp.jsonl", rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
for (const r of rows) {
  const rank = r.rank ? `#${r.rank}` : `not in top ${r.organicCount}`;
  const ai = !r.aiOverview ? "no AI Overview" : `AI Overview${r.aiCitesUs ? " CITES US" : ""}${r.aiMentionsEmerson ? " · Emerson" : ""}`;
  console.log(`${r.q.padEnd(22)} ${rank.padEnd(16)} ${ai}\n${"".padEnd(23)}${r.aiLead}`);
}
