import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ProtoBar } from "@/components/proto/proto-bar";
import { parseProtoSearch } from "@/components/proto/proto-search";
import { TooltipProvider } from "@/components/ui/tooltip";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Libellé de la route dans le fil d'Ariane. */
    crumb?: string;
  }
}

export const Route = createRootRoute({
  validateSearch: parseProtoSearch,
  component: Root,
});

function Root() {
  return (
    <TooltipProvider delayDuration={0}>
      <Outlet />
      <ProtoBar />
    </TooltipProvider>
  );
}
