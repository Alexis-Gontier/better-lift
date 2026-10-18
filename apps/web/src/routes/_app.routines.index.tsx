import { createFileRoute } from "@tanstack/react-router";
import { RoutinesHome } from "@/features/routines/routines-home";

export const Route = createFileRoute("/_app/routines/")({
  component: RoutinesHome,
});
