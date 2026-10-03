import {
  ABREGE_TYPE_SERIE,
  ATTRIBUTION_MEDIAS,
  type ExerciceEnCours,
  LIBELLE_TYPE_SERIE,
  type SerieEnCours,
  TYPES_SERIE,
  type TypeSerie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ArrowUpDown,
  Check,
  Dumbbell,
  Ellipsis,
  Link2,
  Plus,
  Repeat,
  Timer,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { optionsExercice } from "../../lib/requetes";
import { CHOIX_REPOS, libelleRepos } from "../../lib/temps";
import { couleurs, espace, taille } from "../../lib/theme";
import { UNITE } from "../../lib/unites";
import { Feuille, type OptionFeuille } from "../ui/feuille";
import { COLONNES, LigneSerie } from "./ligne-serie";

/**
 * Les étiquettes des séries (D92) : les normales se numérotent entre elles, les
 * autres portent leur lettre — l'échauffement ne décale pas « série 1 ».
 */
function etiquettes(series: SerieEnCours[]): string[] {
  let n = 0;
  return series.map((s) => (s.type === "NORMALE" ? String(++n) : ABREGE_TYPE_SERIE[s.type]));
}

type Feuilles = { quoi: "menu" } | { quoi: "repos" } | { quoi: "serie"; iS: number } | null;

/**
 * Un exercice de la séance, à la Hevy (D86) : un bloc pleine largeur — en-tête,
 * note, repos, tableau des séries — et les actions rares dans le menu ⋯.
 */
export function CarteExercice({
  exercice,
  onModifierSerie,
  onValiderSerie,
  onAjouterSerie,
  onRetirerSerie,
  onNote,
  onRepos,
  onReorganiser,
  onRemplacer,
  onRetirer,
}: {
  exercice: ExerciceEnCours;
  onModifierSerie: (
    iS: number,
    patch: { reps?: number | null; chargeKg?: number | null; type?: TypeSerie },
  ) => void;
  onValiderSerie: (iS: number) => void;
  onAjouterSerie: () => void;
  onRetirerSerie: (iS: number) => void;
  onNote: (note: string) => void;
  onRepos: (reposSec: number | null) => void;
  onReorganiser: () => void;
  onRemplacer: () => void;
  onRetirer: () => void;
}) {
  // La fiche est en cache à vie (le catalogue ne change qu'au semis) : le GIF
  // d'un exercice déjà vu s'affiche même hors ligne, depuis le cache disque.
  const fiche = useQuery(optionsExercice(exercice.slug));
  const gif = fiche.data?.gif ?? null;
  const [grand, setGrand] = useState(false);
  const [note, setNote] = useState(exercice.note ?? "");
  const [feuille, setFeuille] = useState<Feuilles>(null);
  const libelles = etiquettes(exercice.series);

  const retirer = () =>
    Alert.alert(`Retirer « ${exercice.nom} » ?`, "Ses séries seront perdues.", [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: onRetirer },
    ]);

  const options: OptionFeuille[] =
    feuille?.quoi === "menu"
      ? [
          { libelle: "Réorganiser les exercices", icone: ArrowUpDown, onPress: onReorganiser },
          { libelle: "Remplacer l'exercice", icone: Repeat, onPress: onRemplacer },
          // Lot B : le superset attend son modèle de séance.
          { libelle: "Ajouter à un superset", icone: Link2, inactive: "bientôt" },
          { libelle: "Retirer l'exercice", icone: Trash2, danger: true, onPress: retirer },
        ]
      : feuille?.quoi === "repos"
        ? CHOIX_REPOS.map((sec) => ({
            libelle: sec === null ? "Désactivé" : libelleRepos(sec),
            choisie: (exercice.reposSec ?? null) === sec,
            onPress: () => onRepos(sec),
          }))
        : feuille?.quoi === "serie"
          ? [
              ...TYPES_SERIE.map((type) => ({
                libelle: LIBELLE_TYPE_SERIE[type],
                choisie: exercice.series[feuille.iS]?.type === type,
                onPress: () => onModifierSerie(feuille.iS, { type }),
              })),
              {
                libelle: "Supprimer la série",
                icone: Trash2,
                danger: true,
                onPress: () => onRetirerSerie(feuille.iS),
              },
            ]
          : [];

  const titreFeuille =
    feuille?.quoi === "repos"
      ? "Repos après chaque série"
      : feuille?.quoi === "serie"
        ? `Série ${libelles[feuille.iS]}`
        : exercice.nom;

  return (
    <View style={styles.bloc}>
      <View style={styles.entete}>
        <Pressable
          onPress={() => gif && setGrand((g) => !g)}
          accessibilityRole="button"
          accessibilityLabel={grand ? "Réduire l'animation" : "Agrandir l'animation"}
        >
          {gif ? (
            <Image
              source={{ uri: gif }}
              style={styles.vignette}
              contentFit="cover"
              cachePolicy="disk"
              // En vignette, l'animation distrait : elle ne joue qu'agrandie.
              autoplay={false}
            />
          ) : (
            <View style={[styles.vignette, styles.sansImage]}>
              <Dumbbell size={18} color={couleurs.encreFaible} />
            </View>
          )}
        </Pressable>
        <Text style={styles.nom} numberOfLines={2}>
          {exercice.nom}
        </Text>
        <Pressable
          onPress={() => setFeuille({ quoi: "menu" })}
          hitSlop={8}
          style={styles.menu}
          accessibilityRole="button"
          accessibilityLabel={`Actions pour ${exercice.nom}`}
        >
          <Ellipsis size={20} color={couleurs.encreDouce} />
        </Pressable>
      </View>

      {grand && gif ? (
        <Pressable onPress={() => setGrand(false)} style={styles.media} accessibilityRole="button">
          <Image source={{ uri: gif }} style={styles.gif} contentFit="contain" cachePolicy="disk" />
          <Text style={styles.attribution}>{ATTRIBUTION_MEDIAS}</Text>
        </Pressable>
      ) : null}

      {/* D90 : la note s'écrit à chaque frappe. Pas à la sortie du champ : un
          appui sur ✓ garde le clavier ouvert, et la note ne sortirait jamais. */}
      <TextInput
        value={note}
        onChangeText={(t) => {
          setNote(t);
          onNote(t);
        }}
        placeholder="Ajouter une note…"
        placeholderTextColor={couleurs.encreFaible}
        multiline
        maxLength={500}
        style={styles.note}
        accessibilityLabel={`Note pour ${exercice.nom}`}
      />

      <Pressable
        onPress={() => setFeuille({ quoi: "repos" })}
        style={styles.repos}
        hitSlop={4}
        accessibilityRole="button"
      >
        <Timer size={16} color={exercice.reposSec ? couleurs.encreDouce : couleurs.encreFaible} />
        <Text style={[styles.reposTexte, !exercice.reposSec && styles.reposEteint]}>
          Repos : {libelleRepos(exercice.reposSec)}
        </Text>
      </Pressable>

      <View style={styles.colonnes}>
        <Text style={[styles.colonne, { width: COLONNES.serie }]}>Série</Text>
        <Text style={[styles.colonne, styles.gauche, { flex: 1.25 }]}>Précédent</Text>
        <Text style={[styles.colonne, { flex: 1 }]}>{UNITE}</Text>
        <Text style={[styles.colonne, { flex: 1 }]}>Reps</Text>
        <View style={{ width: COLONNES.valider, alignItems: "center" }}>
          <Check size={14} color={couleurs.encreFaible} strokeWidth={3} />
        </View>
      </View>

      {exercice.series.map((s, i) => (
        <LigneSerie
          // Les cases gardent leur texte : une suppression doit les remonter,
          // sans quoi la ligne suivante hériterait du texte de la supprimée.
          key={`${i}-${exercice.series.length}`}
          numero={i + 1}
          etiquette={libelles[i] ?? String(i + 1)}
          couleurEtiquette={s.type === "NORMALE" ? couleurs.encre : couleurs.encrePale}
          serie={s}
          precedent={exercice.precedent?.[i]}
          onChange={(patch) => onModifierSerie(i, patch)}
          onValider={() => onValiderSerie(i)}
          onEtiquette={() => setFeuille({ quoi: "serie", iS: i })}
        />
      ))}

      <Pressable onPress={onAjouterSerie} style={styles.ajouter} accessibilityRole="button">
        <Plus size={16} color={couleurs.encreDouce} strokeWidth={2.4} />
        <Text style={styles.ajouterTexte}>Ajouter une série</Text>
      </Pressable>

      <Feuille
        visible={feuille !== null}
        titre={titreFeuille}
        options={options}
        onFermer={() => setFeuille(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    paddingHorizontal: espace.m,
    paddingVertical: espace.l,
    gap: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  entete: { flexDirection: "row", alignItems: "center", gap: espace.m },
  // Fond blanc : les GIF du dataset sont dessinés sur blanc.
  vignette: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff" },
  sansImage: { backgroundColor: couleurs.surface3, alignItems: "center", justifyContent: "center" },
  nom: { flex: 1, color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "700" },
  menu: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  media: { alignItems: "center", gap: espace.xs },
  gif: { width: 220, height: 220, borderRadius: 12, backgroundColor: "#ffffff" },
  attribution: { color: couleurs.encreFaible, fontSize: 11 },
  note: {
    color: couleurs.encreDouce,
    fontSize: 14,
    padding: 0,
    paddingVertical: 2,
  },
  repos: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  reposTexte: { color: couleurs.encreDouce, fontSize: 14, fontWeight: "600" },
  reposEteint: { color: couleurs.encreFaible, fontWeight: "400" },
  colonnes: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingHorizontal: espace.xs,
    marginTop: espace.xs,
  },
  colonne: {
    color: couleurs.encreFaible,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  gauche: { textAlign: "left" },
  ajouter: {
    height: 36,
    marginTop: espace.xs,
    borderRadius: 8,
    backgroundColor: couleurs.surface2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ajouterTexte: { color: couleurs.encreDouce, fontSize: 14, fontWeight: "600" },
});
