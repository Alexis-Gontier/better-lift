import type { ElementFile, SeanceEnCours } from "@better-lift/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Le disque, et rien d'autre (D55).
 *
 * Deux clés, chacune UNIQUE : le brouillon de la séance en cours, et la file des
 * séances terminées à envoyer. Ce qui n'est pas ici ne survit pas à un arrêt
 * forcé — c'est tout l'objet du § 8 de la conception.
 */
const CLE_BROUILLON = "better-lift:seance-en-cours";
const CLE_FILE = "better-lift:seances-a-envoyer";

async function lire<T>(cle: string): Promise<T | null> {
  const brut = await AsyncStorage.getItem(cle);
  if (brut === null) return null;
  try {
    return JSON.parse(brut) as T;
  } catch {
    // Un contenu illisible ne doit pas bloquer l'app ; on le laisse en place
    // plutôt que de l'effacer — il reste récupérable à la main.
    return null;
  }
}

export const brouillon = {
  lire: () => lire<SeanceEnCours>(CLE_BROUILLON),
  ecrire: (s: SeanceEnCours) => AsyncStorage.setItem(CLE_BROUILLON, JSON.stringify(s)),
  effacer: () => AsyncStorage.removeItem(CLE_BROUILLON),
};

export const fileEnvoi = {
  lire: async () => (await lire<ElementFile[]>(CLE_FILE)) ?? [],
  ecrire: (f: ElementFile[]) => AsyncStorage.setItem(CLE_FILE, JSON.stringify(f)),
};
