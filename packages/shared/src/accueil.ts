/**
 * La routine qui vient ensuite, pour l'accueil (D110, D316). Pure et sans
 * plateforme.
 */

/**
 * La routine « À suivre » : celle qui suit, dans l'ordre de la liste, la
 * dernière routine faite ; la première après la dernière, ou sans historique.
 * Les séances vides et les routines supprimées depuis ne comptent pas.
 */
export function routineASuivre<R extends { id: string }>(
  routines: readonly R[],
  seances: readonly { routineId: string | null; debut: string }[],
): R | null {
  if (routines.length === 0) return null;
  const derniere = [...seances]
    .filter((s) => s.routineId !== null && routines.some((r) => r.id === s.routineId))
    .sort((a, b) => Date.parse(b.debut) - Date.parse(a.debut))[0];
  if (!derniere) return routines[0] ?? null;
  const i = routines.findIndex((r) => r.id === derniere.routineId);
  return routines[(i + 1) % routines.length] ?? null;
}
