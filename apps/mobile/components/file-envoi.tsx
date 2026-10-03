import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useSeance } from "../lib/seance";
import { CIBLE, creerStyles, espace, taille } from "../lib/theme";

/**
 * Les séances terminées qui n'ont pas encore atteint le serveur : en attente
 * (réseau) ou refusées (données). Rien ne s'affiche quand la file est vide.
 */
export function FileEnvoi() {
  const styles = useStyles();
  const router = useRouter();
  const { file, envoiEnCours, synchroniser, reprendreRefusee, supprimerRefusee } = useSeance();
  const enAttente = file.filter((e) => e.erreur === null);
  const refusees = file.filter((e) => e.erreur !== null);

  return (
    <>
      {enAttente.length > 0 ? (
        <View style={styles.bloc}>
          <Text style={styles.texte}>
            {enAttente.length === 1
              ? "1 séance en attente d'envoi"
              : `${enAttente.length} séances en attente d'envoi`}
          </Text>
          <Pressable
            onPress={() => void synchroniser()}
            disabled={envoiEnCours}
            style={styles.bouton}
            accessibilityRole="button"
          >
            <Text style={styles.boutonTexte}>{envoiEnCours ? "Envoi…" : "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : null}

      {refusees.map((e) => (
        <View key={e.seance.id} style={[styles.bloc, styles.refusee]}>
          <Text style={styles.texte}>
            « {e.seance.nom} » refusée : {e.erreur}
          </Text>
          <View style={{ flexDirection: "row", gap: espace.s }}>
            <Pressable
              style={styles.bouton}
              accessibilityRole="button"
              onPress={async () => {
                if (await reprendreRefusee(e.seance.id)) router.push("/seance");
                else
                  Alert.alert("Une séance est en cours", "Termine-la avant de reprendre celle-ci.");
              }}
            >
              <Text style={styles.boutonTexte}>Reprendre</Text>
            </Pressable>
            <Pressable
              style={styles.bouton}
              accessibilityRole="button"
              onPress={() =>
                Alert.alert("Supprimer cette séance ?", "Elle ne sera jamais enregistrée.", [
                  { text: "Garder", style: "cancel" },
                  {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => void supprimerRefusee(e.seance.id),
                  },
                ])
              }
            >
              <Text style={styles.danger}>Supprimer</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: {
    padding: espace.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    backgroundColor: couleurs.surface1,
    gap: espace.s,
  },
  refusee: { borderColor: couleurs.dangerEncre },
  texte: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  bouton: {
    minHeight: CIBLE - 4,
    paddingHorizontal: espace.l,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  boutonTexte: { color: couleurs.encre, fontSize: taille.courant },
  danger: { color: couleurs.dangerEncre, fontSize: taille.courant },
}));
