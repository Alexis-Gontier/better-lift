import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  staticData: { crumb: "Paramètres" },
  component: Outlet,
});
