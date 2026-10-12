import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from "@expo-google-fonts/barlow";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed";
import type { Theme } from "../type";
import { clair, sombre } from "./couleurs";

/** Underground orange (D161–D177) : Barlow et son affiche condensée, rayons francs de 6. */
export const underground: Theme = {
  nom: "Underground orange",
  couleurs: { sombre, clair },
  polices: {
    fichiers: {
      Barlow_400Regular,
      Barlow_500Medium,
      Barlow_600SemiBold,
      Barlow_700Bold,
      BarlowCondensed_800ExtraBold,
    },
    regulier: "Barlow_400Regular",
    moyen: "Barlow_500Medium",
    demiGras: "Barlow_600SemiBold",
    gras: "Barlow_700Bold",
    affiche: "BarlowCondensed_800ExtraBold",
  },
  rayon: { cellule: 6, bouton: 6, bandeau: 6, carte: 6, feuille: 16 },
  affiche: { textTransform: "uppercase", letterSpacing: 0.3 },
};
