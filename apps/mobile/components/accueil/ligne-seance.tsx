import { formaterCharge, formatJour, type SeanceResume } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { dureeMin, libelleMinutes } from "../../lib/temps";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { Appuyable } from "../ui/appuyable";
import { BadgeRecord } from "../ui/badge-record";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une séance du journal (D166) : une ligne, pas une carte. Le nom, puis jour,
 * durée et volume ; les records en contour. Le détail est à un appui.
 */
export function LigneSeance({ seance }: { seance: SeanceResume }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  // Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66).
  const meta = [
    formatJour(seance.debut, FUSEAU),
    libelleMinutes(dureeMin(seance)),
    formaterCharge(seance.volumeKg, SYSTEME_UNITES),
  ].join(" · ");
  return (
    <Appuyable
      style={({ pressed }) => [styles.ligne, pressed && styles.appuyee]}
      onPress={() => router.push(`/historique/${seance.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${seance.nom}, ${meta}${seance.nbRecords > 0 ? `, ${pluriel(seance.nbRecords, "record")}` : ""}`}
    >
      <View style={styles.texte}>
        <Text style={styles.nom} numberOfLines={1}>
          {seance.nom}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {seance.nbRecords > 0 ? <BadgeRecord libelle={String(seance.nbRecords)} /> : null}
      <ChevronRight size={18} color={couleurs.encreAttenuee} />
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: {
    minHeight: CIBLE + 16,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingVertical: espace.s,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
  },
  appuyee: { opacity: 0.6 },
  texte: { flex: 1, gap: 2 },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  meta: { color: couleurs.encreTertiaire, fontSize: taille.petit },
}));
