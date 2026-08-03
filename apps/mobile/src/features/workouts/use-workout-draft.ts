import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { type DraftAction, draftReducer, type WorkoutDraft } from "./draft";
import { clearDraft, readDraft, readDraftRaw, writeDraft } from "./draft-store";

/**
 * Brouillon de séance : réducteur en mémoire, disque en miroir.
 *
 * **Chaque mutation réécrit le brouillon**, sans regroupement ni délai. C'est
 * la contrepartie du choix de MMKV : une écriture synchrone coûte quelques
 * microsecondes, et l'étaler pour économiser ce coût rouvrirait la fenêtre de
 * perte qu'on cherchait précisément à fermer.
 *
 * L'écriture vit dans un effet plutôt que dans le `dispatch` : c'est l'état
 * réellement rendu qu'on veut sur le disque, pas celui qu'on croit avoir
 * calculé.
 *
 * ## Le disque a le dernier mot
 *
 * Un autre écran peut modifier le brouillon pendant que celui-ci est masqué —
 * c'est ainsi que le sélecteur ajoute des exercices (doc 06), le brouillon
 * passant par le disque et jamais par un paramètre de route. Au retour du
 * focus, la version du disque **remplace** donc l'état en mémoire dès qu'elle
 * en diffère. C'est sans risque : tant que cet écran est visible, il est seul à
 * écrire, et il écrit à chaque frappe.
 */
export function useWorkoutDraft() {
  // Lu au premier rendu : un brouillon existant doit être là avant le premier
  // affichage, sinon l'écran clignote entre « vide » et « repris ».
  const [restored] = useState(readDraft);
  const [draft, dispatch] = useReducer(draftReducer, restored);
  const written = useRef(draft);
  /** La dernière forme passée par cet écran, pour reconnaître les écritures d'autrui. */
  const writtenRaw = useRef(restored === null ? null : JSON.stringify(restored));

  useEffect(() => {
    if (draft === written.current) {
      return;
    }

    written.current = draft;

    if (draft) {
      writtenRaw.current = writeDraft(draft);
    } else {
      writtenRaw.current = null;
      clearDraft();
    }
  }, [draft]);

  useFocusEffect(
    useCallback(() => {
      if (readDraftRaw() === writtenRaw.current) {
        return;
      }

      const next = readDraft();

      written.current = next;
      writtenRaw.current = next === null ? null : JSON.stringify(next);
      dispatch({ type: "replace", draft: next });
    }, []),
  );

  const start = useCallback((next: WorkoutDraft) => {
    dispatch({ type: "replace", draft: next });
  }, []);

  /** Fin de séance, envoyée ou abandonnée. */
  const discard = useCallback(() => {
    dispatch({ type: "replace", draft: null });
  }, []);

  const update = useCallback((action: DraftAction) => {
    dispatch(action);
  }, []);

  return { draft, resumed: restored !== null, start, update, discard };
}
