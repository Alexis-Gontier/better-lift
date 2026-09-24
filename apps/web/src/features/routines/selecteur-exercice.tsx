import { LIBELLE_GROUPE } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { optionsCatalogue } from "@/features/exercices/requetes";

/**
 * Choisir un exercice à ajouter. Le catalogue réel existe depuis le lot 4 : ce
 * sélecteur le cherche pour de bon — en français comme en anglais, sans accents.
 * Il flotte, donc il se ferme : c'est un dialogue, pas un panneau.
 */
export function SelecteurExercice({
  ouvert,
  onFermer,
  onChoisir,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onChoisir: (slug: string, nom: string) => void;
}) {
  const [q, setQ] = useState("");
  const catalogue = useInfiniteQuery({
    ...optionsCatalogue({ q: q.trim() || undefined }),
    enabled: ouvert,
  });
  const exercices = catalogue.data?.pages.flatMap((p) => p.exercices) ?? [];

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="flex max-h-[70vh] flex-col gap-3 bg-(--surface-1) p-4">
        <DialogTitle className="text-base">Ajouter un exercice</DialogTitle>
        <DialogDescription className="sr-only">
          Cherche un exercice du catalogue par son nom, en français ou en anglais.
        </DialogDescription>
        <input
          autoFocus
          type="search"
          aria-label="Rechercher un exercice"
          placeholder="développé, squat, bench press…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-(--line) bg-(--surface-2) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        />
        <ul className="-mx-1 flex-1 overflow-auto">
          {catalogue.isPending ? (
            <li className="px-2 py-3 text-sm text-(--ink-faint)">Chargement…</li>
          ) : catalogue.isError ? (
            <li className="px-2 py-3 text-sm text-destructive-ink">
              Le catalogue n'a pas pu être chargé.
            </li>
          ) : exercices.length === 0 ? (
            <li className="px-2 py-3 text-sm text-(--ink-faint)">Rien ne correspond à « {q} ».</li>
          ) : (
            exercices.map((ex) => (
              <li key={ex.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onChoisir(ex.slug, ex.nom);
                    setQ("");
                  }}
                  className="w-full rounded px-2 py-1.5 text-left hover:bg-(--surface-3) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
                >
                  <span className="block truncate text-sm text-(--ink)">{ex.nom}</span>
                  <span className="block text-[11px] text-(--ink-faint)">
                    {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
