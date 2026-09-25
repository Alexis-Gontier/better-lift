import { chargeEnTexte, lireCharge, type SerieEnCours } from "@better-lift/shared";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { couleurs, espace } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

/** Un entier de 0 à 999, ou vide ; `NaN` signale une saisie à corriger. */
function lireReps(t: string): number | null {
  const p = t.trim();
  if (p === "") return null;
  if (!/^\d+$/.test(p) || Number(p) > 999) return Number.NaN;
  return Number(p);
}

/** Les largeurs des colonnes, partagées avec l'en-tête du tableau. */
export const COLONNES = { serie: 34, valider: 36 } as const;

/** La ligne « dernière fois » : « 82,5 × 6 », « 10 reps », ou un tiret. */
function textePrecedent(p?: { reps: number | null; chargeKg: number | null; faite: boolean }) {
  if (!p?.faite) return "—";
  if (p.chargeKg === null) return `${p.reps ?? "—"} reps`;
  return `${chargeEnTexte(p.chargeKg, SYSTEME_UNITES)} × ${p.reps ?? "—"}`;
}

/**
 * Une série sur UNE ligne (D87) : étiquette · précédent · charge · reps · ✓.
 * Les cases gardent le TEXTE tapé et ne le valident qu'à la sortie du champ :
 * « 82, » ne doit pas disparaître avant qu'on ait tapé le 5.
 */
export function LigneSerie({
  numero,
  etiquette,
  couleurEtiquette,
  serie,
  precedent,
  onChange,
  onValider,
  onEtiquette,
}: {
  numero: number;
  /** « 1 », « É », « D »… */
  etiquette: string;
  couleurEtiquette: string;
  serie: SerieEnCours;
  /** Ce qui a été fait la dernière fois à cette position (D67). */
  precedent?: { reps: number | null; chargeKg: number | null; faite: boolean };
  onChange: (patch: { reps?: number | null; chargeKg?: number | null }) => void;
  onValider: () => void;
  /** L'appui sur l'étiquette : type de série, suppression (D92). */
  onEtiquette: () => void;
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

  const faite = serie.faite;
  return (
    <View style={[styles.ligne, faite && styles.faite]}>
      <Pressable
        onPress={onEtiquette}
        hitSlop={6}
        style={styles.etiquette}
        accessibilityRole="button"
        accessibilityLabel={`Série ${numero} : type ou suppression`}
      >
        <Text style={[styles.etiquetteTexte, { color: couleurEtiquette }]}>{etiquette}</Text>
      </Pressable>
      {/* Une INDICATION, pas une valeur (D59) : les cases gardent la cible. Un
          appui la recopie. */}
      <Pressable
        onPress={recopier}
        disabled={!precedent?.faite}
        style={styles.precedent}
        accessibilityRole="button"
        accessibilityLabel={`Recopier la dernière fois pour la série ${numero}`}
      >
        <Text style={styles.precedentTexte} numberOfLines={1}>
          {textePrecedent(precedent)}
        </Text>
      </Pressable>
      <TextInput
        accessibilityLabel={`Série ${numero}, charge`}
        value={charge}
        onChangeText={setCharge}
        onEndEditing={() => !chargeKo && onChange({ chargeKg: lireCharge(charge, SYSTEME_UNITES) })}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={couleurs.encreFaible}
        selectTextOnFocus
        style={[styles.case, faite && styles.caseFaite, chargeKo && styles.caseKo]}
      />
      <TextInput
        accessibilityLabel={`Série ${numero}, répétitions`}
        value={reps}
        onChangeText={setReps}
        onEndEditing={() => !repsKo && onChange({ reps: lireReps(reps) })}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={couleurs.encreFaible}
        selectTextOnFocus
        style={[styles.case, faite && styles.caseFaite, repsKo && styles.caseKo]}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: faite }}
        accessibilityLabel={`Série ${numero} faite`}
        onPress={onValider}
        hitSlop={6}
        style={[styles.valider, faite && styles.validerFait]}
      >
        <Check
          size={18}
          strokeWidth={3}
          color={faite ? couleurs.surAccent : couleurs.encreFaible}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingVertical: 3,
    paddingHorizontal: espace.xs,
    borderRadius: 8,
  },
  // Faite : la ligne se teinte, sans aplat — l'aplat reste réservé à l'action.
  faite: { backgroundColor: couleurs.accentLavis },
  etiquette: {
    width: COLONNES.serie,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetteTexte: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  precedent: { flex: 1.25, height: 36, justifyContent: "center" },
  precedentTexte: { color: couleurs.encreFaible, fontSize: 14, fontVariant: ["tabular-nums"] },
  case: {
    flex: 1,
    height: 36,
    padding: 0,
    borderRadius: 8,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  // Faite, la case se fond dans la ligne teintée : on lit le chiffre, pas le champ.
  caseFaite: { backgroundColor: "transparent" },
  caseKo: { borderWidth: 1, borderColor: couleurs.danger },
  valider: {
    width: COLONNES.valider,
    height: 36,
    borderRadius: 8,
    backgroundColor: couleurs.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  validerFait: { backgroundColor: couleurs.accent },
});
