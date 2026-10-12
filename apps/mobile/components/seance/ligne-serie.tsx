import { type ChampSaisie, chargeEnTexte, type SerieEnCours } from "@better-lift/shared";
import { Check } from "lucide-react-native";
import { type Ref, useRef } from "react";
import { Text, TextInput, View } from "react-native";
import {
  creerStyles,
  espace,
  PLAFOND_TEXTE_DENSE,
  rayon,
  taille,
  useCouleurs,
} from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { vibrer } from "../../lib/vibrations";
import { Appuyable } from "../ui/appuyable";

/** Les largeurs des colonnes, partagées avec l'en-tête du tableau. */
// 40 : « SÉRIE » ne tient pas sur 34.
export const COLONNES = { serie: 40, valider: 40 } as const;

/**
 * Les états d'une ligne (D116), comme une case à cocher : à faire, la case est
 * VIDE ; faite, elle porte la ✓ pleine à l'encre et la ligne se teinte. La
 * prochaine se repère par un liseré et un contour épais — pas d'orange : une ✓
 * colorée se lit « fait », et l'ancienne ✓ lime de la prochaine série se lisait
 * cochée avant de l'être. Les cibles à venir restent en valeurs fantômes.
 */
export type EtatSerie = "faite" | "prochaine" | "a-venir";

/** La ligne « dernière fois » : « 82,5 × 6 », « 10 reps », ou un tiret. */
function textePrecedent(p?: { reps: number | null; chargeKg: number | null; faite: boolean }) {
  if (!p?.faite) return "—";
  if (p.chargeKg === null) return `${p.reps ?? "—"} reps`;
  return `${chargeEnTexte(p.chargeKg, SYSTEME_UNITES)} × ${p.reps ?? "—"}`;
}

/**
 * Une série sur UNE ligne (D87) : étiquette · précédent · charge · reps · ✓.
 * Les cases sont des champs au clavier du téléphone (D184) : « Suivant » passe
 * de la charge aux reps, la fin de saisie écrit dans la séance. L'écran tient le
 * texte en cours.
 */
export function LigneSerie({
  numero,
  etiquette,
  couleurEtiquette,
  serie,
  etat,
  precedent,
  edition,
  onEditer,
  onTexte,
  onFermer,
  onChange,
  onValider,
  onEtiquette,
}: {
  numero: number;
  /** « 1 », « É », « D »… */
  etiquette: string;
  couleurEtiquette: string;
  serie: SerieEnCours;
  etat: EtatSerie;
  /** Ce qui a été fait la dernière fois à cette position (D67). */
  precedent?: { reps: number | null; chargeKg: number | null; faite: boolean };
  /** La case en cours de saisie, et son texte. */
  edition: { champ: ChampSaisie; texte: string; invalide: boolean } | null;
  /** Une case prend le focus : la saisie commence. */
  onEditer: (champ: ChampSaisie) => void;
  /** Le texte tapé, à chaque touche. */
  onTexte: (texte: string) => void;
  /** La case perd le focus : la saisie s'écrit dans la séance. */
  onFermer: () => void;
  onChange: (patch: { reps?: number | null; chargeKg?: number | null }) => void;
  onValider: () => void;
  /** L'appui sur l'étiquette : type de série, suppression (D92). */
  onEtiquette: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const champReps = useRef<TextInput>(null);

  // Recopier la dernière fois dans la séance, d'un seul appui.
  const recopier = () => {
    if (!precedent?.faite) return;
    onChange({ reps: precedent.reps, chargeKg: precedent.chargeKg });
    vibrer.selection();
  };

  const valider = () => {
    // Décocher se sent aussi, plus légèrement : un second appui par erreur ne
    // doit pas passer inaperçu.
    if (serie.faite) vibrer.selection();
    else vibrer.valider();
    onValider();
  };

  const faite = etat === "faite";
  const prochaine = etat === "prochaine";
  // Une série à venir montre ses CIBLES en fantôme ; une valeur saisie, elle,
  // s'écrit à l'encre, case par case (`saisi`).
  const aVenir = etat === "a-venir";
  return (
    <View style={[styles.ligne, faite && styles.faite]}>
      {/* La ligne à faire : un liseré, là où l'œil revient entre deux séries. */}
      {prochaine ? <View style={styles.repere} /> : null}
      <Appuyable
        onPress={onEtiquette}
        hitSlop={6}
        style={styles.etiquette}
        accessibilityRole="button"
        accessibilityLabel={`Série ${numero} : type ou suppression`}
      >
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          style={[styles.etiquetteTexte, { color: couleurEtiquette }]}
        >
          {etiquette}
        </Text>
      </Appuyable>
      {/* Une INDICATION, pas une valeur (D59) : les cases gardent la cible. Un
          appui la recopie. */}
      <Appuyable
        onPress={recopier}
        disabled={!precedent?.faite}
        style={styles.precedent}
        accessibilityRole="button"
        accessibilityLabel={`Recopier la dernière fois pour la série ${numero}`}
      >
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          style={styles.precedentTexte}
          numberOfLines={1}
        >
          {textePrecedent(precedent)}
        </Text>
      </Appuyable>
      <Case
        libelle={`Série ${numero}, charge`}
        texte={
          edition?.champ === "charge"
            ? edition.texte
            : serie.chargeKg === null
              ? ""
              : chargeEnTexte(serie.chargeKg, SYSTEME_UNITES)
        }
        editee={edition?.champ === "charge"}
        invalide={edition?.champ === "charge" && edition.invalide}
        fantome={aVenir && !serie.saisi?.chargeKg}
        faite={faite}
        clavier="decimal-pad"
        onFocus={() => onEditer("charge")}
        onChangeText={onTexte}
        onBlur={onFermer}
        // « Suivant » : la charge passe aux reps, le clavier reste ouvert.
        onSuivant={() => champReps.current?.focus()}
      />
      <Case
        libelle={`Série ${numero}, répétitions`}
        texte={
          edition?.champ === "reps" ? edition.texte : serie.reps === null ? "" : String(serie.reps)
        }
        editee={edition?.champ === "reps"}
        invalide={edition?.champ === "reps" && edition.invalide}
        fantome={aVenir && !serie.saisi?.reps}
        faite={faite}
        clavier="number-pad"
        ref={champReps}
        onFocus={() => onEditer("reps")}
        onChangeText={onTexte}
        onBlur={onFermer}
      />
      <Appuyable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: faite }}
        accessibilityLabel={`Série ${numero} faite`}
        onPress={valider}
        hitSlop={4}
        style={[styles.valider, prochaine && styles.validerProchaine, faite && styles.validerFait]}
      >
        {faite ? <Check size={20} strokeWidth={3} color={couleurs.canevas} /> : null}
      </Appuyable>
    </View>
  );
}

/**
 * Une case kg ou reps, au clavier du téléphone (D184). Au focus, tout le texte
 * est sélectionné : la première touche remplace la valeur, comme le pavé de
 * D109. En saisie, elle est cerclée d'encre ; invalide, de rouge.
 */
function Case({
  libelle,
  texte,
  editee,
  invalide,
  fantome,
  faite,
  clavier,
  ref,
  onFocus,
  onChangeText,
  onBlur,
  onSuivant,
}: {
  libelle: string;
  texte: string;
  editee: boolean;
  invalide: boolean;
  fantome: boolean;
  faite: boolean;
  clavier: "decimal-pad" | "number-pad";
  ref?: Ref<TextInput>;
  onFocus: () => void;
  onChangeText: (texte: string) => void;
  onBlur: () => void;
  /** Absent : la touche du clavier ferme la saisie. */
  onSuivant?: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <TextInput
      ref={ref}
      value={texte}
      placeholder="—"
      placeholderTextColor={couleurs.encreTertiaire}
      keyboardType={clavier}
      returnKeyType={onSuivant ? "next" : "done"}
      submitBehavior={onSuivant ? "submit" : "blurAndSubmit"}
      onSubmitEditing={onSuivant}
      selectTextOnFocus
      onFocus={onFocus}
      onChangeText={onChangeText}
      onBlur={onBlur}
      maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
      numberOfLines={1}
      accessibilityLabel={libelle}
      // Une case a toujours son fond : on la voit comme un champ, même faite.
      style={[
        styles.case,
        styles.caseTexte,
        fantome && !editee && styles.caseFantome,
        faite && styles.caseFaite,
        editee && styles.caseEditee,
        invalide && styles.caseKo,
      ]}
    />
  );
}

// Ligne de 52 : cases visibles de 40, `hitSlop` de 4 pour une cible de 48 (D104).
const useStyles = creerStyles((couleurs) => ({
  ligne: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingHorizontal: espace.xs,
    borderRadius: rayon.cellule,
  },
  // Faite : la ligne se teinte nettement, sans orange — l'orange reste à l'action.
  faite: { backgroundColor: couleurs.ligneFaite },
  etiquette: {
    width: COLONNES.serie,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetteTexte: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  precedent: { flex: 1.25, height: 40, justifyContent: "center" },
  precedentTexte: {
    color: couleurs.encreTertiaire,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  case: {
    flex: 1,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: espace.xs,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface2,
    textAlign: "center",
  },
  caseTexte: {
    color: couleurs.encre,
    fontSize: taille.valeur,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  // En saisie : cerclée d'encre (D108).
  caseEditee: { borderWidth: 2, borderColor: couleurs.encre },
  // À venir : les cibles se lisent, en retrait, jusqu'à ce qu'on y arrive.
  caseFantome: { color: couleurs.encreTertiaire },
  // Faite, la case se fond dans la ligne teintée : on lit le chiffre, pas le champ.
  caseFaite: { backgroundColor: "transparent" },
  caseKo: { borderWidth: 2, borderColor: couleurs.dangerEncre },
  // À faire : une case vide, au contour lisible (3:1 au moins, une commande).
  valider: {
    width: COLONNES.valider,
    height: 40,
    borderRadius: rayon.cellule,
    borderWidth: 1.5,
    borderColor: couleurs.encreAttenuee,
    alignItems: "center",
    justifyContent: "center",
  },
  // La prochaine : même case vide, contour épais à l'encre.
  validerProchaine: { borderWidth: 2.5, borderColor: couleurs.encre },
  // Faite : ✓ pleine, à l'encre.
  validerFait: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
  repere: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: couleurs.encre,
  },
}));
