import {
  bilanSeance,
  type ElementFile,
  formaterCharge,
  formatJourSemaine,
  type SeanceFil,
} from "@better-lift/shared";
import { ChevronRight, CloudUpload, Trophy } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { FUSEAU } from "@/lib/fuseau";
import { libelleMinutes } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
    // La carte ne montre pas les exercices (D345).
    apercu: [],
  };
}

/**
 * Une séance de l'historique (D345), comme la ligne du web (D263) et la carte d'une routine
 * (D320) : le nom et ses records (contour, D28), le jour et la durée, le volume à droite. Une
 * séance encore dans la file d'envoi ne s'ouvre pas : le serveur ne la connaît pas encore.
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
  return (
    <Pressable
      onPress={onOuvrir}
      disabled={!onOuvrir}
      accessibilityRole={onOuvrir ? "button" : undefined}
      accessibilityHint={onOuvrir ? "Ouvre la séance" : undefined}
      className="min-h-16 flex-row items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 active:bg-accent"
    >
      <View className="flex-1 gap-0.5">
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
          {enAttente
            ? "En attente d'envoi"
            : `${majuscule(formatJourSemaine(seance.debut, FUSEAU))} · ${libelleMinutes(seance.debut, seance.fin)}`}
        </Text>
      </View>
      <Text className="text-sm tabular-nums">
        {formaterCharge(Math.round(seance.volumeKg), SYSTEME_UNITES)}
      </Text>
      <Icon as={enAttente ? CloudUpload : ChevronRight} className="size-4 text-muted-foreground" />
    </Pressable>
  );
}
