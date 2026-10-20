import { reposRestant, secondesEcoulees } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useSeance } from "@/lib/seance";
import { formaterDuree, useMaintenant } from "@/lib/temps";

/**
 * La séance en cours, en bas de l'accueil (D107, D316). Tout le bandeau est
 * appuyable. Il dit le repos qui tourne s'il y en a un, le chrono sinon — les
 * deux se déduisent d'heures stockées, jamais d'un compteur (§ 8).
 */
export function BandeauSeance() {
  const { seance } = useSeance();
  return seance ? <Contenu /> : null;
}

// À part : l'horloge ne tourne que lorsqu'une séance est en cours.
function Contenu() {
  const router = useRouter();
  const { seance } = useSeance();
  const maintenant = useMaintenant();
  if (!seance) return null;

  const repos = reposRestant(seance, maintenant);
  const temps =
    repos !== null && repos > 0
      ? `Repos ${formaterDuree(repos)}`
      : formaterDuree(secondesEcoulees(seance.debut, maintenant));

  return (
    <Pressable
      onPress={() => router.push("/seance")}
      accessibilityRole="button"
      accessibilityLabel={`Reprendre la séance ${seance.nom}, ${temps}`}
      className="mx-4 mb-2 min-h-14 flex-row items-center gap-3 rounded-lg border border-border bg-secondary px-4 active:bg-accent"
    >
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold" numberOfLines={1}>
          {seance.nom}
        </Text>
        <Text className="text-muted-foreground text-sm tabular-nums">{temps}</Text>
      </View>
      <Text className="font-medium">Reprendre</Text>
    </Pressable>
  );
}
