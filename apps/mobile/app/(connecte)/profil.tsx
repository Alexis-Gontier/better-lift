import { PREFERENCES_DEFAUT } from "@better-lift/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { FileEnvoi } from "@/components/file-envoi";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { TitreOnglet } from "@/components/ui/titre-onglet";
import { authClient } from "@/lib/auth-client";
import { useConfirmer, useFeuille } from "@/lib/confirmation";
import { persister } from "@/lib/hors-ligne";
import { optionsPreferences, useEcrirePreferences } from "@/lib/requetes";
import { useSeance } from "@/lib/seance";
import { CHOIX_REPOS, libelleRepos } from "@/lib/temps";
import { type ChoixTheme, useChoixTheme } from "@/lib/theme-choix";
import { cn } from "@/lib/utils";
import { useVibrations } from "@/lib/vibrations";

const THEMES: Record<ChoixTheme, string> = { systeme: "Système", sombre: "Sombre", clair: "Clair" };

/**
 * Le Profil, au minimum (D318) : ce qui sert en salle — thème, repos par défaut
 * (sur le compte, D129), vibrations — et la déconnexion. Le bilan, l'objectif et
 * l'export vivent sur le web. Une séance pas encore envoyée passe avant tout.
 */
export default function Profil() {
  const router = useRouter();
  const client = useQueryClient();
  const { data: session } = authClient.useSession();
  const { file, seance } = useSeance();
  const [vibrations, reglerVibrations] = useVibrations();
  const demander = useConfirmer();
  const enAttente = file.filter((e) => e.erreur === null).length;
  const preferences = useQuery(optionsPreferences());
  const ecrire = useEcrirePreferences();
  const [theme, reglerTheme] = useChoixTheme();
  const feuille = useFeuille();
  const prefs = preferences.data ?? PREFERENCES_DEFAUT;

  const choisirRepos = () =>
    feuille({
      titre: "Repos par défaut",
      options: CHOIX_REPOS.map((sec) => ({
        libelle: sec ? libelleRepos(sec) : "Aucun",
        choisie: prefs.reposDefautSec === sec,
        onPress: () => ecrire.mutate({ ...prefs, reposDefautSec: sec }),
      })),
    });
  const choisirTheme = () =>
    feuille({
      titre: "Thème",
      options: (Object.keys(THEMES) as ChoixTheme[]).map((t) => ({
        libelle: THEMES[t],
        choisie: theme === t,
        onPress: () => reglerTheme(t),
      })),
    });

  const seDeconnecter = async () => {
    await authClient.signOut();
    // Les clés de cache ne portent pas l'utilisateur : sans ce vidage, le
    // compte suivant verrait un instant les données du précédent.
    client.clear();
    // Le cache gardé sur le disque (D96) part aussi : le compte suivant ne doit
    // jamais voir les routines du précédent, même hors ligne.
    await persister.removeClient();
    router.replace("/connexion");
  };

  // Se déconnecter avec des séances non envoyées : elles restent sur le disque,
  // mais partiraient sous le compte suivant. On prévient.
  const confirmer = () =>
    enAttente > 0 || seance
      ? demander({
          titre: "Se déconnecter ?",
          message:
            "Une séance est en cours ou attend d'être envoyée. Elle restera sur ce téléphone.",
          action: "Se déconnecter",
          annuler: "Rester connecté",
          onConfirmer: () => void seDeconnecter(),
        })
      : void seDeconnecter();

  return (
    <Ecran className="flex-1 bg-background" edges={["top"]}>
      <TitreOnglet titre="Profil" />
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        {/* Rien en attente : la section n'existe pas (D175). */}
        <FileEnvoi />

        <View className="overflow-hidden rounded-lg border border-border">
          <Ligne libelle="Thème" onPress={choisirTheme}>
            <Text className="text-muted-foreground">{THEMES[theme]}</Text>
          </Ligne>
          <Separator />
          <Ligne
            libelle="Repos par défaut"
            detail="Pour les exercices sans repos propre."
            onPress={choisirRepos}
            inactif={!preferences.data}
          >
            <Text className="text-muted-foreground">
              {prefs.reposDefautSec ? libelleRepos(prefs.reposDefautSec) : "Aucun"}
            </Text>
          </Ligne>
          <Separator />
          <Ligne libelle="Vibrations" detail="Série validée, fin du repos.">
            <Switch
              value={vibrations}
              onValueChange={reglerVibrations}
              accessibilityLabel="Vibrations"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-input"
              thumbColorClassName="accent-background"
            />
          </Ligne>
        </View>

        <View className="gap-0.5 px-1">
          <Text className="text-muted-foreground text-sm" numberOfLines={1}>
            {session?.user.email ?? "—"}
          </Text>
          <Text className="text-muted-foreground text-sm">
            Version {Constants.expoConfig?.version ?? "—"}
          </Text>
        </View>

        <Button variant="outline" className="h-12" onPress={confirmer}>
          <Text className="text-destructive">Se déconnecter</Text>
        </Button>
      </ScrollView>
    </Ecran>
  );
}

function Ligne({
  libelle,
  detail,
  onPress,
  inactif,
  children,
}: {
  libelle: string;
  detail?: string;
  /** Une ligne qui ouvre un choix : appuyable en entier, chevron au bout. */
  onPress?: () => void;
  inactif?: boolean;
  children: ReactNode;
}) {
  const contenu = (
    <>
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{libelle}</Text>
        {detail ? <Text className="text-muted-foreground text-sm">{detail}</Text> : null}
      </View>
      {children}
      {onPress ? <Icon as={ChevronRight} className="size-4.5 text-muted-foreground" /> : null}
    </>
  );
  const classe = "min-h-14 flex-row items-center gap-3 px-4 py-3";
  return onPress ? (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      className={cn(classe, "active:bg-accent", inactif && "opacity-50")}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactif }}
    >
      {contenu}
    </Pressable>
  ) : (
    <View className={classe}>{contenu}</View>
  );
}
