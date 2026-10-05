import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useConfirmer, useInformer } from "../lib/confirmation";
import { useSeance } from "../lib/seance";
import { CIBLE, creerStyles, espace, rayon, taille } from "../lib/theme";
import { Appuyable } from "./ui/appuyable";

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
  const confirmer = useConfirmer();
  const informer = useInformer();

  return (
    <>
      {enAttente.length > 0 ? (
        <View style={styles.bloc}>
          <Text style={styles.texte}>
            {enAttente.length === 1
              ? "1 séance en attente d'envoi"
              : `${enAttente.length} séances en attente d'envoi`}
          </Text>
          <Appuyable
            onPress={() => void synchroniser()}
            disabled={envoiEnCours}
            style={styles.bouton}
            accessibilityRole="button"
          >
            <Text style={styles.boutonTexte}>{envoiEnCours ? "Envoi…" : "Réessayer"}</Text>
          </Appuyable>
        </View>
      ) : null}

      {refusees.map((e) => (
        <View key={e.seance.id} style={[styles.bloc, styles.refusee]}>
          <Text style={styles.texte}>
            « {e.seance.nom} » refusée : {e.erreur}
          </Text>
          <View style={{ flexDirection: "row", gap: espace.s }}>
            <Appuyable
              style={styles.bouton}
              accessibilityRole="button"
              onPress={async () => {
                if (await reprendreRefusee(e.seance.id)) router.push("/seance");
                else informer("Une séance est en cours", "Termine-la avant de reprendre celle-ci.");
              }}
            >
              <Text style={styles.boutonTexte}>Reprendre</Text>
            </Appuyable>
            <Appuyable
              style={styles.bouton}
              accessibilityRole="button"
              onPress={() =>
                confirmer({
                  titre: "Supprimer cette séance ?",
                  message: "Elle ne sera jamais enregistrée.",
                  action: "Supprimer la séance",
                  annuler: "Garder",
                  onConfirmer: () => void supprimerRefusee(e.seance.id),
                })
              }
            >
              <Text style={styles.danger}>Supprimer</Text>
            </Appuyable>
          </View>
        </View>
      ))}
    </>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: {
    padding: espace.m,
    borderRadius: rayon.carte,
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
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  boutonTexte: { color: couleurs.encre, fontSize: taille.courant },
  danger: { color: couleurs.dangerEncre, fontSize: taille.courant },
}));
