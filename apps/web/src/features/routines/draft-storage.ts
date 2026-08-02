import { type RoutineDraft } from "./draft";

/**
 * Sauvegarde locale du brouillon d'édition (doc 05, « Protection contre la
 * perte »).
 *
 * L'éditeur n'envoie rien avant l'enregistrement : un onglet fermé par
 * inadvertance après vingt minutes de saisie perdrait tout. `localStorage`
 * suffit — la donnée est petite, propre à un poste, et n'a pas à survivre à un
 * changement de machine.
 *
 * Ce fichier ne touche pas au DOM au-delà de `localStorage` et reste testable
 * sans navigateur : toutes les fonctions échouent en silence si le stockage
 * est indisponible (navigation privée, quota plein, stockage désactivé), parce
 * qu'un brouillon non sauvegardé ne doit jamais empêcher d'éditer.
 */

const PREFIX = "better-lift:routine-draft:";

/** `new` pour une création, l'identifiant de la routine pour une édition. */
function draftStorageKey(routineId: string | null): string {
  return `${PREFIX}${routineId ?? "new"}`;
}

export function saveDraft(routineId: string | null, draft: RoutineDraft): void {
  try {
    localStorage.setItem(draftStorageKey(routineId), JSON.stringify(draft));
  } catch {
    // Stockage plein ou refusé : on continue sans filet plutôt que de casser
    // la saisie en cours.
  }
}

export function clearDraft(routineId: string | null): void {
  try {
    localStorage.removeItem(draftStorageKey(routineId));
  } catch {
    // Voir `saveDraft`.
  }
}

/**
 * Relit un brouillon stocké.
 *
 * La valeur vient du disque de l'utilisateur : elle a pu être écrite par une
 * version antérieure de l'application, ou éditée à la main. On vérifie donc sa
 * forme au lieu de la caster — un brouillon mal formé qui remplacerait l'écran
 * serait pire que pas de brouillon du tout.
 */
export function loadDraft(routineId: string | null): RoutineDraft | null {
  let raw: string | null;

  try {
    raw = localStorage.getItem(draftStorageKey(routineId));
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    return parseDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

function parseDraft(value: unknown): RoutineDraft | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<RoutineDraft>;

  if (typeof candidate.name !== "string" || !Array.isArray(candidate.exercises)) {
    return null;
  }

  return {
    name: candidate.name,
    folderId: typeof candidate.folderId === "string" ? candidate.folderId : null,
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
    exercises: candidate.exercises,
  };
}
