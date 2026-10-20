import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Appearance } from "react-native";
import { Uniwind } from "uniwind";

/**
 * Le thème choisi (D128, D129) : celui du système par défaut, ou forcé — en
 * salle on veut souvent le sombre. Gardé sur le téléphone : c'est un réglage
 * d'appareil. Uniwind sert les classes (D316) ; `Appearance` fait suivre
 * `useColorScheme`, donc l'ancien `useCouleurs`, au même choix.
 */
export type ChoixTheme = "systeme" | "sombre" | "clair";

const CLE = "better-lift:theme";

function appliquer(choix: ChoixTheme) {
  Uniwind.setTheme(choix === "sombre" ? "dark" : choix === "clair" ? "light" : "system");
  Appearance.setColorScheme(
    choix === "sombre" ? "dark" : choix === "clair" ? "light" : "unspecified",
  );
}

/** Au démarrage : le choix gardé, appliqué avant que l'écran ne s'affiche longtemps. */
export async function appliquerThemeGarde(): Promise<void> {
  try {
    const garde = await AsyncStorage.getItem(CLE);
    if (garde === "sombre" || garde === "clair") appliquer(garde);
  } catch {
    // Un stockage illisible laisse le thème du système.
  }
}

export function useChoixTheme(): [ChoixTheme, (c: ChoixTheme) => void] {
  const [choix, setChoix] = useState<ChoixTheme>("systeme");
  useEffect(() => {
    void AsyncStorage.getItem(CLE).then((g) => {
      if (g === "sombre" || g === "clair") setChoix(g);
    });
  }, []);
  const regler = (c: ChoixTheme) => {
    setChoix(c);
    appliquer(c);
    void AsyncStorage.setItem(CLE, c);
  };
  return [choix, regler];
}
