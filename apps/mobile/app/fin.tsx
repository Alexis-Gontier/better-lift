import { bilanSeance, formaterCharge, secondesEcoulees } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSeance } from "../lib/seance";
import { formaterDuree } from "../lib/temps";
import { CIBLE, couleurs, espace, taille } from "../lib/theme";
import { SYSTEME_UNITES } from "../lib/unites";

export default function Fin() {
  const router = useRouter();
  const { seance, terminer } = useSeance();
  if (!seance) return null;

  // La durée est figée à l'ouverture de cet écran : c'est l'heure de fin.
  const duree = secondesEcoulees(seance.debut, new Date());
  const { seriesFaites, volumeKg } = bilanSeance(seance);

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.contenu}>
        <Text style={styles.titre}>Bien joué.</Text>
        <Text style={styles.nom}>{seance.nom}</Text>

        <View style={styles.chiffres}>
          <Chiffre valeur={formaterDuree(duree)} libelle="Durée" />
          <Chiffre valeur={String(seriesFaites)} libelle="Séries" />
          <Chiffre valeur={formaterCharge(volumeKg, SYSTEME_UNITES)} libelle="Volume" />
        </View>
      </View>

      <View style={styles.pied}>
        <Pressable
          style={styles.enregistrer}
          accessibilityRole="button"
          onPress={async () => {
            // Sur disque dans la file AVANT de quitter l'écran : l'envoi se fait
            // ensuite, et se retentera tant qu'il n'aura pas abouti.
            await terminer();
            router.replace("/");
          }}
        >
          <Text style={styles.enregistrerTexte}>Enregistrer la séance</Text>
        </Pressable>
        <Pressable style={styles.retour} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.retourTexte}>Reprendre la séance</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <View style={styles.chiffre}>
      <Text style={styles.valeur}>{valeur}</Text>
      <Text style={styles.libelle}>{libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas, justifyContent: "space-between" },
  contenu: { padding: espace.xl, gap: espace.s },
  titre: { color: couleurs.encre, fontSize: taille.titre + 4, fontWeight: "700" },
  nom: { color: couleurs.encreDouce, fontSize: taille.courant },
  chiffres: { flexDirection: "row", gap: espace.m, marginTop: espace.xl },
  chiffre: {
    flex: 1,
    padding: espace.m,
    borderRadius: 12,
    backgroundColor: couleurs.surface1,
    borderWidth: 1,
    borderColor: couleurs.ligne,
  },
  valeur: {
    color: couleurs.encre,
    fontSize: taille.grand,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  libelle: { color: couleurs.encrePale, fontSize: taille.petit, marginTop: 2 },
  pied: { padding: espace.l, gap: espace.s },
  enregistrer: {
    minHeight: CIBLE + 8,
    borderRadius: 12,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  enregistrerTexte: { color: couleurs.surAccent, fontSize: taille.courant + 1, fontWeight: "700" },
  retour: { minHeight: CIBLE, alignItems: "center", justifyContent: "center" },
  retourTexte: { color: couleurs.encreDouce, fontSize: taille.courant },
});
