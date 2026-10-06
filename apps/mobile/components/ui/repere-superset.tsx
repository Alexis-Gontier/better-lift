import type { GroupeSuperset } from "@better-lift/shared";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { creerStyles, espace, taille } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Le repère d'un superset (D151) : une barre de 3 px à gauche de chaque membre,
 * qui court sur toute la hauteur de la ligne — marge du bas comprise, d'où un
 * filet continu d'un membre à l'autre —, et l'étiquette « SUPERSET A » au-dessus
 * du premier. Sur le dernier, la barre s'arrête avant sa marge (`marge`).
 */
export function RepereSuperset({
  groupe,
  index,
  marge = 0,
  ecart = 0,
  onEtiquette,
  children,
}: {
  groupe: GroupeSuperset | null;
  index: number;
  /** La marge du bas des éléments enveloppés : le filet s'arrête avant, au dernier. */
  marge?: number;
  /** L'espace laissé ENTRE les éléments par leur conteneur (`gap`) : le filet le franchit. */
  ecart?: number;
  /** Absent : l'étiquette n'est qu'un repère (page d'une routine, historique). */
  onEtiquette?: () => void;
  children: ReactNode;
}) {
  const styles = useStyles();
  if (!groupe) return <>{children}</>;
  const premier = index === groupe.debut;
  const dernier = index === groupe.fin;
  const etiquette = <Text style={styles.etiquette}>Superset {groupe.lettre}</Text>;
  return (
    <View style={styles.ligne}>
      <View
        style={[
          styles.barre,
          premier && styles.debut,
          dernier ? [styles.fin, { marginBottom: marge }] : { marginBottom: -ecart },
        ]}
      />
      <View style={styles.contenu}>
        {premier ? (
          onEtiquette ? (
            <Appuyable
              onPress={onEtiquette}
              hitSlop={8}
              style={styles.cible}
              accessibilityRole="button"
              accessibilityLabel={`Superset ${groupe.lettre}, options`}
            >
              {etiquette}
            </Appuyable>
          ) : (
            <View style={styles.cible}>{etiquette}</View>
          )
        ) : null}
        {children}
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: { flexDirection: "row", gap: espace.s },
  barre: { width: 3, backgroundColor: couleurs.superset },
  debut: { borderTopLeftRadius: 2, borderTopRightRadius: 2, marginTop: espace.s },
  fin: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  contenu: { flex: 1, minWidth: 0 },
  cible: {
    minHeight: 32,
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingRight: espace.m,
  },
  etiquette: {
    color: couleurs.superset,
    fontSize: taille.petit,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
}));
