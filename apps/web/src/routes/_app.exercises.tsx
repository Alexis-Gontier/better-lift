import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/exercises")({
  staticData: { crumb: "Exercices" },
  component: Outlet,
});
