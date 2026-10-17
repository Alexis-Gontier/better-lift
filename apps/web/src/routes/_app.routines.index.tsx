import { createFileRoute } from "@tanstack/react-router";
import { useProto } from "@/components/proto/use-proto";
import { RoutinesHome, RoutinesOnboarding } from "@/features/routines/routines-home";

export const Route = createFileRoute("/_app/routines/")({
  component: RoutinesIndex,
});

/** Rien d'ouvert (D260) : un état vide qui propose la création ; sans routine, la première. */
function RoutinesIndex() {
  const { state } = useProto();
  // La liste dit déjà le chargement ou l'erreur : rien à répéter ici.
  if (state === "chargement" || state === "erreur") return null;
  if (state === "vide") return <RoutinesOnboarding />;
  return <RoutinesHome />;
}
