// Cold-email problem pages: /<slug>/ and /<slug>/stack/, one pair per industry.
//
// Each page is the homepage (src/index.html) with the lead's problem, a demo
// frame cycling screenshots of a working prototype, and a "Try it yourself"
// overlay placed before the hero. /<slug>/stack/ adds the other problems as
// cards above it. Data: content/problems/<slug>.json + <slug>/N.webp.
//
// Outreach pages, not search pages: noindex, canonical /, never in the sitemap
// or llms.txt. Every anchor this file edits in the homepage must match exactly
// once, so a homepage rework fails the build instead of shipping a broken page.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://deltav.build";
const here = path.join(path.dirname(fileURLToPath(import.meta.url)), "problems");
const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Paths the redirects or pages use themselves.
const RESERVED = ["demos", "p", "404", "index", "stack", "work"];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const pad = (n) => String(n).padStart(2, "0");

function swap(html, from, to) {
  const hits = html.split(from).length - 1;
  if (hits !== 1) throw new Error(`problems: homepage anchor found ${hits} times: ${String(from).slice(0, 60)}`);
  return html.replace(from, () => to);
}

function swapRe(html, re, to) {
  const hits = html.match(new RegExp(re.source, "g"))?.length ?? 0;
  if (hits !== 1) throw new Error(`problems: homepage anchor found ${hits} times: ${re}`);
  return html.replace(re, typeof to === "function" ? to : () => to);
}

async function loadProblems(contentRoot, taken) {
  const files = (await readdir(contentRoot)).filter((f) => f.endsWith(".json"));
  const list = [];

  for (const file of files) {
    const p = JSON.parse(await readFile(path.join(contentRoot, file), "utf8"));
    const where = `content/problems/${file}`;
    if (p.slug !== file.replace(/\.json$/, "")) throw new Error(`${where}: slug must match the file name`);
    for (const key of ["headline", "build"]) {
      if (typeof p[key] !== "string" || !p[key].trim()) throw new Error(`${where}: missing ${key}`);
    }
    if (!Array.isArray(p.symptoms) || !p.symptoms.length) throw new Error(`${where}: symptoms must be a non-empty list`);
    p.aliases ??= [];
    p.order ??= 999;
    if (p.enabled) {
      const d = p.demo || {};
      if (!/^https:\/\//.test(d.url || "")) throw new Error(`${where}: enabled problem needs demo.url (https)`);
      if (!d.name) throw new Error(`${where}: enabled problem needs demo.name`);
      if (!Array.isArray(d.screens) || !d.screens.length) throw new Error(`${where}: enabled problem needs demo.screens`);
      for (const s of d.screens) {
        if (!s.caption || !s.path) throw new Error(`${where}: every screen needs path and caption`);
        s.buffer = await readFile(path.join(contentRoot, p.slug, s.file)).catch(() => {
          throw new Error(`${where}: missing screenshot content/problems/${p.slug}/${s.file}`);
        });
      }
    }
    list.push(p);
  }
  list.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  // Redirects beat real files on Cloudflare, so a slug or alias equal to a real
  // route (services, faq, insights…) would hijack it. Fail instead.
  const seen = new Map();
  for (const p of list) {
    for (const name of [p.slug, ...p.aliases]) {
      if (!SLUG.test(name)) throw new Error(`content/problems/${p.slug}.json: bad slug or alias "${name}"`);
      if (RESERVED.includes(name) || taken.has(name)) {
        throw new Error(`content/problems/${p.slug}.json: "${name}" collides with a real route`);
      }
      if (seen.has(name)) throw new Error(`problems: "${name}" used by both ${seen.get(name)} and ${p.slug}`);
      seen.set(name, p.slug);
    }
  }
  return list;
}

function bookUrl(calendly, p, variant) {
  return `${calendly}?utm_source=coldemail&utm_campaign=${p.slug}&utm_content=${variant}`;
}

function renderDemo(p, urls) {
  const d = p.demo;
  const phone = d.device === "phone";
  const [w, h] = phone ? [430, 880] : [1280, 800];
  const host = new URL(d.url).host;
  // Screen 1 loads with the page; the rest after window load (problem.js).
  const images = d.screens
    .map((s, i) => {
      const src = i === 0 ? `class="on" src="${urls[i]}"` : `data-src="${urls[i]}"`;
      return `<img ${src} data-path="${esc(host + s.path)}" alt="${esc(s.caption)}" width="${w}" height="${h}" decoding="async" />`;
    })
    .join("");
  const pips = d.screens
    .map((s, i) => `<button type="button" aria-label="Screen ${i + 1}: ${esc(s.caption)}" aria-current="${i === 0}"></button>`)
    .join("");
  return `<div class="problem-demo">
<figure class="frame${phone ? " phone" : ""}" id="frame">
<div class="frame-bar"><span class="frame-dots"><i></i><i></i><i></i></span><span class="frame-url">${esc(host + d.screens[0].path)}</span><span class="frame-live">Live demo</span></div>
<a class="frame-screen" data-try href="${esc(d.url)}" target="_blank" rel="noopener" aria-label="Try the ${esc(d.name)} demo yourself">${images}</a>
<div class="frame-progress"><i></i></div>
<figcaption class="frame-cap"><span class="frame-step">01 / ${pad(d.screens.length)}</span><span class="frame-text">${esc(d.screens[0].caption)}</span><span class="frame-pips">${pips}</span></figcaption>
</figure>
<div class="demo-actions"><a class="try-btn" data-try href="${esc(d.url)}" target="_blank" rel="noopener">Try it yourself →</a></div>
<p class="frame-note">A working prototype with sample data. Click around; nothing is saved.</p>
</div>`;
}

function renderProblem(p, urls, book, index) {
  const symptoms = p.symptoms
    .map((t, i) => `<li><span class="num">${pad(i + 1)}</span><span>${esc(t)}</span></li>`)
    .join("");
  return `<section class="problem is-target" id="p-${p.slug}">
<div class="problem-inner">
<div class="problem-head">
<p class="problem-kicker"><span>Do you have this problem?</span>${index ? `<span class="idx">${index}</span>` : ""}</p>
<h2 class="problem-headline"><span class="co" id="co" hidden></span>${esc(p.headline)}</h2>
</div>
<div class="problem-body">
<div><p class="model-list-title">Sound familiar?</p><ul class="model-list">${symptoms}</ul></div>
<div><p class="model-list-title">What we'd build</p><p class="model-body">${esc(p.build)}</p></div>
<div class="problem-actions"><a class="hero-cta" data-book href="${esc(book)}" target="_blank" rel="noopener">Book a 30-min scoping call</a><a class="problem-next" href="#hero">Yes. Who are you? ↓</a></div>
</div>
${renderDemo(p, urls)}
</div>
</section>
`;
}

// Stack variant: every other live problem as a card linking to its own page.
function renderStack(others, total) {
  const cells = others
    .map(
      (o, i) =>
        `<a class="domain-cell stack-cell" href="/${o.slug}/">` +
        `<p class="domain-cell-code">${pad(i + 1)} / ${pad(total)}</p>` +
        `<h3 class="stack-h">${esc(o.headline)}</h3>` +
        `<ul>${o.symptoms.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` +
        `<span class="stack-go">See the working demo →</span></a>`,
    )
    .join("");
  return `<section class="stack" id="stack"><div class="domains-inner">
<p class="section-label">Problems we've built working demos for</p>
<div class="domain-grid">${cells}</div>
</div></section>
`;
}

function renderChrome(p, book) {
  return `<div class="book-bar" id="book-bar"><div class="book-bar-inner">
<p class="book-bar-text"><strong>30-min scoping call</strong><span> · we assess the problem and the payoff · no cost</span></p>
<a class="btn-primary" data-book href="${esc(book)}" target="_blank" rel="noopener">Book 30 min</a>
</div></div>
<div class="try" id="try" role="dialog" aria-modal="true" aria-labelledby="try-name" hidden>
<div class="try-bar"><span class="try-title">Live demo · <b id="try-name">${esc(p.demo.name)}</b></span><span>Sample data. Nothing you do is saved.</span><span class="try-spacer"></span><a class="btn-primary" data-book href="${esc(book)}" target="_blank" rel="noopener">Book 30 min</a><a class="try-link" href="${esc(p.demo.url)}" target="_blank" rel="noopener">New tab ↗</a><button class="try-close" id="try-close" type="button">Close ✕</button></div>
<div class="try-stage"><iframe id="try-frame" title="${esc(p.demo.name)} live demo"></iframe><div class="try-loading" id="try-loading">Loading the demo…</div></div>
</div>
`;
}

// Homepage head for a problem page: its own title and social text, noindex,
// canonical stays on /. The homepage FAQ schema is dropped so it isn't
// duplicated across every variant.
function problemHead(home, p, url) {
  const title = `DeltaV | ${p.headline}`;
  let html = home;
  html = swapRe(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = swapRe(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(p.build)}" />\n<meta name="robots" content="noindex" />`,
  );
  html = swapRe(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = swapRe(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${esc(p.build)}" />`,
  );
  html = swapRe(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${SITE}${url}" />`);
  html = swapRe(html, /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open, json, close) => {
    const ld = JSON.parse(json);
    ld["@graph"] = ld["@graph"].filter((node) => node["@type"] !== "FAQPage");
    return open + JSON.stringify(ld) + close;
  });
  return html;
}

export async function buildProblems({ contentRoot, homeHtml, workHtml, taken }) {
  const problems = await loadProblems(contentRoot, taken);
  const live = problems.filter((p) => p.enabled);
  const [css, js] = await Promise.all([
    readFile(path.join(here, "problem.css"), "utf8"),
    readFile(path.join(here, "problem.js"), "utf8"),
  ]);
  const calendly = homeHtml.match(/https:\/\/calendly\.com\/[\w-]+/)?.[0];
  if (!calendly) throw new Error("problems: no Calendly link in src/index.html");

  // Shared by every variant: no ?p= shim, problem CSS in the inline <style>.
  let base = swapRe(homeHtml, /\s*<!-- Legacy cold-email links[\s\S]*?<\/script>/, "");
  base = swap(base, "</style>", `${css}</style>`);

  const pages = new Map();
  const assets = new Map();
  const firstScreen = new Map(); // slug → first screen URL, for the /work gallery

  for (const p of live) {
    // Content-hashed screens, cached forever by the /demos/* rule in _headers.
    const urls = p.demo.screens.map((s) => {
      const hash = createHash("sha256").update(s.buffer).digest("hex").slice(0, 8);
      const ext = path.extname(s.file);
      const rel = `demos/${p.slug}/${path.basename(s.file, ext)}.${hash}${ext}`;
      assets.set(rel, s.buffer);
      return `/${rel}`;
    });
    firstScreen.set(p.slug, urls[0]);

    for (const variant of ["solo", "stack"]) {
      const stack = variant === "stack";
      const url = stack ? `/${p.slug}/stack/` : `/${p.slug}/`;
      const book = bookUrl(calendly, p, variant);
      const config = JSON.stringify({ p: p.slug, v: variant, cal: calendly, demo: p.demo.url }).replace(/</g, "\\u003c");
      const lead =
        (stack ? renderStack(live.filter((o) => o !== p), live.length) : "") +
        renderProblem(p, urls, book, stack ? `${pad(live.length)} / ${pad(live.length)}` : "");

      let html = problemHead(base, p, url);
      html = swap(html, "<section id=\"hero\">", `${lead}<section id="hero">`);
      html = swap(html, 'value="DeltaV — New lead"', `value="${esc(`DeltaV — New lead (${p.slug})`)}"`);
      html = swap(html, 'name="source_problem" value="direct"', `name="source_problem" value="${p.slug}"`);
      html = swap(html, 'name="source_variant" value=""', `name="source_variant" value="${variant}"`);
      html = swap(html, "</body>", `${renderChrome(p, book)}<script>\n${js.replace("{{config}}", () => config)}</script>\n</body>`);
      pages.set(`${p.slug}${stack ? "/stack" : ""}/index.html`, html);
    }
  }

  const cards = live
    .map((p) => {
      const tryUrl = `/${p.slug}/?demo=1&utm_source=website&utm_medium=portfolio&utm_campaign=workflow-prototypes&utm_content=${encodeURIComponent(p.slug)}`;
      const phone = p.demo.device === "phone";
      return `<article class="work-card">
<a class="work-preview${phone ? " device-phone" : ""}" href="${tryUrl}" aria-label="Open the ${esc(p.demo.name)} interactive prototype">
<img src="${firstScreen.get(p.slug)}" alt="${esc(p.demo.screens[0].caption)}" width="${phone ? 430 : 1280}" height="${phone ? 880 : 800}" loading="lazy" decoding="async" />
<span class="preview-label">Interactive prototype</span><span class="preview-arrow" aria-hidden="true">↗</span>
</a>
<div class="work-card-copy">
<p class="work-audience">${esc(p.audience)}</p>
<h2><a href="${tryUrl}">${esc(p.headline)}</a></h2>
<p class="work-description">${esc(p.build)}</p>
<div class="work-card-meta"><span>Sample data · nothing is saved</span><a href="${tryUrl}">Try the workflow →</a></div>
</div>
</article>`;
    })
    .join("\n");
  const gallery = swap(swap(workHtml, "{{prototype_count}}", String(live.length)), "{{prototypes}}", cards);
  pages.set("work/index.html", gallery);

  // First match wins: exact rules, then :placeholder rules, then splats.
  const exact = ["# Generated by scripts/problems.mjs from content/problems/*.json"];
  const splats = [];
  for (const p of problems) {
    if (p.enabled) {
      exact.push(`/${p.slug}/solo  /${p.slug}/  301`, `/${p.slug}/solo/  /${p.slug}/  301`);
      for (const a of p.aliases) exact.push(`/${a}  /${p.slug}/  301`, `/${a}/  /${p.slug}/  301`);
    } else {
      // Not live yet: links land on the homepage, not a 404 (302, it will go live).
      for (const a of [p.slug, ...p.aliases]) {
        exact.push(`/${a}  /  302`, `/${a}/  /  302`);
        splats.push(`/${a}/*  /  302`);
      }
    }
  }
  const redirects = [...exact, "/p/:slug  /:slug/  301", "/p/:slug/  /:slug/  301", ...splats].join("\n") + "\n";

  return {
    pages,
    assets,
    redirects,
    // Regex alternation for the ?p= shim on the homepage; (?!) matches nothing.
    slugs: live.map((p) => p.slug).join("|") || "(?!)",
    summary: `${live.length} problem(s) live (${live.map((p) => p.slug).join(", ")}), ${problems.length - live.length} disabled, ${assets.size} screens`,
  };
}
