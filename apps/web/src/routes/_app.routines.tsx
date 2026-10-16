import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/routines")({
  staticData: { crumb: "Routines" },
  component: Outlet,
});
