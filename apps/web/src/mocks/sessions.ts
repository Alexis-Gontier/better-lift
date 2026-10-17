import { doneRecords, doneVolume, sessionDetail } from "./history";
import { realWorkouts } from "./workouts";

export type MockSession = {
  id: string;
  date: string;
  routine: string;
  minutes: number;
  volume: number;
  records: number;
};

/**
 * Les séances réelles, la plus récente d'abord. Volume et records se déduisent des séries
 * faites : liste, détail et Accueil disent le même chiffre.
 */
export const mockSessions: MockSession[] = realWorkouts.map((w) => {
  const session: MockSession = {
    id: w.id,
    date: w.date,
    routine: w.routine,
    minutes: w.minutes,
    volume: 0,
    records: 0,
  };
  const detail = sessionDetail(session);
  session.volume = doneVolume(detail);
  session.records = doneRecords(detail);
  return session;
});
