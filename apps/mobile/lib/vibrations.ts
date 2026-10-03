import * as Haptics from "expo-haptics";

/**
 * Les vibrations (D113) : on vibre pour CONFIRMER une action faite sans
 * regarder l'écran, jamais pour décorer ni pour la navigation. Un seul endroit
 * les déclenche : le réglage « Vibrations » du Profil s'y branchera.
 */
export const vibrer = {
  /** Une série validée. */
  valider: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** « Précédent » recopié, repos −15 / +15. */
  selection: () => void Haptics.selectionAsync(),
  /** Le repos est terminé. */
  finRepos: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};
