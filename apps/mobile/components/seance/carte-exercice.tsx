import { ATTRIBUTION_MEDIAS, type ExerciceEnCours } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { optionsExercice } from "../../lib/requetes";
import { couleurs, espace, taille } from "../../lib/theme";
import { UNITE } from "../../lib/unites";
import { LigneSerie } from "./ligne-serie";

export function CarteExercice({
  exercice,
  onModifierSerie,
  onValiderSerie,
  onAjouterSerie,
  onRetirer,
}: {
  exercice: ExerciceEnCours;
  onModifierSerie: (iS: number, patch: { reps?: number | null; chargeKg?: number | null }) => void;
  onValiderSerie: (iS: number) => void;
  onAjouterSerie: () => void;
  onRetirer: () => void;
}) {
  const faites = exercice.series.filter((s) => s.faite).length;
  // La fiche est en cache à vie (le catalogue ne change qu'au semis) : le GIF
  // d'un exercice déjà vu s'affiche même hors ligne, depuis le cache disque.
  const fiche = useQuery(optionsExercice(exercice.slug));
  const gif = fiche.data?.gif ?? null;
  const [grand, setGrand] = useState(false);
  return (
    <View style={styles.carte}>
      <View style={styles.entete}>
        {gif ? (
          <Pressable
            onPress={() => setGrand((g) => !g)}
            accessibilityRole="button"
            accessibilityLabel={grand ? "Réduire l'animation" : "Agrandir l'animation"}
          >
            <Image
              source={{ uri: gif }}
              style={styles.vignette}
              contentFit="contain"
              cachePolicy="disk"
              // En vignette, l'animation distrait : elle ne joue qu'agrandie.
              autoplay={false}
            />
          </Pressable>
        ) : null}
        <Text style={styles.nom}>{exercice.nom}</Text>
        <Text style={styles.compte}>
          {faites}/{exercice.series.length}
        </Text>
      </View>
      {grand && gif ? (
        <Pressable onPress={() => setGrand(false)} style={styles.media} accessibilityRole="button">
          <Image source={{ uri: gif }} style={styles.gif} contentFit="contain" cachePolicy="disk" />
          <Text style={styles.attribution}>{ATTRIBUTION_MEDIAS}</Text>
        </Pressable>
      ) : null}
      <View style={styles.colonnes}>
        <Text style={[styles.colonne, { width: 54 }]}>#</Text>
        <Text style={[styles.colonne, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colonne, { flex: 1 }]}>{UNITE}</Text>
        <Text style={[styles.colonne, { width: 48 }]} />
      </View>
      {exercice.series.map((s, i) => (
        <LigneSerie
          // Position = identité : les séries ne se réordonnent pas.
          key={i}
          numero={i + 1}
          serie={s}
          precedent={exercice.precedent?.[i]}
          onChange={(patch) => onModifierSerie(i, patch)}
          onValider={() => onValiderSerie(i)}
        />
      ))}
      <View style={styles.actions}>
        <Pressable onPress={onAjouterSerie} style={styles.action} accessibilityRole="button">
          <Text style={styles.actionTexte}>+ série</Text>
        </Pressable>
        <Pressable onPress={onRetirer} style={styles.action} accessibilityRole="button">
          <Text style={styles.retirer}>Retirer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.surface1,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: 12,
    padding: espace.m,
    gap: espace.xs,
  },
  entete: { flexDirection: "row", alignItems: "center", gap: espace.m, marginBottom: espace.xs },
  // Fond blanc : les GIF du dataset sont dessinés sur blanc.
  vignette: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#ffffff" },
  media: { alignItems: "center", gap: espace.xs, marginBottom: espace.s },
  gif: { width: 220, height: 220, borderRadius: 12, backgroundColor: "#ffffff" },
  attribution: { color: couleurs.encreFaible, fontSize: 11 },
  nom: { flex: 1, color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "600" },
  compte: { color: couleurs.encrePale, fontSize: taille.petit, fontVariant: ["tabular-nums"] },
  colonnes: { flexDirection: "row", gap: 10 },
  colonne: {
    color: couleurs.encreFaible,
    fontSize: 11,
    textTransform: "uppercase",
    textAlign: "center",
  },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: espace.xs },
  action: { minHeight: 40, justifyContent: "center", paddingHorizontal: espace.s },
  actionTexte: { color: couleurs.encreDouce, fontSize: taille.courant },
  retirer: { color: couleurs.encrePale, fontSize: taille.petit },
});
