import { LIBELLE_ZONE, zonesTravaillees } from "@better-lift/shared";
import { useState } from "react";
import { View } from "react-native";
import Body, { type ExtendedBodyPart, type Slug } from "react-native-body-highlighter";
import { useCSSVariable } from "uniwind";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

// Le dessin de la bibliothèque mesure 200 × 400 à l'échelle 1.
const LARGEUR_DESSIN = 200;
const ECART = 16;

// Toutes les parties du dessin. La bibliothèque peint chacune d'une couleur codée en dur, qui
// l'emporte sur `defaultFill` : sans les repeindre une à une, le corps resterait sombre en clair.
const PARTIES: readonly Slug[] = [
  "abs",
  "adductors",
  "ankles",
  "biceps",
  "calves",
  "chest",
  "deltoids",
  "feet",
  "forearm",
  "gluteal",
  "hamstring",
  "hands",
  "knees",
  "lower-back",
  "neck",
  "obliques",
  "quadriceps",
  "tibialis",
  "trapezius",
  "triceps",
  "upper-back",
];

type Props = {
  exercices: readonly { musclePrincipal: string; musclesSecondaires: readonly string[] }[];
};

/**
 * Les muscles qu'une routine travaille (D83, D321), face et dos, comme la carte d'opengym : les
 * principaux à l'encre, les secondaires en gris, le reste du corps au ton des filets. Le dessin
 * attend des couleurs en valeur : les tokens se lisent par `useCSSVariable`.
 */
export function CarteMuscles({ exercices }: Props) {
  const [largeur, setLargeur] = useState(0);
  const encre = useCSSVariable("--color-foreground") as string;
  const gris = useCSSVariable("--color-ring") as string;
  const corps = useCSSVariable("--color-border") as string;
  const zones = zonesTravaillees(exercices);
  if (zones.length === 0) return null;

  // `intensity` indexe `colors` : 1 → secondaire, 2 → principal. Un `styles.fill` passerait
  // devant `intensity`, d'où les deux cas.
  const donnees: ExtendedBodyPart[] = [
    { slug: "head", styles: { fill: corps } },
    { slug: "hair", styles: { fill: corps } },
    ...PARTIES.map((slug): ExtendedBodyPart => {
      const z = zones.find((x) => x.zone === slug);
      return z
        ? { slug, intensity: z.niveau === "principal" ? 2 : 1 }
        : { slug, styles: { fill: corps } };
    }),
  ];
  // Deux silhouettes côte à côte, sans dépasser l'échelle où la carte mangerait l'écran.
  const echelle = largeur > 0 ? Math.min(0.6, (largeur - ECART) / 2 / LARGEUR_DESSIN) : 0;

  return (
    <View className="gap-3 rounded-lg border border-border p-4">
      <Text className="font-medium" accessibilityRole="header">
        Muscles travaillés
      </Text>
      <View
        className="flex-row justify-center gap-4"
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`Muscles travaillés : ${zones.map((z) => LIBELLE_ZONE[z.zone]).join(", ")}`}
      >
        {echelle > 0
          ? (["front", "back"] as const).map((side) => (
              <Body
                key={side}
                side={side}
                data={donnees}
                scale={echelle}
                colors={[gris, encre]}
                defaultFill={corps}
                border="none"
              />
            ))
          : null}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {zones.map((z) => (
          <View key={z.zone} className="rounded-full bg-secondary px-3 py-1">
            <Text
              className={cn(
                "text-sm",
                z.niveau === "principal" ? "font-medium" : "text-muted-foreground",
              )}
            >
              {LIBELLE_ZONE[z.zone]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
