# Notification de repos (notify-kit) — plan d'implémentation

> **Pour l'agent qui exécute :** sous-skill requis : superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes se cochent (`- [ ]`).

**But :** une notification Android tenue pendant le repos (chrono, barre qui se vide, série
suivante, −15 s / +15 s / Passer qui agissent sur la séance même app fermée), avec
`react-native-notify-kit` à la place d'`expo-notifications`.

**Architecture :** la logique pure (contenu affiché, effet d'un bouton) vit dans
`packages/shared/src/notif-repos.ts`, testée par Vitest. Le mobile réécrit
`lib/notification-repos.ts` autour d'une seule fonction `aligner(séance)` appelée par le hook,
par le service au premier plan (une boucle d'une seconde) et par les boutons app tuée. App
vivante, les boutons passent par `appliquer(f)` du `SeanceProvider` : un seul écrivain.

**Pile :** Expo SDK 57, React Native, `react-native-notify-kit` 10.9.0 (fork maintenu de
Notifee), AsyncStorage, Vitest.

**Spec :** `docs/superpowers/specs/2026-10-23-notif-repos-design.md`

## Contraintes globales

- Tout en français : code, commentaires, commits, textes affichés.
- `packages/shared` : TypeScript pur, ni React, ni API de plateforme (`Intl` toléré).
- Charge affichée par `formaterCharge(kg, systeme)` ; système du mobile : `SYSTEME_UNITES`
  (`apps/mobile/lib/unites.ts`).
- `noUncheckedIndexedAccess` est actif : tout accès indexé peut être `undefined`.
- notify-kit absent sous Expo Go et sous iOS : le module ne se charge que si
  `Platform.OS === "android"` et hors `ExecutionEnvironment.StoreClient`.
- `react-native-notify-kit` en version exacte `10.9.0`.
- `app.json` → `"version": "0.3.0"`.
- Ne jamais pousser sur `main` ; s'arrêter à la PR verte. N'ajouter que ses fichiers.
- Branche : `feat/notif-repos` (existe, partie de `main`, la spec y est committée).
- Chaque message de commit finit par la ligne
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` ; sujet en minuscule, ≤ 100
  caractères (commitlint).

---

### Tâche 1 : la logique pure dans `shared`

**Fichiers :**
- Créer : `packages/shared/src/notif-repos.ts`
- Créer : `packages/shared/src/notif-repos.test.ts`
- Modifier : `packages/shared/src/index.ts` (ajouter l'export)

**Interfaces :**
- Consomme : `prochaineSerie`, `ajusterRepos`, `arreterRepos`, `SeanceEnCours`, `SerieEnCours`,
  `ExerciceEnCours` (`./seance.js`) ; `formaterCharge` (`./charge.js`) ; `UnitSystem` (`./units.js`).
- Produit :
  - `type ActionRepos = "moins" | "plus" | "passer"`
  - `type ContenuNotifRepos = { titre: string; texte: string; fin: number; duree: number | null; restant: number }`
    (`fin` en millisecondes epoch, `restant` en secondes entières ≥ 0)
  - `contenuNotifRepos(s: SeanceEnCours, maintenant: Date, systeme: UnitSystem): ContenuNotifRepos | null`
  - `appliquerActionRepos(s: SeanceEnCours, action: ActionRepos, maintenant: Date): SeanceEnCours`

- [ ] **Étape 1 : écrire les tests qui échouent**

`packages/shared/src/notif-repos.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { formaterCharge } from "./charge.js";
import { appliquerActionRepos, contenuNotifRepos } from "./notif-repos.js";
import type { ExerciceEnCours, SeanceEnCours } from "./seance.js";

const T0 = new Date("2026-10-23T18:00:00.000Z");
const plus = (sec: number) => new Date(T0.getTime() + sec * 1000);

function exercice(nom: string, e: Partial<ExerciceEnCours> = {}): ExerciceEnCours {
  return {
    slug: nom.toLowerCase(),
    nom,
    reposSec: 90,
    series: [
      { type: "NORMALE", reps: 8, chargeKg: 80, faite: true },
      { type: "NORMALE", reps: 8, chargeKg: 80, faite: false },
    ],
    ...e,
  };
}

/** `duree` à `null` : un ancien brouillon, sans durée de repos. */
function seance(exercices: ExerciceEnCours[], duree: number | null = 90): SeanceEnCours {
  return {
    id: "s1",
    routineId: null,
    nom: "Push",
    debut: T0.toISOString(),
    exercices,
    repos: {
      fin: plus(90).toISOString(),
      signale: false,
      ...(duree === null ? {} : { duree }),
    },
  };
}

describe("contenuNotifRepos", () => {
  it("rend null sans repos", () => {
    const s = { ...seance([exercice("Développé couché")]), repos: null };
    expect(contenuNotifRepos(s, plus(30), "metric")).toBeNull();
  });

  it("annonce l'exercice et la série qui suit, avec ses valeurs", () => {
    const c = contenuNotifRepos(seance([exercice("Développé couché")]), plus(30), "metric");
    expect(c).toEqual({
      titre: "Repos · Développé couché",
      texte: `Ensuite : série 2/2 · ${formaterCharge(80, "metric")} × 8`,
      fin: plus(90).getTime(),
      duree: 90,
      restant: 60,
    });
  });

  it("prend le précédent quand la série n'a ni saisie ni cible", () => {
    const e = exercice("Squat", {
      series: [
        { type: "NORMALE", reps: 5, chargeKg: 100, faite: true },
        { type: "NORMALE", reps: null, chargeKg: null, faite: false },
      ],
      precedent: [
        { reps: 5, chargeKg: 100, faite: true },
        { reps: 6, chargeKg: 82.5, faite: true },
      ],
    });
    expect(contenuNotifRepos(seance([e]), plus(30), "metric")?.texte).toBe(
      `Ensuite : série 2/2 · ${formaterCharge(82.5, "metric")} × 6`,
    );
  });

  it("ignore un précédent pas fait : rien après le numéro de série", () => {
    const e = exercice("Squat", {
      series: [
        { type: "NORMALE", reps: 5, chargeKg: 100, faite: true },
        { type: "NORMALE", reps: null, chargeKg: null, faite: false },
      ],
      precedent: [
        { reps: 5, chargeKg: 100, faite: true },
        { reps: 6, chargeKg: 82.5, faite: false },
      ],
    });
    expect(contenuNotifRepos(seance([e]), plus(30), "metric")?.texte).toBe(
      "Ensuite : série 2/2",
    );
  });

  it("écrit les reps seules quand il n'y a pas de charge", () => {
    const e = exercice("Tractions", {
      series: [
        { type: "NORMALE", reps: 10, chargeKg: null, faite: true },
        { type: "NORMALE", reps: 12, chargeKg: null, faite: false },
      ],
    });
    expect(contenuNotifRepos(seance([e]), plus(30), "metric")?.texte).toBe(
      "Ensuite : série 2/2 · 12 reps",
    );
  });

  it("suit l'ordre du superset : la série suivante est celle de l'autre exercice", () => {
    const a = exercice("Curl", {
      supersetGroupe: 1,
      series: [
        { type: "NORMALE", reps: 10, chargeKg: 12, faite: true },
        { type: "NORMALE", reps: 10, chargeKg: 12, faite: false },
      ],
    });
    const b = exercice("Extension", {
      supersetGroupe: 1,
      series: [
        { type: "NORMALE", reps: 12, chargeKg: 20, faite: false },
        { type: "NORMALE", reps: 12, chargeKg: 20, faite: false },
      ],
    });
    const c = contenuNotifRepos(seance([a, b]), plus(30), "metric");
    expect(c?.titre).toBe("Repos · Extension");
    expect(c?.texte).toBe(`Ensuite : série 1/2 · ${formaterCharge(20, "metric")} × 12`);
  });

  it("dit que tout est fait quand il ne reste aucune série", () => {
    const e = exercice("Squat", {
      series: [{ type: "NORMALE", reps: 5, chargeKg: 100, faite: true }],
    });
    const c = contenuNotifRepos(seance([e]), plus(30), "metric");
    expect(c?.titre).toBe("Repos");
    expect(c?.texte).toBe("Toutes les séries sont faites");
  });

  it("affiche la charge dans le système demandé", () => {
    const c = contenuNotifRepos(seance([exercice("Développé couché")]), plus(30), "imperial");
    expect(c?.texte).toBe(`Ensuite : série 2/2 · ${formaterCharge(80, "imperial")} × 8`);
  });

  it("rend restant 0 une fois la fin passée, et duree null pour un ancien brouillon", () => {
    const c = contenuNotifRepos(seance([exercice("Squat")], null), plus(120), "metric");
    expect(c?.restant).toBe(0);
    expect(c?.duree).toBeNull();
  });
});

describe("appliquerActionRepos", () => {
  const s = seance([exercice("Squat")]);

  it("+15 s repousse la fin", () => {
    expect(appliquerActionRepos(s, "plus", plus(30)).repos?.fin).toBe(plus(105).toISOString());
  });

  it("−15 s l'avance", () => {
    expect(appliquerActionRepos(s, "moins", plus(30)).repos?.fin).toBe(plus(75).toISOString());
  });

  it("Passer arrête le repos", () => {
    expect(appliquerActionRepos(s, "passer", plus(30)).repos).toBeNull();
  });
});
```

- [ ] **Étape 2 : lancer les tests, ils échouent**

Lancer : `pnpm --filter @better-lift/shared test -- notif-repos`
Attendu : ÉCHEC, « Failed to resolve import "./notif-repos.js" ».

- [ ] **Étape 3 : écrire le code**

`packages/shared/src/notif-repos.ts` :

```ts
import { formaterCharge } from "./charge.js";
import {
  ajusterRepos,
  arreterRepos,
  type ExerciceEnCours,
  prochaineSerie,
  type SeanceEnCours,
  type SerieEnCours,
} from "./seance.js";
import type { UnitSystem } from "./units.js";

/**
 * La notification de repos du mobile (D338) : ce qu'elle affiche, et l'effet de
 * ses boutons. Pur : le mobile n'y ajoute que notify-kit et le disque.
 */

/** Les boutons de la notification : −15 s, +15 s, Passer. */
export type ActionRepos = "moins" | "plus" | "passer";

export type ContenuNotifRepos = {
  titre: string;
  texte: string;
  /** La fin du repos, en millisecondes : le chrono à rebours d'Android la lit. */
  fin: number;
  /** La durée du repos, pour la barre ; `null` pour un brouillon qui ne l'a pas. */
  duree: number | null;
  /** Les secondes qui restent ; 0 une fois la fin passée. */
  restant: number;
};

/** `null` sans repos : la notification n'a plus lieu d'être. */
export function contenuNotifRepos(
  s: SeanceEnCours,
  maintenant: Date,
  systeme: UnitSystem,
): ContenuNotifRepos | null {
  if (!s.repos) return null;
  const fin = Date.parse(s.repos.fin);
  const base = {
    fin,
    duree: s.repos.duree ?? null,
    restant: Math.max(0, Math.ceil((fin - maintenant.getTime()) / 1000)),
  };
  const p = prochaineSerie(s);
  const e = p ? s.exercices[p.iE] : undefined;
  const serie = p ? e?.series[p.iS] : undefined;
  if (!p || !e || !serie) return { ...base, titre: "Repos", texte: "Toutes les séries sont faites" };
  const suite = [
    `Ensuite : série ${p.iS + 1}/${e.series.length}`,
    valeurs(serie, e.precedent?.[p.iS], systeme),
  ];
  return { ...base, titre: `Repos · ${e.nom}`, texte: suite.filter(Boolean).join(" · ") };
}

/**
 * Les valeurs de la série : sa saisie ou sa cible, sinon ce qui a été fait la
 * dernière fois (D67), sinon rien.
 */
function valeurs(
  serie: SerieEnCours,
  precedent: NonNullable<ExerciceEnCours["precedent"]>[number] | undefined,
  systeme: UnitSystem,
): string | null {
  const propre = serie.chargeKg !== null || serie.reps !== null;
  const source = propre ? serie : precedent?.faite ? precedent : null;
  if (!source) return null;
  const charge = source.chargeKg === null ? null : formaterCharge(source.chargeKg, systeme);
  if (charge && source.reps !== null) return `${charge} × ${source.reps}`;
  return charge ?? (source.reps === null ? null : `${source.reps} reps`);
}

/** Les mêmes effets que le bandeau de repos (D79) : ±15 s, ou l'arrêt. */
export function appliquerActionRepos(
  s: SeanceEnCours,
  action: ActionRepos,
  maintenant: Date,
): SeanceEnCours {
  if (action === "passer") return arreterRepos(s);
  return ajusterRepos(s, action === "plus" ? 15 : -15, maintenant);
}
```

Dans `packages/shared/src/index.ts`, ajouter (à sa place alphabétique, entre les exports
voisins) :

```ts
export {
  type ActionRepos,
  appliquerActionRepos,
  type ContenuNotifRepos,
  contenuNotifRepos,
} from "./notif-repos.js";
```

- [ ] **Étape 4 : lancer les tests, ils passent**

Lancer : `pnpm --filter @better-lift/shared test -- notif-repos`
Attendu : 12 tests passent. Puis `pnpm --filter @better-lift/shared typecheck` : aucune erreur.

- [ ] **Étape 5 : committer**

```bash
git add packages/shared/src/notif-repos.ts packages/shared/src/notif-repos.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): contenu et boutons de la notification de repos (D338)"
```

---

### Tâche 2 : notify-kit à la place d'expo-notifications

**Fichiers :**
- Modifier : `apps/mobile/package.json` (dépendances)
- Modifier : `apps/mobile/app.json` (plugins, version)
- Créer : `apps/mobile/assets/notification-icon.png` (repris de l'épreuve)
- Réécrire : `apps/mobile/lib/notification-repos.ts`
- Modifier : `apps/mobile/lib/seance.tsx:152` (appel du hook)

**Interfaces :**
- Consomme : `contenuNotifRepos`, `appliquerActionRepos`, `ActionRepos`, `ContenuNotifRepos`
  (tâche 1) ; `brouillon` (`./stockage`) ; `SYSTEME_UNITES` (`./unites`) ;
  `vibrationsActives` (`./vibrations`).
- Produit (dans `lib/notification-repos.ts`) :
  - `useNotificationRepos(seance: SeanceEnCours | null): void`
  - `enregistrerNotificationRepos(): void` — à appeler une fois, au point d'entrée
  - `declarerAppliquer(f: Appliquer | null): void`
  - `type Appliquer = (f: (s: SeanceEnCours) => SeanceEnCours) => void`

- [ ] **Étape 1 : dépendances**

```bash
cd apps/mobile
pnpm remove expo-notifications
pnpm add react-native-notify-kit@10.9.0 --save-exact
```

Vérifier dans `apps/mobile/package.json` : `"react-native-notify-kit": "10.9.0"`, plus
d'`expo-notifications`.

- [ ] **Étape 2 : l'icône**

```bash
git checkout essai/notify-kit -- apps/mobile/assets/notification-icon.png
```

(Le logo recadré, validé sur le téléphone le 2026-10-23.)

- [ ] **Étape 3 : `app.json`**

Passer `"version"` à `"0.3.0"`. Dans `plugins`, remplacer le bloc `"expo-notifications"` par :

```json
      [
        "react-native-notify-kit",
        {
          "android": {
            "foregroundService": {
              "types": ["specialUse"],
              "specialUseSubtype": "Minuteur de repos entre deux séries de musculation"
            },
            "icons": [
              {
                "name": "notification_icon",
                "path": "./assets/notification-icon.png",
                "type": "small"
              }
            ]
          }
        }
      ]
```

- [ ] **Étape 4 : réécrire `apps/mobile/lib/notification-repos.ts`**

Remplacer tout le fichier par :

```ts
import {
  type ActionRepos,
  appliquerActionRepos,
  type ContenuNotifRepos,
  contenuNotifRepos,
  type SeanceEnCours,
} from "@better-lift/shared";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import type * as NotifyKit from "react-native-notify-kit";
import { brouillon } from "./stockage";
import { SYSTEME_UNITES } from "./unites";
import { vibrationsActives } from "./vibrations";

/**
 * La notification de repos (D338) : tenue au premier plan tant qu'un repos
 * court, avec le chrono, une barre qui se vide, la série qui suit et trois
 * boutons (−15 s, +15 s, Passer) qui agissent sur la séance même app fermée.
 * À la fin, « Repos terminé » sonne — sauf app au premier plan, où l'écran
 * vibre déjà.
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
  Platform.OS === "android" &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// Chargé à la demande : sous Expo Go, le simple accès au module natif lève.
const nk: Module | null = disponible ? (require("react-native-notify-kit") as Module) : null;

const ID_REPOS = "repos";
const ID_FIN = "fin-repos";
const CANAL_REPOS = "repos-en-cours";
// Deux canaux pour la fin : sous Android, la vibration d'un canal est figée à
// sa création. Le réglage « Vibrations » du Profil (D113) choisit le canal.
const CANAL_FIN = "repos";
const CANAL_FIN_SANS_VIBRATION = "repos-sans-vibration";
// Générée par le plugin de notify-kit (`app.json`) depuis le logo recadré.
const ICONE = "notification_icon";
const COULEUR = "#171717";

const ACTIONS: Record<string, ActionRepos> = { moins: "moins", plus: "plus", passer: "passer" };

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
      // La barre se vide, comme celle du bandeau (D335).
      ...(c.duree ? { progress: { max: c.duree, current: c.restant } } : {}),
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

async function annoncerFin(k: Module) {
  await retirer(k);
  if (AppState.currentState === "active") return;
  await k.default.displayNotification({
    id: ID_FIN,
    title: "Repos terminé",
    body: "C'est reparti : série suivante.",
    android: {
      channelId: vibrationsActives() ? CANAL_FIN : CANAL_FIN_SANS_VIBRATION,
      smallIcon: ICONE,
      color: COULEUR,
      pressAction: { id: "default", launchActivity: "default" },
    },
  });
}

/** Met la notification d'accord avec la séance. */
async function aligner(k: Module, s: SeanceEnCours | null) {
  const c = s && contenuNotifRepos(s, new Date(), SYSTEME_UNITES);
  if (!c) return retirer(k);
  if (c.restant === 0) return annoncerFin(k);
  await preparer(k);
  if (!(await autorisee(k))) return;
  await k.default.cancelNotification(ID_FIN);
  await afficher(k, c);
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
      setTimeout(tic, 1000);
    };
    setTimeout(tic, 1000);
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
  const f = (s: SeanceEnCours) => appliquerActionRepos(s, action, new Date());
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

/** Tient la notification alignée sur la séance (`null` : aucune). */
export function useNotificationRepos(seance: SeanceEnCours | null) {
  const c = nk && seance ? contenuNotifRepos(seance, new Date(), SYSTEME_UNITES) : null;
  // Ce qui se voit, et rien d'autre : un rendu qui ne le change pas ne redessine pas.
  const cle = c ? `${c.titre}|${c.texte}|${c.fin}|${c.duree}` : null;
  const derniere = useRef(seance);
  derniere.current = seance;

  useEffect(() => {
    if (!nk) return;
    const k = nk;
    const s = cle === null ? null : derniere.current;
    void enFile(() => aligner(k, s));
  }, [cle]);

  // De retour dans l'app, l'annonce de fin a fait son office.
  useEffect(() => {
    if (!nk) return;
    const k = nk;
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") void enFile(() => k.default.cancelNotification(ID_FIN));
    });
    return () => abonnement.remove();
  }, []);
}
```

Si Biome refuse le `require` (règle `noCommonJs` ou équivalente), poser au-dessus de la ligne
un `// biome-ignore lint/<règle exacte citée>: notify-kit ne se charge qu'hors Expo Go` ; pas
d'`import()` dynamique : l'enregistrement doit être synchrone au démarrage.

- [ ] **Étape 5 : l'appel du hook**

Dans `apps/mobile/lib/seance.tsx`, remplacer :

```ts
  useNotificationRepos(seance?.repos?.fin ?? null);
```

par :

```ts
  useNotificationRepos(seance);
```

- [ ] **Étape 6 : vérifier**

Lancer : `pnpm --filter @better-lift/mobile typecheck`
Attendu : aucune erreur. Si TypeScript ne trouve pas les types de notify-kit, `pnpm install` à
la racine puis relancer.

- [ ] **Étape 7 : committer**

```bash
git add apps/mobile/package.json pnpm-lock.yaml apps/mobile/app.json apps/mobile/assets/notification-icon.png apps/mobile/lib/notification-repos.ts apps/mobile/lib/seance.tsx
git commit -m "feat(mobile): notification de repos tenue avec notify-kit (D338)"
```

---

### Tâche 3 : boutons app ouverte et app tuée

**Fichiers :**
- Créer : `apps/mobile/index.ts`
- Modifier : `apps/mobile/package.json` (`"main"`)
- Modifier : `apps/mobile/lib/seance.tsx` (référence courante, `appliquer`)

**Interfaces :**
- Consomme : `enregistrerNotificationRepos`, `declarerAppliquer`, `Appliquer` (tâche 2).
- Produit : rien de neuf pour les autres tâches.

- [ ] **Étape 1 : le point d'entrée**

`apps/mobile/index.ts` :

```ts
import { enregistrerNotificationRepos } from "./lib/notification-repos";

// Avant l'app : un bouton de la notification touché app tuée relance ce code
// seul, sans écran, et doit trouver son traitement déjà enregistré (D338).
enregistrerNotificationRepos();

import "expo-router/entry";
```

Dans `apps/mobile/package.json`, `"main": "expo-router/entry"` devient `"main": "index.ts"`.

- [ ] **Étape 2 : `appliquer` dans `SeanceProvider`**

Dans `apps/mobile/lib/seance.tsx` :

1. Importer `declarerAppliquer` à côté de `useNotificationRepos` :

```ts
import { declarerAppliquer, useNotificationRepos } from "./notification-repos";
```

2. Sous `const ecritures = useRef(0);`, ajouter une référence à la séance courante, et la tenir
à jour dans `poser` et `recharger` :

```ts
  // La séance du moment, pour `appliquer` : un bouton de notification arrive
  // hors du rendu, la séance capturée par une fermeture aurait pu vieillir.
  const courante = useRef<SeanceEnCours | null>(null);
  const poser = useCallback((s: SeanceEnCours | null) => {
    ecritures.current += 1;
    courante.current = s;
    setSeance(s);
  }, []);

  const recharger = useCallback(async () => {
    const avant = ecritures.current;
    const lue = await brouillon.lire();
    if (ecritures.current === avant) {
      courante.current = lue;
      setSeance(lue);
    }
  }, []);
```

(remplace les définitions existantes de `poser` et `recharger`).

3. Sous `useNotificationRepos(seance);`, ajouter :

```ts
  // Les boutons de la notification passent par ici tant que l'app vit : même
  // chemin que le bandeau, un seul écrivain du brouillon.
  const appliquer = useCallback(
    (f: (s: SeanceEnCours) => SeanceEnCours) => {
      const s = courante.current;
      if (!s) return;
      const n = f(s);
      poser(n);
      void brouillon.ecrire(n);
    },
    [poser],
  );
  useEffect(() => {
    declarerAppliquer(appliquer);
    return () => declarerAppliquer(null);
  }, [appliquer]);
```

`SeanceEnCours` est déjà importé de `@better-lift/shared` dans ce fichier ; sinon l'ajouter à
l'import existant.

- [ ] **Étape 3 : vérifier**

Lancer : `pnpm --filter @better-lift/mobile typecheck` puis `pnpm lint` puis `pnpm knip`
Attendu : rien. Si Knip signale `index.ts` ou `expo-router/entry`, déclarer `index.ts` en
`entry` du bloc `apps/mobile` de `knip.json`.

- [ ] **Étape 4 : committer**

```bash
git add apps/mobile/index.ts apps/mobile/package.json apps/mobile/lib/seance.tsx
git commit -m "feat(mobile): boutons de la notification de repos, app ouverte ou tuée (D338)"
```

(ajouter `knip.json` s'il a changé.)

---

### Tâche 4 : décision, règles, vérification

**Fichiers :**
- Modifier : `docs/decisions.md` (D338, à la suite de D337)
- Modifier : `.claude/rules/mobile.md` (section « Séance », puces « Fin du repos app fermée »)

- [ ] **Étape 1 : D338**

Ajouter à la fin de `docs/decisions.md`, après D337, au même format :

```markdown
- **D338** — Révise D335 pour le repos hors de l'écran : pendant un repos, une notification
  Android tenue au premier plan (`react-native-notify-kit`, qui remplace `expo-notifications`)
  montre le chrono, une barre qui se vide, l'exercice et la série qui suit (saisie ou cible,
  sinon le précédent fait) et trois boutons, −15 s, +15 s, Passer. Les boutons changent la
  séance même app fermée : par le `SeanceProvider` quand l'app vit, sinon par le brouillon
  sur disque. Affichée app ouverte aussi, comme Hevy ; « Repos terminé » sonne à la fin, sauf
  app au premier plan. Absente d'Expo Go et d'iOS. Icône de notification dédiée (logo
  recadré). Nouveau runtime : 0.3.0, l'APK se réinstalle.
```

- [ ] **Étape 2 : règles du mobile**

Dans `.claude/rules/mobile.md`, remplacer la puce qui commence par
« **Fin du repos app fermée** » par :

```markdown
- **Notification de repos (D338)** : `lib/notification-repos.ts`, avec `react-native-notify-kit`
  (module natif : chargé par `require` seulement sous Android hors Expo Go). Elle dérive de
  l'état par `aligner(séance)` ; le contenu et l'effet des boutons sont dans
  `shared/notif-repos.ts`. Le service et les boutons s'enregistrent dans `index.ts`, avant
  l'app. Les boutons passent par `appliquer` du `SeanceProvider` quand l'app vit, sinon par
  le disque. Ne s'éprouve que sur un build EAS ; le volet des notifications n'est pas lisible
  par `describe` (le chrono) : taper d'après une capture.
```

Dans la section « Lancer (Expo Go) », la phrase « Aucune dépendance native hors SDK » n'est
plus vraie : la remplacer par « Une seule dépendance native hors SDK, notify-kit (D338),
absente d'Expo Go : la notification de repos ne s'y montre pas, le reste tourne ».

- [ ] **Étape 3 : `/verif`**

Lancer le skill `/verif` (build, typecheck, test, lint, knip). Attendu : tout vert.

- [ ] **Étape 4 : committer**

```bash
git add docs/decisions.md .claude/rules/mobile.md
git commit -m "docs: D338, notification de repos avec notify-kit"
```

---

### Tâche 5 : l'APK sur l'émulateur, puis la PR

- [ ] **Étape 1 : build `preview`**

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview --non-interactive --no-wait
```

Suivre jusqu'à `FINISHED` (`npx eas-cli build:view <id> --json`), télécharger l'APK dans le
dossier scratchpad, `adb install -r`.

- [ ] **Étape 2 : éprouver avec Argent (skill `argent-device-interact`)**

Sur l'émulateur `better-lift`, compte connecté (l'utilisateur se connecte s'il le faut) :

1. Lancer une routine, cocher une série : la notification apparaît (titre « Repos ·
   {exercice} », texte « Ensuite : série n/N · … », chrono, barre pleine qui se vide, icône
   du logo dans la barre d'état).
2. Déplier : −15 s, +15 s, Passer, app ouverte ; le bandeau de l'écran suit.
3. App tuée (`adb shell am kill` après retour à l'accueil, ou glisser dans les récentes) :
   −15 s et +15 s changent le chrono ; rouvrir l'app : le bandeau a le même temps.
4. Laisser finir app en arrière-plan : « Repos terminé » apparaît, la notification de repos
   disparaît.
5. Profil → Vibrations coupées, refaire 4 : la fin arrive sur le canal sans vibration.
6. Terminer ou abandonner pendant un repos : la notification disparaît.

Toute anomalie : la corriger dans la tâche qui l'a introduite, rebuild, refaire la liste.

- [ ] **Étape 3 : la PR**

```bash
git push -u origin feat/notif-repos
gh pr create --title "feat(mobile): notification de repos avec notify-kit (D338)" --body "<résumé, captures, liste d'épreuve ci-dessus cochée>"
```

Attendre le check `Qualité · typecheck · test · build` vert. **S'arrêter là** : pas de fusion
ni de build `production` sans l'accord de l'utilisateur.
