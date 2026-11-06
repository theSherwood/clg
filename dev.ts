// Runs server.ts and restarts it whenever a source file in this directory changes. Bun's dev
// bundler (as of 1.2.11) doesn't notice files created after it starts, and sometimes stops
// picking up edits too, so it would otherwise serve a stale build.
import { existsSync, readdirSync, watch } from "node:fs";
import type { Subprocess } from "bun";

const dir = import.meta.dir;
const SOURCE = /\.(tsx?|css|html|json)$/;

let known = new Set(readdirSync(dir));
let server: Subprocess | undefined;
let restart_timer: ReturnType<typeof setTimeout> | undefined;

function start() {
  server = Bun.spawn(["bun", "server.ts"], { cwd: dir, stdio: ["inherit", "inherit", "inherit"] });
}

async function restart(reason: string) {
  console.log(`[dev] ${reason}, restarting`);
  server?.kill();
  await server?.exited;
  start();
}

watch(dir, (event, file) => {
  if (!file || !SOURCE.test(file)) return;
  const added = event === "rename" && existsSync(`${dir}/${file}`) && !known.has(file);
  known = new Set(readdirSync(dir));
  clearTimeout(restart_timer);
  restart_timer = setTimeout(() => restart(added ? `${file} added` : `${file} changed`), 100);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server?.kill();
    process.exit(0);
  });
}

start();
