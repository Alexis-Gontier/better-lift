import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
import { ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
import type { Theme } from "../type";
import { clair, sombre } from "./couleurs";

/**
 * Basic-Fit (D183), façon app mobile. Leur police, Heading Pro Treble, est
 * commerciale : Archivo en est la plus proche en libre, Archivo Black pour
 * l'affiche. Rayons de leur échelle : 12 pour les cartes, 8 pour le reste.
 */
export const basicFit: Theme = {
  nom: "Basic-Fit",
  couleurs: { sombre, clair },
  polices: {
    fichiers: {
      Archivo_400Regular,
      Archivo_500Medium,
      Archivo_600SemiBold,
      Archivo_700Bold,
      ArchivoBlack_400Regular,
    },
    regulier: "Archivo_400Regular",
    moyen: "Archivo_500Medium",
    demiGras: "Archivo_600SemiBold",
    gras: "Archivo_700Bold",
    affiche: "ArchivoBlack_400Regular",
  },
  rayon: { cellule: 8, bouton: 8, bandeau: 8, carte: 12, feuille: 16 },
  affiche: { textTransform: "uppercase", letterSpacing: 0 },
};
