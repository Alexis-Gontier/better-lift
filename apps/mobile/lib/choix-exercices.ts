/**
 * Le canal entre l'écran d'édition et la modale de choix d'exercices.
 *
 * La modale est un écran à part : elle ne peut pas rendre sa sélection par une
 * valeur de retour, et la faire passer par les paramètres d'URL sérialiserait
 * une liste d'objets. L'écran d'édition dépose donc un rappel ici avant
 * d'ouvrir la modale, qui l'appelle en se fermant.
 */
export type ExerciceChoisi = { slug: string; nom: string; image: string | null };

let rappel: ((choix: ExerciceChoisi[]) => void) | null = null;

export function attendreChoix(surChoix: (choix: ExerciceChoisi[]) => void) {
  rappel = surChoix;
}

export function rendreChoix(choix: ExerciceChoisi[]) {
  rappel?.(choix);
  rappel = null;
}
