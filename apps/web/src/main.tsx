// Space Grotesk (D195) : 500 pour le texte, 700 pour les titres et les chiffres.
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./styles/globals.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PageErreur, PageIntrouvable } from "./components/etats/pages-routeur";
import { auth, chargerSession } from "./lib/auth-session";
import { routeTree } from "./routeTree.gen";

// Les écrans par défaut du routeur, en français et dans le système : une adresse
// inconnue, et une route qui plante (rendue à sa place seulement).
const router = createRouter({
  routeTree,
  context: { auth },
  defaultNotFoundComponent: PageIntrouvable,
  defaultErrorComponent: PageErreur,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root introuvable");

// La session est résolue AVANT le premier rendu : c'est ce qui évite qu'un écran
// protégé se peigne puis disparaisse — un clignotement. Sur une application privée,
// il n'y a rien à montrer avant de savoir qui est là.
await chargerSession();

createRoot(racine).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
