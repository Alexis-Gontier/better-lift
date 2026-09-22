import "./env.js";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { health } from "./routes/health.js";

const app = new Hono();

app.use(logger());
app.use(secureHeaders());
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    credentials: true,
  }),
);

const routes = app.route("/health", health);

export type AppType = typeof routes;
export default app;

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, () => {
  console.log(`API sur http://localhost:${port}`);
});
