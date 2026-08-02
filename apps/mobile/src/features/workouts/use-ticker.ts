import { useEffect, useState } from "react";

/**
 * Horloge de rendu : renvoie l'instant courant, rafraîchi chaque seconde.
 *
 * Le point à ne pas rater (doc 06) : **rien n'est incrémenté**. Le chrono de
 * séance et le minuteur de repos se calculent tous deux par différence avec cet
 * instant, et non en ajoutant une seconde à un compteur. Un compteur
 * incrémental dérive dès que l'app passe en arrière-plan — le système suspend
 * les minuteurs, l'utilisateur revient dix minutes plus tard, et le chrono
 * affiche dix minutes de moins que la réalité.
 *
 * `active` coupe le rendu quand il n'y a rien à afficher : sans séance en
 * cours, une horloge qui bat chaque seconde ne fait que réveiller React.
 */
export function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }

    // Remis à l'heure au montage : entre deux activations, l'état gardait la
    // valeur du dernier battement.
    setNow(Date.now());

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [active]);

  return now;
}

/** « 42:18 », ou « 1:04:22 » au-delà de l'heure. */
export function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, "0");

  if (minutes < 60) {
    return `${minutes}:${rest}`;
  }

  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${rest}`;
}
