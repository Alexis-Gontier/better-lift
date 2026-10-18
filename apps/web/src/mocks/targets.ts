/**
 * La cible d'un exercice (D276) : la charge visée, tracée sur sa courbe, montrée sur sa carte
 * épinglée et dans le palmarès. Remplace les objectifs de force ; celui du poids vit dans Corps.
 */
const TARGETS: Record<string, number> = {
  "lever-chest-press": 90,
  "dumbbell-incline-bench-press": 32,
};

export const targetOf = (slug: string): number | undefined => TARGETS[slug];
