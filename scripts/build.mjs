import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "html-minifier-terser";
import { buildInsights } from "./insights.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(projectRoot, "..", "src");
const contentRoot = path.join(projectRoot, "..", "content", "insights");
const outputRoot = path.join(projectRoot, "..", "dist");

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

// Overwrite in place, then prune stale files. Never delete dist/ or empty it
// first: `wrangler dev` rescans the moment files vanish and keeps serving that
// half-empty snapshot.
await mkdir(outputRoot, { recursive: true });
const written = new Set();

async function emit(relativePath, contents) {
  const destinationPath = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, contents);
  written.add(destinationPath);
}

for (const sourcePath of sourceFiles) {
  const relativePath = path.relative(sourceRoot, sourcePath);

  if (path.extname(sourcePath).toLowerCase() === ".html") {
    await emit(relativePath, await minifyHtml(await readFile(sourcePath, "utf8")));
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

for (const outputPath of await walk(outputRoot)) {
  if (!written.has(outputPath)) {
    await rm(outputPath);
  }
}

console.log(`Built ${path.relative(process.cwd(), outputRoot)}/`);
if (insights.drafts.length) {
  const verb = includeDrafts ? "Previewing" : "Skipped";
  console.log(`${verb} ${insights.drafts.length} draft(s): ${insights.drafts.join(", ")}`);
}
