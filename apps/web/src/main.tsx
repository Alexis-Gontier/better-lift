import "./styles/globals.css";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorPage, NotFoundPage } from "./components/states/router-pages";
import { ErreurApi } from "./lib/api";
import { auth, chargerSession } from "./lib/auth";
import { routeTree } from "./routeTree.gen";

/** Une session expirée en cours de route : la relire, et la garde renvoie à la connexion. */
async function surErreur(e: unknown) {
  if (e instanceof ErreurApi && e.statut === 401) {
    await chargerSession();
    await router.invalidate();
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: surErreur }),
  mutationCache: new MutationCache({ onError: surErreur }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Un 4xx ne se répare pas en réessayant.
      retry: (n, e) => !(e instanceof ErreurApi && e.statut >= 400 && e.statut < 500) && n < 2,
    },
  },
});

const router = createRouter({
  routeTree,
  // L'application vit sous `/app`, la racine est à la landing (D292) ; Vite a le même `base`.
  basepath: "/app",
  context: { auth, queryClient },
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: ErrorPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

// La session est résolue AVANT le premier rendu : un écran protégé ne doit pas se peindre
// puis disparaître. Sur une application privée, il n'y a rien à montrer avant de savoir qui
// est là.
await chargerSession();

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
