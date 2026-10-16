import { seeded } from "./random";
import { addDays } from "./stats";
import { TODAY } from "./today";

export type MockSession = {
  id: string;
  date: string;
  routine: string;
  minutes: number;
  volume: number;
  records: number;
};

const ROUTINES = ["Push A", "Pull A", "Jambes A", "Push B", "Pull B", "Haut du corps"];

/** ~3,5 séances par semaine sur l'année écoulée, la plus récente d'abord. */
function generate(): MockSession[] {
  const rand = seeded(42);
  const sessions: MockSession[] = [];
  let routine = 0;
  for (let day = 364; day >= 0; day--) {
    // Une coupure de deux semaines en été, pour que la régularité ait des trous.
    if (day > 75 && day < 90) continue;
    if (rand() > 0.5) continue;
    const name = ROUTINES[routine % ROUTINES.length] ?? "Push A";
    routine += 1;
    sessions.push({
      id: String(1000 - day),
      date: addDays(TODAY, -day),
      routine: name,
      minutes: Math.round(50 + rand() * 40),
      volume: Math.round((7000 + rand() * 6000 + (365 - day) * 8) / 10) * 10,
      records: rand() > 0.8 ? Math.ceil(rand() * 3) : 0,
    });
  }
  return sessions.reverse();
}

export const mockSessions: MockSession[] = generate();
