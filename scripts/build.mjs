import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "html-minifier-terser";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(projectRoot, "..", "src");
const outputRoot = path.join(projectRoot, "..", "dist");

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

// Overwrite in place, then prune stale files. Never delete dist/ or empty it
// first: `wrangler dev` rescans the moment files vanish and keeps serving that
// half-empty snapshot.
await mkdir(outputRoot, { recursive: true });
const written = new Set();

for (const sourcePath of await walk(sourceRoot)) {
  const relativePath = path.relative(sourceRoot, sourcePath);
  const destinationPath = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });

  if (path.extname(sourcePath).toLowerCase() === ".html") {
    const source = await readFile(sourcePath, "utf8");
    const output = await minify(source, {
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
    });
    await writeFile(destinationPath, output);
  } else {
    await cp(sourcePath, destinationPath);
  }
  written.add(destinationPath);
}

for (const outputPath of await walk(outputRoot)) {
  if (!written.has(outputPath)) {
    await rm(outputPath);
  }
}

console.log(`Built ${path.relative(process.cwd(), outputRoot)}/`);
