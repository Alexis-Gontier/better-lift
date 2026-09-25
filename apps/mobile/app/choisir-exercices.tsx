import { LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Dumbbell, X } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chargement, Erreur, Vide } from "../components/ui/etats";
import { type ExerciceChoisi, rendreChoix } from "../lib/choix-exercices";
import { optionsCatalogue } from "../lib/requetes";
import { CIBLE, couleurs, espace, taille } from "../lib/theme";

/**
 * Choisir des exercices dans le catalogue (D93) : une recherche, et une
 * sélection multiple — on coche tout ce qu'on veut, puis on ajoute d'un coup.
 * En `?mode=remplacer`, un seul choix, rendu dès l'appui.
 */
export default function ChoisirExercices() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const unique = mode === "remplacer";
  const [filtre, setFiltre] = useState("");
  const [choix, setChoix] = useState<ExerciceChoisi[]>([]);
  const catalogue = useQuery(optionsCatalogue(filtre.trim()));

  const basculer = (e: ExerciceChoisi) => {
    if (unique) {
      rendreChoix([e]);
      router.back();
      return;
    }
    setChoix((c) =>
      c.some((x) => x.slug === e.slug) ? c.filter((x) => x.slug !== e.slug) : [...c, e],
    );
  };

  const ajouter = () => {
    rendreChoix(choix);
    router.back();
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top", "bottom"]}>
      <View style={styles.entete}>
        <Pressable
          onPress={() => router.back()}
          style={styles.fermer}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        >
          <X size={24} color={couleurs.encre} />
        </Pressable>
        <Text style={styles.titre}>
          {unique ? "Remplacer l'exercice" : "Ajouter des exercices"}
        </Text>
      </View>

      <TextInput
        value={filtre}
        onChangeText={setFiltre}
        placeholder="Chercher un exercice"
        placeholderTextColor={couleurs.encreFaible}
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
          contentContainerStyle={styles.liste}
          renderItem={({ item }) => {
            const coche = choix.some((c) => c.slug === item.slug);
            return (
              <Pressable
                style={[styles.ligne, coche && styles.ligneCochee]}
                onPress={() => basculer({ slug: item.slug, nom: item.nom, image: item.image })}
                accessibilityRole={unique ? "button" : "checkbox"}
                accessibilityState={unique ? undefined : { checked: coche }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.vignette}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <View style={[styles.vignette, styles.sansImage]}>
                    <Dumbbell size={20} color={couleurs.encreFaible} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom} numberOfLines={2}>
                    {item.nom}
                  </Text>
                  <Text style={styles.sous} numberOfLines={1}>
                    {LIBELLE_GROUPE[item.groupe]} · {item.equipement}
                  </Text>
                </View>
                {unique ? null : (
                  <View style={[styles.case, coche && styles.caseCochee]}>
                    {coche ? <Check size={16} color={couleurs.canvas} strokeWidth={3} /> : null}
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {unique ? null : (
        <View style={styles.pied}>
          <Pressable
            style={[styles.ajouter, choix.length === 0 && styles.inactif]}
            disabled={choix.length === 0}
            onPress={ajouter}
            accessibilityRole="button"
          >
            <Text style={styles.ajouterTexte}>
              {choix.length === 0 ? "Coche des exercices" : `Ajouter (${choix.length})`}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.xs,
    paddingHorizontal: espace.s,
    paddingVertical: espace.s,
  },
  fermer: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  titre: { flex: 1, color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
  recherche: {
    height: CIBLE,
    marginHorizontal: espace.l,
    marginBottom: espace.m,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.courant,
    paddingHorizontal: espace.m,
  },
  liste: { paddingHorizontal: espace.l, gap: espace.s, paddingBottom: espace.l },
  ligne: {
    minHeight: CIBLE + 20,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    padding: espace.s,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  // La sélection se dit par le contour d'encre et la case, pas par le lime :
  // cocher n'est ni l'action ni un record.
  ligneCochee: { borderColor: couleurs.encreDouce },
  vignette: { width: 52, height: 52, borderRadius: 8, backgroundColor: couleurs.surface3 },
  sansImage: { alignItems: "center", justifyContent: "center" },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  sous: { color: couleurs.encrePale, fontSize: taille.petit },
  case: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  caseCochee: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
  pied: {
    padding: espace.l,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
  },
  ajouter: {
    minHeight: CIBLE + 8,
    borderRadius: 12,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  inactif: { opacity: 0.4 },
  ajouterTexte: { color: couleurs.surAccent, fontSize: taille.courant + 1, fontWeight: "700" },
});
