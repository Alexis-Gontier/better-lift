import { useMemo } from "react";
import Model, { type Muscle } from "react-body-highlighter";

/** Nos groupes musculaires, traduits dans le vocabulaire de la silhouette. */
const MUSCLE_MAP: Record<string, Muscle[]> = {
  Pectoraux: ["chest"],
  "Haut des pectoraux": ["chest"],
  Épaules: ["front-deltoids", "back-deltoids"],
  Deltoïdes: ["front-deltoids", "back-deltoids"],
  "Deltoïdes postérieurs": ["back-deltoids"],
  Triceps: ["triceps"],
  Biceps: ["biceps"],
  "Avant-bras": ["forearm"],
  "Grand dorsal": ["upper-back"],
  "Haut du dos": ["upper-back", "trapezius"],
  Trapèzes: ["trapezius"],
  Rhomboïdes: ["upper-back"],
  Quadriceps: ["quadriceps"],
  "Ischio-jambiers": ["hamstring"],
  Adducteurs: ["adductor"],
  Fessiers: ["gluteal"],
  Mollets: ["calves", "left-soleus", "right-soleus"],
};

const toMuscles = (groups: string[]) => groups.flatMap((g) => MUSCLE_MAP[g] ?? []);

/** La silhouette reçoit des couleurs en attribut SVG : on lit les rôles du thème une fois. */
function themeColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

type Props = { primary: string[]; secondary?: string[] };

/** Silhouette avant / arrière : principal en foncé, secondaires en clair. */
export function BodyMap({ primary, secondary = [] }: Props) {
  const colors = useMemo(
    () => ({
      body: themeColor("--muted"),
      secondary: themeColor("--muted-foreground"),
      primary: themeColor("--foreground"),
    }),
    [],
  );
  // La fréquence d'un muscle choisit sa couleur : principal compté deux fois, secondaire une.
  const data = [
    { name: "secondaire", muscles: toMuscles(secondary) },
    { name: "principal", muscles: toMuscles(primary) },
    { name: "principal-bis", muscles: toMuscles(primary) },
  ];
  const props = {
    data,
    bodyColor: colors.body,
    highlightedColors: [colors.secondary, colors.primary],
    style: { width: "100%", maxWidth: "9rem" },
  };
  return (
    <div className="flex justify-center gap-4">
      <Model {...props} type="anterior" />
      <Model {...props} type="posterior" />
    </div>
  );
}
