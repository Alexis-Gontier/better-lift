import { useSyncExternalStore } from "react";
import { doneVolume, type SessionDetail, sessionDetail } from "./history";
import { type MockSession, mockSessions } from "./sessions";

/** Ce qu'on corrige d'une séance passée (D239) : ses séries, sa note, sa durée. */
type Correction = Pick<SessionDetail, "exercises" | "notes"> & { minutes: number };

/**
 * La séance telle que corrigée : le volume se relit des séries. Les badges de record restent
 * ceux d'origine — dans l'application, ils seront dérivés à la lecture (`shared/records.ts`).
 */
export function withCorrection(session: MockSession, correction: Correction): SessionDetail {
  const detail: SessionDetail = {
    session: { ...session, minutes: correction.minutes },
    exercises: correction.exercises,
    ...(correction.notes ? { notes: correction.notes } : {}),
  };
  return { ...detail, session: { ...detail.session, volume: doneVolume(detail) } };
}

/** Les corrections et suppressions du wireframe, en mémoire jusqu'au rechargement. Remplacé par l'API. */
const corrections = new Map<string, Correction>();
const deleted = new Set<string>();
let sessions: MockSession[] = mockSessions;
const listeners = new Set<() => void>();

/** Relit la liste : sans les séances supprimées, avec la durée et le volume corrigés. */
function refresh() {
  sessions = mockSessions
    .filter((s) => !deleted.has(s.id))
    .map((s) => {
      const c = corrections.get(s.id);
      return c ? withCorrection(s, c).session : s;
    });
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Les séances, corrections comprises : la liste montre la durée et le volume corrigés. */
export const currentSessions = (): MockSession[] => sessions;

export function useSessions(): MockSession[] {
  return useSyncExternalStore(subscribe, currentSessions);
}

export function detailOf(session: MockSession): SessionDetail {
  const correction = corrections.get(session.id);
  // `session` vient déjà de la liste corrigée : on ne repart que de ses séries.
  return correction ? withCorrection(session, correction) : sessionDetail(session);
}

export function saveSession(detail: SessionDetail) {
  const { session, exercises, notes } = detail;
  corrections.set(session.id, { exercises, notes, minutes: session.minutes });
  refresh();
}

/** Retire la séance de la liste. Rend de quoi annuler. */
export function deleteSession(id: string): () => void {
  deleted.add(id);
  refresh();
  return () => {
    deleted.delete(id);
    refresh();
  };
}
