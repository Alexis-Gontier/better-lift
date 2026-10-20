# Accueil du web : tableau de bord

Document de chantier (CLAUDE.md, « Specs et plans ») : supprimé après fusion, ses décisions
reportées dans `docs/decisions.md` (révise D283, « l'Accueil est vide »).

## But

L'Accueil (`/app/`) devient un tableau de bord classique, **bilan d'abord** : où en est la
semaine, comment évolue l'entraînement sur une période, quels muscles il travaille, ce qui a été
battu et fait récemment. Pas de routine à suivre (retirée à la revue du dessin). Le web sert à relire et préparer
(D224) : rien ne s'y lance.

Inspirations relevées : les statistiques de Hevy (graphe des jours entraînés, séries par groupe
musculaire avec carte du corps, période 30 j / 3 mois / 1 an, rapport mensuel) ; les règles de
tableau de bord (chiffres clés en tête, puis tendances, puis détail ; 4 à 6 chiffres clés ; la
couleur ne porte jamais seule un sens).

## Page, de haut en bas

1. **En-tête** — `Page` « Accueil », à droite un `ToggleGroup` **4 sem. · 3 mois · 1 an**.
   La période est le dernier choix de ce navigateur (`localStorage`, `features/home/periode.ts`),
   3 mois par défaut. Ni URL ni gestionnaire d'état : pour deux ou trois comptes, le lien
   partagé n'a pas d'usage, et une seule source vaut mieux que deux.
2. **Chiffres clés** — quatre cartes en ligne (deux par ligne sous `md`, une sous `sm`) :
   **Séances**, **Volume**, **Séries**, **Records battus** (séries ayant battu au moins un
   record, comme `nbRecords`), sur la période. Chacune montre la
   valeur en grand et l'écart avec la période précédente de même longueur, en texte
   (« +12 % », « −1 », « = ») précédé d'une flèche ; aucun vert ni rouge. Sans période
   précédente (compte récent), pas d'écart.
3. **Cette semaine** — carte : les 7 jours du lundi au dimanche (pastille pleine = jour
   entraîné, contour = aujourd'hui), « 2 / 3 séances » face à l'objectif hebdomadaire
   (`preferences.objectifHebdo`, D129 ; sans objectif, le compte seul).
4. **Tendance** — carte : aire (Recharts via `components/ui/chart`, courbe monotone et dégradé),
   un point par **semaine** (4 sem., 3 mois) ou par **mois** (1 an), avec une bascule
   **Séances · Volume**. Infobulle au survol, axe des
   dates court (« 6 oct. », « oct. »). Animations coupées (`isAnimationActive={false}`).
5. **Muscles** — carte : barres horizontales triées par séries décroissantes (une ligne par
   zone, libellé de `LIBELLE_ZONE`, valeur en texte au bout), et `BodyMap` du web à côté
   (principaux à l'encre, secondaires en gris). Une série compte pour le muscle principal de
   son exercice (`target`) ; les secondaires n'alimentent que le dessin. Échauffements exclus.
6. **En bas, deux colonnes** (une sous `lg`) :
   - **Records récents** — les 5 derniers records battus sur la période : exercice, type
     (`LIBELLE_RECORD`), valeur (`formaterCharge`), date ; lien « Tous les records ».
   - **Dernières séances** — les 5 dernières : nom, date, durée, volume, records ; chaque ligne
     ouvre la séance dans Historique ; lien « Tout l'historique ».

Gris wireframe, aucun token nouveau ; la seule couleur porteuse de sens reste le type de série
(rien ici). Toute charge passe par `formaterCharge`, toute date par `lib/locale.ts`.

## États (`?etat=`)

- **Chargement** : squelette de la page — quatre cartes, deux grands blocs, deux listes.
- **Vide** (aucune séance jamais) : `Empty` « Pas encore de séance », « Les séances
  enregistrées depuis le téléphone apparaîtront ici. », lien vers Routines.
- **Période vide** (séances avant, aucune dans la période) : les chiffres à 0 avec leur écart,
  les blocs disent « Aucune séance sur la période ».
- **Erreur** : message et « Réessayer ».

## Données

### API : `GET /tableau-de-bord?depuis=<ISO>`

Derrière `exigerSession`, filtrée par `userId`. `depuis` est l'instant de début de la période
**précédente** (le web le calcule dans son fuseau). Réponse :

```ts
type FaitSeance = {
  id: string; nom: string; debut: string; fin: string;
  seriesFaites: number; volumeKg: number;
  /** Séries comptées par zone (muscle principal), hors échauffement. */
  seriesParZone: Partial<Record<Zone, number>>;
  /** Muscles du catalogue (`target`, `secondary`) : `BodyMap` du web lit ces noms. */
  muscles: { principaux: string[]; secondaires: string[] };
  /** Une entrée par série ayant battu au moins un record, à ce moment-là (D64). */
  records: { slug: string; nom: string; types: TypeRecord[]; reps: number | null; chargeKg: number | null }[];
};
type TableauDeBord = {
  seances: FaitSeance[];
  total: number; // séances de toujours
  objectifHebdo: number | null;
};
```

- Les séances depuis `depuis`, la plus récente d'abord ; `total` distingue « jamais de séance »
  de « période vide ».
- Les records se rejouent sur **tout** l'historique des exercices concernés (`historique` et
  `marquerRecords` existants), puis se filtrent à la période : un record se juge contre tout le
  passé, pas contre la seule période.
- Zones des barres par `zoneDuMuscle` (`shared/muscles.ts`) sur `target` ; l'objectif hebdomadaire
  est rendu avec, pour que la page ne lise qu'une requête.
- `depuis` invalide : 400 `{ erreur }`. Zod du contrat dans `shared`.

### `shared` : `tableau-de-bord.ts` (pur, testé)

- `bornesPeriode(periode, maintenant, fuseau)` → `{ debut, debutPrecedente }` en jours civils :
  4 sem. et 3 mois commencent un lundi (4 et 13 semaines, semaine en cours comprise), 1 an le
  1ᵉʳ du mois (12 mois, mois en cours compris).
- `chiffresCles(seances, bornes)` → séances, volume, séries, records, et leurs écarts.
- `semaineEnCours(seances, maintenant, fuseau)` → 7 booléens et le compte.
- `tendance(seances, periode, bornes, fuseau)` → intervalles `{ debut, seances, volumeKg }`, tous
  présents, vides compris.
- `muscles(seances, bornes)` → zones triées `{ zone, series }`, et l'union des zones pour le
  dessin.
- `recordsRecents(seances, n)` / `dernieresSeances(seances, n)`.

Le découpage se fait **dans le fuseau**, jamais en UTC (piège déjà payé). `semainesRecentes`,
retiré par D328, n'est pas ressuscité tel quel : `tendance` le remplace.

### Web

- `features/home/` : `queries.ts` (`optionsTableauDeBord(periode)`, clé
  `["tableau-de-bord", depuis]`), `home-page.tsx` et un composant par bloc ; la route
  `_app.index.tsx` ne fait que valider `?periode`, précharger et rendre la page.
- Une séance supprimée dans Historique invalide `["tableau-de-bord"]` (piège des clés TanStack).

## Méthode

1. **Dessin** : la page complète sur des données factices (fixture typée `TableauDeBord`),
   ses quatre états forçables, validée à l'écran (sombre, clair, téléphone) avant tout
   branchement.
2. **`shared`** : `tableau-de-bord.ts` et ses tests (fuseau, semaines vides, période sans
   précédente, comparaison, records filtrés).
3. **API** : route, service, tests de route (401, 400, filtrage par utilisateur).
4. **Branchement** : la fixture part, la page lit l'API ; e2e de la page ; captures.

## Hors périmètre

Poids du corps, objectifs autres que l'hebdomadaire, export, graphiques par exercice (ils sont
sur la fiche), personnalisation des blocs, rien côté mobile.
