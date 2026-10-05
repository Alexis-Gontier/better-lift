import { type ChampPave, chargeEnTexte, type SerieEnCours } from "@better-lift/shared";
import { Check } from "lucide-react-native";
import { Text, View } from "react-native";
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
// 40 : « SÉRIE » en Archivo ne tient pas sur 34 (D103).
export const COLONNES = { serie: 40, valider: 40 } as const;

/**
 * Les états d'une ligne (D108). La prochaine série porte la SEULE ✓ en aplat
 * lime de l'écran (D105) ; les suivantes montrent leurs cibles en valeurs
 * fantômes ; une série faite se fond dans une ligne teintée, ✓ neutre.
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
 * Les cases ne sont pas des champs : un appui ouvre le pavé de la séance (D109),
 * qui écrit dans la case cerclée d'encre. L'écran tient le texte en cours.
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
  /** La case en cours de saisie au pavé, et son texte. */
  edition: { champ: ChampPave; texte: string; invalide: boolean } | null;
  onEditer: (champ: ChampPave) => void;
  onChange: (patch: { reps?: number | null; chargeKg?: number | null }) => void;
  onValider: () => void;
  /** L'appui sur l'étiquette : type de série, suppression (D92). */
  onEtiquette: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();

  // Recopier la dernière fois dans la séance, d'un seul appui.
  const recopier = () => {
    if (!precedent?.faite) return;
    onChange({ reps: precedent.reps, chargeKg: precedent.chargeKg });
    vibrer.selection();
  };

  const valider = () => {
    // On ne vibre qu'à la validation : décocher une erreur de doigt se fait en silence.
    if (!serie.faite) vibrer.valider();
    onValider();
  };

  const faite = etat === "faite";
  // Une série à venir montre ses CIBLES en fantôme ; une valeur saisie, elle,
  // s'écrit à l'encre, case par case (`saisi`).
  const aVenir = etat === "a-venir";
  return (
    <View style={[styles.ligne, faite && styles.faite]}>
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
        onPress={() => onEditer("charge")}
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
        onPress={() => onEditer("reps")}
      />
      <Appuyable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: faite }}
        accessibilityLabel={`Série ${numero} faite`}
        onPress={valider}
        hitSlop={4}
        style={[
          styles.valider,
          etat === "prochaine" && styles.validerProchaine,
          faite && styles.validerFait,
        ]}
      >
        <Check
          size={18}
          strokeWidth={3}
          color={
            etat === "prochaine"
              ? couleurs.surAction
              : faite
                ? couleurs.canevas
                : couleurs.encreAttenuee
          }
        />
      </Appuyable>
    </View>
  );
}

/** Une case kg ou reps : un appui ouvre le pavé ; en saisie, elle est cerclée d'encre. */
function Case({
  libelle,
  texte,
  editee,
  invalide,
  fantome,
  faite,
  onPress,
}: {
  libelle: string;
  texte: string;
  editee: boolean;
  invalide: boolean;
  fantome: boolean;
  faite: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Appuyable
      onPress={onPress}
      hitSlop={4}
      style={[
        styles.case,
        faite && styles.caseFaite,
        editee && styles.caseEditee,
        invalide && styles.caseKo,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${libelle} : ${texte || "vide"}`}
    >
      <Text
        maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
        style={[styles.caseTexte, fantome && !editee && styles.caseFantome]}
        numberOfLines={1}
      >
        {texte || "—"}
      </Text>
    </Appuyable>
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
  // Faite : la ligne se teinte nettement, sans lime — le lime reste à l'action.
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
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  caseTexte: {
    color: couleurs.encre,
    fontSize: taille.valeur,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  // En saisie au pavé : cerclée d'encre (D108).
  caseEditee: { borderWidth: 2, borderColor: couleurs.encre },
  // À venir : les cibles se lisent, en retrait, jusqu'à ce qu'on y arrive.
  caseFantome: { color: couleurs.encreTertiaire },
  // Faite, la case se fond dans la ligne teintée : on lit le chiffre, pas le champ.
  caseFaite: { backgroundColor: "transparent" },
  caseKo: { borderWidth: 2, borderColor: couleurs.dangerEncre },
  // À venir : ✓ en contour.
  valider: {
    width: COLONNES.valider,
    height: 40,
    borderRadius: rayon.cellule,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  validerProchaine: { backgroundColor: couleurs.action, borderColor: couleurs.action },
  // Faite : ✓ plein, à l'encre. La prochaine porte le lime, les suivantes un contour.
  validerFait: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
}));
