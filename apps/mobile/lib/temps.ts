import { useEffect, useState } from "react";

/**
 * L'heure courante, rafraîchie chaque seconde. Elle ne COMPTE rien : chrono et
 * repos se calculent en la comparant à des heures stockées. Après une mise en
 * veille, la première valeur est donc déjà juste.
 */
export function useMaintenant(): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return maintenant;
}

/** « 3:24 », « 1:02:05 ». */
export function formaterDuree(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Les repos proposés en séance (D91), en secondes ; `null` le désactive. */
export const CHOIX_REPOS = [null, 30, 45, 60, 90, 120, 150, 180, 240, 300] as const;

/** « désactivé », « 45 s », « 1 min », « 1 min 30 ». */
export function libelleRepos(sec: number | null): string {
  if (!sec) return "désactivé";
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, "0")}`;
}

/** Un identifiant de séance, généré ici (D56) : il rend l'envoi rejouable. */
export function nouvelId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** La durée d'une séance en minutes, arrondie : on lit « 62 min », pas « 61,7 ». */
export const dureeMin = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60000);

/** « 48 min », « 1 h 02 ». */
export function libelleMinutes(min: number): string {
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
}
