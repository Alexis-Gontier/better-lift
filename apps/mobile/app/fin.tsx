import {
  bilanSeance,
  chargeEnTexte,
  formaterCharge,
  formatJour,
  LIBELLE_RECORD,
  meilleureSerieComptee,
  recordsBattus,
  secondesEcoulees,
} from "@better-lift/shared";
import { onlineManager, useQueries } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ArrowUp, CircleDashed, CloudOff } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { FUSEAU } from "@/lib/fuseau";
import { optionsRecords } from "@/lib/requetes";
import { useSeance } from "@/lib/seance";
import { formaterDuree } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";
import { vibrer } from "@/lib/vibrations";

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités. */
function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return `${reps ?? "—"} reps`;
  return `${chargeEnTexte(chargeKg, SYSTEME_UNITES)} kg × ${reps ?? "—"}`;
}

/**
 * La fin de séance (D130, D318, D324) : le bilan, les records battus, ce qui a
 * été fait de chaque exercice, une note, puis l'enregistrement. Une séance sans
 * série validée ne s'enregistre pas — elle se reprend.
 */
export default function Fin() {
  const router = useRouter();
  const { seance, terminer, modifier } = useSeance();
  // La durée est figée à l'ouverture de cet écran : c'est l'heure de fin.
  const [fin] = useState(() => new Date());
  // Un second appui pendant l'enregistrement mettrait la séance deux fois en file.
  const [enregistrement, setEnregistrement] = useState(false);
  const slugs = seance ? [...new Set(seance.exercices.map((e) => e.slug))] : [];
  // Les records d'avant : en cache hors ligne pour les exercices des routines (D96).
  const records = useQueries({ queries: slugs.map((slug) => optionsRecords(slug)) });
  if (!seance) return null;

  const { seriesFaites, volumeKg } = bilanSeance(seance);
  const reprendre = () => router.back();

  if (seriesFaites === 0) {
    return (
      <Ecran className="flex-1 bg-background p-4">
        <View className="flex-1 justify-center gap-2">
          <Text className="font-semibold text-2xl" accessibilityRole="header">
            Pas encore de série.
          </Text>
          <Text className="text-muted-foreground">Valide au moins une série pour enregistrer.</Text>
        </View>
        <Button variant="outline" className="h-12" onPress={reprendre}>
          <Text>Reprendre la séance</Text>
        </Button>
      </Ecran>
    );
  }

  // Ce qui reste à valider : terminer ne doit pas se faire par mégarde au milieu
  // d'une séance, comme Hevy qui le signale avant d'enregistrer.
  const toutes = seance.exercices.flatMap((e) => e.series);
  const nonValidees = toutes.filter((x) => !x.faite).length;
  // D5 : l'échauffement ne compte pas dans le volume — l'écran le dit, sans quoi
  // « 1 série · 0 kg » ressemble à une erreur.
  const echauffementFait = toutes.some((x) => x.faite && x.type === "ECHAUFFEMENT");

  const avant = Object.fromEntries(slugs.map((slug, i) => [slug, records[i]?.data]));
  const { battus, incomplet } = recordsBattus(seance, avant);
  const chargement = records.some((r) => r.isPending && r.fetchStatus === "fetching");
  const horsLigne = !onlineManager.isOnline();

  const enregistrer = async () => {
    if (enregistrement) return;
    setEnregistrement(true);
    vibrer.valider();
    // Sur disque dans la file AVANT de quitter l'écran : l'envoi se fait
    // ensuite, et se retentera tant qu'il n'aura pas abouti.
    await terminer();
    router.replace("/");
  };

  return (
    <Ecran className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 p-4">
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
          <Chiffre libelle="Durée" valeur={formaterDuree(secondesEcoulees(seance.debut, fin))} />
          <Chiffre libelle="Séries" valeur={String(seriesFaites)} />
          <Chiffre libelle="Volume" valeur={formaterCharge(volumeKg, SYSTEME_UNITES)} />
        </View>
        {echauffementFait ? (
          <Text className="text-muted-foreground text-sm">
            L'échauffement ne compte pas dans le volume.
          </Text>
        ) : null}

        {/* Le record est un contour (D28) : la récompense, sans couleur. */}
        {!chargement && battus.length > 0 ? (
          <View className="gap-2 rounded-lg border-2 border-foreground p-3">
            <View className="flex-row items-center gap-2">
              <Icon as={ArrowUp} className="size-5 text-foreground" strokeWidth={2.6} />
              <Text className="font-semibold text-lg" accessibilityRole="header">
                {battus.length === 1 ? "1 record battu" : `${battus.length} records battus`}
              </Text>
            </View>
            {battus.map((b, i) => (
              <View key={`${b.slug}-${i}`} className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="font-medium" numberOfLines={2}>
                    {b.nom}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {b.types.map((t) => LIBELLE_RECORD[t]).join(" · ")}
                  </Text>
                </View>
                <Text className="font-semibold tabular-nums">
                  {formaterSerie(b.chargeKg, b.reps)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {incomplet && !chargement ? (
          <Text className="text-muted-foreground text-sm">
            Les records des autres exercices se calculeront à l'envoi, dans l'historique.
          </Text>
        ) : null}

        {/* Ce qui a été fait de chaque exercice (D324) : un exercice laissé vide se voit
            avant d'enregistrer. */}
        <View className="gap-2">
          <Text className="font-semibold text-muted-foreground text-sm" accessibilityRole="header">
            Exercices
          </Text>
          <View className="rounded-lg border border-border">
            {seance.exercices.map((e, i) => (
              <LigneExercice
                key={`${e.slug}-${i}`}
                nom={e.nom}
                faites={e.series.filter((x) => x.faite).length}
                meilleure={meilleureSerieComptee(e.series)}
                premiere={i === 0}
              />
            ))}
          </View>
        </View>

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
        <Button variant="ghost" className="h-12" onPress={reprendre}>
          <Text>Reprendre la séance</Text>
        </Button>
      </View>
    </Ecran>
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

/** Un exercice de la séance : son nom, puis sa meilleure série et le nombre de séries faites. */
function LigneExercice({
  nom,
  faites,
  meilleure,
  premiere,
}: {
  nom: string;
  faites: number;
  meilleure: { chargeKg: number | null; reps: number } | null;
  premiere: boolean;
}) {
  return (
    <View
      className={cn(
        "min-h-14 flex-row items-center gap-3 px-3 py-2",
        !premiere && "border-border border-t",
      )}
    >
      <Text
        className={cn("flex-1 font-medium", faites === 0 && "text-muted-foreground")}
        numberOfLines={2}
      >
        {nom}
      </Text>
      <View className="items-end">
        {meilleure ? (
          <Text className="font-semibold tabular-nums">
            {formaterSerie(meilleure.chargeKg, meilleure.reps)}
          </Text>
        ) : null}
        <Text className="text-muted-foreground text-sm tabular-nums">
          {faites === 0 ? "Aucune série" : faites === 1 ? "1 série" : `${faites} séries`}
        </Text>
      </View>
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
