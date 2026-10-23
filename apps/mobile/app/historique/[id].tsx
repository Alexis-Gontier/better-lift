import {
  formaterCharge,
  formatHeure,
  formatJourSemaine,
  groupeDe,
  LIBELLE_RECORD,
  type SeanceDetail,
} from "@better-lift/shared";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Dumbbell, Trash2, Trophy } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { CarteMuscles } from "@/components/routine/carte-muscles";
import { etiquettes } from "@/components/seance/carte-exercice";
import { RepereSuperset } from "@/components/seance/repere-superset";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useConfirmer, useInformer } from "@/lib/confirmation";
import { FUSEAU } from "@/lib/fuseau";
import { optionsSeance, useSupprimerSeance } from "@/lib/requetes";
import { libelleMinutes } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Une séance passée (D345), en lecture, comme Hevy : la date, ses chiffres, les muscles
 * travaillés, chaque exercice avec ses séries et les records battus, la note. Elle ne se
 * corrige pas (D293) ; elle se supprime, après confirmation.
 */
export default function PageSeancePassee() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requete = useQuery(optionsSeance(id));
  const supprimer = useSupprimerSeance();
  const confirmer = useConfirmer();
  const informer = useInformer();
  const seance = requete.data;

  const demanderSuppression = (s: SeanceDetail) => {
    // Hors ligne, l'appel se mettrait en pause sans rien dire : on le dit tout de suite.
    if (!onlineManager.isOnline()) {
      informer("Hors ligne", "Supprimer une séance demande le réseau.");
      return;
    }
    confirmer({
      titre: "Supprimer cette séance ?",
      message: `${s.nom}, ${formatJourSemaine(s.debut, FUSEAU, true)}. Ses séries et les records qu'elle portait disparaîtront.`,
      action: "Supprimer la séance",
      icone: Trash2,
      annuler: "Garder",
      onConfirmer: () =>
        supprimer.mutate(id, {
          onSuccess: () => router.back(),
          onError: (e) => informer("Suppression impossible", e.message),
        }),
    });
  };

  const entete = (
    <View className="h-14 flex-row items-center gap-1 px-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-12"
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Icon as={ChevronLeft} className="size-6 text-foreground" />
      </Button>
      <Text className="flex-1 font-semibold text-xl" accessibilityRole="header" numberOfLines={1}>
        {seance?.nom ?? "Séance"}
      </Text>
    </View>
  );

  const corps = () => {
    if (requete.isPending && requete.fetchStatus === "paused") {
      return <Vide titre="Hors ligne" message="La séance apparaîtra au retour du réseau." />;
    }
    if (requete.isPending) return <Chargement forme="seance" />;
    if (requete.isError && seance === undefined) {
      return (
        <Erreur message="La séance n'a pas pu se charger." onReessayer={() => requete.refetch()} />
      );
    }
    if (!seance) {
      return <Vide titre="Cette séance n'existe plus" message="Elle a peut-être été supprimée." />;
    }

    const exercices = seance.exercices;
    const totalSeries = exercices.reduce((n, e) => n + e.series.length, 0);
    return (
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <Text className="text-muted-foreground">
          {majuscule(formatJourSemaine(seance.debut, FUSEAU, true))} à{" "}
          {formatHeure(seance.debut, FUSEAU)}
        </Text>

        <View className="flex-row rounded-lg border border-border">
          <Chiffre libelle="Durée" valeur={libelleMinutes(seance.debut, seance.fin)} />
          <Chiffre
            libelle="Volume"
            valeur={formaterCharge(Math.round(seance.volumeKg), SYSTEME_UNITES)}
          />
          <Chiffre
            libelle="Séries"
            valeur={
              seance.seriesFaites === totalSeries
                ? String(totalSeries)
                : `${seance.seriesFaites}/${totalSeries}`
            }
          />
          {seance.nbRecords > 0 ? (
            <Chiffre libelle="Records" valeur={String(seance.nbRecords)} />
          ) : null}
        </View>

        {/* Les muscles des exercices faits, comme l'en-tête de la séance (D344). */}
        <CarteMuscles exercices={exercices.filter((e) => e.series.some((s) => s.faite))} />

        <View className="gap-2">
          <Text className="font-medium" accessibilityRole="header">
            Exercices
          </Text>
          {exercices.length === 0 ? (
            <Text className="text-muted-foreground">Aucun exercice.</Text>
          ) : null}
          {exercices.map((e, i) => (
            <RepereSuperset key={`${e.slug}-${i}`} groupe={groupeDe(exercices, i)} index={i}>
              <ExerciceFait exercice={e} />
            </RepereSuperset>
          ))}
        </View>

        {seance.note ? (
          <View className="gap-1 rounded-lg border border-border p-4">
            <Text className="font-medium" accessibilityRole="header">
              Note
            </Text>
            <Text className="text-muted-foreground">{seance.note}</Text>
          </View>
        ) : null}

        {/* Le danger en contour, confirmé (D335, D342). */}
        <Button
          variant="outline"
          className="h-12 border-destructive"
          onPress={() => demanderSuppression(seance)}
          disabled={supprimer.isPending}
        >
          <Icon as={Trash2} className="size-4 text-destructive" />
          <Text className="text-destructive">
            {supprimer.isPending ? "Suppression…" : "Supprimer la séance"}
          </Text>
        </Button>
      </ScrollView>
    );
  };

  return (
    <Ecran className="flex-1 bg-background" edges={["top", "bottom"]}>
      {entete}
      {corps()}
    </Ecran>
  );
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 py-3">
      <Text className="text-muted-foreground text-xs">{libelle}</Text>
      <Text className="font-semibold text-lg tabular-nums" numberOfLines={1}>
        {valeur}
      </Text>
    </View>
  );
}

/**
 * Un exercice de la séance passée : sa vignette, son nom et sa note, puis chaque série —
 * l'étiquette de la séance (É, 1, 2…), la charge et les répétitions, et ses records battus
 * en contour (D28). Une série non faite reste, en retrait.
 */
function ExerciceFait({ exercice }: { exercice: SeanceDetail["exercices"][number] }) {
  const libelles = etiquettes(exercice.series);
  return (
    <View className="pb-3">
      <View className="overflow-hidden rounded-lg border border-border bg-background">
        <View className="min-h-16 flex-row items-center gap-3 px-3 py-3">
          {exercice.image ? (
            // Fond blanc : les images du catalogue sont détourées sur blanc.
            <View className="size-12 overflow-hidden rounded-md bg-white">
              <Image
                source={{ uri: exercice.image }}
                style={{ width: 48, height: 48 }}
                contentFit="cover"
                cachePolicy="disk"
                autoplay={false}
              />
            </View>
          ) : (
            <View className="size-12 items-center justify-center rounded-md bg-secondary">
              <Icon as={Dumbbell} className="size-4.5 text-muted-foreground" />
            </View>
          )}
          <View className="flex-1 gap-0.5">
            <Text className="font-medium text-base" numberOfLines={2}>
              {exercice.nom}
            </Text>
            {exercice.note ? (
              <Text className="text-muted-foreground text-sm">{exercice.note}</Text>
            ) : null}
          </View>
        </View>
        <View className="flex-row gap-3 border-border border-t px-3 pt-2 pb-1">
          <Text className="w-8 text-muted-foreground text-xs">Série</Text>
          <Text className="flex-1 text-muted-foreground text-xs">Charge × reps</Text>
        </View>
        <View className="pb-2">
          {exercice.series.map((s, i) => (
            // Clé par position : l'ordre des séries est celui de la séance.
            <View
              key={i}
              className={cn("min-h-10 flex-row items-center gap-3 px-3", !s.faite && "opacity-50")}
              accessibilityLabel={
                s.records.length > 0
                  ? `Record : ${s.records.map((r) => LIBELLE_RECORD[r]).join(", ")}`
                  : undefined
              }
            >
              <Text className="w-8 font-medium tabular-nums">{libelles[i]}</Text>
              <Text className="flex-1 tabular-nums">
                {s.chargeKg === null
                  ? s.reps === null
                    ? "—"
                    : `${s.reps} rép.`
                  : `${formaterCharge(s.chargeKg, SYSTEME_UNITES)} × ${s.reps ?? "—"}`}
              </Text>
              {s.records.length > 0 ? (
                <View className="flex-row items-center gap-1 rounded-full border border-foreground px-2 py-0.5">
                  <Icon as={Trophy} className="size-3 text-foreground" />
                  <Text className="font-medium text-xs">
                    {s.records.map((r) => LIBELLE_RECORD[r]).join(" · ")}
                  </Text>
                </View>
              ) : !s.faite ? (
                <Text className="text-muted-foreground text-xs">Non faite</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
