import { prochaineSerie, reposRestant, secondesEcoulees } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { ChevronUp, Trash2 } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useConfirmer } from "@/lib/confirmation";
import { useSeance } from "@/lib/seance";
import { formaterDuree, useMaintenant } from "@/lib/temps";

/**
 * La séance en cours, en bas de l'accueil (D107, D316, D336, D337). Le
 * bandeau, chevron vers le haut, reprend la séance ; la corbeille l'abandonne,
 * après confirmation. Il dit l'exercice en cours et le repos qui tourne s'il y
 * en a un, le chrono sinon — les deux se déduisent d'heures stockées, jamais
 * d'un compteur (§ 8).
 */
export function BandeauSeance() {
  const { seance } = useSeance();
  return seance ? <Contenu /> : null;
}

// À part : l'horloge ne tourne que lorsqu'une séance est en cours.
function Contenu() {
  const router = useRouter();
  const { seance, abandonner } = useSeance();
  const confirmer = useConfirmer();
  const maintenant = useMaintenant();
  if (!seance) return null;

  const repos = reposRestant(seance, maintenant);
  const temps =
    repos !== null && repos > 0
      ? `Repos ${formaterDuree(repos)}`
      : formaterDuree(secondesEcoulees(seance.debut, maintenant));
  const p = prochaineSerie(seance);
  const exercice = p ? seance.exercices[p.iE]?.nom : undefined;
  // Le temps d'abord : un nom d'exercice long est coupé, jamais le repos.
  const detail = exercice ? `${temps} · ${exercice}` : temps;

  const supprimer = () =>
    confirmer({
      titre: "Abandonner la séance ?",
      message: "Rien ne sera enregistré.",
      action: "Abandonner la séance",
      icone: Trash2,
      annuler: "Garder la séance",
      onConfirmer: abandonner,
    });

  return (
    <View className="mx-4 mb-2 min-h-14 flex-row items-center rounded-lg border border-border bg-secondary">
      <Pressable
        onPress={() => router.push("/seance")}
        accessibilityRole="button"
        accessibilityLabel={`Reprendre la séance ${seance.nom}, ${detail}`}
        className="min-h-14 flex-1 flex-row items-center gap-3 rounded-l-lg py-2 pl-3 active:bg-accent"
      >
        {/* Le pendant du chevron qui replie la séance (D337) : on déplie ce qu'on a replié. */}
        <Icon as={ChevronUp} className="size-5 text-muted-foreground" />
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold" numberOfLines={1}>
            {seance.nom}
          </Text>
          <Text className="text-muted-foreground text-sm tabular-nums" numberOfLines={1}>
            {detail}
          </Text>
        </View>
      </Pressable>
      <Button
        variant="ghost"
        size="icon"
        className="mx-1 size-12"
        onPress={supprimer}
        accessibilityLabel={`Abandonner la séance ${seance.nom}`}
      >
        <Icon as={Trash2} className="size-5 text-destructive" />
      </Button>
    </View>
  );
}
