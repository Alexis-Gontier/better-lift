import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSyncExternalStore } from "react";

/**
 * Les vibrations (D113) : on vibre pour CONFIRMER une action faite sans
 * regarder l'écran, jamais pour décorer ni pour la navigation. Un seul endroit
 * les déclenche, et le réglage « Vibrations » du Profil les coupe toutes.
 *
 * Le réglage est gardé sur le téléphone, pas sur le compte : c'est une affaire
 * d'appareil (un téléphone posé sur un banc métallique résonne).
 */
const CLE = "better-lift:vibrations";

// Actives tant que le disque n'a pas répondu : c'est le réglage par défaut.
let actives = true;
const abonnes = new Set<() => void>();

function changer(valeur: boolean) {
  actives = valeur;
  for (const rappel of abonnes) rappel();
}

// Lu une fois au chargement du module ; une erreur de lecture garde le défaut.
void AsyncStorage.getItem(CLE)
  .then((brut) => {
    if (brut === "non") changer(false);
  })
  .catch(() => {});

/** Le réglage et son interrupteur, pour l'écran Profil. */
export function useVibrations(): [boolean, (valeur: boolean) => void] {
  const valeur = useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    () => actives,
  );
  const regler = (v: boolean) => {
    changer(v);
    void AsyncStorage.setItem(CLE, v ? "oui" : "non").catch(() => {});
    // Ce qu'on vient d'activer se sent tout de suite.
    if (v) vibrer.selection();
  };
  return [valeur, regler];
}

const si = (vibration: () => Promise<void>) => () => {
  if (actives) void vibration();
};

export const vibrer = {
  /** Une série validée. */
  valider: si(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** « Précédent » recopié, repos −15 / +15. */
  selection: si(() => Haptics.selectionAsync()),
  /** Le repos est terminé. */
  finRepos: si(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
