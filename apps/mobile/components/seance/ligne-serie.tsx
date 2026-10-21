import { chargeEnTexte, lireCharge, lireReps, type SerieEnCours } from "@better-lift/shared";
import { Check } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, type TextInput, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";
import { vibrer } from "@/lib/vibrations";
import { PLAFOND_TEXTE_DENSE } from "./texte-dense";

/**
 * Les états d'une ligne (D116), comme une case à cocher : à faire, la case est
 * VIDE ; faite, elle porte la ✓ pleine et la ligne se teinte. La prochaine se
 * repère par un liseré.
 */
export type EtatSerie = "faite" | "prochaine" | "a-venir";

/** La ligne « dernière fois » : « 82,5 × 6 », « 10 reps », ou un tiret. */
function textePrecedent(p?: { reps: number | null; chargeKg: number | null; faite: boolean }) {
  if (!p?.faite) return "—";
  if (p.chargeKg === null) return p.reps === null ? "—" : `${p.reps} reps`;
  return `${chargeEnTexte(p.chargeKg, SYSTEME_UNITES)} × ${p.reps ?? "—"}`;
}

const texteCharge = (v: number | null) => (v === null ? "" : chargeEnTexte(v, SYSTEME_UNITES));
const texteReps = (v: number | null) => (v === null ? "" : String(v));

/**
 * Une série sur UNE ligne (D87) : étiquette · précédent · charge · reps · ✓.
 * Saisie au clavier du système (D317, D334) : une case non saisie montre la
 * cible en indication ; la toucher la remplit, sélectionnée, et taper la
 * remplace. La valeur s'écrit à la sortie du champ.
 */
export function LigneSerie({
  numero,
  etiquette,
  secondaire,
  serie,
  etat,
  precedent,
  onChange,
  onValider,
  onEtiquette,
}: {
  numero: number;
  /** « 1 », « É », « D »… */
  etiquette: string;
  /** Une série hors des normales (échauffement, dégressive…) : étiquette en retrait. */
  secondaire: boolean;
  serie: SerieEnCours;
  etat: EtatSerie;
  /** Ce qui a été fait la dernière fois à cette position (D67). */
  precedent?: { reps: number | null; chargeKg: number | null; faite: boolean };
  onChange: (patch: { reps?: number | null; chargeKg?: number | null }) => void;
  onValider: () => void;
  /** L'appui sur l'étiquette : type de série, suppression (D92). */
  onEtiquette: () => void;
}) {
  const faite = etat === "faite";

  // Recopier la dernière fois dans la séance, d'un seul appui.
  const recopier = () => {
    if (!precedent?.faite) return;
    onChange({ reps: precedent.reps, chargeKg: precedent.chargeKg });
    vibrer.selection();
  };

  const valider = () => {
    // La saisie en cours s'écrit à la sortie du champ : fermer le clavier d'abord.
    Keyboard.dismiss();
    if (serie.faite) vibrer.selection();
    else vibrer.valider();
    onValider();
  };

  return (
    <View
      className={cn("min-h-13 flex-row items-center gap-2 rounded-md px-1", faite && "bg-muted")}
    >
      {/* La ligne à faire : un liseré, là où l'œil revient entre deux séries. */}
      {etat === "prochaine" ? (
        <View className="absolute top-2.5 bottom-2.5 left-0 w-0.75 rounded-full bg-foreground" />
      ) : null}
      <Pressable
        onPress={onEtiquette}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={`Série ${numero} : type ou suppression`}
      >
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          className={cn("font-bold tabular-nums", secondaire && "text-muted-foreground")}
        >
          {etiquette}
        </Text>
      </Pressable>
      {/* Une INDICATION, pas une valeur (D59) : un appui la recopie. */}
      <Pressable
        onPress={recopier}
        disabled={!precedent?.faite}
        className="h-10 flex-[1.25] justify-center"
        accessibilityRole="button"
        accessibilityLabel={`Recopier la dernière fois pour la série ${numero}`}
      >
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          className="text-muted-foreground text-sm tabular-nums"
          numberOfLines={1}
        >
          {textePrecedent(precedent)}
        </Text>
      </Pressable>
      <Champ
        libelle={`Série ${numero}, charge`}
        valeur={texteCharge(serie.chargeKg)}
        affichee={faite || Boolean(serie.saisi?.chargeKg)}
        faite={faite}
        lire={(t) => lireCharge(t, SYSTEME_UNITES)}
        clavier="decimal-pad"
        onEcrire={(v) => onChange({ chargeKg: v })}
      />
      <Champ
        libelle={`Série ${numero}, répétitions`}
        valeur={texteReps(serie.reps)}
        affichee={faite || Boolean(serie.saisi?.reps)}
        faite={faite}
        lire={lireReps}
        clavier="number-pad"
        onEcrire={(v) => onChange({ reps: v })}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: faite }}
        accessibilityLabel={`Série ${numero} faite`}
        onPress={valider}
        hitSlop={4}
        className={cn(
          "h-10 w-10 items-center justify-center rounded-md border-2 border-input",
          etat === "prochaine" && "border-foreground",
          faite && "border-primary bg-primary",
        )}
      >
        {faite ? (
          <Icon as={Check} className="size-5 text-primary-foreground" strokeWidth={3} />
        ) : null}
      </Pressable>
    </View>
  );
}

/**
 * Une case kg ou reps (D334). Au toucher, elle se remplit de sa valeur — la
 * cible ou la saisie — toute sélectionnée : le premier chiffre la remplace,
 * comme une calculatrice. `texte` ne vit que pendant l'édition (`null` sinon) ;
 * hors édition, une case non saisie montre la cible en indication.
 *
 * La saisie n'est jugée qu'à la sortie : un style changé en cours de frappe
 * (« 15, » pas encore lisible) relançait la sélection de tout sous Android, et
 * le chiffre suivant remplaçait le 15. Invalide à la sortie, elle n'est pas
 * écrite et reste affichée, bordée de rouge.
 */
function Champ({
  libelle,
  valeur,
  affichee,
  faite,
  lire,
  clavier,
  onEcrire,
}: {
  libelle: string;
  /** La valeur de la séance, en texte : la saisie, ou la cible. */
  valeur: string;
  /** Saisie ou série faite : la valeur s'écrit à l'encre ; sinon c'est une indication. */
  affichee: boolean;
  /** Faite, la case se fond dans la ligne teintée : on lit le chiffre, pas le champ. */
  faite: boolean;
  lire: (texte: string) => number | null;
  clavier: "decimal-pad" | "number-pad";
  onEcrire: (v: number | null) => void;
}) {
  const champ = useRef<TextInput>(null);
  const [texte, setTexte] = useState<string | null>(null);
  const [actif, setActif] = useState(false);
  // Posée au toucher pour tout sélectionner, relâchée à la première frappe.
  const [selection, setSelection] = useState<{ start: number; end: number }>();
  // « 15, » laissé tel quel vaut 15 : la virgule attendait le chiffre suivant.
  const lu = texte === null ? null : lire(texte.trim().replace(/[.,]$/, ""));
  const invalide = !actif && lu !== null && Number.isNaN(lu);

  // Le retour d'Android ferme le clavier sans quitter la case : le curseur y
  // restait à clignoter. Clavier fermé, la case lâche le focus (et écrit).
  useEffect(() => {
    if (!actif) return;
    const abonnement = Keyboard.addListener("keyboardDidHide", () => champ.current?.blur());
    return () => abonnement.remove();
  }, [actif]);

  const ecrire = () => {
    setActif(false);
    setSelection(undefined);
    if (texte === null || (lu !== null && Number.isNaN(lu))) return;
    onEcrire(lu);
    setTexte(null);
  };

  return (
    <Input
      ref={champ}
      value={texte ?? (affichee ? valeur : "")}
      placeholder={affichee ? undefined : valeur || "—"}
      onFocus={() => {
        // Une saisie invalide restée en rouge se reprend telle quelle.
        const t = texte ?? valeur;
        setActif(true);
        setTexte(t);
        setSelection({ start: 0, end: t.length });
      }}
      selection={selection}
      onChangeText={(t) => {
        setSelection(undefined);
        setTexte(t);
      }}
      onEndEditing={ecrire}
      keyboardType={clavier}
      // « ✓ » sur le pavé, comme Hevy : il écrit et ferme, sans cocher la série.
      returnKeyType="done"
      submitBehavior="blurAndSubmit"
      maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
      accessibilityLabel={libelle}
      // Bordure de 2 dans tous les états : seule sa couleur change, la case ne
      // bouge pas d'un pixel. À faire, un contour ; active, l'encre ; faite,
      // elle se fond dans la ligne teintée.
      className={cn(
        "h-10 flex-1 border-2 border-input bg-transparent px-1 py-0 text-center font-semibold text-lg leading-6 tabular-nums shadow-none dark:bg-transparent",
        faite && "border-transparent",
        actif && "border-foreground",
        invalide && "border-destructive",
      )}
    />
  );
}
