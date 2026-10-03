import { formaterCharge, formatJour, type SeanceResume } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { dureeMin } from "../../lib/temps";
import { CIBLE, creerStyles, espace, taille } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { BadgeRecord } from "../ui/badge-record";

/**
 * Une séance passée, sur une ligne : nom, jour, records battus (D110), volume
 * et durée. L'appui ouvre son détail dans la pile de l'historique.
 */
export function LigneSeance({ seance }: { seance: SeanceResume }) {
  const styles = useStyles();
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
      onPress={() => router.push(`/historique/${seance.id}`)}
      accessibilityRole="button"
    >
      <View style={styles.gauche}>
        <Text style={styles.nom} numberOfLines={1}>
          {seance.nom}
        </Text>
        {/* Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66). */}
        <Text style={styles.sous}>{formatJour(seance.debut, FUSEAU)}</Text>
      </View>
      {seance.nbRecords > 0 ? (
        <BadgeRecord
          libelle={seance.nbRecords === 1 ? "1 record" : `${seance.nbRecords} records`}
        />
      ) : null}
      <View style={styles.droite}>
        <Text style={styles.volume}>{formaterCharge(seance.volumeKg, SYSTEME_UNITES)}</Text>
        <Text style={styles.sous}>{dureeMin(seance)} min</Text>
      </View>
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: {
    minHeight: CIBLE + 16,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  gauche: { flex: 1 },
  droite: { alignItems: "flex-end" },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  sous: { color: couleurs.encreTertiaire, fontSize: taille.petit, marginTop: 2 },
  volume: {
    color: couleurs.encre,
    fontSize: taille.courant,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
}));
