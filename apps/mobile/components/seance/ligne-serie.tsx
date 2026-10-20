import { chargeEnTexte, lireCharge, lireReps, type SerieEnCours } from "@better-lift/shared";
import { Check } from "lucide-react-native";
import { useRef, useState } from "react";
import { Keyboard, Pressable, type TextInput, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { PLAFOND_TEXTE_DENSE } from "@/lib/theme";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";
import { vibrer } from "@/lib/vibrations";

/**
 * Les états d'une ligne (D116), comme une case à cocher : à faire, la case est
 * VIDE ; faite, elle porte la ✓ pleine et la ligne se teinte. La prochaine se
 * repère par un liseré.
 */
export type EtatSerie = "faite" | "prochaine" | "a-venir";

/** La ligne « dernière fois » : « 82,5 × 6 », « 10 reps », ou un tiret. */
function textePrecedent(p?: { reps: number | null; chargeKg: number | null; faite: boolean }) {
  if (!p?.faite) return "—";
  if (p.chargeKg === null) return `${p.reps ?? "—"} reps`;
  return `${chargeEnTexte(p.chargeKg, SYSTEME_UNITES)} × ${p.reps ?? "—"}`;
}

const texteCharge = (v: number | null) => (v === null ? "" : chargeEnTexte(v, SYSTEME_UNITES));
const texteReps = (v: number | null) => (v === null ? "" : String(v));

/**
 * Une série sur UNE ligne (D87) : étiquette · précédent · charge · reps · ✓.
 * Saisie au clavier du système (D317) : une case vide montre la cible en
 * indication, taper la remplace ; la valeur s'écrit à la sortie du champ.
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
  const reps = useRef<TextInput>(null);
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
    <View className={cn("min-h-13 flex-row items-center gap-2 px-1", faite && "bg-muted")}>
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
        retour="next"
        onSoumettre={() => reps.current?.focus()}
        onEcrire={(v) => onChange({ chargeKg: v })}
      />
      <Champ
        ref={reps}
        libelle={`Série ${numero}, répétitions`}
        valeur={texteReps(serie.reps)}
        affichee={faite || Boolean(serie.saisi?.reps)}
        faite={faite}
        lire={lireReps}
        clavier="number-pad"
        retour="done"
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
 * Une case kg ou reps. `texte` ne vit que pendant la frappe (`null` sinon) : une
 * case non saisie reste vide et montre la cible en indication. Une saisie
 * invalide n'est jamais écrite : elle reste affichée, bordée de rouge.
 */
function Champ({
  ref,
  libelle,
  valeur,
  affichee,
  faite,
  lire,
  clavier,
  retour,
  onSoumettre,
  onEcrire,
}: {
  ref?: React.Ref<TextInput>;
  libelle: string;
  /** La valeur de la séance, en texte : la saisie, ou la cible. */
  valeur: string;
  /** Saisie ou série faite : la valeur s'écrit à l'encre ; sinon c'est une indication. */
  affichee: boolean;
  /** Faite, la case se fond dans la ligne teintée : on lit le chiffre, pas le champ. */
  faite: boolean;
  lire: (texte: string) => number | null;
  clavier: "decimal-pad" | "number-pad";
  retour: "next" | "done";
  onSoumettre?: () => void;
  onEcrire: (v: number | null) => void;
}) {
  const [texte, setTexte] = useState<string | null>(null);
  const invalide = texte !== null && Number.isNaN(lire(texte));

  const ecrire = () => {
    if (texte === null || invalide) return;
    onEcrire(lire(texte));
    setTexte(null);
  };

  return (
    <Input
      ref={ref}
      value={texte ?? (affichee ? valeur : "")}
      placeholder={affichee ? undefined : valeur || "—"}
      onChangeText={setTexte}
      onEndEditing={ecrire}
      onSubmitEditing={onSoumettre}
      keyboardType={clavier}
      returnKeyType={retour}
      submitBehavior={retour === "next" ? "submit" : "blurAndSubmit"}
      selectTextOnFocus
      maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
      accessibilityLabel={libelle}
      className={cn(
        "h-10 flex-1 border-0 bg-secondary px-1 py-0 text-center font-semibold text-lg leading-6 tabular-nums shadow-none",
        faite && "bg-transparent dark:bg-transparent",
        invalide && "border-2 border-destructive",
      )}
    />
  );
}
