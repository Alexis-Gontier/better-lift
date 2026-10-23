import {
  bilanSeance,
  formaterCharge,
  formatJour,
  lireReps,
  secondesEcoulees,
} from "@better-lift/shared";
import { onlineManager } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CircleDashed, CloudOff, Pencil, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useConfirmer } from "@/lib/confirmation";
import { FUSEAU } from "@/lib/fuseau";
import { useSeance } from "@/lib/seance";
import { formaterDuree } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { vibrer } from "@/lib/vibrations";

// Une durée corrigée reste plausible : de 1 min à 10 h.
const DUREE_MAX_MIN = 600;

/**
 * La fin de séance (D130, D318, D342) : trois chiffres, une note, puis
 * enregistrer, reprendre ou abandonner. La durée se corrige d'un appui : une
 * séance terminée bien après la dernière série ne compte pas l'attente. Une
 * séance sans série validée ne s'enregistre pas, elle se reprend.
 */
export default function Fin() {
  const router = useRouter();
  const { seance, terminer, modifier, abandonner } = useSeance();
  const confirmer = useConfirmer();
  // La durée est figée à l'ouverture de cet écran : c'est l'heure de fin.
  const [finReelle] = useState(() => new Date());
  // La durée corrigée, en minutes ; `null` : la vraie.
  const [dureeMin, setDureeMin] = useState<number | null>(null);
  const [edition, setEdition] = useState(false);
  // Un second appui pendant l'enregistrement mettrait la séance deux fois en file.
  const [enregistrement, setEnregistrement] = useState(false);
  if (!seance) return null;

  const { seriesFaites, volumeKg } = bilanSeance(seance);
  const reprendre = () => router.back();
  const fin =
    dureeMin === null ? finReelle : new Date(Date.parse(seance.debut) + dureeMin * 60_000);
  const duree = secondesEcoulees(seance.debut, fin);

  const abandon = () =>
    confirmer({
      titre: "Abandonner la séance ?",
      message: "Rien ne sera enregistré.",
      action: "Abandonner la séance",
      icone: Trash2,
      annuler: "Garder la séance",
      onConfirmer: () => {
        void abandonner().then(() => router.replace("/"));
      },
    });

  if (seriesFaites === 0) {
    return (
      <Ecran className="flex-1 bg-background p-4">
        <View className="flex-1 justify-center gap-2">
          <Text className="font-semibold text-2xl" accessibilityRole="header">
            Pas encore de série.
          </Text>
          <Text className="text-muted-foreground">Valide au moins une série pour enregistrer.</Text>
        </View>
        <View className="flex-row gap-2">
          <Button variant="outline" className="h-12 flex-1" onPress={reprendre}>
            <Text>Reprendre</Text>
          </Button>
          <Abandonner onPress={abandon} />
        </View>
      </Ecran>
    );
  }

  // Ce qui reste à valider : terminer ne doit pas se faire par mégarde au milieu
  // d'une séance, comme Hevy qui le signale avant d'enregistrer.
  const toutes = seance.exercices.flatMap((e) => e.series);
  const nonValidees = toutes.filter((x) => !x.faite).length;
  // D5 : l'échauffement ne compte pas dans le volume. L'écran le dit, sans quoi
  // « 1 série · 0 kg » ressemble à une erreur.
  const echauffementFait = toutes.some((x) => x.faite && x.type === "ECHAUFFEMENT");
  const horsLigne = !onlineManager.isOnline();

  const enregistrer = async () => {
    if (enregistrement) return;
    setEnregistrement(true);
    vibrer.valider();
    // Sur disque dans la file AVANT de quitter l'écran : l'envoi se fait
    // ensuite, et se retentera tant qu'il n'aura pas abouti.
    await terminer(fin);
    router.replace("/");
  };

  return (
    <Ecran className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          {/* Rien n'est encore enregistré : l'écran relit avant d'enregistrer (D324). */}
          <Text className="font-semibold text-2xl" accessibilityRole="header">
            Fin de séance
          </Text>
          <Text className="text-muted-foreground">
            {seance.nom} · {formatJour(seance.debut, FUSEAU)}
          </Text>
        </View>

        <View className="flex-row rounded-lg border border-border">
          <Pressable
            onPress={() => setEdition(true)}
            accessibilityRole="button"
            accessibilityLabel={`Durée ${formaterDuree(duree)}, modifier`}
            className="flex-1 items-center gap-0.5 rounded-l-lg py-3 active:bg-accent"
          >
            <View className="flex-row items-center gap-1">
              <Text className="text-muted-foreground text-xs">Durée</Text>
              <Icon as={Pencil} className="size-3 text-muted-foreground" />
            </View>
            <Text className="font-semibold text-lg tabular-nums">{formaterDuree(duree)}</Text>
          </Pressable>
          <Chiffre libelle="Séries" valeur={String(seriesFaites)} />
          <Chiffre libelle="Volume" valeur={formaterCharge(volumeKg, SYSTEME_UNITES)} />
        </View>
        {edition ? (
          <DureeEnMinutes
            initiale={Math.max(1, Math.round(duree / 60))}
            onFini={(min) => {
              setEdition(false);
              if (min !== null) setDureeMin(min);
            }}
          />
        ) : null}
        {echauffementFait ? (
          <Text className="text-muted-foreground text-sm">
            L'échauffement ne compte pas dans le volume.
          </Text>
        ) : null}

        <Input
          value={seance.note ?? ""}
          onChangeText={(note) => modifier({ ...seance, note })}
          placeholder="Ajouter une note sur la séance…"
          className="h-auto min-h-18 py-2"
          multiline
          maxLength={1000}
          accessibilityLabel="Note de la séance"
        />
      </ScrollView>

      <View className="gap-2 border-border border-t p-4">
        {nonValidees > 0 ? (
          <Encart icone={CircleDashed} role="alert">
            {nonValidees === 1
              ? "1 série non validée : elle ne comptera pas."
              : `${nonValidees} séries non validées : elles ne compteront pas.`}
          </Encart>
        ) : null}
        {/* Hors ligne, un fait et pas une alerte : la séance part seule au retour du réseau (D99). */}
        {horsLigne ? (
          <Encart icone={CloudOff}>
            Pas de réseau. La séance reste sur ton téléphone et partira seule au retour du réseau.
          </Encart>
        ) : null}
        <Button className="h-12" disabled={enregistrement} onPress={() => void enregistrer()}>
          <Text>{enregistrement ? "Enregistrement…" : "Enregistrer la séance"}</Text>
        </Button>
        <View className="flex-row gap-2">
          <Button variant="ghost" className="h-12 flex-1" onPress={reprendre}>
            <Text>Reprendre</Text>
          </Button>
          <Abandonner onPress={abandon} />
        </View>
      </View>
    </Ecran>
  );
}

/** Le danger en contour (D335), la confirmation derrière. */
function Abandonner({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="outline" className="h-12 flex-1 border-destructive" onPress={onPress}>
      <Text className="text-destructive">Abandonner</Text>
    </Button>
  );
}

/** La durée corrigée, en minutes entières ; `null` si la saisie n'est pas lisible. */
function DureeEnMinutes({
  initiale,
  onFini,
}: {
  initiale: number;
  onFini: (min: number | null) => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="flex-1 text-muted-foreground">Durée en minutes</Text>
      <Input
        defaultValue={String(initiale)}
        autoFocus
        selectTextOnFocus
        keyboardType="number-pad"
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        accessibilityLabel="Durée en minutes"
        className="h-12 w-24 text-center font-semibold text-lg tabular-nums"
        onEndEditing={(e) => {
          const min = lireReps(e.nativeEvent.text);
          const lisible = min !== null && !Number.isNaN(min) && min >= 1 && min <= DUREE_MAX_MIN;
          onFini(lisible ? min : null);
        }}
      />
    </View>
  );
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 py-3">
      <Text className="text-muted-foreground text-xs">{libelle}</Text>
      <Text className="font-semibold text-lg tabular-nums">{valeur}</Text>
    </View>
  );
}

function Encart({
  icone,
  role,
  children,
}: {
  icone: typeof CloudOff;
  role?: "alert";
  children: string;
}) {
  return (
    <View className="flex-row items-center gap-2" accessibilityRole={role}>
      <Icon as={icone} className="size-4.5 text-muted-foreground" />
      <Text className="flex-1 text-muted-foreground text-sm">{children}</Text>
    </View>
  );
}
