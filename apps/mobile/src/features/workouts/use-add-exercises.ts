import { router } from "expo-router";
import { useCallback, useState } from "react";

import { type ApiClient } from "@better-lift/api-client";
import { type ExerciseSummary } from "@better-lift/validators";

import { appendExercises, draftExerciseFrom } from "./draft";
import { readDraft, writeDraft } from "./draft-store";

/**
 * « + Ajouter un exercice », depuis le sélecteur.
 *
 * ## Le brouillon passe par le disque, pas par la route
 *
 * Le sélecteur relit le brouillon, y ajoute les exercices choisis et le
 * réécrit ; l'écran de séance reprend la version du disque en retrouvant le
 * focus. Le même chemin qu'au démarrage d'une routine, donc un seul à éprouver —
 * et surtout, le brouillon reste **la** source de vérité : le repasser d'un
 * écran à l'autre par un paramètre de route en créerait une seconde, qui aurait
 * tôt fait de diverger.
 *
 * La relecture se fait **au moment de la validation**, jamais depuis un état
 * capturé à l'ouverture : entre les deux, une série a pu être cochée.
 */
export function useAddExercises(client: ApiClient) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (exercises: readonly ExerciseSummary[]) => {
      setPending(true);
      setError(null);

      try {
        /**
         * Une panne réseau ne doit pas empêcher d'ajouter : sans repères, on
         * s'entraîne quand même. La colonne « PRÉC. » reste alors vide, comme
         * pour un exercice jamais fait.
         */
        const performances = await client
          .getLastPerformance(exercises.map((exercise) => exercise.id))
          .catch(() => []);

        // Relu **après** l'appel, jamais avant : réécrire un brouillon capturé
        // il y a une requête effacerait ce qui a été saisi entre-temps.
        const draft = readDraft();

        if (!draft) {
          // Impossible depuis l'écran de séance, mais atteignable par un lien
          // profond ou après un abandon depuis un autre écran.
          setError("Aucune séance en cours : la sélection n'a pas été ajoutée.");

          return;
        }

        const added = exercises.map((exercise) =>
          draftExerciseFrom(
            exercise,
            performances.find((entry) => entry.exerciseId === exercise.id),
          ),
        );

        writeDraft(appendExercises(draft, added));
        router.back();
      } finally {
        setPending(false);
      }
    },
    [client],
  );

  return { add, pending, error };
}
