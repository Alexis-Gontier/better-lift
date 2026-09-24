import {
  demarrerDepuisRoutine,
  demarrerVide,
  type RoutineDetail,
  secondesEcoulees,
} from "@better-lift/shared";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../lib/auth-client";
import { ROUTINES } from "../lib/factices";
import { useSeance } from "../lib/seance-memoire";
import { formaterDuree, nouvelId, useMaintenant } from "../lib/temps";
import { CIBLE, couleurs, espace, taille } from "../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export default function Accueil() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { seance, setSeance } = useSeance();
  const maintenant = useMaintenant();

  useEffect(() => {
    if (!isPending && !session) router.replace("/connexion");
  }, [isPending, session, router]);

  /**
   * Démarrer ne doit JAMAIS écraser une séance en cours (§ 8). En PR 3, la
   * vérification relira le disque au moment même de l'appui.
   */
  const demarrer = (creer: () => ReturnType<typeof demarrerVide>) => {
    if (seance) {
      Alert.alert(
        "Une séance est en cours",
        "Termine-la ou abandonne-la avant d'en commencer une autre.",
        [{ text: "Reprendre", onPress: () => router.push("/seance") }],
      );
      return;
    }
    setSeance(creer());
    router.push("/seance");
  };

  if (isPending) {
    return (
      <View style={[styles.ecran, styles.centre]}>
        <Text style={styles.pale}>Chargement…</Text>
      </View>
    );
  }

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

        <Pressable
          style={styles.vide}
          onPress={() => demarrer(() => demarrerVide(nouvelId(), new Date()))}
          accessibilityRole="button"
        >
          <Text style={styles.videTexte}>Séance vide</Text>
        </Pressable>

        <Text style={styles.section}>Routines</Text>
        {ROUTINES.map((r: RoutineDetail) => (
          <Pressable
            key={r.id}
            style={styles.routine}
            onPress={() => demarrer(() => demarrerDepuisRoutine(r, nouvelId(), new Date()))}
            accessibilityRole="button"
            accessibilityHint="Démarre une séance depuis cette routine"
          >
            <Text style={styles.routineNom}>{r.nom}</Text>
            <Text style={styles.pale}>
              {pluriel(r.exercices.length, "exercice")} ·{" "}
              {pluriel(
                r.exercices.reduce((n, e) => n + e.series.length, 0),
                "série",
              )}
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={styles.deconnexion}
          onPress={async () => {
            await authClient.signOut();
            router.replace("/connexion");
          }}
        >
          <Text style={styles.pale}>Se déconnecter ({session?.user.email})</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  centre: { alignItems: "center", justifyContent: "center" },
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
  deconnexion: {
    marginTop: espace.xl,
    alignItems: "center",
    minHeight: CIBLE,
    justifyContent: "center",
  },
});
