import {
  ajouterExercice,
  ajouterSerie,
  arreterRepos,
  modifierSerie,
  reposRestant,
  retirerExercice,
  secondesEcoulees,
  validerSerie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BandeauRepos } from "../components/seance/bandeau-repos";
import { CarteExercice } from "../components/seance/carte-exercice";
import { optionsCatalogue } from "../lib/requetes";
import { useSeance } from "../lib/seance-memoire";
import { formaterDuree, useMaintenant } from "../lib/temps";
import { CIBLE, couleurs, espace, taille } from "../lib/theme";

export default function Seance() {
  const router = useRouter();
  const { seance, setSeance } = useSeance();
  const maintenant = useMaintenant();
  const [ajout, setAjout] = useState(false);
  const [filtre, setFiltre] = useState("");
  // La recherche du catalogue réel : bilingue, sans accents (lot 4).
  const catalogue = useQuery({ ...optionsCatalogue(filtre.trim()), enabled: ajout });

  if (!seance) {
    return (
      <SafeAreaView style={[styles.ecran, styles.centre]}>
        <Text style={styles.pale}>Aucune séance en cours.</Text>
        <Pressable onPress={() => router.replace("/")} style={styles.secondaire}>
          <Text style={styles.secondaireTexte}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const repos = reposRestant(seance, maintenant);

  const abandonner = () =>
    Alert.alert("Abandonner la séance ?", "Rien ne sera enregistré.", [
      { text: "Continuer", style: "cancel" },
      {
        text: "Abandonner",
        style: "destructive",
        onPress: () => {
          setSeance(null);
          router.replace("/");
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.entete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nom} numberOfLines={1}>
            {seance.nom}
          </Text>
          <Text style={styles.chrono}>
            {formaterDuree(secondesEcoulees(seance.debut, maintenant))}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/fin")}
          style={styles.terminer}
          accessibilityRole="button"
        >
          <Text style={styles.terminerTexte}>Terminer</Text>
        </Pressable>
      </View>

      {/* De la marge en bas : le bandeau de repos ne doit jamais cacher la dernière série. */}
      <ScrollView
        contentContainerStyle={[styles.contenu, { paddingBottom: 140 }]}
        keyboardShouldPersistTaps="handled"
      >
        {seance.exercices.map((e, iE) => (
          <CarteExercice
            key={`${e.slug}-${iE}`}
            exercice={e}
            onModifierSerie={(iS, patch) => setSeance(modifierSerie(seance, iE, iS, patch))}
            onValiderSerie={(iS) => setSeance(validerSerie(seance, iE, iS, new Date()))}
            onAjouterSerie={() => setSeance(ajouterSerie(seance, iE))}
            onRetirer={() => setSeance(retirerExercice(seance, iE))}
          />
        ))}
        <Pressable
          onPress={() => setAjout(true)}
          style={styles.secondaire}
          accessibilityRole="button"
        >
          <Text style={styles.secondaireTexte}>+ exercice</Text>
        </Pressable>
        <Pressable onPress={abandonner} style={styles.abandon} accessibilityRole="button">
          <Text style={styles.abandonTexte}>Abandonner la séance</Text>
        </Pressable>
      </ScrollView>

      {repos !== null ? (
        <BandeauRepos restant={repos} onPasser={() => setSeance(arreterRepos(seance))} />
      ) : null}

      <Modal visible={ajout} animationType="slide" onRequestClose={() => setAjout(false)}>
        <SafeAreaView style={styles.ecran}>
          <View style={styles.entete}>
            <TextInput
              autoFocus
              value={filtre}
              onChangeText={setFiltre}
              placeholder="Chercher un exercice"
              placeholderTextColor={couleurs.encreFaible}
              style={styles.recherche}
            />
            <Pressable onPress={() => setAjout(false)} style={styles.fermer}>
              <Text style={styles.secondaireTexte}>Fermer</Text>
            </Pressable>
          </View>
          <FlatList
            data={catalogue.data ?? []}
            ListEmptyComponent={
              <Text style={[styles.pale, { padding: espace.l }]}>
                {catalogue.isPending
                  ? "Chargement…"
                  : catalogue.isError
                    ? "Le catalogue n'a pas pu être chargé."
                    : "Aucun exercice trouvé."}
              </Text>
            }
            keyExtractor={(x) => x.slug}
            contentContainerStyle={styles.contenu}
            renderItem={({ item }) => (
              <Pressable
                style={styles.choix}
                onPress={() => {
                  setSeance(ajouterExercice(seance, item.slug, item.nom));
                  setAjout(false);
                  setFiltre("");
                }}
              >
                <Text style={styles.choixTexte}>{item.nom}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  centre: { alignItems: "center", justifyContent: "center", gap: espace.l },
  pale: { color: couleurs.encrePale, fontSize: taille.courant },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
    paddingVertical: espace.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  nom: { color: couleurs.encreDouce, fontSize: taille.courant },
  chrono: {
    color: couleurs.encre,
    fontSize: taille.chrono,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  // L'action principale de l'écran : l'aplat lime (D28).
  terminer: {
    minHeight: CIBLE,
    paddingHorizontal: espace.xl,
    borderRadius: 10,
    backgroundColor: couleurs.accent,
    justifyContent: "center",
  },
  terminerTexte: { color: couleurs.surAccent, fontSize: taille.courant, fontWeight: "700" },
  contenu: { padding: espace.m, gap: espace.m },
  secondaire: {
    minHeight: CIBLE,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espace.l,
  },
  secondaireTexte: { color: couleurs.encreDouce, fontSize: taille.courant },
  abandon: { minHeight: CIBLE, alignItems: "center", justifyContent: "center" },
  abandonTexte: { color: couleurs.dangerEncre, fontSize: taille.courant },
  recherche: {
    flex: 1,
    height: CIBLE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.courant,
    paddingHorizontal: espace.m,
  },
  fermer: { minHeight: CIBLE, justifyContent: "center" },
  choix: {
    minHeight: CIBLE + 8,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  choixTexte: { color: couleurs.encre, fontSize: taille.courant },
});
