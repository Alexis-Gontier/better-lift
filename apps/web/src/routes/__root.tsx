import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Palette } from "@/components/shell/palette";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Session } from "@/lib/auth-client";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

export type ContexteRouteur = {
  auth: { session: Session };
};

// La coquille n'est PAS montée ici : seule la route sait s'il y a un détail à
// ouvrir, et `PageListeDetail` change son jeu de panneaux — donc sa clé de
// persistance — selon qu'il y en a un. Chaque écran monte son gabarit
// (`PageListeDetail` ou `PageTableau`), qui pose la `Coquille`.
//
// La garde d'authentification n'est pas ici non plus : la racine rend TOUJOURS,
// quelle que soit la session. La frontière est `_protege.tsx`.
export const Route = createRootRouteWithContext<ContexteRouteur>()({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Outlet />
        <Palette />
      </TooltipProvider>
    </QueryClientProvider>
  ),
});
