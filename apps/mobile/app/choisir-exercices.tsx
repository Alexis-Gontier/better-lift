import { filtrerCatalogue, LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Dumbbell, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { type ExerciceChoisi, rendreChoix } from "@/lib/choix-exercices";
import { optionsCatalogueComplet } from "@/lib/requetes";
import { cn } from "@/lib/utils";

/**
 * Choisir des exercices dans le catalogue (D93) : une recherche, et une
 * sélection multiple — on coche tout ce qu'on veut, puis on ajoute d'un coup.
 * En `?mode=remplacer`, un seul choix, rendu dès l'appui.
 */
export default function ChoisirExercices() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const unique = mode === "remplacer";
  const [filtre, setFiltre] = useState("");
  const [choix, setChoix] = useState<ExerciceChoisi[]>([]);
  // Le catalogue entier, filtré ici (D97) : la recherche marche hors ligne et
  // répond à chaque lettre sans aller-retour.
  const catalogue = useQuery(optionsCatalogueComplet());
  const resultats = useMemo(
    () => (catalogue.data ? filtrerCatalogue(catalogue.data, filtre) : []),
    [catalogue.data, filtre],
  );

  const basculer = (e: ExerciceChoisi) => {
    if (unique) {
      rendreChoix([e]);
      router.back();
      return;
    }
    setChoix((c) =>
      c.some((x) => x.slug === e.slug) ? c.filter((x) => x.slug !== e.slug) : [...c, e],
    );
  };

  const ajouter = () => {
    rendreChoix(choix);
    router.back();
  };

  return (
    <Ecran className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="h-14 flex-row items-center gap-1 px-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          onPress={() => router.back()}
          accessibilityLabel="Fermer"
        >
          <Icon as={X} className="size-6 text-foreground" />
        </Button>
        <Text className="flex-1 font-semibold text-xl" accessibilityRole="header">
          {unique ? "Remplacer l'exercice" : "Ajouter des exercices"}
        </Text>
      </View>

      <View className="px-4 pb-3">
        <Input
          value={filtre}
          onChangeText={setFiltre}
          placeholder="Chercher un exercice"
          className="h-12 pl-10"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Chercher un exercice"
        />
        <View className="absolute top-0 bottom-3 left-7 justify-center" pointerEvents="none">
          <Icon as={Search} className="size-4.5 text-muted-foreground" />
        </View>
      </View>

      {/* Jamais chargé et hors ligne : la requête attend le réseau (D97). */}
      {catalogue.isPending && catalogue.fetchStatus === "paused" ? (
        <Vide
          titre="Hors ligne"
          message="Le catalogue se charge à la première connexion, puis reste sur le téléphone."
        />
      ) : catalogue.isPending ? (
        <Chargement />
      ) : catalogue.isError && !catalogue.data ? (
        <Erreur
          message="Le catalogue n'a pas pu être chargé. Il faut du réseau la première fois."
          onReessayer={() => catalogue.refetch()}
        />
      ) : resultats.length === 0 ? (
        <Vide titre="Aucun exercice trouvé" message={`Rien ne correspond à « ${filtre} ».`} />
      ) : (
        <FlatList
          className="flex-1"
          data={resultats}
          keyExtractor={(x) => x.slug}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={Filet}
          renderItem={({ item }) => {
            const coche = choix.some((c) => c.slug === item.slug);
            return (
              <Pressable
                className="min-h-17 flex-row items-center gap-3 px-4 py-2 active:bg-accent"
                onPress={() => basculer({ slug: item.slug, nom: item.nom, image: item.image })}
                accessibilityRole={unique ? "button" : "checkbox"}
                accessibilityState={unique ? undefined : { checked: coche }}
              >
                {/* Fond blanc : les images du catalogue sont dessinées sur blanc. */}
                <View className="size-13 items-center justify-center overflow-hidden rounded-md bg-white">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: 52, height: 52 }}
                      contentFit="cover"
                      cachePolicy="disk"
                    />
                  ) : (
                    <Icon as={Dumbbell} className="size-5 text-muted-foreground" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-medium" numberOfLines={2}>
                    {item.nom}
                  </Text>
                  <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                    {LIBELLE_GROUPE[item.groupe]} · {item.equipement}
                  </Text>
                </View>
                {unique ? null : (
                  <View
                    className={cn(
                      "size-6.5 items-center justify-center rounded-md border-2 border-input",
                      coche && "border-primary bg-primary",
                    )}
                  >
                    {coche ? (
                      <Icon as={Check} className="size-4 text-primary-foreground" strokeWidth={3} />
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {unique ? null : (
        <View className="border-border border-t p-4">
          <Button className="h-12" disabled={choix.length === 0} onPress={ajouter}>
            <Text>{choix.length === 0 ? "Coche des exercices" : `Ajouter (${choix.length})`}</Text>
          </Button>
        </View>
      )}
    </Ecran>
  );
}

function Filet() {
  return <Separator className="ml-4" />;
}
