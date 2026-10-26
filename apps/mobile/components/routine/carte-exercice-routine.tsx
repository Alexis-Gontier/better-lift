import {
  ABREGE_TYPE_SERIE,
  formaterCharge,
  type RoleRepos,
  type RoutineDetail,
  resumeSeries,
} from "@better-lift/shared";
import { Image } from "expo-image";
import { ChevronDown, ChevronRight, Dumbbell } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { libelleRepos } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";

type Exercice = RoutineDetail["exercices"][number];

/** Les numéros de série : « É » pour un échauffement, les autres comptés à part. */
function numeros(series: Exercice["series"]): string[] {
  let n = 0;
  return series.map((s) => (s.type === "NORMALE" ? String(++n) : ABREGE_TYPE_SERIE[s.type]));
}

/**
 * Un exercice de la page d'une routine (D321), replié comme dans l'éditeur du web (D253) :
 * la tête dit ce qui attend (« Pectoraux · 1 É + 3 × 8 · 80 kg ») ; ouvert, le tableau des
 * séries et le repos. Lecture seule : la routine se modifie sur le web. Sa tête ouvre la
 * page de l'exercice (D348), comme Hevy ; le chevron seul déplie.
 */
export function CarteExerciceRoutine({
  exercice,
  ouvert,
  onBasculer,
  onOuvrir,
  repos,
}: {
  exercice: Exercice;
  ouvert: boolean;
  onBasculer: () => void;
  onOuvrir: () => void;
  repos: RoleRepos;
}) {
  const resume = resumeSeries(
    exercice.series.map((s) => ({ type: s.type, reps: s.repsCible, kg: s.chargeCibleKg })),
    SYSTEME_UNITES,
  );
  const num = numeros(exercice.series);
  return (
    <View className="overflow-hidden rounded-lg border border-border bg-background">
      {/* Deux gestes (D348) : le chevron déplie les séries, le reste ouvre la page de l'exercice. */}
      <View className="min-h-16 flex-row items-stretch">
        <Pressable
          onPress={onBasculer}
          accessibilityRole="button"
          accessibilityState={{ expanded: ouvert }}
          accessibilityLabel={ouvert ? "Replier les séries" : "Déplier les séries"}
          className="w-12 items-center justify-center active:bg-accent"
        >
          <Icon as={ouvert ? ChevronDown : ChevronRight} className="size-5 text-muted-foreground" />
        </Pressable>
        <Pressable
          onPress={onOuvrir}
          accessibilityRole="button"
          accessibilityLabel={`${exercice.nom}, ${resume}`}
          accessibilityHint="Ouvre la page de l'exercice"
          className="flex-1 flex-row items-center gap-3 py-3 pr-3 active:bg-accent"
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
            <Text className="font-medium" numberOfLines={1}>
              {exercice.nom}
            </Text>
            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
              {ouvert
                ? exercice.musclePrincipal
                : [exercice.musclePrincipal, resume].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </Pressable>
      </View>

      {ouvert ? (
        <>
          <Separator />
          <View className="gap-1 px-4 py-3">
            <View className="flex-row">
              <Text className="w-14 text-muted-foreground text-xs uppercase">Série</Text>
              <Text className="flex-1 text-muted-foreground text-xs uppercase">Charge</Text>
              <Text className="w-16 text-right text-muted-foreground text-xs uppercase">Reps</Text>
            </View>
            {exercice.series.map((s, i) => (
              <View key={i} className="min-h-9 flex-row items-center">
                <Text className="w-14 font-medium tabular-nums">{num[i]}</Text>
                <Text className="flex-1 tabular-nums">
                  {s.chargeCibleKg === null ? "—" : formaterCharge(s.chargeCibleKg, SYSTEME_UNITES)}
                </Text>
                <Text className="w-16 text-right tabular-nums">{s.repsCible ?? "—"}</Text>
              </View>
            ))}
            {repos === "masque" ? null : (
              <Text className="pt-1 text-muted-foreground text-sm">
                {exercice.reposSec === null
                  ? "Repos par défaut"
                  : `Repos ${libelleRepos(exercice.reposSec)}`}
              </Text>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}
