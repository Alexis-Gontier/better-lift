import "./env.js";

import { serve } from "@hono/node-server";
import app from "./app.js";

export type { AppType } from "./app.js";
export default app;

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, () => {
  console.log(`API sur http://localhost:${port}`);
});
