import { formatJour, type HistoriqueExercice } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { CIBLE, creerStyles, espace, taille } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";
import { formaterSerie } from "../ui/badge-record";
import { Section } from "../ui/section";

/** Les séances où l'exercice a été fait, ses séries faites en une ligne (D124). */
export function HistoriqueSeances({ seances }: { seances: HistoriqueExercice }) {
  const styles = useStyles();
  const router = useRouter();
  if (seances.length === 0) return null;
  return (
    <View>
      <Section titre="Historique" />
      {seances.map((s, i) => {
        const faites = s.series.filter((x) => x.faite && x.type !== "ECHAUFFEMENT");
        return (
          <Appuyable
            key={`${s.id}-${i}`}
            onPress={() => router.push(`/historique/${s.id}`)}
            style={({ pressed }) => [styles.ligne, pressed && styles.appuyee]}
            accessibilityRole="link"
            accessibilityHint="Ouvre la séance"
          >
            <View style={styles.tete}>
              <Text style={styles.jour}>{formatJour(s.debut, FUSEAU)}</Text>
              <Text style={styles.nom} numberOfLines={1}>
                {s.nom}
              </Text>
            </View>
            <Text style={styles.series}>
              {faites.length > 0
                ? faites.map((x) => formaterSerie(x.chargeKg, x.reps)).join(" · ")
                : "Aucune série faite"}
            </Text>
          </Appuyable>
        );
      })}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: {
    minHeight: CIBLE,
    gap: 2,
    paddingVertical: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  appuyee: { backgroundColor: couleurs.surface2 },
  tete: { flexDirection: "row", gap: espace.s, alignItems: "baseline" },
  jour: { color: couleurs.encre, fontSize: taille.petit + 1, fontWeight: "700" },
  nom: { flex: 1, color: couleurs.encreTertiaire, fontSize: taille.petit },
  series: {
    color: couleurs.encreSecondaire,
    fontSize: taille.petit + 1,
    fontVariant: ["tabular-nums"],
  },
}));
