import {
  avecPrecedents,
  demarrerDepuisRoutine,
  demarrerVide,
  secondesEcoulees,
} from "@better-lift/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chargerPrecedents, optionsRoutine, optionsRoutines } from "../../lib/requetes";
import { useSeance } from "../../lib/seance";
import { formaterDuree, nouvelId, useMaintenant } from "../../lib/temps";
import { CIBLE, couleurs, espace, taille } from "../../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export default function Accueil() {
  const router = useRouter();
  const {
    seance,
    file,
    envoiEnCours,
    demarrer: demarrerSeance,
    synchroniser,
    reprendreRefusee,
    supprimerRefusee,
  } = useSeance();
  const enAttente = file.filter((e) => e.erreur === null);
  const refusees = file.filter((e) => e.erreur !== null);
  const maintenant = useMaintenant();
  const client = useQueryClient();
  // La garde de session est dans `(onglets)/_layout.tsx` : ici, on est connecté.
  const routines = useQuery(optionsRoutines());
  const [ouverture, setOuverture] = useState<string | null>(null);

  /**
   * Démarrer ne doit JAMAIS écraser une séance en cours (§ 8) : la vérification
   * relit le DISQUE au moment de l'appui, pas l'état de cet écran.
   */
  const demarrer = async (creer: () => ReturnType<typeof demarrerVide>) => {
    if (!(await demarrerSeance(creer()))) {
      Alert.alert(
        "Une séance est en cours",
        "Termine-la ou abandonne-la avant d'en commencer une autre.",
        [{ text: "Reprendre", onPress: () => router.push("/seance") }],
      );
      return;
    }
    router.push("/seance");
  };

  return (
    <SafeAreaView style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>better-lift</Text>

        {seance ? (
          <Pressable
            style={styles.enCours}
            onPress={() => router.push("/seance")}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.enCoursLibelle}>Séance en cours</Text>
              <Text style={styles.enCoursNom}>{seance.nom}</Text>
            </View>
            <Text style={styles.enCoursChrono}>
              {formaterDuree(secondesEcoulees(seance.debut, maintenant))}
            </Text>
          </Pressable>
        ) : null}

        {enAttente.length > 0 ? (
          <View style={styles.file}>
            <Text style={styles.fileTexte}>
              {enAttente.length === 1
                ? "1 séance en attente d'envoi"
                : `${enAttente.length} séances en attente d'envoi`}
            </Text>
            <Pressable
              onPress={() => void synchroniser()}
              disabled={envoiEnCours}
              style={styles.fileBouton}
            >
              <Text style={styles.videTexte}>{envoiEnCours ? "Envoi…" : "Réessayer"}</Text>
            </Pressable>
          </View>
        ) : null}

        {refusees.map((e) => (
          <View key={e.seance.id} style={[styles.file, styles.refusee]}>
            <Text style={styles.fileTexte}>
              « {e.seance.nom} » refusée : {e.erreur}
            </Text>
            <View style={{ flexDirection: "row", gap: espace.s }}>
              <Pressable
                style={styles.fileBouton}
                onPress={async () => {
                  if (await reprendreRefusee(e.seance.id)) router.push("/seance");
                  else
                    Alert.alert(
                      "Une séance est en cours",
                      "Termine-la avant de reprendre celle-ci.",
                    );
                }}
              >
                <Text style={styles.videTexte}>Reprendre</Text>
              </Pressable>
              <Pressable
                style={styles.fileBouton}
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
                <Text style={styles.dangerTexte}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          style={styles.vide}
          onPress={() => void demarrer(() => demarrerVide(nouvelId(), new Date()))}
          accessibilityRole="button"
        >
          <Text style={styles.videTexte}>Séance vide</Text>
        </Pressable>

        <Text style={styles.section}>Routines</Text>
        {routines.isPending ? (
          <ActivityIndicator color={couleurs.encrePale} style={{ marginVertical: espace.xl }} />
        ) : routines.isError ? (
          <View style={styles.message}>
            <Text style={styles.pale}>Les routines n'ont pas pu être chargées.</Text>
            <Pressable
              onPress={() => routines.refetch()}
              style={styles.vide}
              accessibilityRole="button"
            >
              <Text style={styles.videTexte}>Réessayer</Text>
            </Pressable>
          </View>
        ) : routines.data.length === 0 ? (
          <Text style={[styles.pale, styles.message]}>
            Aucune routine. Prépare-en une sur le web, elle apparaîtra ici.
          </Text>
        ) : null}
        {(routines.data ?? []).map((r) => (
          <Pressable
            key={r.id}
            style={[styles.routine, ouverture === r.id && { opacity: 0.6 }]}
            disabled={ouverture !== null}
            onPress={async () => {
              // Le résumé ne porte pas les séries : le détail se charge à l'appui.
              setOuverture(r.id);
              try {
                const detail = await client.fetchQuery(optionsRoutine(r.id));
                // La dernière fois entre dans le brouillon AVANT son écriture (D67).
                const precedents = await chargerPrecedents(detail.exercices.map((e) => e.slug));
                await demarrer(() =>
                  avecPrecedents(demarrerDepuisRoutine(detail, nouvelId(), new Date()), precedents),
                );
              } catch {
                Alert.alert(
                  "Routine indisponible",
                  "Elle n'a pas pu être chargée. Vérifie ta connexion.",
                );
              } finally {
                setOuverture(null);
              }
            }}
            accessibilityRole="button"
            accessibilityHint="Démarre une séance depuis cette routine"
          >
            <Text style={styles.routineNom}>{r.nom}</Text>
            <Text style={styles.pale}>
              {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  contenu: { padding: espace.l, gap: espace.m },
  titre: {
    color: couleurs.encre,
    fontSize: taille.titre,
    fontWeight: "700",
    marginBottom: espace.s,
  },
  pale: { color: couleurs.encrePale, fontSize: taille.petit },
  // La séance en cours est l'information la plus importante de l'écran : elle
  // est en tête, et bordée du lime.
  enCours: {
    flexDirection: "row",
    alignItems: "center",
    padding: espace.l,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.accent,
    backgroundColor: couleurs.accentLavis,
  },
  enCoursLibelle: { color: couleurs.accent, fontSize: taille.petit, textTransform: "uppercase" },
  enCoursNom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600", marginTop: 2 },
  enCoursChrono: { color: couleurs.encre, fontSize: taille.grand, fontVariant: ["tabular-nums"] },
  vide: {
    minHeight: CIBLE + 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  videTexte: { color: couleurs.encre, fontSize: taille.courant },
  section: {
    color: couleurs.encrePale,
    fontSize: taille.petit,
    textTransform: "uppercase",
    marginTop: espace.m,
  },
  routine: {
    padding: espace.l,
    borderRadius: 12,
    backgroundColor: couleurs.surface1,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    gap: 4,
  },
  routineNom: { color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "600" },
  message: { gap: espace.m, marginVertical: espace.m },
  file: {
    padding: espace.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    backgroundColor: couleurs.surface1,
    gap: espace.s,
  },
  refusee: { borderColor: couleurs.danger },
  fileTexte: { color: couleurs.encreDouce, fontSize: taille.petit + 1 },
  fileBouton: {
    minHeight: CIBLE - 4,
    paddingHorizontal: espace.l,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  dangerTexte: { color: couleurs.dangerEncre, fontSize: taille.courant },
});
