import "./styles/globals.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root introuvable");

createRoot(racine).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
