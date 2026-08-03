import { useMemo, useState } from "react";

import { useExercises } from "@better-lift/api-client";
import { type BodyPart } from "@better-lift/validators";

import { resolveMediaUrl } from "./media";
import { useDebouncedValue } from "./use-debounced-value";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Recherche dans le catalogue : état des filtres, requête paginée, résultats.
 *
 * Le catalogue et le sélecteur de séance montrent la **même** liste avec les
 * mêmes filtres ; seul ce qu'un appui déclenche les distingue — ouvrir la fiche
 * d'un côté, cocher de l'autre. Tout ce qui précède ce choix vit donc ici, y
 * compris les mentions de copyright : les oublier dans le sélecteur serait un
 * manquement à la licence du dataset (D17, doc 08), et une règle qu'on ne peut
 * appliquer qu'à un seul endroit ne s'oublie pas.
 */
export function useExerciseSearch() {
  const [draftQuery, setDraftQuery] = useState("");
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [custom, setCustom] = useState<boolean | undefined>(undefined);

  const q = useDebouncedValue(draftQuery, SEARCH_DEBOUNCE_MS).trim();
  const locale = useProfileLocale();

  const query = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(bodyParts.length ? { bodyPart: bodyParts } : {}),
      // `false` est une valeur significative — « le catalogue seul » — à ne pas
      // confondre avec « non renseigné », qui veut dire « les deux ».
      ...(custom === undefined ? {} : { custom }),
      locale,
    }),
    [q, bodyParts, custom, locale],
  );

  const exercises = useExercises(apiClient, query);
  const items = useMemo(
    () => exercises.data?.pages.flatMap((page) => page.data) ?? [],
    [exercises.data],
  );

  /**
   * Mentions de copyright des seuls médias réellement affichés (D17, doc 08),
   * regroupées en pied de liste : la source est unique pour tout le catalogue,
   * et la répéter sous chaque ligne n'informerait pas mieux.
   */
  const attributions = useMemo(
    () => [
      ...new Set(
        items
          .filter((exercise) => resolveMediaUrl(exercise.thumbnailUrl))
          .map((exercise) => exercise.attribution)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [items],
  );

  /** Le tri garde la clé de cache TanStack stable quel que soit l'ordre des taps. */
  function toggleBodyPart(value: BodyPart) {
    setBodyParts((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value].sort((a, b) => a.localeCompare(b)),
    );
  }

  return {
    exercises,
    items,
    attributions,
    filters: { draftQuery, setDraftQuery, bodyParts, toggleBodyPart, custom, setCustom },
    /** Vrai quand rien n'a été demandé : « aucun résultat » n'a alors pas le même sens. */
    unfiltered: !q && bodyParts.length === 0,
  };
}

export type ExerciseFilters = ReturnType<typeof useExerciseSearch>["filters"];
