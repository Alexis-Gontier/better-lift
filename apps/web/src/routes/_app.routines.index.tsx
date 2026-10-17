import { createFileRoute } from "@tanstack/react-router";
import { useProto } from "@/components/proto/use-proto";
import {
  RoutinesHome,
  RoutinesHomeSkeleton,
  RoutinesOnboarding,
} from "@/features/routines/routines-home";

export const Route = createFileRoute("/_app/routines/")({
  component: RoutinesIndex,
});

/** Rien d'ouvert (D260) : la vue d'ensemble ; sans routine, la première création. */
function RoutinesIndex() {
  const { state } = useProto();
  if (state === "chargement") return <RoutinesHomeSkeleton />;
  // La liste dit déjà l'erreur : rien à répéter ici.
  if (state === "erreur") return null;
  if (state === "vide") return <RoutinesOnboarding />;
  return <RoutinesHome />;
}
