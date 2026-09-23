import "./styles/globals.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { auth, chargerSession } from "./lib/auth-session";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree, context: { auth } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root introuvable");

// La session est résolue AVANT le premier rendu : c'est ce qui évite qu'un écran
// protégé se peigne puis disparaisse — le même clignotement que le script
// synchrone du thème a servi à supprimer au lot 1. Sur une application privée,
// il n'y a rien à montrer avant de savoir qui est là.
await chargerSession();

createRoot(racine).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
