import { LIBELLE_ZONE, zonesTravaillees } from "@better-lift/shared";
import { useState } from "react";
import { type LayoutChangeEvent, Text, View } from "react-native";
import Body, { type ExtendedBodyPart, type Slug } from "react-native-body-highlighter";
import { creerStyles, espace, taille, useCouleurs } from "../../lib/theme";

// Le dessin de la bibliothèque mesure 200 × 400 à l'échelle 1.
const LARGEUR_DESSIN = 200;

// Toutes les parties du dessin. La bibliothèque peint chacune d'une couleur
// codée en dur (#3f3f3f), qui l'emporte sur `defaultFill` : sans les repeindre
// une à une, le corps resterait sombre sur le thème clair.
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
  /** Le titre de la carte : la période, quand elle n'est pas celle d'une routine. */
  titre?: string;
};

/**
 * « Muscles travaillés » (D83), face et dos, en vert comme sur opengym (D84,
 * révisée à la demande de l'utilisateur) : principal en lime plein, secondaire
 * en lime atténué, le reste du corps en surface.
 */
export function CarteMuscles({ exercices, titre = "Muscles travaillés" }: Props) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const [largeur, setLargeur] = useState(0);
  const zones = zonesTravaillees(exercices);
  // `intensity` indexe `colors` : 1 → secondaire, 2 → principal.
  const donnees: ExtendedBodyPart[] = [
    // La bibliothèque peint la tête en clair : sur fond sombre, elle attirerait
    // l'œil avant les muscles. On la rend au ton du corps.
    { slug: "head", styles: { fill: couleurs.ligneForte } },
    { slug: "hair", styles: { fill: couleurs.surface3 } },
    // Une partie travaillée prend sa couleur par `intensity` ; un `styles.fill`
    // passerait devant, d'où les deux cas.
    ...PARTIES.map((slug): ExtendedBodyPart => {
      const z = zones.find((x) => x.zone === slug);
      return z
        ? { slug, intensity: z.niveau === "principal" ? 2 : 1 }
        : { slug, styles: { fill: couleurs.surface3 } };
    }),
  ];
  // Deux silhouettes côte à côte dans la largeur disponible, sans dépasser
  // l'échelle où la carte mangerait tout l'écran.
  const echelle = largeur > 0 ? Math.min(0.8, (largeur - espace.m) / 2 / LARGEUR_DESSIN) : 0;

  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>{titre}</Text>
      <View
        style={styles.corps}
        onLayout={(e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`Muscles travaillés : ${zones.map((z) => LIBELLE_ZONE[z.zone]).join(", ") || "aucun"}`}
      >
        {echelle > 0
          ? (["front", "back"] as const).map((side) => (
              <Body
                key={side}
                side={side}
                data={donnees}
                scale={echelle}
                colors={[couleurs.corpsSecondaire, couleurs.corps]}
                defaultFill={couleurs.surface3}
                border="none"
              />
            ))
          : null}
      </View>
      {zones.length > 0 ? (
        <View style={styles.pastilles}>
          {zones.map((z) => (
            <View key={z.zone} style={styles.pastille}>
              <Text
                style={[
                  styles.pastilleTexte,
                  z.niveau === "secondaire" && { color: couleurs.encreTertiaire },
                ]}
              >
                {LIBELLE_ZONE[z.zone]}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.vide}>Ajoute des exercices pour voir les muscles travaillés.</Text>
      )}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
    padding: espace.l,
    gap: espace.m,
  },
  titre: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1, fontWeight: "600" },
  corps: { flexDirection: "row", justifyContent: "space-evenly" },
  pastilles: { flexDirection: "row", flexWrap: "wrap", gap: espace.s },
  pastille: {
    paddingHorizontal: espace.m,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: couleurs.surface3,
  },
  pastilleTexte: { color: couleurs.encre, fontSize: taille.petit, fontWeight: "600" },
  vide: { color: couleurs.encreAttenuee, fontSize: taille.petit },
}));
