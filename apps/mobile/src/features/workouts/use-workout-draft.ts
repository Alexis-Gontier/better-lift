import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { type DraftAction, draftReducer, type WorkoutDraft } from "./draft";
import { clearDraft, readDraft, writeDraft } from "./draft-store";

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
 */
export function useWorkoutDraft() {
  // Lu au premier rendu : un brouillon existant doit être là avant le premier
  // affichage, sinon l'écran clignote entre « vide » et « repris ».
  const [restored] = useState(readDraft);
  const [draft, dispatch] = useReducer(draftReducer, restored);
  const written = useRef(draft);

  useEffect(() => {
    if (draft === written.current) {
      return;
    }

    written.current = draft;

    if (draft) {
      writeDraft(draft);
    } else {
      clearDraft();
    }
  }, [draft]);

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
