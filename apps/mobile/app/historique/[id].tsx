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
import {
  ChevronLeft,
  Dumbbell,
  EllipsisVertical,
  ListChecks,
  Trash2,
  Trophy,
} from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { CarteMuscles } from "@/components/routine/carte-muscles";
import { etiquettes } from "@/components/seance/carte-exercice";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useConfirmer, useFeuille, useInformer } from "@/lib/confirmation";
import { FUSEAU } from "@/lib/fuseau";
import { optionsSeance, useSupprimerSeance } from "@/lib/requetes";
import { libelleMinutes } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const charge = (kg: number | null) => (kg === null ? "—" : formaterCharge(kg, SYSTEME_UNITES));

/**
 * Une séance passée (D345), en lecture, comme le détail du web (D263, D265) : ses chiffres,
 * les muscles travaillés, chaque exercice et ses séries face à la dernière fois, la note. Le
 * menu ⋮ mène à la routine d'origine ou supprime la séance ; elle ne se corrige pas (D293).
 */
export default function PageSeancePassee() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requete = useQuery(optionsSeance(id));
  const supprimer = useSupprimerSeance();
  const ouvrirFeuille = useFeuille();
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

  const menu = (s: SeanceDetail) =>
    ouvrirFeuille({
      titre: s.nom,
      options: [
        ...(s.routineId
          ? [
              {
                libelle: "Voir la routine",
                icone: ListChecks,
                onPress: () => router.push(`/routine/${s.routineId}`),
              },
            ]
          : []),
        {
          libelle: "Supprimer",
          icone: Trash2,
          danger: true,
          onPress: () => demanderSuppression(s),
        },
      ],
    });

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
      {seance ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          onPress={() => menu(seance)}
          disabled={supprimer.isPending}
          accessibilityLabel="Actions de la séance"
        >
          <Icon as={EllipsisVertical} className="size-5 text-muted-foreground" />
        </Button>
      ) : null}
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
          <Chiffre libelle="Séries faites" valeur={String(seance.seriesFaites)} />
          <Chiffre libelle="Records" valeur={String(seance.nbRecords)} />
        </View>

        {/* Les muscles des exercices faits, comme l'en-tête de la séance (D344). */}
        <CarteMuscles exercices={exercices.filter((e) => e.series.some((s) => s.faite))} />

        {exercices.length === 0 ? (
          <Text className="text-muted-foreground">Aucun exercice.</Text>
        ) : null}
        {exercices.map((e, i) => (
          <ExerciceFait
            key={`${e.slug}-${i}`}
            exercice={e}
            lettre={groupeDe(exercices, i)?.lettre ?? null}
          />
        ))}

        {seance.note ? (
          <View className="gap-1 rounded-lg border border-border p-4">
            <Text className="font-medium" accessibilityRole="header">
              Note
            </Text>
            <Text className="text-muted-foreground">{seance.note}</Text>
          </View>
        ) : null}
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
      <Text className="text-muted-foreground text-xs" numberOfLines={1}>
        {libelle}
      </Text>
      <Text className="font-semibold text-lg tabular-nums" numberOfLines={1}>
        {valeur}
      </Text>
    </View>
  );
}

// Les colonnes du web (D246) : étiquette, Précédent, Charge, Répétitions, puis le record ou
// « Non faite » dans une largeur fixe — chaque ligne est sa propre rangée, une colonne
// élargie par un trophée décalerait les autres.
const COL_SERIE = "w-10";
const COL_FIN = "w-16 items-end";

/**
 * Un exercice fait, en lecture, comme le web (D263, D294) : sa vignette, son nom, son
 * superset et sa note, ses records ; puis ses séries face à sa dernière occurrence
 * antérieure, position par position (D123). Une série non faite reste, en retrait.
 */
function ExerciceFait({
  exercice,
  lettre,
}: {
  exercice: SeanceDetail["exercices"][number];
  lettre: string | null;
}) {
  const router = useRouter();
  const libelles = etiquettes(exercice.series);
  const records = exercice.series.filter((s) => s.records.length > 0).length;
  const sousTitre = [lettre && `Superset ${lettre}`, exercice.note].filter(Boolean).join(" · ");
  return (
    <View className="overflow-hidden rounded-lg border border-border bg-background">
      <Pressable
        onPress={() =>
          router.push({ pathname: "/exercice/[slug]", params: { slug: exercice.slug } })
        }
        accessibilityRole="button"
        accessibilityHint="Ouvre la page de l'exercice"
        className="min-h-16 flex-row items-center gap-3 px-3 py-3 active:bg-accent"
      >
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
          {sousTitre ? (
            <Text className="text-muted-foreground text-sm" numberOfLines={2}>
              {sousTitre}
            </Text>
          ) : null}
        </View>
        {records > 0 ? (
          <View className="flex-row items-center gap-1 rounded-full border border-foreground px-2 py-0.5">
            <Icon as={Trophy} className="size-3 text-foreground" />
            <Text className="font-medium text-xs">
              {records > 1 ? `${records} records` : "Record"}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <View className="gap-1 border-border border-t px-3 py-2">
        <View className="flex-row items-center gap-2">
          <Text className={cn(COL_SERIE, "text-muted-foreground text-xs")}>Série</Text>
          <Text className="flex-1 text-muted-foreground text-xs">Précédent</Text>
          <Text className="flex-1 text-muted-foreground text-xs">Charge</Text>
          <Text className="flex-1 text-muted-foreground text-xs">Répétitions</Text>
          <View className={COL_FIN} />
        </View>
        {exercice.series.map((s, i) => {
          const avant = exercice.precedentes[i];
          return (
            // Clé par position : l'ordre des séries est celui de la séance.
            <View
              key={i}
              className={cn("min-h-10 flex-row items-center gap-2", !s.faite && "opacity-50")}
            >
              <Text className={cn(COL_SERIE, "font-medium tabular-nums")}>{libelles[i]}</Text>
              <Text className="flex-1 text-muted-foreground text-sm tabular-nums" numberOfLines={1}>
                {avant ? `${charge(avant.chargeKg)} × ${avant.reps ?? "—"}` : "—"}
              </Text>
              <Text className="flex-1 text-sm tabular-nums" numberOfLines={1}>
                {charge(s.chargeKg)}
              </Text>
              <Text className="flex-1 text-sm tabular-nums" numberOfLines={1}>
                {s.reps === null ? "—" : `${s.reps} rép.`}
              </Text>
              <View className={COL_FIN}>
                {s.records.length > 0 ? (
                  <View
                    accessible
                    accessibilityLabel={`Record : ${s.records.map((r) => LIBELLE_RECORD[r]).join(", ")}`}
                    className="rounded-full border border-foreground p-1"
                  >
                    <Icon as={Trophy} className="size-3.5 text-foreground" />
                  </View>
                ) : !s.faite ? (
                  <Text className="text-muted-foreground text-xs">Non faite</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
