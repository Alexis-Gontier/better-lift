import { formaterCharge } from "./charge.js";
import { type RoutineDetail, type RoutineSaisie, routineSaisie } from "./routines.js";
import type { SeanceEnCours } from "./seance.js";
import { groupes, normaliserGroupes } from "./supersets.js";
import type { UnitSystem } from "./units.js";

/**
 * Mettre à jour la routine avec la séance du jour (D347), comme Hevy à la fin.
 *
 * La routine reprend la STRUCTURE de la séance — exercices, ordre, séries, types,
 * repos, supersets — et les VALEURS des séries faites. Une série non cochée garde
 * la cible de la routine : une série sautée par fatigue ne disparaît pas, une
 * charge tapée puis abandonnée ne devient pas la cible.
 */

type Exo = RoutineSaisie["exercices"][number];
type Serie = Exo["series"][number];

const depuisRoutine = (r: RoutineDetail): Exo[] =>
  normaliserGroupes(
    r.exercices.map((e) => ({
      slug: e.slug,
      reposSec: e.reposSec,
      supersetGroupe: e.supersetGroupe ?? null,
      series: e.series.map(({ type, repsCible, chargeCibleKg }) => ({
        type,
        repsCible,
        chargeCibleKg,
      })),
    })),
  );

/** « bench+curl|dips+… » : les supersets par leurs exercices, pas par leurs numéros. */
const formeSupersets = (liste: readonly Exo[]) =>
  groupes(liste)
    .map((g) =>
      liste
        .slice(g.debut, g.fin + 1)
        .map((e) => e.slug)
        .join("+"),
    )
    .join("|");

/** Le plus grand d'un champ, hors échauffement ; `null` si aucune série n'en porte. */
function maximum(series: readonly Serie[], champ: "repsCible" | "chargeCibleKg") {
  const valeurs = series
    .filter((s) => s.type !== "ECHAUFFEMENT")
    .map((s) => s[champ])
    .filter((v): v is number => v !== null);
  return valeurs.length > 0 ? Math.max(...valeurs) : null;
}

/** « 60 kg → 62,5 kg », ou le seul nom du champ quand le maximum n'a pas bougé. */
function ecart(
  avant: readonly Serie[],
  apres: readonly Serie[],
  champ: "repsCible" | "chargeCibleKg",
  texte: (a: number | null, b: number | null) => string,
  nom: string,
): string | null {
  const a = maximum(avant, champ);
  const b = maximum(apres, champ);
  if (a !== b) return texte(a, b);
  return avant.some((s, i) => apres[i] && apres[i][champ] !== s[champ]) ? nom : null;
}

/** Ce qui change d'un exercice gardé, en une ligne ; `null` s'il n'a pas changé. */
function changementExercice(nom: string, avant: Exo, apres: Exo, systeme: UnitSystem) {
  const parties = [
    avant.series.length !== apres.series.length
      ? `${avant.series.length} → ${apres.series.length} séries`
      : null,
    ecart(
      avant.series,
      apres.series,
      "chargeCibleKg",
      (a, b) => `${charge(a, systeme)} → ${charge(b, systeme)}`,
      "charges",
    ),
    ecart(
      avant.series,
      apres.series,
      "repsCible",
      (a, b) => `${a ?? "—"} → ${b ?? "—"} rép.`,
      "répétitions",
    ),
    avant.series.some((s, i) => apres.series[i] && apres.series[i].type !== s.type)
      ? "types de série"
      : null,
    avant.reposSec !== apres.reposSec ? "repos" : null,
  ].filter((p): p is string => p !== null);
  return parties.length > 0 ? `${nom} : ${parties.join(", ")}` : null;
}

const charge = (v: number | null, systeme: UnitSystem) =>
  v === null ? "sans charge" : formaterCharge(v, systeme);

/**
 * La routine mise à jour et la liste des changements, ou `null` quand la séance a
 * suivi la routine — ou qu'elle donnerait une routine que l'API refuserait.
 * Le nom reste ; la note et le dossier ne partent pas, l'API les garde (D298).
 */
export function majRoutine(
  routine: RoutineDetail,
  seance: SeanceEnCours,
  systeme: UnitSystem,
): { saisie: RoutineSaisie; changements: string[] } | null {
  const avant = depuisRoutine(routine);
  // Un exercice sans série serait refusé : il reste hors de la routine.
  const gardes = normaliserGroupes(seance.exercices.filter((e) => e.series.length > 0));
  // Chaque exercice de la séance retrouve, par son slug, le premier exercice de
  // la routine pas encore pris : un exercice présent deux fois garde ses deux places.
  const pris: number[] = [];
  const correspondance = gardes.map((e) => {
    const i = avant.findIndex((x, k) => x.slug === e.slug && !pris.includes(k));
    if (i >= 0) pris.push(i);
    return i;
  });

  const apres: Exo[] = gardes.map((e, k) => {
    const ancien = avant[correspondance[k] ?? -1];
    return {
      slug: e.slug,
      reposSec: e.reposSec,
      supersetGroupe: e.supersetGroupe ?? null,
      series: e.series.map((x, i): Serie => {
        if (x.faite) return { type: x.type, repsCible: x.reps, chargeCibleKg: x.chargeKg };
        const cible = ancien?.series[i];
        return cible
          ? { ...cible, type: x.type }
          : { type: x.type, repsCible: x.reps, chargeCibleKg: x.chargeKg };
      }),
    };
  });

  if (JSON.stringify(apres) === JSON.stringify(avant)) return null;
  const saisie: RoutineSaisie = { nom: routine.nom, exercices: apres };
  if (!routineSaisie.safeParse(saisie).success) return null;

  const changements = [
    ...routine.exercices.filter((_, i) => !pris.includes(i)).map((e) => `− ${e.nom}`),
    ...gardes.filter((_, k) => correspondance[k] === -1).map((e) => `+ ${e.nom}`),
  ];
  const ordre = correspondance.filter((i) => i >= 0);
  if (ordre.some((i, k) => k > 0 && i < (ordre[k - 1] ?? 0)))
    changements.push("Ordre des exercices");
  if (formeSupersets(avant) !== formeSupersets(apres)) changements.push("Supersets");
  gardes.forEach((e, k) => {
    const ancien = avant[correspondance[k] ?? -1];
    const nouveau = apres[k];
    if (!ancien || !nouveau) return;
    const ligne = changementExercice(e.nom, ancien, nouveau, systeme);
    if (ligne) changements.push(ligne);
  });
  return { saisie, changements };
}
