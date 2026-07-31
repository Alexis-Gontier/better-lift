import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.warn(`API à l'écoute sur http://localhost:${info.port} (${env.NODE_ENV})`);
});
