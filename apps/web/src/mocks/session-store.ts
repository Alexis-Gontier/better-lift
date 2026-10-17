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

/** Les corrections du wireframe, en mémoire jusqu'au rechargement. Remplacé par l'API. */
const corrections = new Map<string, Correction>();
let sessions: MockSession[] = mockSessions;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Les séances, corrections comprises : la liste montre la durée et le volume corrigés. */
export function useSessions(): MockSession[] {
  return useSyncExternalStore(subscribe, () => sessions);
}

export function detailOf(session: MockSession): SessionDetail {
  const correction = corrections.get(session.id);
  // `session` vient déjà de la liste corrigée : on ne repart que de ses séries.
  return correction ? withCorrection(session, correction) : sessionDetail(session);
}

export function saveSession(detail: SessionDetail) {
  const { session, exercises, notes } = detail;
  corrections.set(session.id, { exercises, notes, minutes: session.minutes });
  sessions = mockSessions.map((s) => {
    const c = corrections.get(s.id);
    return c ? withCorrection(s, c).session : s;
  });
  for (const l of listeners) l();
}
