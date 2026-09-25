import {
  chargeInvalide,
  type ExerciceBrouillon,
  etiquettesSeries,
  LIBELLE_TYPE_SERIE,
  reposInvalide,
  repsInvalides,
  type SerieBrouillon,
  TYPES_SERIE,
} from "@better-lift/shared";
import { Image } from "expo-image";
import { Dumbbell, Ellipsis, GripVertical, Plus, X } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CIBLE, couleurs, espace, taille } from "../../lib/theme";
import { SYSTEME_UNITES, UNITE } from "../../lib/unites";

type Props = {
  exercice: ExerciceBrouillon;
  onChange: (e: ExerciceBrouillon) => void;
  onRetirer: () => void;
  /** Le glisser-déposer : la poignée le déclenche à l'appui long. */
  onGlisser: () => void;
  enGlissement: boolean;
};

/**
 * Un exercice en cours d'édition, à la Hevy : repos, puis les séries saisies sur
 * place. Reps et charge restent du texte tapé ; une saisie illisible se signale
 * par la bordure de danger, et bloque l'enregistrement sans rien perdre.
 */
export function CarteExerciceEdition({
  exercice: e,
  onChange,
  onRetirer,
  onGlisser,
  enGlissement,
}: Props) {
  const etiquettes = etiquettesSeries(e.series.map((s) => s.type));
  const changerSerie = (i: number, s: Partial<SerieBrouillon>) =>
    onChange({ ...e, series: e.series.map((x, j) => (j === i ? { ...x, ...s } : x)) });

  const choisirType = (i: number) =>
    Alert.alert(
      "Type de série",
      undefined,
      [
        ...TYPES_SERIE.map((t) => ({
          text: LIBELLE_TYPE_SERIE[t],
          onPress: () => changerSerie(i, { type: t }),
        })),
        { text: "Annuler", style: "cancel" as const },
      ],
      { cancelable: true },
    );

  const menu = () =>
    Alert.alert(e.nom, undefined, [
      { text: "Retirer l'exercice", style: "destructive", onPress: onRetirer },
      { text: "Annuler", style: "cancel" },
    ]);

  return (
    <View style={[styles.carte, enGlissement && styles.glisse]}>
      <View style={styles.entete}>
        <Pressable
          onLongPress={onGlisser}
          delayLongPress={200}
          style={styles.poignee}
          accessibilityRole="button"
          accessibilityLabel="Déplacer l'exercice (appui long)"
        >
          <GripVertical size={20} color={couleurs.encreFaible} />
        </Pressable>
        {e.image ? (
          <Image
            source={{ uri: e.image }}
            style={styles.vignette}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <View style={[styles.vignette, styles.sansImage]}>
            <Dumbbell size={18} color={couleurs.encreFaible} />
          </View>
        )}
        <Text style={styles.nom} numberOfLines={2}>
          {e.nom}
        </Text>
        <Pressable
          onPress={menu}
          style={styles.icone}
          accessibilityRole="button"
          accessibilityLabel={`Options de ${e.nom}`}
        >
          <Ellipsis size={20} color={couleurs.encreDouce} />
        </Pressable>
      </View>

      <View style={styles.repos}>
        <Text style={styles.libelle}>Repos</Text>
        <TextInput
          value={e.repos}
          onChangeText={(repos) => onChange({ ...e, repos })}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={couleurs.encreFaible}
          style={[styles.champ, styles.champRepos, reposInvalide(e.repos) && styles.invalide]}
          accessibilityLabel="Repos en secondes"
        />
        <Text style={styles.unite}>s</Text>
      </View>

      <View style={styles.enteteSeries}>
        <Text style={[styles.colonne, styles.colSerie]}>Série</Text>
        <Text style={[styles.colonne, styles.colValeur]}>{UNITE}</Text>
        <Text style={[styles.colonne, styles.colValeur]}>Reps</Text>
        <View style={styles.colRetirer} />
      </View>
      {e.series.map((s, i) => (
        // Les séries n'ont pas d'identité propre : leur rang en tient lieu.
        <View key={i} style={styles.serie}>
          <Pressable
            onPress={() => choisirType(i)}
            style={[styles.etiquette, styles.colSerie]}
            accessibilityRole="button"
            accessibilityLabel={`Série ${etiquettes[i]}, ${LIBELLE_TYPE_SERIE[s.type]} — changer le type`}
          >
            <Text
              style={[
                styles.etiquetteTexte,
                s.type === "ECHAUFFEMENT" && { color: couleurs.encrePale },
                s.type === "ECHEC" && { color: couleurs.dangerEncre },
              ]}
            >
              {etiquettes[i]}
            </Text>
          </Pressable>
          <TextInput
            value={s.charge}
            onChangeText={(charge) => changerSerie(i, { charge })}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={couleurs.encreFaible}
            style={[
              styles.champ,
              styles.colValeur,
              chargeInvalide(s.charge, SYSTEME_UNITES) && styles.invalide,
            ]}
            accessibilityLabel={`Charge de la série ${etiquettes[i]}`}
          />
          <TextInput
            value={s.reps}
            onChangeText={(reps) => changerSerie(i, { reps })}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={couleurs.encreFaible}
            style={[styles.champ, styles.colValeur, repsInvalides(s.reps) && styles.invalide]}
            accessibilityLabel={`Répétitions de la série ${etiquettes[i]}`}
          />
          <Pressable
            onPress={() => onChange({ ...e, series: e.series.filter((_, j) => j !== i) })}
            style={[styles.icone, styles.colRetirer]}
            accessibilityRole="button"
            accessibilityLabel={`Retirer la série ${etiquettes[i]}`}
          >
            <X size={18} color={couleurs.encreFaible} />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={() => {
          // La nouvelle série reprend la dernière : on enchaîne souvent à l'identique.
          const derniere = e.series.at(-1) ?? { type: "NORMALE" as const, reps: "", charge: "" };
          onChange({ ...e, series: [...e.series, { ...derniere }] });
        }}
        style={styles.ajouterSerie}
        accessibilityRole="button"
      >
        <Plus size={18} color={couleurs.encreDouce} />
        <Text style={styles.ajouterSerieTexte}>Ajouter une série</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
    paddingBottom: espace.xs,
    marginBottom: espace.m,
  },
  glisse: { borderColor: couleurs.encreDouce, backgroundColor: couleurs.surface2 },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingRight: espace.xs,
    paddingVertical: espace.s,
  },
  poignee: { width: 36, height: CIBLE, alignItems: "center", justifyContent: "center" },
  vignette: { width: 44, height: 44, borderRadius: 8, backgroundColor: couleurs.surface3 },
  sansImage: { alignItems: "center", justifyContent: "center" },
  nom: { flex: 1, color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  icone: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  repos: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingHorizontal: espace.m,
    paddingBottom: espace.s,
  },
  libelle: { color: couleurs.encrePale, fontSize: taille.petit + 1 },
  unite: { color: couleurs.encrePale, fontSize: taille.petit + 1 },
  enteteSeries: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingHorizontal: espace.m,
    paddingVertical: espace.xs,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
  },
  colonne: { color: couleurs.encreFaible, fontSize: taille.petit, textAlign: "center" },
  colSerie: { width: 44 },
  colValeur: { flex: 1 },
  colRetirer: { width: CIBLE },
  serie: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingHorizontal: espace.m,
    paddingVertical: 3,
  },
  etiquette: {
    height: 40,
    borderRadius: 8,
    backgroundColor: couleurs.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetteTexte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  champ: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.courant,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    paddingVertical: 0,
  },
  champRepos: { width: 72 },
  invalide: { borderColor: couleurs.danger },
  ajouterSerie: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
  },
  ajouterSerieTexte: { color: couleurs.encreDouce, fontSize: taille.courant, fontWeight: "600" },
});
