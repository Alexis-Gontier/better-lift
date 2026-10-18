import { useCallback, useState } from "react";

/**
 * L'historique d'un brouillon, pour annuler et rétablir pas à pas (D261). Des changements qui se
 * suivent de près (une saisie, des clics répétés sur « + ») ne font qu'un pas.
 */
export type History<T> = { past: T[]; present: T; future: T[]; at: number };

/** En dessous de cet écart, un changement rejoint le pas précédent. */
export const MERGE_MS = 800;

export const startHistory = <T>(present: T): History<T> => ({
  past: [],
  present,
  future: [],
  at: Number.NEGATIVE_INFINITY,
});

export function record<T>(h: History<T>, next: T, now: number): History<T> {
  if (Object.is(next, h.present)) return h;
  // Le pas en cours continue : le présent change, le passé reste.
  if (now - h.at < MERGE_MS && h.past.length > 0)
    return { past: h.past, present: next, future: [], at: now };
  return { past: [...h.past, h.present], present: next, future: [], at: now };
}

export function undo<T>(h: History<T>): History<T> {
  const previous = h.past.at(-1);
  if (previous === undefined) return h;
  return {
    past: h.past.slice(0, -1),
    present: previous,
    future: [h.present, ...h.future],
    at: Number.NEGATIVE_INFINITY,
  };
}

export function redo<T>(h: History<T>): History<T> {
  const [next, ...rest] = h.future;
  if (next === undefined) return h;
  return {
    past: [...h.past, h.present],
    present: next,
    future: rest,
    at: Number.NEGATIVE_INFINITY,
  };
}

/** Un brouillon avec son historique ; `set` reçoit une fonction, comme l'éditeur l'attend. */
export function useDraftHistory<T>(initial: () => T) {
  const [h, setH] = useState(() => startHistory(initial()));
  const set = useCallback(
    (update: T | ((current: T) => T)) =>
      setH((s) =>
        record(
          s,
          typeof update === "function" ? (update as (c: T) => T)(s.present) : update,
          Date.now(),
        ),
      ),
    [],
  );
  return {
    draft: h.present,
    set,
    undo: useCallback(() => setH(undo), []),
    redo: useCallback(() => setH(redo), []),
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    /** Repart d'un historique neuf (après un enregistrement). */
    reset: useCallback((present: T) => setH(startHistory(present)), []),
  };
}
