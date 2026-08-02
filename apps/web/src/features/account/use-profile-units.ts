"use client";

import { useMe } from "@better-lift/api-client";
import { type UnitSystem } from "@better-lift/validators";

import { apiClient } from "@/lib/api";

/**
 * Système d'unités du **profil**, comme `useProfileLocale` pour la langue.
 *
 * Le repli sur `METRIC` pendant le chargement de `GET /v1/me` est le même
 * arbitrage que pour la locale : c'est l'unité de stockage (règle non
 * négociable n°3), donc afficher la valeur brute une fraction de seconde ne
 * ment jamais sur l'ordre de grandeur — contrairement à un repli impérial, qui
 * montrerait 100 là où l'utilisateur a soulevé 100 kg.
 *
 * Aucun écran n'appelle ce hook directement pour convertir : c'est le rôle de
 * `<Weight>`. Il est exporté parce que la saisie a besoin du chemin inverse.
 */
export function useProfileUnits(): UnitSystem {
  return useMe(apiClient).data?.unitSystem ?? "METRIC";
}
