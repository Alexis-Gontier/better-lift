import { type WorkoutDraft } from "./draft";
import { getString, isPersisted, remove, setString } from "./storage";

/**
 * Persistance du brouillon de séance.
 *
 * Un seul brouillon à la fois : on ne fait pas deux séances en parallèle, et
 * une clé unique rend la reprise au démarrage triviale. Les garanties du
 * magasin — écriture synchrone, ouverture paresseuse, repli en mémoire — vivent
 * dans `storage.ts`.
 */

const DRAFT_KEY = "draft/active";

/** `false` sur un environnement sans MMKV : le brouillon ne survit pas à l'app. */
export function isDraftPersisted(): boolean {
  return isPersisted();
}

/**
 * La forme sérialisée, telle qu'elle est sur le disque.
 *
 * Elle sert à répondre à une seule question : « le brouillon a-t-il changé
 * depuis ma dernière écriture ? » Comparer deux chaînes évite d'avoir à
 * inventer un numéro de révision, qu'il faudrait alors incrémenter partout.
 */
export function readDraftRaw(): string | null {
  return getString(DRAFT_KEY);
}

export function readDraft(): WorkoutDraft | null {
  const raw = readDraftRaw();

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    // Un brouillon illisible — écrit par une version antérieure du format —
    // est jeté plutôt que de faire échouer le démarrage de l'app. On perd un
    // brouillon, jamais l'accès à l'application.
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Renvoie la forme écrite, que l'appelant compare ensuite à celle du disque. */
export function writeDraft(draft: WorkoutDraft): string {
  const serialized = JSON.stringify(draft);

  setString(DRAFT_KEY, serialized);

  return serialized;
}

export function clearDraft(): void {
  remove(DRAFT_KEY);
}

/**
 * Contrôle de forme minimal, pas une validation de schéma.
 *
 * Le brouillon n'a jamais traversé le réseau : il vient de cette app, sur ce
 * téléphone. Ce qu'on vérifie ici n'est pas une entrée hostile mais un
 * changement de format entre deux versions installées.
 */
function isDraft(value: unknown): value is WorkoutDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<WorkoutDraft>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.startedAt === "string" &&
    Array.isArray(candidate.exercises)
  );
}
