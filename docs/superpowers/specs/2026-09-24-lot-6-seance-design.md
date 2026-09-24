# better-lift — Lot 6 : la séance

**Date :** 24 septembre 2026
**Portée :** écrans mobiles, modèle et API des séances, saisie hors ligne.
**Critère de sortie :** **un entraînement réel est saisi avec** — sur l'émulateur, de bout en bout,
y compris un arrêt forcé en pleine séance.

Complète la conception principale (dont le § 8, l'invariant du mobile) ; registre à partir de **D55**.

## 1. L'état de départ, vérifié

- Le mobile n'a que la connexion (`app/index.tsx`, `app/connexion.tsx`) et tourne dans **Expo Go**.
- Aucun module natif hors SDK : MMKV exigerait un build EAS à chaque essai, `expo run:android`
  étant bloqué sur cette machine.
- La V1 générait l'identifiant de séance **côté client** — c'est ce qui rendait la file rejouable.

## 2. Les décisions

| | Décision | Pourquoi |
|---|---|---|
| **D55** | **Le brouillon vit en AsyncStorage**, sous une clé unique, et non en MMKV | Inclus dans Expo Go : itération sans build. L'invariant tient : disque, clé unique, jamais un paramètre de route |
| **D56** | **L'identifiant de séance est généré par le client** ; `POST /seances` est idempotent | La file peut rejouer sans doublon |
| **D57** | **Le corps de `POST /seances` n'est pas strict**, et un exercice archivé y est accepté | § 8 : perdre un entraînement réel est pire qu'un champ ignoré |
| **D58** | **Aucun total stocké** sur la séance : volume, séries et durée se dérivent | Même raison que D13 : rien à recalculer quand on corrige |
| **D59** | **Pré-remplissage par les cibles de la routine** | « La dernière fois » vient avec l'historique (lot 7) |
| **D60** | **Repos dans l'app, avec vibration**, calculé depuis l'heure de fin | Juste après une veille ; pas de notification (hors jalon) |
| **D61** | **La logique de séance vit dans `shared`**, pure et testée ; le mobile ne garde que disque et écrans | Le code où un test attrape vraiment quelque chose |
| **D62** | **Trois PR** : dessin, API, saisie réelle | D25, et le hors-ligne se relit seul |

## 3. Le modèle

```prisma
model Seance {
  id        String   @id            // fourni par le client (D56)
  userId    String
  routineId String?                 // SetNull : la séance survit à sa routine
  nom       String   @db.VarChar(120)
  debut     DateTime
  fin       DateTime
  createdAt DateTime @default(now())
  exercices SeanceExercice[]
  @@index([userId, debut(sort: Desc)])
}
model SeanceExercice { id, seanceId, exerciseId (Restrict), position, reposSec?, series SeanceSerie[] ; @@unique([seanceId, position]) }
model SeanceSerie    { id, seanceExerciceId, position, type TypeSerie, reps Int?, chargeKg Decimal(7,2)?, faite Boolean ; @@unique([seanceExerciceId, position]) }
```

Une séance est un **instantané** : elle recopie exercices et séries, et ne dépend plus de la
routine (conception principale, vocabulaire).

## 4. La logique partagée (`shared/seance.ts`)

```ts
type SerieEnCours = { type: TypeSerie; reps: number | null; chargeKg: number | null; faite: boolean };
type ExerciceEnCours = { slug: string; nom: string; reposSec: number | null; series: SerieEnCours[] };
type SeanceEnCours = { id: string; routineId: string | null; nom: string; debut: string /* ISO */;
                       exercices: ExerciceEnCours[]; repos: { fin: string } | null };

demarrerDepuisRoutine(r: RoutineDetail, id: string, maintenant: Date): SeanceEnCours
demarrerVide(id: string, maintenant: Date): SeanceEnCours
validerSerie(s, iExercice, iSerie, maintenant): SeanceEnCours     // coche, et lance le repos de l'exercice
secondesEcoulees(debutIso, maintenant): number                    // le chrono
reposRestant(s, maintenant): number | null                        // null = pas de repos en cours
versEnvoi(s, fin: Date): SeanceSaisie                             // ce que POST /seances reçoit
seanceSaisie (Zod, non strict)                                    // le contrat
```

## 5. L'API

`POST /seances` (session requise) : valide `seanceSaisie`, résout les slugs (archivés compris,
D57), crée la séance avec l'`id` fourni. **Existe déjà pour cet utilisateur → 200 sans rien
écrire** ; existe pour un autre → 409 (collision d'identifiant, improbable). Slug inconnu → 400.
Aucune autre route : la lecture des séances est le lot 7.

Le mobile consomme `GET /routines` et `GET /routines/:id` par `@better-lift/api-client`, avec le
cookie de Better Auth (`authClient.getCookie()`) posé en en-tête.

## 6. Le mobile

Expo Router, pile simple :

| Écran | Contenu |
|---|---|
| `index` (accueil) | Bandeau « séance en cours — reprendre » si brouillon ; « Séance vide » ; routines (appui = démarrer) ; état de la file d'envoi |
| `seance` | Chrono ; cartes d'exercice ; séries en grandes cases (reps, charge) avec ✓ ; bandeau de repos ; « + exercice » ; Terminer / Abandonner |
| `fin` | Résumé (durée, séries faites, volume) ; « Enregistrer » |

**Invariants (§ 8) :**
- Le brouillon est réécrit sur disque à chaque changement ; `seance` le **relit du disque**.
  Démarrer une routine = écrire le brouillon, puis naviguer : même chemin que reprendre.
- « Démarrer » **revérifie le disque au moment de l'appui** : un brouillon existant n'est jamais
  écrasé — on propose de le reprendre.
- Chrono et repos se calculent depuis des heures stockées, jamais par un compteur.
- **File d'envoi** : terminer déplace la séance du brouillon vers la file (disque) et quitte
  l'écran. Envoi tenté aussitôt, au démarrage de l'app, et à la demande. **Refusée (4xx)** : elle
  revient en brouillon avec le message. **Réseau** : elle reste en file.

**Registre visuel :** palette du web (fond `#08090a`, lime `#a8cf45` pour l'action), cibles d'au
moins 48 px, chiffres grands, peu d'éléments. Toute charge passe par `formaterCharge`/`lireCharge`
avec la constante d'unités du mobile.

## 7. Découpage

| PR | Contenu | Validation |
|---|---|---|
| **1** | `shared/seance.ts` (TDD), trois écrans sur factices, brouillon en mémoire | L'utilisateur valide sur l'émulateur |
| **2** | Schéma, `POST /seances` idempotent, client d'API mobile, routines réelles sur l'accueil | Tests de routes, `curl` |
| **3** | Brouillon AsyncStorage, file d'envoi, hors ligne, vibration | Arrêt forcé en pleine séance, envoi rejoué |

## 8. Hors périmètre

Historique et records (lot 7), pré-remplissage « dernière fois » (lot 7), notifications, supersets
à l'écran, modification d'une séance déjà envoyée, séance sur le web.
