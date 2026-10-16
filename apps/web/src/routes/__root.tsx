import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Libellé de la route dans le fil d'Ariane. */
    crumb?: string;
  }
}

export const Route = createRootRoute({ component: Root });

function Root() {
  return (
    <TooltipProvider delayDuration={0}>
      <Outlet />
    </TooltipProvider>
  );
}
