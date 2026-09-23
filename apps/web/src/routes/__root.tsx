import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Palette } from "@/components/shell/palette";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

// La coquille n'est PAS montée ici : seule la route sait s'il y a un détail à
// ouvrir, et `AppShell` change son jeu de panneaux — donc sa clé de persistance —
// selon qu'il y en a un ou non. Un `AppShell` racine obligerait chaque route à en
// imbriquer un second, avec deux navigations et deux groupes de panneaux.
export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Palette />
    </QueryClientProvider>
  ),
});
