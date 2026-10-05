import { filtrerCatalogue, LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Dumbbell, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chargement, Erreur, Vide } from "../components/ui/etats";
import { type ExerciceChoisi, rendreChoix } from "../lib/choix-exercices";
import { optionsCatalogueComplet } from "../lib/requetes";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../lib/theme";

/**
 * Choisir des exercices dans le catalogue (D93) : une recherche, et une
 * sélection multiple — on coche tout ce qu'on veut, puis on ajoute d'un coup.
 * En `?mode=remplacer`, un seul choix, rendu dès l'appui.
 */
export default function ChoisirExercices() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const unique = mode === "remplacer";
  const [filtre, setFiltre] = useState("");
  const [choix, setChoix] = useState<ExerciceChoisi[]>([]);
  // Le catalogue entier, filtré ici (D97) : la recherche marche hors ligne et
  // répond à chaque lettre sans aller-retour.
  const catalogue = useQuery(optionsCatalogueComplet());
  const resultats = useMemo(
    () => (catalogue.data ? filtrerCatalogue(catalogue.data, filtre) : []),
    [catalogue.data, filtre],
  );

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

      <View style={styles.recherche}>
        <Search size={18} color={couleurs.encreTertiaire} />
        <TextInput
          value={filtre}
          onChangeText={setFiltre}
          placeholder="Chercher un exercice"
          placeholderTextColor={couleurs.encreAttenuee}
          style={styles.champ}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Chercher un exercice"
        />
      </View>

      {/* Jamais chargé et hors ligne : la requête attend le réseau (D97). */}
      {catalogue.isPending && catalogue.fetchStatus === "paused" ? (
        <Vide
          titre="Hors ligne"
          message="Le catalogue se charge à la première connexion, puis reste sur le téléphone."
        />
      ) : catalogue.isPending ? (
        <Chargement />
      ) : catalogue.isError && !catalogue.data ? (
        <Erreur
          message="Le catalogue n'a pas pu être chargé. Il faut du réseau la première fois."
          onReessayer={() => catalogue.refetch()}
        />
      ) : resultats.length === 0 ? (
        <Vide titre="Aucun exercice trouvé" message={`Rien ne correspond à « ${filtre} ».`} />
      ) : (
        <FlatList
          data={resultats}
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
                    <Dumbbell size={20} color={couleurs.encreAttenuee} />
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
                    {coche ? <Check size={16} color={couleurs.canevas} strokeWidth={3} /> : null}
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

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
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
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    paddingHorizontal: espace.m,
  },
  champ: { flex: 1, height: "100%", color: couleurs.encre, fontSize: taille.courant },
  liste: { paddingHorizontal: espace.l, gap: espace.s, paddingBottom: espace.l },
  ligne: {
    minHeight: CIBLE + 20,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    padding: espace.s,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  // La sélection se dit par le contour d'encre et la case, pas par le lime :
  // cocher n'est ni l'action ni un record.
  ligneCochee: { borderColor: couleurs.encreSecondaire },
  // Fond blanc : les images du dataset sont dessinées sur blanc.
  vignette: {
    width: 52,
    height: 52,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.fondImage,
  },
  sansImage: { alignItems: "center", justifyContent: "center", backgroundColor: couleurs.surface3 },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  sous: { color: couleurs.encreTertiaire, fontSize: taille.petit },
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
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  inactif: { opacity: 0.4 },
  ajouterTexte: { color: couleurs.surAction, fontSize: taille.courant + 1, fontWeight: "700" },
}));
