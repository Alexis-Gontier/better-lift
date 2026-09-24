import {
  ABREGE_TYPE_SERIE,
  chargeEnTexte,
  formaterCharge,
  lireCharge,
  type SerieEnCours,
} from "@better-lift/shared";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CIBLE, couleurs, taille } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

/** Un entier de 0 à 999, ou vide ; `NaN` signale une saisie à corriger. */
function lireReps(t: string): number | null {
  const p = t.trim();
  if (p === "") return null;
  if (!/^\d+$/.test(p) || Number(p) > 999) return Number.NaN;
  return Number(p);
}

/**
 * Une série : deux grandes cases et un ✓ de 48 px — ce qu'un pouce vise entre
 * deux séries. Les cases gardent le TEXTE tapé et ne le valident qu'à la sortie
 * du champ : « 82, » ne doit pas disparaître avant qu'on ait tapé le 5.
 */
export function LigneSerie({
  numero,
  serie,
  precedent,
  onChange,
  onValider,
}: {
  numero: number;
  serie: SerieEnCours;
  /** Ce qui a été fait la dernière fois à cette position (D67). */
  precedent?: { reps: number | null; chargeKg: number | null; faite: boolean };
  onChange: (patch: { reps?: number | null; chargeKg?: number | null }) => void;
  onValider: () => void;
}) {
  const [reps, setReps] = useState(serie.reps === null ? "" : String(serie.reps));
  const [charge, setCharge] = useState(
    serie.chargeKg === null ? "" : chargeEnTexte(serie.chargeKg, SYSTEME_UNITES),
  );
  const repsKo = Number.isNaN(lireReps(reps));
  const chargeKo = Number.isNaN(lireCharge(charge, SYSTEME_UNITES));

  // Recopier la dernière fois : dans les cases ET dans la séance, d'un seul appui.
  const recopier = () => {
    if (!precedent?.faite) return;
    setReps(precedent.reps === null ? "" : String(precedent.reps));
    setCharge(precedent.chargeKg === null ? "" : chargeEnTexte(precedent.chargeKg, SYSTEME_UNITES));
    onChange({ reps: precedent.reps, chargeKg: precedent.chargeKg });
  };

  return (
    <View>
      <View style={[styles.ligne, serie.faite && styles.faite]}>
        <Text style={styles.numero}>{numero}</Text>
        <Text style={styles.type}>{ABREGE_TYPE_SERIE[serie.type]}</Text>
        <TextInput
          accessibilityLabel={`Série ${numero}, répétitions`}
          value={reps}
          onChangeText={setReps}
          onEndEditing={() => !repsKo && onChange({ reps: lireReps(reps) })}
          keyboardType="number-pad"
          placeholder="reps"
          placeholderTextColor={couleurs.encreFaible}
          style={[styles.case, repsKo && styles.caseKo]}
        />
        <TextInput
          accessibilityLabel={`Série ${numero}, charge`}
          value={charge}
          onChangeText={setCharge}
          onEndEditing={() =>
            !chargeKo && onChange({ chargeKg: lireCharge(charge, SYSTEME_UNITES) })
          }
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor={couleurs.encreFaible}
          style={[styles.case, chargeKo && styles.caseKo]}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: serie.faite }}
          accessibilityLabel={`Série ${numero} faite`}
          onPress={onValider}
          style={[styles.valider, serie.faite && styles.validerFait]}
        >
          <Text style={[styles.coche, serie.faite && styles.cocheFaite]}>✓</Text>
        </Pressable>
      </View>
      {/* Une INDICATION, pas une valeur (D59) : les cases gardent la cible. Un
          appui la recopie. Cible assez haute pour un pouce entre deux séries. */}
      {precedent?.faite ? (
        <Pressable
          onPress={recopier}
          accessibilityRole="button"
          accessibilityLabel={`Recopier la dernière fois pour la série ${numero}`}
          style={styles.precedent}
        >
          <Text style={styles.precedentTexte}>
            préc.{" "}
            {precedent.chargeKg === null
              ? `${precedent.reps ?? "—"} reps`
              : `${formaterCharge(precedent.chargeKg, SYSTEME_UNITES)} × ${precedent.reps ?? "—"}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  // Faite : le fond se teinte, sans aplat — l'aplat reste réservé à l'action.
  faite: { backgroundColor: couleurs.accentLavis, borderRadius: 8 },
  numero: { width: 20, color: couleurs.encreFaible, fontSize: taille.petit, textAlign: "center" },
  type: { width: 24, color: couleurs.encrePale, fontSize: taille.petit },
  case: {
    flex: 1,
    height: CIBLE,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: 8,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.grand,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  caseKo: { borderColor: couleurs.danger },
  // Sous les cases, aligné sur elles : 54 = numéro + type + écarts.
  precedent: { marginLeft: 54, minHeight: 28, justifyContent: "center" },
  precedentTexte: {
    color: couleurs.encrePale,
    fontSize: taille.petit,
    fontVariant: ["tabular-nums"],
  },
  valider: {
    width: CIBLE,
    height: CIBLE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  validerFait: { backgroundColor: couleurs.accent, borderColor: couleurs.accent },
  coche: { color: couleurs.encreFaible, fontSize: taille.grand, fontWeight: "700" },
  cocheFaite: { color: couleurs.surAccent },
});
