import { LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appuyable } from "../../../components/ui/appuyable";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { optionsCatalogue } from "../../../lib/requetes";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../../lib/theme";

export default function Exercices() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const [filtre, setFiltre] = useState("");
  // Recherche bilingue et sans accents (lot 4) : « developpe » trouve « Développé ».
  const catalogue = useQuery(optionsCatalogue(filtre.trim()));

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre} accessibilityRole="header">
        Exercices
      </Text>
      <TextInput
        value={filtre}
        onChangeText={setFiltre}
        placeholder="Chercher un exercice"
        placeholderTextColor={couleurs.encreAttenuee}
        style={styles.recherche}
        autoCorrect={false}
        returnKeyType="search"
      />
      {catalogue.isPending ? (
        <Chargement />
      ) : catalogue.isError ? (
        <Erreur
          message="Le catalogue n'a pas pu être chargé."
          onReessayer={() => catalogue.refetch()}
        />
      ) : catalogue.data.length === 0 ? (
        <Vide titre="Aucun exercice trouvé" message={`Rien ne correspond à « ${filtre} ».`} />
      ) : (
        <FlatList
          data={catalogue.data}
          keyExtractor={(x) => x.slug}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Appuyable
              style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
              onPress={() => router.push(`/exercices/${item.slug}`)}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.nom} numberOfLines={1}>
                  {item.nom}
                </Text>
                <Text style={styles.sous} numberOfLines={1}>
                  {LIBELLE_GROUPE[item.groupe]} · {item.equipement}
                </Text>
              </View>
            </Appuyable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  titre: {
    color: couleurs.encre,
    fontSize: taille.titre,
    fontWeight: "700",
    paddingHorizontal: espace.l,
    paddingTop: espace.l,
  },
  recherche: {
    height: CIBLE,
    margin: espace.l,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.courant,
    paddingHorizontal: espace.m,
  },
  ligne: {
    minHeight: CIBLE + 12,
    justifyContent: "center",
    paddingHorizontal: espace.l,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  nom: { color: couleurs.encre, fontSize: taille.courant },
  sous: { color: couleurs.encreAttenuee, fontSize: taille.petit, marginTop: 2 },
}));
