import { Image } from "expo-image";
import { Dumbbell } from "lucide-react-native";
import { View } from "react-native";
import { creerStyles, useCouleurs } from "../../lib/theme";

/**
 * L'image d'un exercice, en petit (D118) : elle donne sa couleur à la page sans
 * toucher à l'orange. Fond blanc (`fondImage`) : les médias sont détourés sur blanc.
 * Sans image, l'haltère.
 */
export function Vignette({ image, taille = 36 }: { image: string | null; taille?: number }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const cadre = { width: taille, height: taille };
  return image ? (
    <Image
      source={{ uri: image }}
      recyclingKey={image}
      style={[styles.vignette, cadre]}
      contentFit="cover"
      cachePolicy="disk"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View style={[styles.vignette, styles.sansImage, cadre]}>
      <Dumbbell size={taille / 2} color={couleurs.encreAttenuee} />
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  vignette: { borderRadius: 8, backgroundColor: couleurs.fondImage },
  sansImage: {
    backgroundColor: couleurs.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
}));
