import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/history")({
  staticData: { crumb: "Historique" },
  component: Outlet,
});
