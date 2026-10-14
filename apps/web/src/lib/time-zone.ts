/**
 * Le fuseau où se découpent les jours — l'UNIQUE endroit où il est fixé (D66).
 *
 * Jamais UTC : le samedi 21 h à Paris est déjà dimanche en UTC. Aucun profil
 * n'existe encore ; le jour où il arrive, cette constante devient sa lecture.
 */
export const TIME_ZONE = "Europe/Paris";
