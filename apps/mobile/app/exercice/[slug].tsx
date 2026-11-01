import {
  ATTRIBUTION_MEDIAS,
  chargeEnTexte,
  chiffresSeance,
  type ExerciceDetail,
  formaterCharge,
  formatJourCourt,
  formatJourSemaine,
  type HistoriqueExercice,
  meilleureChargeParReps,
  pourcentagesUnRm,
  type RecordExercice,
  recordsExercice,
  type TypeRecord,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { CarteMuscles } from "@/components/routine/carte-muscles";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { FUSEAU } from "@/lib/fuseau";
import { optionsExercice, optionsHistoriqueExercice } from "@/lib/requetes";
import { SYSTEME_UNITES, UNITE } from "@/lib/unites";
import { cn } from "@/lib/utils";

type Seance = HistoriqueExercice[number];

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kg = (v: number) => formaterCharge(v, SYSTEME_UNITES);
const jour = (iso: string) => majuscule(formatJourSemaine(iso, FUSEAU));

/** « 47,5 × 15 · 40 × 14 » : les séries faites, comme le web. */
const seriesTexte = (s: Seance) =>
  s.series
    .filter((x) => x.faite)
    .map(
      (x) =>
        `${x.chargeKg === null ? "—" : chargeEnTexte(x.chargeKg, SYSTEME_UNITES)} × ${x.reps ?? "—"}`,
    )
    .join(" · ");

/**
 * La page d'un exercice (D348), transposée de la fiche du web (D264, D265) d'un seul
 * défilement : l'animation, les muscles, les records, chaque séance qui mène à son détail,
 * les pourcentages du 1RM et la meilleure charge par nombre de répétitions. Sans la courbe de
 * progression : en salle, on lit des chiffres ; la courbe reste sur le web.
 */
export default function PageExercice() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const fiche = useQuery(optionsExercice(slug));
  const historique = useQuery(optionsHistoriqueExercice(slug));

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
        {fiche.data?.nom ?? "Exercice"}
      </Text>
    </View>
  );

  const corps = () => {
    if (fiche.isPending && fiche.fetchStatus === "paused") {
      return <Vide titre="Hors ligne" message="L'exercice apparaîtra au retour du réseau." />;
    }
    if (fiche.isPending) return <Chargement forme="routine" />;
    if (fiche.isError && !fiche.data) {
      return (
        <Erreur message="L'exercice n'a pas pu se charger." onReessayer={() => fiche.refetch()} />
      );
    }
    const h = historique.data;
    return (
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <Execution exercice={fiche.data} />
        <CarteMuscles
          exercices={[
            { musclePrincipal: fiche.data.cible, musclesSecondaires: fiche.data.secondaires },
          ]}
        />
        {historique.isPending ? (
          historique.fetchStatus === "paused" ? (
            <Text className="text-muted-foreground">
              Hors ligne : les séances apparaîtront au retour du réseau.
            </Text>
          ) : (
            <Chargement />
          )
        ) : historique.isError || !h ? (
          <Erreur
            message="Les séances de l'exercice n'ont pas pu se charger."
            onReessayer={() => historique.refetch()}
          />
        ) : h.length === 0 ? (
          <Vide titre="Pas encore fait" message="Ses records et ses séances apparaîtront ici." />
        ) : (
          <>
            <Records historique={h} />
            <Seances
              historique={h}
              onOuvrir={(id) => router.push({ pathname: "/historique/[id]", params: { id } })}
            />
            <Pourcentages historique={h} />
            <ParReps historique={h} />
          </>
        )}
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

function Carte({
  titre,
  detail,
  children,
}: {
  titre: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-lg border border-border p-4">
      <View className="gap-0.5">
        <Text className="font-medium" accessibilityRole="header">
          {titre}
        </Text>
        {detail ? <Text className="text-muted-foreground text-sm">{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** L'animation, sur blanc comme le catalogue la dessine, et le matériel. */
function Execution({ exercice }: { exercice: ExerciceDetail }) {
  const visuel = exercice.gif ?? exercice.image;
  return (
    <Carte titre="Exécution" detail={exercice.equipement}>
      {visuel ? (
        <View className="gap-1">
          {/* Aux deux tiers : en entier, l'animation cachait les records. */}
          <View className="w-2/3 self-center overflow-hidden rounded-md bg-white">
            <Image
              source={{ uri: visuel }}
              style={{ width: "100%", aspectRatio: 1 }}
              contentFit="contain"
              cachePolicy="disk"
              accessibilityLabel={`Animation : ${exercice.nom}`}
            />
          </View>
          <Text className="text-center text-muted-foreground text-xs">{ATTRIBUTION_MEDIAS}</Text>
        </View>
      ) : null}
    </Carte>
  );
}

/**
 * Les records (D350) : le record héros en grand, au contour du record (D28) — la meilleure
 * charge, ou les répétitions au poids du corps — puis les autres et le nombre de séances.
 */
function Records({ historique }: { historique: HistoriqueExercice }) {
  const records = recordsExercice(historique);
  const record = (type: TypeRecord) => records.find((x) => x.type === type);
  const heros = record("CHARGE") ?? record("REPS");
  const derniere = historique[0];
  const autres = [
    ...(record("UN_RM") && heros?.type === "CHARGE"
      ? [{ libelle: "1RM estimé", r: record("UN_RM"), valeur: (v: number) => kg(Math.round(v)) }]
      : []),
    ...(record("VOLUME") ? [{ libelle: "Meilleure série", r: record("VOLUME"), valeur: kg }] : []),
  ].map(({ libelle, r, valeur }) => ({
    libelle,
    valeur: r ? valeur(r.valeur) : "—",
    indice: r ? dateCourte(r.date) : "",
  }));
  const colonnes = [
    ...autres,
    {
      libelle: "Séances",
      valeur: String(historique.length),
      indice: derniere ? `dern. ${dateCourte(derniere.debut)}` : "",
    },
  ];
  return (
    <View className="gap-3">
      <Text className="font-semibold text-lg" accessibilityRole="header">
        Records
      </Text>
      {heros ? <RecordHeros record={heros} /> : null}
      <View className="flex-row rounded-lg border border-border bg-card px-1 py-3.5">
        {colonnes.map((c, i) => (
          <View
            key={c.libelle}
            className={cn("flex-1 gap-0.5 px-3", i > 0 && "border-border border-l")}
          >
            <Text className="text-muted-foreground text-xs">{c.libelle}</Text>
            <Text className="font-semibold text-lg tabular-nums">{c.valeur}</Text>
            <Text className="text-muted-foreground text-xs">{c.indice}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const dateCourte = (iso: string) => formatJourCourt(iso, FUSEAU);

/** Le record mis en avant : son chiffre en grand, les répétitions à côté, sa date en haut. */
function RecordHeros({ record }: { record: RecordExercice }) {
  const charge = record.type === "CHARGE";
  return (
    <View
      className="gap-2 rounded-lg border-2 border-record bg-card p-4"
      accessibilityLabel={
        charge
          ? `Meilleure charge : ${kg(record.valeur)} × ${record.reps}, le ${formatJourSemaine(record.date, FUSEAU)}`
          : `Meilleures répétitions : ${record.valeur}, le ${formatJourSemaine(record.date, FUSEAU)}`
      }
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1 rounded-full border border-record px-2 py-0.5">
          <Icon as={TrendingUp} className="size-3 text-record" />
          <Text className="font-semibold text-record text-xs">
            {charge ? "Meilleure charge" : "Répétitions"}
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs">{dateCourte(record.date)}</Text>
      </View>
      <View className="flex-row items-end gap-2.5">
        <Text className="font-semibold text-7xl tabular-nums tracking-tighter">
          {charge ? chargeEnTexte(record.valeur, SYSTEME_UNITES) : record.valeur}
        </Text>
        <View className="pb-2.5">
          <Text className="font-semibold text-muted-foreground text-xl">
            {charge ? UNITE : "rép."}
          </Text>
          {charge ? (
            <Text className="font-semibold text-xl tabular-nums">× {record.reps}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Une ligne par séance, la plus récente d'abord ; chacune ouvre son détail. */
function Seances({
  historique,
  onOuvrir,
}: {
  historique: HistoriqueExercice;
  onOuvrir: (id: string) => void;
}) {
  return (
    <View className="overflow-hidden rounded-lg border border-border">
      <View className="gap-0.5 p-4 pb-3">
        <Text className="font-medium" accessibilityRole="header">
          Historique
        </Text>
        <Text className="text-muted-foreground text-sm">Chaque séance mène à son relevé.</Text>
      </View>
      {historique.map((s) => {
        const c = chiffresSeance(s);
        return (
          <View key={s.id}>
            <Separator />
            <Pressable
              onPress={() => onOuvrir(s.id)}
              accessibilityRole="button"
              className="flex-row items-center gap-3 px-4 py-3 active:bg-accent"
            >
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-baseline justify-between gap-2">
                  <Text className="font-medium" numberOfLines={1}>
                    {jour(s.debut)}
                  </Text>
                  <Text className="text-muted-foreground text-sm tabular-nums">
                    {kg(c.volume)}
                    {c.unRm === null ? "" : ` · 1RM ${kg(Math.round(c.unRm))}`}
                  </Text>
                </View>
                <Text className="text-muted-foreground text-sm tabular-nums">
                  {seriesTexte(s) || "Aucune série faite"}
                </Text>
              </View>
              <Icon as={ChevronRight} className="size-4 text-muted-foreground" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** Les pourcentages du 1RM estimé, arrondis aux 2,5 kg : de quoi régler une charge de travail. */
function Pourcentages({ historique }: { historique: HistoriqueExercice }) {
  const unRm = recordsExercice(historique).find((r) => r.type === "UN_RM")?.valeur ?? 0;
  return (
    <Carte
      titre="Pourcentages du 1RM"
      detail={
        unRm > 0
          ? `Sur un 1RM estimé de ${kg(Math.round(unRm))}, arrondi aux 2,5 kg`
          : "Pas encore de série chargée"
      }
    >
      {unRm > 0 ? (
        <View className="flex-row flex-wrap">
          {pourcentagesUnRm(unRm).map((r) => (
            <View key={r.percent} className="w-1/2 flex-row justify-between py-0.5 pr-6">
              <Text className="text-muted-foreground text-sm">{r.percent} %</Text>
              <Text className="text-sm tabular-nums">{kg(r.kg)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Carte>
  );
}

/** La meilleure charge par nombre de répétitions, de 1 à 12 : les cases vides se voient. */
function ParReps({ historique }: { historique: HistoriqueExercice }) {
  const parReps = meilleureChargeParReps(historique);
  return (
    <Carte titre="Meilleure charge par répétitions">
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((reps) => {
          const v = parReps.get(reps);
          return (
            <View
              key={reps}
              className={cn(
                "w-[22%] grow items-center rounded-lg border border-border px-1 py-1.5",
                !v && "border-dashed",
              )}
            >
              <Text className="text-muted-foreground text-xs">{reps} rép.</Text>
              <Text className={cn("text-sm tabular-nums", !v && "text-muted-foreground")}>
                {v ? kg(v) : "—"}
              </Text>
            </View>
          );
        })}
      </View>
    </Carte>
  );
}
