// Dev server: serves the app with hot reloading, plus endpoints the Roots page uses to save the
// phonology playground's settings as the defaults and the order of the core sections. Run it through dev.ts (bun run dev).
import { join } from "node:path";
import index from "./index.html";
import { is_section_order } from "./dict";
import { is_phonology, phonology_to_json } from "./phonology";

const DEFAULTS_FILE = "phonology.defaults.json";
const SECTION_ORDER_FILE = "section_order.json";

// The circle layout worker, bundled for the browser once per run (dev.ts restarts the server when
// a source file changes)
let circle_worker: Promise<Response> | undefined;
async function build_circle_worker(): Promise<Response> {
  const built = await Bun.build({ entrypoints: [join(import.meta.dir, "circle_worker.ts")], target: "browser" });
  if (!built.success) return new Response(built.logs.join("\n"), { status: 500 });
  return new Response(await built.outputs[0]!.text(), { headers: { "Content-Type": "text/javascript" } });
}

const server = Bun.serve({
  hostname: "localhost",
  port: 3005,
  development: true,
  routes: {
    "/": index,
    "/circle_worker.js": async () => (await (circle_worker ??= build_circle_worker())).clone(),
    "/api/phonology-defaults": {
      POST: async (request) => {
        const phonology = await request.json().catch(() => null);
        if (!is_phonology(phonology)) {
          return Response.json({ error: "Not a valid phonology" }, { status: 400 });
        }
        await Bun.write(join(import.meta.dir, DEFAULTS_FILE), phonology_to_json(phonology));
        return Response.json({ saved: DEFAULTS_FILE });
      },
    },
    "/api/section-order": {
      POST: async (request) => {
        const order = await request.json().catch(() => null);
        if (!is_section_order(order)) {
          return Response.json({ error: "Not an order of the core sections" }, { status: 400 });
        }
        await Bun.write(
          join(import.meta.dir, SECTION_ORDER_FILE),
          `[${order.map((key) => JSON.stringify(key)).join(", ")}]\n`,
        );
        return Response.json({ saved: SECTION_ORDER_FILE });
      },
    },
  },
});

console.log(`Dev server: ${server.url}`);
