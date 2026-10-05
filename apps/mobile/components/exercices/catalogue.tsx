import { filtrerCatalogue, GROUPES, type Groupe, LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, Text, TextInput, View } from "react-native";
import { optionsCatalogueComplet } from "../../lib/requetes";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";
import { Chargement, Erreur, Vide } from "../ui/etats";
import { Vignette } from "../ui/vignette";

/**
 * La bibliothèque d'exercices, vue de l'onglet Routines (D121). Le catalogue
 * ENTIER, filtré sur le téléphone (D97) : la recherche marche hors ligne et
 * répond à chaque lettre. Les puces filtrent par groupe musculaire.
 */
export function Catalogue() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const [filtre, setFiltre] = useState("");
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const catalogue = useQuery(optionsCatalogueComplet());
  const resultats = useMemo(
    () =>
      catalogue.data
        ? filtrerCatalogue(catalogue.data, filtre).filter((e) => !groupe || e.groupe === groupe)
        : [],
    [catalogue.data, filtre, groupe],
  );

  return (
    <View style={styles.vue}>
      <TextInput
        value={filtre}
        onChangeText={setFiltre}
        placeholder="Chercher un exercice"
        placeholderTextColor={couleurs.encreAttenuee}
        style={styles.recherche}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Chercher un exercice"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.puces}
        contentContainerStyle={styles.pucesContenu}
        keyboardShouldPersistTaps="handled"
      >
        {[null, ...GROUPES].map((g) => {
          const actif = g === groupe;
          return (
            <Appuyable
              key={g ?? "tous"}
              onPress={() => setGroupe(g)}
              style={[styles.puce, actif && styles.puceActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
            >
              <Text style={[styles.puceTexte, actif && styles.puceTexteActif]}>
                {g ? LIBELLE_GROUPE[g] : "Tous"}
              </Text>
            </Appuyable>
          );
        })}
      </ScrollView>
      {catalogue.isPending && catalogue.fetchStatus === "paused" ? (
        <Vide titre="Hors ligne" message="Le catalogue apparaîtra au retour du réseau." />
      ) : catalogue.isPending ? (
        <Chargement />
      ) : catalogue.isError && !catalogue.data ? (
        <Erreur
          message="Le catalogue n'a pas pu être chargé."
          onReessayer={() => catalogue.refetch()}
        />
      ) : resultats.length === 0 ? (
        <Vide titre="Aucun exercice trouvé" message="Change la recherche ou le groupe." />
      ) : (
        <FlatList
          data={resultats}
          keyExtractor={(x) => x.slug}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <Appuyable
              style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
              onPress={() => router.push(`/exercices/${item.slug}`)}
              accessibilityRole="button"
            >
              <Vignette image={item.image} taille={40} />
              <View style={styles.texte}>
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
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  vue: { flex: 1 },
  recherche: {
    height: CIBLE,
    marginHorizontal: espace.l,
    borderRadius: rayon.cellule,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.courant,
    paddingHorizontal: espace.m,
  },
  // Sans `flexShrink: 0`, la liste qui suit écrase la rangée et rogne les puces.
  puces: { flexGrow: 0, flexShrink: 0, marginVertical: espace.m },
  pucesContenu: { gap: espace.s, paddingHorizontal: espace.l },
  puce: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: espace.m,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  puceActive: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
  puceTexte: { color: couleurs.encreSecondaire, fontSize: taille.petit, fontWeight: "600" },
  puceTexteActif: { color: couleurs.canevas },
  ligne: {
    minHeight: CIBLE + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  texte: { flex: 1 },
  nom: { color: couleurs.encre, fontSize: taille.courant },
  sous: { color: couleurs.encreAttenuee, fontSize: taille.petit, marginTop: 2 },
}));
