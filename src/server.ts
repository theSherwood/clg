// Dev server: serves the app with hot reloading, plus an endpoint the phonology playground uses
// to save its settings as the defaults. Run it through dev.ts (bun run dev).
import { join } from "node:path";
import index from "./index.html";
import { is_phonology, phonology_to_json } from "./phonology";

const DEFAULTS_FILE = "phonology.defaults.json";

const server = Bun.serve({
  hostname: "localhost",
  port: 3005,
  development: true,
  routes: {
    "/": index,
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
  },
});

console.log(`Dev server: ${server.url}`);
