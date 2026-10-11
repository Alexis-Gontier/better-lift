import { Text, View } from "react-native";
import { CIBLE, creerStyles, rayon, taille } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Un sélecteur à segments (D121) : deux ou trois vues d'un même écran, chacune
 * avec toute la page. Le segment actif se distingue par la surface et la graisse,
 * pas par l'orange.
 */
export function Segments<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: readonly { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.piste} accessibilityRole="tablist">
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Appuyable
            key={o.valeur}
            onPress={() => onChange(o.valeur)}
            style={[styles.segment, actif && styles.actif]}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
          >
            <Text style={[styles.libelle, actif && styles.libelleActif]} numberOfLines={1}>
              {o.libelle}
            </Text>
          </Appuyable>
        );
      })}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  piste: {
    flexDirection: "row",
    padding: 3,
    gap: 3,
    borderRadius: rayon.cellule + 2,
    backgroundColor: couleurs.surface2,
  },
  segment: {
    flex: 1,
    minHeight: CIBLE - 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: rayon.cellule,
  },
  actif: { backgroundColor: couleurs.surface3 },
  libelle: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1, fontWeight: "600" },
  libelleActif: { color: couleurs.encre, fontWeight: "700" },
}));
