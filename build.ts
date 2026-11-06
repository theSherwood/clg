// Static build for GitHub Pages: the app and the circle layout worker, bundled into dist.
// The dev server's save endpoints don't exist there, so the Roots page hides their buttons.
import { rm } from "node:fs/promises";
import { join } from "node:path";
import tailwind from "bun-plugin-tailwind";

const outdir = join(import.meta.dir, "dist");
await rm(outdir, { recursive: true, force: true });

for (const options of [
  { entrypoints: [join(import.meta.dir, "index.html")], plugins: [tailwind] },
  { entrypoints: [join(import.meta.dir, "circle_worker.ts")], naming: "circle_worker.js" },
]) {
  const built = await Bun.build({ ...options, outdir, target: "browser", minify: true });
  if (!built.success) {
    console.error(built.logs.join("\n"));
    process.exit(1);
  }
  for (const output of built.outputs) console.log(output.path.replace(`${outdir}/`, ""));
}
