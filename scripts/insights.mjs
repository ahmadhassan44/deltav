// Renders content/insights/*.html into full pages, plus everything that lists
// them: the /insights/ index, the sitemap, and the guide list in llms.txt.
//
// A post is one file: a JSON block in a leading HTML comment, then the body as
// plain HTML. Every <h2> starts a numbered section; the layout, schema, FAQ and
// calls to action are added here so a post carries only its own words.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SITE = "https://deltav.build";
const EMAIL = "support@deltav.build";
const ORG = { "@id": `${SITE}/#org` };
const CALL = ["Book a scoping call", "/#intake"];
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const strip = (s) => String(s).replace(/<[^>]+>/g, "");
const pad = (n) => String(n).padStart(2, "0");

function humanDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function crumbs(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"], ...trail].map(([name, url], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: SITE + url,
    })),
  };
}

function faqSchema(faq) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: strip(a) },
    })),
  };
}

function actions(secondary) {
  return `<div class="actions">
  <a class="btn" href="${CALL[1]}">${CALL[0]}</a>
  <a class="btn-quiet" href="${secondary[1]}">${secondary[0]}</a>
</div>`;
}

function section(id, eyebrow, inner) {
  return `<section class="section" aria-labelledby="${id}">
<p class="eyebrow">${eyebrow}</p>
${inner}
</section>`;
}

function page({ url, title, description, graph, main, ogType = "website" }) {
  const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="theme-color" content="#0d0f0c" />
<link rel="canonical" href="${SITE}${url}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="preload" href="/fonts/barlow-condensed-700.v1.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/site.css" />
<meta property="og:type" content="${ogType}" />
<meta property="og:site_name" content="DeltaV" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${SITE}${url}" />
<meta property="og:image" content="${SITE}/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${ld}</script>
</head>
<body>
<div class="site-shell">
<header class="site-header">
<a class="brand" href="/" aria-label="DeltaV home"><span class="brand-mark">Δ<span>V</span></span><span class="brand-name">DeltaV</span></a>
<nav class="site-nav" aria-label="Primary">
<a href="/services/">Services</a>
<a href="/work/">Prototypes</a>
<a href="/insights/" aria-current="page">Insights</a>
<a class="nav-cta" href="/#intake">Book a call</a>
</nav>
</header>
<main class="page-main">
${main}
</main>
<footer class="site-footer">
<div class="site-footer-inner">
<span>ΔV · DeltaV · 2026</span>
<nav aria-label="Footer">
<a href="/services/">Services</a>
<a href="/work/">Prototypes</a>
<a href="/insights/">Insights</a>
<a href="/faq/">FAQ</a>
<a href="mailto:${EMAIL}">${EMAIL}</a>
</nav>
</div>
</footer>
</div>
  <script src="/lead-attribution.js" defer></script>
</body>
</html>
`;
}

async function readPosts(contentRoot) {
  const posts = [];
  for (const name of (await readdir(contentRoot)).sort()) {
    if (!name.endsWith(".html")) continue;
    const raw = await readFile(path.join(contentRoot, name), "utf8");
    const m = raw.match(/^\s*<!--([\s\S]*?)-->\s*([\s\S]*)$/);
    if (!m) throw new Error(`${name}: missing <!-- {json} --> front matter`);
    let meta;
    try {
      meta = JSON.parse(m[1]);
    } catch (e) {
      throw new Error(`${name}: front matter is not valid JSON: ${e.message}`);
    }
    for (const key of ["title", "seoTitle", "description", "eyebrow", "date", "answer", "card", "cta"]) {
      if (!meta[key]) throw new Error(`${name}: front matter is missing "${key}"`);
    }
    posts.push({ ...meta, slug: name.replace(/\.html$/, ""), body: m[2].trim() });
  }
  // Newest first; slug breaks ties so same-day posts keep a stable order.
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

function renderPost(post) {
  const url = `/insights/${post.slug}/`;
  const parts = post.body.split(/(?=<h2[\s>])/).filter((p) => p.trim());
  if (!parts.length || !parts[0].startsWith("<h2")) {
    throw new Error(`${post.slug}: body must start with an <h2>`);
  }
  const sections = parts.map((p, i) => {
    const id = `s${i + 1}`;
    return section(id, pad(i + 1), p.trim().replace(/^<h2[^>]*>/, `<h2 id="${id}">`));
  });
  if (post.faq?.length) {
    const cells = post.faq
      .map(([q, a]) => `<div class="cell">\n<h3>${q}</h3>\n<p>${a}</p>\n</div>`)
      .join("\n");
    sections.push(section("faq", "Questions", `<h2 id="faq">Direct answers</h2>\n<div class="grid">\n${cells}\n</div>`));
  }
  // The calls to action close out the last section rather than floating after it.
  const last = sections.length - 1;
  sections[last] = sections[last].replace(/<\/section>$/, `${actions(post.cta)}\n</section>`);

  const updated = post.updated || post.date;
  const graph = [
    {
      "@type": "Article",
      "@id": `${SITE}${url}#article`,
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: updated,
      author: ORG,
      publisher: ORG,
      mainEntityOfPage: SITE + url,
      image: `${SITE}/og-image.png`,
    },
    crumbs([["Insights", "/insights/"], [post.title, url]]),
  ];
  if (post.faq?.length) graph.push(faqSchema(post.faq));

  const stamp =
    (post.draft ? "Draft · " : "") +
    (post.updated
      ? `DeltaV engineering · Updated ${humanDate(post.updated)}`
      : `DeltaV engineering · ${humanDate(post.date)}`);
  const main = `<p class="eyebrow">${post.eyebrow}</p>
<h1>${post.title}</h1>
<p class="meta">${stamp}</p>
<p class="answer">${post.answer}</p>
${sections.join("\n")}`;

  return page({ url, title: post.seoTitle, description: post.description, graph, main, ogType: "article" });
}

function renderIndex(posts) {
  const url = "/insights/";
  const cells = posts
    .map(
      (p) => `<a class="cell" href="/insights/${p.slug}/">
<p class="cell-label">${p.draft ? "Draft · " : ""}${p.card[0]} · ${humanDate(p.date)}</p>
<h3>${p.title}</h3>
<p>${p.card[1]}</p>
</a>`,
    )
    .join("\n");
  const main = `<p class="eyebrow">Insights</p>
<h1>Field guides.</h1>
<p class="answer">Short answers for owners, operators and CTOs deciding what to build. Written by the engineers who build it.</p>
${section("guides", "Guides", `<h2 id="guides">Read before you build</h2>\n<div class="grid">\n${cells}\n</div>\n${actions(["Services", "/services/"])}`)}`;
  const graph = [
    {
      "@type": "CollectionPage",
      "@id": `${SITE}${url}#page`,
      name: "DeltaV field guides",
      url: SITE + url,
      publisher: ORG,
      hasPart: posts.map((p) => ({ "@id": `${SITE}/insights/${p.slug}/#article` })),
    },
    crumbs([["Insights", url]]),
  ];
  return page({
    url,
    title: "Field Guides: Custom Software, Automation & AI | DeltaV",
    description:
      "Short guides for owners, operators and CTOs: build vs buy, custom software cost, automation and applied AI.",
    graph,
    main,
  });
}

// Static pages have no trustworthy modified date (a fresh clone stamps every
// file with the build time), so only posts carry <lastmod>.
function renderSitemap(staticPaths, posts) {
  const urls = [
    ...staticPaths.map((p) => `<url><loc>${SITE}${p}</loc></url>`),
    `<url><loc>${SITE}/insights/</loc><lastmod>${posts[0]?.date ?? ""}</lastmod></url>`,
    ...posts.map(
      (p) => `<url><loc>${SITE}/insights/${p.slug}/</loc><lastmod>${p.updated || p.date}</lastmod></url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  ${u}`).join("\n")}
</urlset>
`;
}

export async function buildInsights({ contentRoot, staticPaths, includeDrafts }) {
  const all = await readPosts(contentRoot);
  const posts = all.filter((p) => includeDrafts || !p.draft);
  const pages = new Map([["insights/index.html", renderIndex(posts)]]);
  for (const p of posts) pages.set(`insights/${p.slug}/index.html`, renderPost(p));

  // Drafts never reach the sitemap or llms.txt, even in a local preview build,
  // so a preview can't be mistaken for what Google and AI crawlers will see.
  const live = all.filter((p) => !p.draft);
  const guideList = live
    .map((p) => `- [${strip(p.title)}](${SITE}/insights/${p.slug}/): ${strip(p.card[1])}`)
    .join("\n");
  return {
    pages,
    sitemap: renderSitemap(staticPaths, live),
    guideList,
    drafts: all.filter((p) => p.draft).map((p) => p.slug),
  };
}
