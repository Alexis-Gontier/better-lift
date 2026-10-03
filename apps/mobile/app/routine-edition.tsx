import {
  type Brouillon,
  brouillonValide,
  empreinte,
  nouvelExercice,
  type RoutineDetail,
  versBrouillon,
  versSaisie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ellipsis, Plus } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteExerciceEdition } from "../components/routines/carte-exercice-edition";
import { Chargement, Erreur } from "../components/ui/etats";
import { attendreChoix } from "../lib/choix-exercices";
import {
  optionsRoutine,
  useCreerRoutine,
  useRemplacerRoutine,
  useSupprimerRoutine,
} from "../lib/requetes";
import { CIBLE, couleurs, espace, taille } from "../lib/theme";
import { SYSTEME_UNITES } from "../lib/unites";

/**
 * Créer ou modifier une routine sur le téléphone (D82), à la Hevy. Avec `id`,
 * on modifie ; sans, on crée. Plein écran, hors des onglets.
 */
export default function RoutineEdition() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!id) return <Editeur id={null} initiale={null} />;
  return <EditeurExistant id={id} />;
}

function EditeurExistant({ id }: { id: string }) {
  const routine = useQuery(optionsRoutine(id));
  if (routine.isPending) {
    return (
      <SafeAreaView style={styles.ecran}>
        <Chargement />
      </SafeAreaView>
    );
  }
  if (routine.isError && !routine.data) {
    return (
      <SafeAreaView style={styles.ecran}>
        <Erreur
          message="Cette routine n'a pas pu être chargée."
          onReessayer={() => routine.refetch()}
        />
      </SafeAreaView>
    );
  }
  return <Editeur id={id} initiale={routine.data} />;
}

function Editeur({ id, initiale }: { id: string | null; initiale: RoutineDetail | null }) {
  const router = useRouter();
  const navigation = useNavigation();
  const creer = useCreerRoutine();
  const remplacer = useRemplacerRoutine(id ?? "");
  const supprimer = useSupprimerRoutine();

  const [brouillon, setBrouillon] = useState<Brouillon>(() =>
    versBrouillon(initiale, SYSTEME_UNITES),
  );
  const reference = useMemo(() => empreinte(versBrouillon(initiale, SYSTEME_UNITES)), [initiale]);
  const modifiee = empreinte(brouillon) !== reference;
  const valide = brouillonValide(brouillon, SYSTEME_UNITES);
  const enCours = creer.isPending || remplacer.isPending || supprimer.isPending;
  const erreur = creer.error ?? remplacer.error ?? supprimer.error;

  // Une sortie voulue (enregistrer, supprimer) ne demande pas confirmation.
  const sortieAutorisee = useRef(false);

  // Quitter avec des changements — retour, geste ou Annuler — demande confirmation.
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (!modifiee || sortieAutorisee.current) return;
        e.preventDefault();
        Alert.alert("Abandonner les modifications ?", "Elles ne seront pas enregistrées.", [
          { text: "Continuer l'édition", style: "cancel" },
          {
            text: "Abandonner",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]);
      }),
    [navigation, modifiee],
  );

  const enregistrer = () => {
    const saisie = versSaisie(brouillon, SYSTEME_UNITES);
    const sortir = () => {
      sortieAutorisee.current = true;
    };
    if (id) {
      remplacer.mutate(saisie, {
        onSuccess: () => {
          sortir();
          router.back();
        },
      });
    } else {
      creer.mutate(saisie, {
        onSuccess: (nouvelId) => {
          sortir();
          // La routine existe : on passe sur sa page plutôt que de revenir à la liste.
          router.replace({ pathname: "/routines/[id]", params: { id: nouvelId } });
        },
      });
    }
  };

  const confirmerSuppression = () => {
    if (!id) return;
    Alert.alert(
      "Supprimer la routine ?",
      `« ${brouillon.nom || initiale?.nom} » disparaîtra. Tes séances passées restent.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () =>
            supprimer.mutate(id, {
              onSuccess: () => {
                sortieAutorisee.current = true;
                router.dismissTo("/routines");
              },
            }),
        },
      ],
    );
  };

  const ajouterExercices = () => {
    attendreChoix((choix) =>
      setBrouillon((b) => ({
        ...b,
        exercices: [...b.exercices, ...choix.map((c) => nouvelExercice(c.slug, c.nom, c.image))],
      })),
    );
    router.push("/choisir-exercices");
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top", "bottom"]}>
      <View style={styles.entete}>
        <Pressable
          onPress={() => router.back()}
          style={styles.texteBouton}
          accessibilityRole="button"
        >
          <Text style={styles.annuler}>Annuler</Text>
        </Pressable>
        <Text style={styles.titre} numberOfLines={1}>
          {id ? "Modifier" : "Nouvelle routine"}
        </Text>
        {id ? (
          <Pressable
            onPress={confirmerSuppression}
            style={styles.icone}
            accessibilityRole="button"
            accessibilityLabel="Options de la routine"
          >
            <Ellipsis size={22} color={couleurs.encreDouce} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={enregistrer}
          disabled={!valide || !modifiee || enCours}
          style={[styles.enregistrer, (!valide || !modifiee || enCours) && styles.inactif]}
          accessibilityRole="button"
        >
          {enCours ? (
            <ActivityIndicator color={couleurs.surAccent} />
          ) : (
            <Text style={styles.enregistrerTexte}>Enregistrer</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <DraggableFlatList
          data={brouillon.exercices}
          keyExtractor={(e) => e.cle}
          onDragEnd={({ data }) => setBrouillon((b) => ({ ...b, exercices: data }))}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.enTete}>
              <TextInput
                value={brouillon.nom}
                onChangeText={(nom) => setBrouillon((b) => ({ ...b, nom }))}
                placeholder="Nom de la routine"
                placeholderTextColor={couleurs.encreFaible}
                style={styles.nom}
                accessibilityLabel="Nom de la routine"
                maxLength={120}
              />
              {erreur ? (
                <Text style={styles.erreur} accessibilityRole="alert">
                  {erreur.message}
                </Text>
              ) : null}
              {brouillon.exercices.length === 0 ? (
                <Text style={styles.aide}>
                  Une routine a besoin d'au moins un exercice. Ajoute-les ci-dessous.
                </Text>
              ) : (
                <Text style={styles.aide}>Appui long sur ⋮⋮ pour changer l'ordre.</Text>
              )}
            </View>
          }
          renderItem={({ item, drag, isActive }) => (
            <CarteExerciceEdition
              exercice={item}
              enGlissement={isActive}
              onGlisser={drag}
              onChange={(e) =>
                setBrouillon((b) => ({
                  ...b,
                  exercices: b.exercices.map((x) => (x.cle === e.cle ? e : x)),
                }))
              }
              onRetirer={() =>
                setBrouillon((b) => ({
                  ...b,
                  exercices: b.exercices.filter((x) => x.cle !== item.cle),
                }))
              }
            />
          )}
          ListFooterComponent={
            <Pressable onPress={ajouterExercices} style={styles.ajouter} accessibilityRole="button">
              <Plus size={20} color={couleurs.encre} />
              <Text style={styles.ajouterTexte}>Ajouter des exercices</Text>
            </Pressable>
          }
        />
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  texteBouton: { minHeight: CIBLE, justifyContent: "center", paddingHorizontal: espace.s },
  annuler: { color: couleurs.encreDouce, fontSize: taille.courant },
  titre: {
    flex: 1,
    color: couleurs.encre,
    fontSize: taille.courant + 1,
    fontWeight: "700",
    textAlign: "center",
  },
  icone: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  // L'action de l'écran : l'aplat lime (D28).
  enregistrer: {
    minHeight: 40,
    minWidth: 112,
    paddingHorizontal: espace.m,
    borderRadius: 10,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  enregistrerTexte: { color: couleurs.surAccent, fontSize: taille.courant, fontWeight: "700" },
  inactif: { opacity: 0.4 },
  contenu: { padding: espace.l, paddingBottom: espace.xl * 2 },
  enTete: { gap: espace.s, marginBottom: espace.m },
  nom: {
    minHeight: CIBLE + 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
    color: couleurs.encre,
    fontSize: taille.grand,
    fontWeight: "600",
    paddingHorizontal: espace.m,
  },
  erreur: { color: couleurs.dangerEncre, fontSize: taille.petit + 1 },
  aide: { color: couleurs.encreFaible, fontSize: taille.petit },
  ajouter: {
    minHeight: CIBLE + 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
  },
  ajouterTexte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
});
