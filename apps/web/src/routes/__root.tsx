import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { parseEtat } from "@/components/states/etat";
import { EtatBar } from "@/components/states/etat-bar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Session } from "@/lib/auth";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Libellé de la route dans le fil d'Ariane. */
    crumb?: string;
    /** La page répond aux quatre états, que `?etat=` peut forcer (D303). */
    etats?: boolean;
  }
}

/** Ce que chaque route reçoit : la session (D301) et le cache des requêtes (D300). */
type ContexteRouteur = { auth: { session: Session }; queryClient: QueryClient };

export const Route = createRootRouteWithContext<ContexteRouteur>()({
  validateSearch: parseEtat,
  component: Root,
});

function Root() {
  return (
    <TooltipProvider delayDuration={0}>
      <Outlet />
      <EtatBar />
      {/* Au centre : le sélecteur d'état occupe le coin droit. */}
      <Toaster position="bottom-center" />
    </TooltipProvider>
  );
}
