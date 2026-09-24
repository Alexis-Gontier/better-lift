import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileEnvoi } from "../../components/file-envoi";
import { authClient } from "../../lib/auth-client";
import { useSeance } from "../../lib/seance";
import { CIBLE, couleurs, espace, taille } from "../../lib/theme";

export default function Profil() {
  const router = useRouter();
  const client = useQueryClient();
  const { data: session } = authClient.useSession();
  const { file, seance } = useSeance();
  const enAttente = file.filter((e) => e.erreur === null).length;

  const seDeconnecter = async () => {
    await authClient.signOut();
    // Les clés de cache ne portent pas l'utilisateur : sans ce vidage, le
    // compte suivant verrait un instant les données du précédent.
    client.clear();
    router.replace("/connexion");
  };

  // Se déconnecter avec des séances non envoyées : elles restent sur le disque,
  // mais partiraient sous le compte suivant. On prévient.
  const confirmer = () =>
    enAttente > 0 || seance
      ? Alert.alert(
          "Se déconnecter ?",
          "Une séance est en cours ou attend d'être envoyée. Elle restera sur ce téléphone.",
          [
            { text: "Rester", style: "cancel" },
            { text: "Se déconnecter", style: "destructive", onPress: () => void seDeconnecter() },
          ],
        )
      : void seDeconnecter();

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre}>Profil</Text>
      <View style={styles.carte}>
        <Ligne libelle="Compte" valeur={session?.user.email ?? "—"} />
        <Ligne
          libelle="En attente d'envoi"
          valeur={enAttente === 0 ? "Rien" : `${enAttente} séance${enAttente > 1 ? "s" : ""}`}
        />
        <Ligne libelle="Version" valeur={Constants.expoConfig?.version ?? "—"} dernier />
      </View>
      {/* Les séances pas encore arrivées au serveur : réessayer, reprendre ou
          supprimer une séance refusée. */}
      <FileEnvoi />
      <Pressable style={styles.deconnexion} onPress={confirmer} accessibilityRole="button">
        <Text style={styles.dangerTexte}>Se déconnecter</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Ligne({
  libelle,
  valeur,
  dernier,
}: {
  libelle: string;
  valeur: string;
  dernier?: boolean;
}) {
  return (
    <View style={[styles.ligne, !dernier && styles.separe]}>
      <Text style={styles.libelle}>{libelle}</Text>
      <Text style={styles.valeur} numberOfLines={1}>
        {valeur}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas, padding: espace.l, gap: espace.l },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "700" },
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  ligne: {
    minHeight: CIBLE + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
  },
  separe: { borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
  libelle: { color: couleurs.encrePale, fontSize: taille.petit + 1 },
  valeur: { flex: 1, textAlign: "right", color: couleurs.encre, fontSize: taille.courant },
  deconnexion: {
    minHeight: CIBLE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerTexte: { color: couleurs.dangerEncre, fontSize: taille.courant },
});
