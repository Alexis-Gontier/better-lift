/**
 * Un superset resté seul n'en est pas un (invariant 4, doc 03).
 *
 * Un groupe doit compter au moins deux exercices, sinon il est ramené à `null`
 * à l'enregistrement. Le cas arrive tout seul : on crée un superset de deux
 * exercices dans l'éditeur, puis on en supprime un — le survivant garderait
 * sinon une marque de groupe invisible et fausse, que rien n'afficherait et que
 * personne ne penserait à nettoyer.
 *
 * La règle vit ici parce qu'elle vaut pour les routines **et** pour les
 * séances : elles portent le même champ, avec la même contrainte. La laisser
 * dans un service, c'était la réécrire à l'identique dans le second.
 */
export function normalizeSupersetGroups(
  groups: readonly (number | null | undefined)[],
): (number | null)[] {
  const counts = new Map<number, number>();

  for (const group of groups) {
    if (group !== null && group !== undefined) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }

  return groups.map((group) => {
    if (group === null || group === undefined) {
      return null;
    }

    return (counts.get(group) ?? 0) >= 2 ? group : null;
  });
}
