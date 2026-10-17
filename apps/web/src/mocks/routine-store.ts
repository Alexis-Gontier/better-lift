import { FOLDERS, type MockRoutine, mockRoutines } from "./routines";
import { signal } from "./signal";

/**
 * Les routines modifiables du wireframe, en mémoire jusqu'au rechargement. Sans API, c'est ici
 * qu'un enregistrement atterrit : la liste, le détail et le fil d'Ariane le voient aussitôt.
 * Remplacé au branchement par TanStack Query.
 */
const routines = signal<MockRoutine[]>(mockRoutines);

export const useRoutines = routines.use;

export function useRoutine(id: string): MockRoutine | undefined {
  return useRoutines().find((r) => r.id === id);
}

/** Remplace la routine de même identifiant, ou l'ajoute en tête si elle est nouvelle. */
export function saveRoutine(routine: MockRoutine) {
  const all = routines.get();
  const known = all.some((r) => r.id === routine.id);
  routines.set(known ? all.map((r) => (r.id === routine.id ? routine : r)) : [routine, ...all]);
}

export function deleteRoutine(id: string) {
  routines.set(routines.get().filter((r) => r.id !== id));
}

/** Un identifiant qui ne heurte ni les routines de prod (« 1 », « 2 »…) ni les autres créées. */
export function newRoutineId(): string {
  return `new-${Date.now().toString(36)}`;
}

/** Le nom de la routine en cours de création : la ligne brouillon de la liste le suit (D238). */
const draftName = signal("");
export const setDraftName = draftName.set;
export const useDraftName = draftName.use;

/**
 * Les dossiers, dans leur ordre (D257). Une routine dont le dossier est vide, ou n'existe plus,
 * va dans « Sans dossier ».
 */
const folders = signal<readonly string[]>(FOLDERS);
export const useFolders = folders.use;

/** Le dossier à prendre pour la prochaine routine créée (« Nouvelle routine ici »). */
const nextFolder = signal<string | null>(null);
export const setNextRoutineFolder = nextFolder.set;
export const peekNextRoutineFolder = nextFolder.get;

/** Le dossier dont le nom est en cours de saisie (juste créé, ou « Renommer »). */
const renaming = signal<string | null>(null);
export const useRenamingFolder = renaming.use;
export const setRenamingFolder = renaming.set;

export function addFolder(): string {
  const name = uniqueFolderName("Nouveau dossier", folders.get());
  folders.set([...folders.get(), name]);
  renaming.set(name);
  return name;
}

export function renameFolder(from: string, to: string) {
  const name = to.trim();
  renaming.set(null);
  if (!name || name === from || folders.get().includes(name)) return;
  folders.set(folders.get().map((f) => (f === from ? name : f)));
  routines.set(routines.get().map((r) => (r.folder === from ? { ...r, folder: name } : r)));
}

/** Supprime le dossier ; ses routines passent dans « Sans dossier ». Rend de quoi annuler. */
export function deleteFolder(name: string): () => void {
  const before = { folders: folders.get(), routines: routines.get() };
  folders.set(before.folders.filter((f) => f !== name));
  routines.set(before.routines.map((r) => (r.folder === name ? { ...r, folder: "" } : r)));
  return () => {
    folders.set(before.folders);
    routines.set(before.routines);
  };
}

/** Range la routine dans un autre dossier, à la fin de celui-ci. */
export function moveRoutine(id: string, folder: string) {
  const all = routines.get();
  const routine = all.find((r) => r.id === id);
  if (!routine || routine.folder === folder) return;
  routines.set([...all.filter((r) => r.id !== id), { ...routine, folder }]);
}

/** « Nouveau dossier », « Nouveau dossier 2 »… : un nom qui n'est pas pris. */
export function uniqueFolderName(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

/**
 * Les routines rangées par dossier, dans l'ordre des dossiers puis de la liste ; « Sans
 * dossier » (clé vide) vient en dernier, et seulement s'il a des routines.
 */
export function groupByFolder<T extends { folder: string }>(
  items: readonly T[],
  folderNames: readonly string[],
): { folder: string; items: T[] }[] {
  const groups = folderNames.map((folder) => ({
    folder,
    items: items.filter((r) => r.folder === folder),
  }));
  const loose = items.filter((r) => !folderNames.includes(r.folder));
  return loose.length > 0 ? [...groups, { folder: "", items: loose }] : groups;
}
