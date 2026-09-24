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

/** Un identifiant de séance, généré ici (D56) : il rend l'envoi rejouable. */
export function nouvelId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** La durée d'une séance en minutes, arrondie : on lit « 62 min », pas « 61,7 ». */
export const dureeMin = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60000);
