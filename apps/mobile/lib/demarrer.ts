import { avecPrecedents, demarrerDepuisRoutine, demarrerVide } from "@better-lift/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFeuille, useInformer } from "./confirmation";
import { chargerPrecedents, chargerRoutine } from "./requetes";
import { useSeance } from "./seance";
import { nouvelId } from "./temps";

/**
 * Démarrer une séance, vide ou depuis une routine : partagé par la page d'une routine et
 * l'écran « Démarrer » ouvert depuis l'Accueil.
 *
 * Démarrer ne doit JAMAIS écraser une séance en cours (§ 8) : la vérification
 * relit le DISQUE au moment de l'appui, pas l'état d'un écran.
 */
export function useDemarrer({ depuisModale = false }: { depuisModale?: boolean } = {}) {
  const router = useRouter();
  const client = useQueryClient();
  const { demarrer: demarrerSeance } = useSeance();
  const [ouverture, setOuverture] = useState<string | null>(null);
  const feuille = useFeuille();
  const informer = useInformer();

  // Depuis l'écran « Démarrer », `replace` : le retour de la séance ne doit pas
  // y ramener. Depuis l'Accueil, `push` : le retour ramène aux onglets.
  const aller = () => (depuisModale ? router.replace("/seance") : router.push("/seance"));

  const lancer = async (creer: () => ReturnType<typeof demarrerVide>) => {
    if (!(await demarrerSeance(creer()))) {
      feuille({
        titre: "Une séance est en cours",
        message: "Termine-la ou abandonne-la avant d'en commencer une autre.",
        options: [{ libelle: "Reprendre la séance", onPress: aller }, { libelle: "Fermer" }],
      });
      return;
    }
    aller();
  };

  const vide = () => lancer(() => demarrerVide(nouvelId(), new Date()));

  const routine = async (id: string) => {
    // Le résumé ne porte pas les séries : le détail se charge à l'appui.
    setOuverture(id);
    try {
      // Réseau d'abord, cache en repli (D98) : en salle, la routine de la veille
      // vaut mieux qu'un refus.
      const detail = await chargerRoutine(client, id);
      // La dernière fois entre dans le brouillon AVANT son écriture (D67).
      const precedents = await chargerPrecedents(
        client,
        detail.exercices.map((e) => e.slug),
      );
      await lancer(() =>
        avecPrecedents(demarrerDepuisRoutine(detail, nouvelId(), new Date()), precedents),
      );
    } catch {
      informer(
        "Routine indisponible",
        "Elle n'a jamais été chargée sur ce téléphone. Ouvre-la une fois avec du réseau.",
      );
    } finally {
      setOuverture(null);
    }
  };

  return { vide, routine, ouverture };
}
