import Constants, { ExecutionEnvironment } from "expo-constants";
import type * as ModuleNotifications from "expo-notifications";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { vibrationsActives } from "./vibrations";

/**
 * La fin du repos quand l'application n'est pas au premier plan (téléphone
 * verrouillé, autre application) : une notification LOCALE, programmée à
 * `repos.fin`. Au premier plan, l'écran vibre déjà (`vibrer.finRepos`) : la
 * notification n'y est pas montrée, pour ne pas annoncer deux fois.
 *
 * Elle dérive de l'état, pas des actions : lancer, ±15 s, passer, abandonner,
 * terminer changent tous `repos.fin`, et chaque changement reprogramme ou
 * annule. Un seul identifiant : programmer de nouveau remplace la précédente.
 *
 * **Absente d'Expo Go sous Android** : depuis le SDK 53, le simple import
 * d'`expo-notifications` y lève une erreur, même pour un usage local. Le
 * module est donc chargé à la demande, jamais dans Expo Go ; la notification
 * ne s'éprouve que sur un build EAS (l'APK).
 */
const IDENTIFIANT = "fin-repos";

// Deux canaux : sous Android, la vibration d'un canal est figée à sa création.
// Le réglage « Vibrations » du Profil (D113) choisit donc le canal.
const CANAL = "repos";
const CANAL_SANS_VIBRATION = "repos-sans-vibration";

const indisponible =
  Platform.OS === "android" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let chargement: Promise<typeof ModuleNotifications | null> | null = null;

/** Le module, chargé et préparé une seule fois ; `null` là où il n'existe pas. */
function charger(): Promise<typeof ModuleNotifications | null> {
  chargement ??= (async () => {
    if (indisponible) return null;
    const N = await import("expo-notifications");
    N.setNotificationHandler({
      handleNotification: async () => {
        const auPremierPlan = AppState.currentState === "active";
        return {
          shouldShowBanner: !auPremierPlan,
          shouldShowList: !auPremierPlan,
          shouldPlaySound: !auPremierPlan,
          shouldSetBadge: false,
        };
      },
    });
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync(CANAL, {
        name: "Fin du repos",
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
      });
      await N.setNotificationChannelAsync(CANAL_SANS_VIBRATION, {
        name: "Fin du repos (sans vibration)",
        importance: N.AndroidImportance.HIGH,
        enableVibrate: false,
      });
    }
    return N;
  })().catch(() => null);
  return chargement;
}

/** Demandée au premier repos, pas au lancement : la demande a alors un sens. */
async function autorisee(N: typeof ModuleNotifications): Promise<boolean> {
  const actuelle = await N.getPermissionsAsync();
  if (actuelle.granted) return true;
  if (!actuelle.canAskAgain) return false;
  return (await N.requestPermissionsAsync()).granted;
}

async function aligner(fin: Date | null) {
  const N = await charger();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(IDENTIFIANT);
  await N.dismissNotificationAsync(IDENTIFIANT);
  if (!fin || fin.getTime() <= Date.now() || !(await autorisee(N))) return;
  await N.scheduleNotificationAsync({
    identifier: IDENTIFIANT,
    content: { title: "Repos terminé", body: "C'est reparti : série suivante." },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: fin,
      channelId: vibrationsActives() ? CANAL : CANAL_SANS_VIBRATION,
    },
  });
}

// Les opérations passent l'une après l'autre : trois appuis rapides sur +15 s
// ne doivent pas croiser leurs annulations et programmations — la dernière
// fin connue l'emporte toujours.
let file: Promise<void> = Promise.resolve();
function enFile(operation: () => Promise<void>) {
  // Une erreur ici (permission, canal) ne doit jamais toucher la séance :
  // l'écran garde sa vibration au premier plan.
  file = file.then(operation).catch(() => {});
}

/** Tient la notification alignée sur la fin du repos en cours (`null` : aucun). */
export function useNotificationRepos(fin: string | null) {
  useEffect(() => {
    if (indisponible) return;
    enFile(() => aligner(fin ? new Date(fin) : null));
  }, [fin]);

  // De retour dans l'application, l'annonce a fait son office : elle quitte
  // le volet des notifications.
  useEffect(() => {
    if (indisponible) return;
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat !== "active") return;
      enFile(async () => {
        await (await charger())?.dismissNotificationAsync(IDENTIFIANT);
      });
    });
    return () => abonnement.remove();
  }, []);
}
