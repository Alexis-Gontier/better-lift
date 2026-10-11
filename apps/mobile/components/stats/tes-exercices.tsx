import {
  type ExerciceProgres,
  formaterCharge,
  formatJour,
  type Periode,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { optionsStatsExercices } from "../../lib/requetes";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { Appuyable } from "../ui/appuyable";
import { Section } from "../ui/section";
import { Vignette } from "../ui/vignette";

/** Assez pour un coup d'œil ; le reste se déplie (divulgation progressive). */
const VISIBLES = 6;

/** « 1RM 104 kg · +4 kg sur la période », « stable », ou la dernière fois sans 1RM. */
function resume(e: ExerciceProgres): string {
  if (e.unRm === null || e.unRmDebut === null) {
    return `Dernière fois ${formatJour(e.derniereFois, FUSEAU)}`;
  }
  const d = Math.round(e.unRm - e.unRmDebut);
  const tendance =
    d === 0
      ? "stable"
      : `${d > 0 ? "+" : "−"}${formaterCharge(Math.abs(d), SYSTEME_UNITES)} sur la période`;
  return `1RM ${formaterCharge(Math.round(e.unRm), SYSTEME_UNITES)} · ${tendance}`;
}

/**
 * « Tes exercices » (D173) : ceux que tu as faits sur la période, du plus récent
 * au plus ancien, chacun avec son 1RM estimé et son écart — la progression d'un
 * mouvement à un appui de sa fiche.
 */
export function TesExercices({ periode }: { periode: Periode }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const exercices = useQuery(optionsStatsExercices(periode));
  const [tous, setTous] = useState(false);
  if (!exercices.data) return null;
  const liste = tous ? exercices.data : exercices.data.slice(0, VISIBLES);

  return (
    <View style={styles.carte}>
      <Section titre="Tes exercices" />
      {exercices.data.length === 0 ? (
        <Text style={styles.vide}>Aucun exercice sur la période.</Text>
      ) : (
        liste.map((e) => (
          <Appuyable
            key={e.slug}
            onPress={() => router.push(`/exercices/${e.slug}`)}
            style={styles.ligne}
            accessibilityRole="link"
            accessibilityLabel={`${e.nom}, ${resume(e)}`}
          >
            <Vignette image={e.image} taille={40} />
            <View style={styles.texte}>
              <Text style={styles.nom} numberOfLines={1}>
                {e.nom}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {resume(e)}
              </Text>
            </View>
            <ChevronRight size={18} color={couleurs.encreAttenuee} />
          </Appuyable>
        ))
      )}
      {exercices.data.length > VISIBLES ? (
        <Appuyable onPress={() => setTous(!tous)} style={styles.plus} accessibilityRole="button">
          <Text style={styles.plusTexte}>
            {tous ? "Moins d'exercices" : `Tous les exercices (${exercices.data.length})`}
          </Text>
        </Appuyable>
      ) : null}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    gap: espace.s,
    padding: espace.l,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.surface1,
  },
  vide: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1 },
  ligne: { minHeight: CIBLE + 8, flexDirection: "row", alignItems: "center", gap: espace.m },
  texte: { flex: 1, gap: 2 },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  meta: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  plus: { minHeight: CIBLE, justifyContent: "center" },
  plusTexte: { color: couleurs.encre, fontSize: taille.petit + 1, fontWeight: "600" },
}));
