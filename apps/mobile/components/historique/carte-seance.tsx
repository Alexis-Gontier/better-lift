import {
  type ApercuExercice,
  apercuExercices,
  bilanSeance,
  type ElementFile,
  formaterCharge,
  formatJourSemaine,
  type SeanceFil,
} from "@better-lift/shared";
import { CloudUpload, Trophy } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { FUSEAU } from "@/lib/fuseau";
import { libelleMinutes } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « 80 kg × 8 », « 12 rép. » au poids du corps. */
function libelleSerie(m: NonNullable<ApercuExercice["meilleure"]>): string {
  return m.chargeKg === null
    ? `${m.reps} rép.`
    : `${formaterCharge(m.chargeKg, SYSTEME_UNITES)} × ${m.reps}`;
}

/**
 * Une séance terminée qui attend dans la file d'envoi, à la forme d'une séance du serveur :
 * la carte la montre en tête de l'historique avant qu'elle n'y arrive (D345).
 */
export function filEnAttente(e: ElementFile): SeanceFil {
  const { seriesFaites, volumeKg } = bilanSeance(e.seance);
  return {
    id: e.seance.id,
    nom: e.seance.nom,
    routineId: e.seance.routineId,
    debut: e.seance.debut,
    fin: e.fin,
    seriesFaites,
    volumeKg,
    // Les records se jugent contre l'historique du serveur : pas avant l'envoi.
    nbRecords: 0,
    nbExercices: e.seance.exercices.length,
    apercu: apercuExercices(e.seance.exercices.map((x) => ({ ...x, image: null }))),
  };
}

/**
 * Une séance de l'historique (D345), comme Hevy : le nom et les records battus (en contour,
 * D28), la date, la durée et le volume, puis les premiers exercices avec leur meilleure série.
 * Une séance encore dans la file d'envoi ne s'ouvre pas : le serveur ne la connaît pas encore.
 */
export function CarteSeance({
  seance,
  enAttente = false,
  onOuvrir,
}: {
  seance: SeanceFil;
  enAttente?: boolean;
  onOuvrir?: () => void;
}) {
  const reste = seance.nbExercices - seance.apercu.length;
  return (
    <Pressable
      onPress={onOuvrir}
      disabled={!onOuvrir}
      accessibilityRole={onOuvrir ? "button" : undefined}
      accessibilityHint={onOuvrir ? "Ouvre la séance" : undefined}
      className={cn(
        "gap-3 rounded-lg border border-border bg-background px-4 py-3 active:bg-accent",
        enAttente && "border-dashed",
      )}
    >
      <View className="gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="shrink font-medium text-base" numberOfLines={1}>
            {seance.nom}
          </Text>
          {seance.nbRecords > 0 ? (
            <View
              className="flex-row items-center gap-1 rounded-full border border-foreground px-2 py-0.5"
              accessibilityLabel={pluriel(seance.nbRecords, "record")}
            >
              <Icon as={Trophy} className="size-3 text-foreground" />
              <Text className="font-medium text-xs tabular-nums">{seance.nbRecords}</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          {[
            majuscule(formatJourSemaine(seance.debut, FUSEAU)),
            libelleMinutes(seance.debut, seance.fin),
            formaterCharge(Math.round(seance.volumeKg), SYSTEME_UNITES),
          ].join(" · ")}
        </Text>
        {enAttente ? (
          <View className="flex-row items-center gap-1.5 pt-1">
            <Icon as={CloudUpload} className="size-4 text-muted-foreground" />
            <Text className="text-muted-foreground text-sm">En attente d'envoi</Text>
          </View>
        ) : null}
      </View>

      {seance.apercu.length > 0 ? (
        <View className="gap-1">
          {seance.apercu.map((e, i) => (
            // Clé par position : un exercice peut revenir deux fois dans une séance.
            <View key={`${e.slug}-${i}`} className="flex-row items-baseline gap-2">
              {e.nbSeries > 0 ? (
                <Text className="flex-1 text-sm" numberOfLines={1}>
                  <Text className="text-muted-foreground text-sm tabular-nums">
                    {e.nbSeries} ×{" "}
                  </Text>
                  {e.nom}
                </Text>
              ) : (
                // Sauté : en retrait, sans « 0 × ».
                <Text className="flex-1 text-muted-foreground text-sm" numberOfLines={1}>
                  {e.nom}
                </Text>
              )}
              {e.meilleure ? (
                <Text className="shrink-0 text-muted-foreground text-sm tabular-nums">
                  {libelleSerie(e.meilleure)}
                </Text>
              ) : null}
            </View>
          ))}
          {reste > 0 ? (
            <Text className="text-muted-foreground text-sm">
              {reste === 1 ? "et 1 autre exercice" : `et ${reste} autres exercices`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
