import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { minify } from "html-minifier-terser";
import { buildInsights } from "./insights.mjs";
import { buildProblems } from "./problems.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(projectRoot, "..", "src");
const contentRoot = path.join(projectRoot, "..", "content", "insights");
const problemsRoot = path.join(projectRoot, "..", "content", "problems");
const outputRoot = path.join(projectRoot, "..", "dist");

// First TCP round trip (CLAUDE.md, Performance). Every page, gzip -9.
const GZIP_BUDGET = 14336;

// `npm run dev` sets this so drafts can be previewed locally. Deploys never do.
const includeDrafts = process.env.INCLUDE_DRAFTS === "1";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

const minifyHtml = (html) =>
  minify(html, {
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
  });

const sourceFiles = await walk(sourceRoot);

// Every src/**/index.html is a page. Insights pages come from content/ instead.
const staticPaths = sourceFiles
  .map((f) => path.relative(sourceRoot, f).split(path.sep).join("/"))
  .filter((f) => f === "index.html" || f.endsWith("/index.html"))
  .map((f) => `/${f.replace(/index\.html$/, "")}`)
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

const insights = await buildInsights({ contentRoot, staticPaths, includeDrafts });

// Problem slugs and aliases must not shadow anything the site already serves.
const taken = new Set(
  [...sourceFiles.map((f) => path.relative(sourceRoot, f)), ...insights.pages.keys()].map(
    (rel) => rel.split(/[\\/]/)[0],
  ),
);
const problems = await buildProblems({
  contentRoot: problemsRoot,
  homeHtml: await readFile(path.join(sourceRoot, "index.html"), "utf8"),
  workHtml: await readFile(path.join(sourceRoot, "work", "index.html"), "utf8"),
  taken,
});

// Overwrite in place, then prune stale files. Never delete dist/ or empty it
// first: `wrangler dev` rescans the moment files vanish and keeps serving that
// half-empty snapshot.
await mkdir(outputRoot, { recursive: true });
const written = new Set();
const sizes = [];

async function emit(relativePath, contents) {
  const destinationPath = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, contents);
  written.add(destinationPath);
  if (relativePath.endsWith(".html")) {
    sizes.push([relativePath, Buffer.byteLength(contents), gzipSync(contents, { level: 9 }).length]);
  }
}

for (const sourcePath of sourceFiles) {
  const relativePath = path.relative(sourceRoot, sourcePath);

  // src/work/index.html is a template; problems.mjs renders it into work/index.html.
  if (relativePath === path.join("work", "index.html")) continue;

  if (path.extname(sourcePath).toLowerCase() === ".html") {
    let html = await readFile(sourcePath, "utf8");
    if (relativePath === "index.html") html = html.replace("{{problems}}", problems.slugs);
    await emit(relativePath, await minifyHtml(html));
  } else if (relativePath === "llms.txt" || relativePath === "llms-full.txt") {
    const text = await readFile(sourcePath, "utf8");
    await emit(relativePath, text.replace("{{guides}}", insights.guideList));
  } else {
    const destinationPath = path.join(outputRoot, relativePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await cp(sourcePath, destinationPath);
    written.add(destinationPath);
  }
}

for (const [relativePath, html] of insights.pages) {
  await emit(relativePath, await minifyHtml(html));
}
await emit("sitemap.xml", insights.sitemap);

for (const [relativePath, html] of problems.pages) {
  await emit(relativePath, await minifyHtml(html));
}
for (const [relativePath, image] of problems.assets) {
  await emit(relativePath, image);
}
await emit("_redirects", problems.redirects);

for (const outputPath of await walk(outputRoot)) {
  if (!written.has(outputPath)) {
    await rm(outputPath);
  }
}

const width = Math.max(...sizes.map(([rel]) => rel.length));
console.log(`${"page".padEnd(width)}   raw B  gzip B  budget`);
for (const [rel, raw, gz] of sizes.sort((a, b) => a[0].localeCompare(b[0]))) {
  const pct = `${Math.round((gz / GZIP_BUDGET) * 100)}%`.padStart(4);
  console.log(`${rel.padEnd(width)}  ${String(raw).padStart(6)}  ${String(gz).padStart(6)}  ${pct}${gz > GZIP_BUDGET ? "  OVER" : ""}`);
}

console.log(`Built ${path.relative(process.cwd(), outputRoot)}/ — ${problems.summary}`);
if (insights.drafts.length) {
  const verb = includeDrafts ? "Previewing" : "Skipped";
  console.log(`${verb} ${insights.drafts.length} draft(s): ${insights.drafts.join(", ")}`);
}

const over = sizes.filter(([, , gz]) => gz > GZIP_BUDGET).map(([rel]) => rel);
if (over.length) {
  throw new Error(`Over the ${GZIP_BUDGET} B gzip budget: ${over.join(", ")}`);
}
