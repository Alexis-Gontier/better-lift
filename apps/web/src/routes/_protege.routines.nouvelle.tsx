import { createFileRoute } from "@tanstack/react-router";
import { EditeurRoutine } from "@/features/routines/editeur-routine";
import { useCreerRoutine } from "@/features/routines/requetes";

/**
 * Une routine neuve (D81). Le segment statique `nouvelle` l'emporte sur `$id` :
 * aucun identifiant réservé à vérifier à la main.
 */
export const Route = createFileRoute("/_protege/routines/nouvelle")({
  component: PageNouvelleRoutine,
});

function PageNouvelleRoutine() {
  const navigate = Route.useNavigate();
  const creer = useCreerRoutine();

  return (
    <EditeurRoutine
      initiale={null}
      enregistrement={creer.isPending}
      erreur={creer.error?.message}
      onEnregistrer={(r) =>
        creer.mutate(r, {
          // Enregistrée, elle a un identifiant : on passe sur sa vraie page.
          onSuccess: (id) => navigate({ to: "/routines/$id", params: { id }, replace: true }),
        })
      }
      onFermer={() => navigate({ to: "/routines" })}
    />
  );
}
