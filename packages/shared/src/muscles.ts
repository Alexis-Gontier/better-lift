/**
 * La carte des muscles (D83) : des noms de muscles du catalogue, en français,
 * aux zones du dessin du corps.
 *
 * Les identifiants de zone sont ceux de `react-native-body-highlighter` ; ils
 * restent de simples chaînes ici, `shared` n'important aucune bibliothèque
 * d'interface.
 */
export const ZONES = [
  "chest",
  "deltoids",
  "biceps",
  "triceps",
  "forearm",
  "abs",
  "obliques",
  "trapezius",
  "upper-back",
  "lower-back",
  "gluteal",
  "quadriceps",
  "hamstring",
  "adductors",
  "calves",
  "tibialis",
  "neck",
] as const;

export type Zone = (typeof ZONES)[number];

export const LIBELLE_ZONE: Record<Zone, string> = {
  chest: "Pectoraux",
  deltoids: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  forearm: "Avant-bras",
  abs: "Abdominaux",
  obliques: "Obliques",
  trapezius: "Trapèzes",
  "upper-back": "Haut du dos",
  "lower-back": "Bas du dos",
  gluteal: "Fessiers",
  quadriceps: "Quadriceps",
  hamstring: "Ischio-jambiers",
  adductors: "Adducteurs",
  calves: "Mollets",
  tibialis: "Tibias",
  neck: "Cou",
};

// Les noms tels que le catalogue les écrit (`target`, `secondary`). Un sous-muscle
// rejoint la zone qui le contient : le dessin ne descend pas plus finement.
const ZONE_DU_MUSCLE: Record<string, Zone> = {
  Pectoraux: "chest",
  "Haut des pectoraux": "chest",
  Épaules: "deltoids",
  Deltoïdes: "deltoids",
  "Deltoïdes postérieurs": "deltoids",
  "Coiffe des rotateurs": "deltoids",
  Biceps: "biceps",
  Brachial: "biceps",
  Triceps: "triceps",
  "Avant-bras": "forearm",
  Poignets: "forearm",
  "Extenseurs du poignet": "forearm",
  "Fléchisseurs du poignet": "forearm",
  "Muscles de la prise": "forearm",
  Abdominaux: "abs",
  Gainage: "abs",
  "Bas des abdominaux": "abs",
  Obliques: "obliques",
  "Dentelé antérieur": "obliques",
  Trapèzes: "trapezius",
  "Élévateur de la scapula": "trapezius",
  "Haut du dos": "upper-back",
  "Grand dorsal": "upper-back",
  Rhomboïdes: "upper-back",
  Dos: "upper-back",
  "Bas du dos": "lower-back",
  "Érecteurs du rachis": "lower-back",
  Fessiers: "gluteal",
  Abducteurs: "gluteal",
  Quadriceps: "quadriceps",
  "Ischio-jambiers": "hamstring",
  Adducteurs: "adductors",
  "Intérieur des cuisses": "adductors",
  Mollets: "calves",
  Soléaire: "calves",
  Tibias: "tibialis",
  "Sterno-cléido-mastoïdien": "neck",
};

/**
 * Les noms du catalogue que le dessin ne sait pas montrer. Ils sont ignorés
 * volontairement : le test vérifie que chaque nom du catalogue a une zone OU
 * figure ici, pour qu'un nom nouveau ne disparaisse pas en silence.
 */
export const MUSCLES_SANS_ZONE: readonly string[] = [
  "Système cardiovasculaire",
  "Fléchisseurs de hanche",
  "Chevilles",
  "Pieds",
  "Mains",
  "Stabilisateurs de la cheville",
];

export function zoneDuMuscle(nom: string): Zone | null {
  return ZONE_DU_MUSCLE[nom] ?? null;
}

export type NiveauZone = "principal" | "secondaire";

export type ZoneTravaillee = { zone: Zone; niveau: NiveauZone };

/**
 * Les zones qu'une routine travaille. Une zone principale pour un exercice
 * l'est pour la routine, même si un autre ne la sollicite qu'en secondaire.
 * Les principales viennent d'abord ; dans chaque niveau, la zone la plus
 * fréquente passe devant, et l'ordre d'apparition départage.
 */
export function zonesTravaillees(
  exercices: readonly { musclePrincipal: string; musclesSecondaires: readonly string[] }[],
): ZoneTravaillee[] {
  const principales = new Map<Zone, number>();
  const secondaires = new Map<Zone, number>();
  const compter = (m: Map<Zone, number>, z: Zone | null) => {
    if (z) m.set(z, (m.get(z) ?? 0) + 1);
  };

  for (const e of exercices) {
    compter(principales, zoneDuMuscle(e.musclePrincipal));
    for (const s of e.musclesSecondaires) compter(secondaires, zoneDuMuscle(s));
  }

  // `sort` est stable : à égalité, l'ordre d'insertion — celui d'apparition — tient.
  const classer = (m: Map<Zone, number>) => [...m].sort((a, b) => b[1] - a[1]).map(([z]) => z);

  return [
    ...classer(principales).map((zone) => ({ zone, niveau: "principal" as const })),
    ...classer(secondaires)
      .filter((z) => !principales.has(z))
      .map((zone) => ({ zone, niveau: "secondaire" as const })),
  ];
}
