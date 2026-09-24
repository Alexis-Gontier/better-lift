import { avecPrecedents, demarrerDepuisRoutine, demarrerVide } from "@better-lift/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { chargerPrecedents, optionsRoutine } from "./requetes";
import { useSeance } from "./seance";
import { nouvelId } from "./temps";

/**
 * Démarrer une séance, vide ou depuis une routine : partagé par l'Accueil et
 * l'écran « Démarrer » du bouton central.
 *
 * Démarrer ne doit JAMAIS écraser une séance en cours (§ 8) : la vérification
 * relit le DISQUE au moment de l'appui, pas l'état d'un écran.
 */
export function useDemarrer({ depuisModale = false }: { depuisModale?: boolean } = {}) {
  const router = useRouter();
  const client = useQueryClient();
  const { demarrer: demarrerSeance } = useSeance();
  const [ouverture, setOuverture] = useState<string | null>(null);

  // Depuis l'écran « Démarrer », `replace` : le retour de la séance ne doit pas
  // y ramener. Depuis l'Accueil, `push` : le retour ramène aux onglets.
  const aller = () => (depuisModale ? router.replace("/seance") : router.push("/seance"));

  const lancer = async (creer: () => ReturnType<typeof demarrerVide>) => {
    if (!(await demarrerSeance(creer()))) {
      Alert.alert(
        "Une séance est en cours",
        "Termine-la ou abandonne-la avant d'en commencer une autre.",
        [{ text: "Reprendre", onPress: () => aller() }],
      );
      return;
    }
    aller();
  };

  const vide = () => lancer(() => demarrerVide(nouvelId(), new Date()));

  const routine = async (id: string) => {
    // Le résumé ne porte pas les séries : le détail se charge à l'appui.
    setOuverture(id);
    try {
      const detail = await client.fetchQuery(optionsRoutine(id));
      // La dernière fois entre dans le brouillon AVANT son écriture (D67).
      const precedents = await chargerPrecedents(detail.exercices.map((e) => e.slug));
      await lancer(() =>
        avecPrecedents(demarrerDepuisRoutine(detail, nouvelId(), new Date()), precedents),
      );
    } catch {
      Alert.alert("Routine indisponible", "Elle n'a pas pu être chargée. Vérifie ta connexion.");
    } finally {
      setOuverture(null);
    }
  };

  return { vide, routine, ouverture };
}
