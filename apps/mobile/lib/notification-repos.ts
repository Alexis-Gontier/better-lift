import {
  type ActionRepos,
  appliquerActionRepos,
  type ContenuNotifRepos,
  contenuNotifRepos,
  contenuNotifSuivante,
  type SeanceEnCours,
} from "@better-lift/shared";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import type * as NotifyKit from "react-native-notify-kit";
import { queryClient } from "./hors-ligne";
import { brouillon } from "./stockage";
import { SYSTEME_UNITES } from "./unites";
import { vibrationsActives } from "./vibrations";

/**
 * La notification de repos (D338) : tenue au premier plan tant qu'un repos
 * court, avec le chrono, une barre qui se vide, la série qui suit et trois
 * boutons (−15 s, +15 s, Passer) qui agissent sur la séance même app fermée.
 * À la fin, elle laisse place à la série suivante (D340), qui sonne — sauf app
 * au premier plan, où l'écran vibre déjà — et dont « Terminer la série » coche
 * la série et relance le repos : on enchaîne sans ouvrir l'app.
 *
 * Elle dérive de l'état : tout passe par `aligner(séance)`, appelée par le
 * hook à chaque changement, par le service chaque seconde (le disque fait foi)
 * et par un bouton touché app tuée.
 *
 * **Android hors Expo Go seulement** : notify-kit est un module natif, absent
 * d'Expo Go, et iOS n'a pas de service au premier plan. Ailleurs, rien.
 */
type Module = typeof NotifyKit;

const disponible =
  Platform.OS === "android" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// Chargé à la demande : sous Expo Go, le simple accès au module natif lève.
const nk: Module | null = disponible ? (require("react-native-notify-kit") as Module) : null;

const ID_REPOS = "repos";
const ID_SUIVANTE = "fin-repos";
const CANAL_REPOS = "repos-en-cours";
// Deux canaux pour la fin : sous Android, la vibration d'un canal est figée à
// sa création. Le réglage « Vibrations » du Profil (D113) choisit le canal.
const CANAL_FIN = "repos";
const CANAL_FIN_SANS_VIBRATION = "repos-sans-vibration";
// Générée par le plugin de notify-kit (`app.json`) depuis le logo recadré.
const ICONE = "notification_icon";
const COULEUR = "#171717";

const ACTIONS: Record<string, ActionRepos> = {
  moins: "moins",
  plus: "plus",
  passer: "passer",
  terminer: "terminer",
};

let canaux: Promise<void> | null = null;
function preparer(k: Module): Promise<void> {
  canaux ??= (async () => {
    await k.default.createChannel({
      id: CANAL_REPOS,
      name: "Repos en cours",
      importance: k.AndroidImportance.LOW,
    });
    await k.default.createChannel({
      id: CANAL_FIN,
      name: "Fin du repos",
      importance: k.AndroidImportance.HIGH,
      vibration: true,
    });
    await k.default.createChannel({
      id: CANAL_FIN_SANS_VIBRATION,
      name: "Fin du repos (sans vibration)",
      importance: k.AndroidImportance.HIGH,
      vibration: false,
    });
  })();
  return canaux;
}

// Demandée au premier repos, pas au lancement : la demande a alors un sens.
let permission: Promise<boolean> | null = null;
function autorisee(k: Module): Promise<boolean> {
  permission ??= k.default
    .requestPermission()
    .then((r) => r.authorizationStatus === k.AuthorizationStatus.AUTHORIZED)
    .catch(() => false);
  return permission;
}

async function afficher(k: Module, c: ContenuNotifRepos) {
  await k.default.displayNotification({
    id: ID_REPOS,
    title: c.titre,
    body: c.texte,
    android: {
      channelId: CANAL_REPOS,
      smallIcon: ICONE,
      color: COULEUR,
      asForegroundService: true,
      ongoing: true,
      onlyAlertOnce: true,
      showChronometer: true,
      chronometerDirection: "down",
      timestamp: c.fin,
      // La barre se vide, comme celle du bandeau (D335), en millisecondes : en
      // secondes arrondies au-dessus, elle restait d'une case en retard sur le
      // chrono d'Android, pas vide à 0:00.
      ...(c.duree
        ? {
            progress: {
              max: c.duree * 1000,
              current: Math.max(0, Math.min(c.duree * 1000, c.fin - Date.now())),
            },
          }
        : {}),
      pressAction: { id: "default", launchActivity: "default" },
      actions: [
        { title: "−15 s", pressAction: { id: "moins" } },
        { title: "+15 s", pressAction: { id: "plus" } },
        { title: "Passer", pressAction: { id: "passer" } },
      ],
    },
  });
}

async function retirer(k: Module) {
  await k.default.stopForegroundService();
  await k.default.cancelNotification(ID_REPOS);
}

/**
 * La série qui attend (D340). Elle sonne quand un repos vient de finir, app
 * hors du premier plan ; sinon elle se met à jour sans bruit. `onlyAlertOnce` :
 * la redessiner ne resonne pas.
 */
async function afficherSuivante(k: Module, c: { titre: string; texte: string }, sonner: boolean) {
  const canal = !sonner ? CANAL_REPOS : vibrationsActives() ? CANAL_FIN : CANAL_FIN_SANS_VIBRATION;
  await k.default.displayNotification({
    id: ID_SUIVANTE,
    title: sonner ? `C'est reparti · ${c.titre}` : c.titre,
    body: c.texte,
    android: {
      channelId: canal,
      smallIcon: ICONE,
      color: COULEUR,
      onlyAlertOnce: true,
      pressAction: { id: "default", launchActivity: "default" },
      actions: [{ title: "Terminer la série", pressAction: { id: "terminer" } }],
    },
  });
}

/** Met les notifications d'accord avec la séance : le repos, sinon la série suivante. */
async function aligner(k: Module, s: SeanceEnCours | null) {
  const c = s && contenuNotifRepos(s, new Date(), SYSTEME_UNITES);
  if (c && c.restant > 0) {
    await preparer(k);
    if (!(await autorisee(k))) return;
    await k.default.cancelNotification(ID_SUIVANTE);
    await afficher(k, c);
    return;
  }
  await retirer(k);
  const suivante = s && contenuNotifSuivante(s, SYSTEME_UNITES);
  if (!suivante) return k.default.cancelNotification(ID_SUIVANTE);
  await preparer(k);
  if (!(await autorisee(k))) return;
  // Un repos fini à l'instant sonne ; un « Passer » ou une coche dans l'app, non.
  await afficherSuivante(k, suivante, c !== null && AppState.currentState !== "active");
}

// Les opérations passent l'une après l'autre : trois appuis rapides sur +15 s
// ne croisent pas leurs affichages, la dernière séance connue l'emporte.
let file: Promise<void> = Promise.resolve();
function enFile(operation: () => Promise<void>): Promise<void> {
  // Une erreur ici (permission, canal) ne doit jamais toucher la séance.
  file = file.then(operation).catch(() => {});
  return file;
}

// Le service redessine chaque seconde (la barre) et annonce la fin. Il relit
// le disque : l'app y écrit chaque changement, et app tuée c'est la seule source.
// Chaque tic tombe juste après un changement de seconde du chrono d'Android :
// partis d'un instant quelconque, ils traînaient jusqu'à une seconde derrière.
const apresSeconde = (fin: number) => ((fin - Date.now()) % 1000) + 20;
let boucle = false;
function service(k: Module): Promise<void> {
  return new Promise<void>(() => {
    if (boucle) return;
    boucle = true;
    const tic = async () => {
      const s = await brouillon.lire().catch(() => null);
      const c = s && contenuNotifRepos(s, new Date(), SYSTEME_UNITES);
      if (!c || c.restant === 0) {
        boucle = false;
        await enFile(() => aligner(k, s));
        return;
      }
      await enFile(() => afficher(k, c));
      setTimeout(tic, apresSeconde(c.fin));
    };
    void brouillon
      .lire()
      .then((s) => setTimeout(tic, s?.repos ? apresSeconde(Date.parse(s.repos.fin)) : 0));
  });
}

export type Appliquer = (f: (s: SeanceEnCours) => SeanceEnCours) => void;

// Déclarée par `SeanceProvider` tant que l'app vit : un bouton passe alors par
// elle, comme le bandeau, et l'app reste le seul écrivain du brouillon.
let appliquer: Appliquer | null = null;
export function declarerAppliquer(f: Appliquer | null) {
  appliquer = f;
}

async function surEvenement(k: Module, { type, detail }: NotifyKit.Event) {
  if (type !== k.EventType.ACTION_PRESS) return;
  const action = ACTIONS[detail.pressAction?.id ?? ""];
  if (!action) return;
  // Le repos par défaut du compte (D128), s'il est en mémoire : app tuée, le
  // cache n'est pas relu, et un exercice sans repos propre n'en lance pas.
  const defaut =
    queryClient.getQueryData<{ reposDefautSec: number | null }>(["preferences"])?.reposDefautSec ??
    null;
  const f = (s: SeanceEnCours) => appliquerActionRepos(s, action, new Date(), defaut);
  // App vivante : le hook réaligne la notification sur la séance changée.
  if (appliquer) return appliquer(f);
  // App tuée : le disque, puis la notification, sans attendre le service.
  const s = await brouillon.lire();
  if (!s) return;
  const n = f(s);
  await brouillon.ecrire(n);
  await enFile(() => aligner(k, n));
}

/** Au point d'entrée, avant l'app : app tuée, Android relance ce code seul. */
export function enregistrerNotificationRepos() {
  if (!nk) return;
  const k = nk;
  k.default.registerForegroundService(() => service(k));
  k.default.onBackgroundEvent((e) => surEvenement(k, e));
  k.default.onForegroundEvent((e) => void surEvenement(k, e));
}

/** Tient les notifications alignées sur la séance (`null` : aucune). */
export function useNotificationRepos(seance: SeanceEnCours | null) {
  const c = nk && seance ? contenuNotifRepos(seance, new Date(), SYSTEME_UNITES) : null;
  const suivante = nk && seance && !c ? contenuNotifSuivante(seance, SYSTEME_UNITES) : null;
  // Ce qui se voit, et rien d'autre : un rendu qui ne le change pas ne redessine pas.
  const cle = c
    ? `${c.titre}|${c.texte}|${c.fin}|${c.duree}`
    : suivante
      ? `${suivante.titre}|${suivante.texte}`
      : null;
  const derniere = useRef(seance);
  derniere.current = seance;

  useEffect(() => {
    if (!nk) return;
    const k = nk;
    const s = cle === null ? null : derniere.current;
    void enFile(() => aligner(k, s));
  }, [cle]);
}
