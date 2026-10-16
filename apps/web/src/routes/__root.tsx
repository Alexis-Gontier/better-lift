import { createRootRoute, Outlet } from "@tanstack/react-router";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Libellé de la route dans le fil d'Ariane. */
    crumb?: string;
  }
}

export const Route = createRootRoute({ component: Outlet });
