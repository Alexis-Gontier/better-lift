import { createRootRoute, Outlet } from "@tanstack/react-router";
import { parseEtat } from "@/components/states/etat";
import { EtatBar } from "@/components/states/etat-bar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Libellé de la route dans le fil d'Ariane. */
    crumb?: string;
    /** La page répond aux quatre états, que `?etat=` peut forcer (D303). */
    etats?: boolean;
  }
}

export const Route = createRootRoute({
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
