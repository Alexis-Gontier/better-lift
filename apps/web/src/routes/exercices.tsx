import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/shell/app-shell";
import { DetailExercice } from "@/features/exercices/detail-exercice";
import { ListeExercices } from "@/features/exercices/liste-exercices";
import { EXERCICES } from "@/mocks/exercices";

// Le détail ouvert et la recherche vivent dans l'URL, validés par schéma (D19) :
// un rechargement retombe au même endroit, et un lien se partage tel quel.
const recherche = z.object({
  q: z.string().optional(),
  groupe: z.string().optional(),
  id: z.string().optional(),
});

export const Route = createFileRoute("/exercices")({
  validateSearch: recherche,
  component: PageExercices,
});

function PageExercices() {
  const { q, groupe, id } = Route.useSearch();
  const navigate = Route.useNavigate();

  const visibles = EXERCICES.filter((e) => {
    const parNom = q ? e.nom.toLowerCase().includes(q.toLowerCase()) : true;
    const parGroupe = groupe ? e.groupe === groupe : true;
    return parNom && parGroupe;
  });

  const selectionne = id ? EXERCICES.find((e) => e.id === id) : undefined;

  return (
    <AppShell
      liste={
        <ListeExercices
          exercices={visibles}
          q={q ?? ""}
          idSelectionne={id}
          onRecherche={(valeur) => navigate({ search: (s) => ({ ...s, q: valeur || undefined }) })}
          onSelection={(exId) => navigate({ search: (s) => ({ ...s, id: exId }) })}
        />
      }
      detail={
        selectionne ? (
          <DetailExercice
            exercice={selectionne}
            onFermer={() => navigate({ search: (s) => ({ ...s, id: undefined }) })}
          />
        ) : undefined
      }
    />
  );
}
