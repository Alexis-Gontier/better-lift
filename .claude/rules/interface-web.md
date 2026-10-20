---
paths:
  - "apps/web/**"
---

# Interface web

Wireframe shadcn en gris, branché sur l'API. Décisions : `docs/decisions.md`, section
« Interface web » (D221 et au-delà).

## Arborescence (D306)

- `routes/` : la route seule — `validateSearch`, garde, loader, choix de l'état. Aucune logique,
  aucun JSX au-delà de l'appel au composant de la feature. Fichiers plats (`_app.routines.$id.tsx`).
- `features/<x>/` : tout ce qui est propre à une page — `queries.ts`, ses composants, sa logique
  pure (`*.ts`) et ses tests à côté. **Une feature n'importe pas une autre feature** ; ce
  qu'elles partagent monte dans `components/` ou `lib/`.
- `components/` : briques communes (`list-detail`, `editable`, `detail-columns`, `row-menu`,
  `summary-card`, `body-map`, `exercise-media`…) ; `shell/` la coquille ; `states/` les quatre
  états. `components/ui/`, `reui/`, `kibo-ui/` : code des registres, **non modifié** sauf
  nécessité (D231).
- `lib/` : sans React ni feature — config, client d'API, auth, formatage, lecture, locale.
- Le calcul métier commun au mobile vit dans `packages/shared` : le web ne réécrit jamais un
  calcul que `shared` a déjà (records, 1RM, volume, dates civiles).
- Code et adresses en anglais (`/exercises`, `routine-editor.tsx`), textes en français.
- Knip voit tout le web (D309) : seuls `components/ui/` et `lib/utils.ts` sont des entrées.

## Données (D299–D304, D313)

- **Une couche de requêtes par page** : `features/<x>/queries.ts` (clés, `queryOptions`,
  mutations) ; ce que plusieurs pages lisent vit dans `lib/` (`catalogue.ts`, `exercices.ts`).
  Les écrans consomment les types inférés par le RPC.
- **Tout appel passe par `lire()`** (`lib/api.ts`) : une réponse non `ok` devient une `ErreurApi`
  (message de `{ erreur }`, statut ; 0 si le serveur est injoignable). Un 401 relit la session et
  la garde renvoie à la connexion (`main.tsx`).
- **Les routes préchargent sans attendre** (`prefetchQuery` dans `loader`) ; la page lit par
  `useQuery` et choisit son état par `etatAffiche(useEtat(), requête, vide)`. Pas de Suspense :
  il rendrait `?etat=chargement` impossible.
- **Les quatre états par l'URL** : `?etat=chargement|erreur|vide`, sur les pages qui déclarent
  `staticData.etats` ; la barre d'état ne s'affiche qu'en développement.
- **Libellé d'une page de détail** dans le fil d'Ariane : `useCrumbLabel(nom)`.
- **Supprimer** : `useSuppression` — l'élément sort du cache, l'appel part à la fin du toast
  « Annuler » (`lib/differe.ts`, `keepalive`), D302.
- **Modifier** (routines seulement) : `useEditable` (`components/editable.tsx`) — historique ↶ ↷
  (`lib/draft-history.ts`), Ctrl Z / Ctrl Y / Ctrl S, garde de sortie, succès dit après la
  réponse. Le brouillon de routine est celui de `shared` (charges en texte « 82,5 ») ; la version
  enregistrée est gardée en état pour que ses clés suivent le brouillon. Séances et fiches
  d'exercice sont en lecture seule (D294).
- **Fuseau et kilos** : `lib/locale.ts` seul (`jourCivil`, `joursDepuis`, `SYSTEME`), D313.

## Coquille et écrans

- Barre latérale shadcn repliable en icônes, logo et nom en tête (D329), d'une seule liste (`components/shell/nav.ts`) : Accueil · Routines ·
  Historique · Records · Exercices. Paramètres s'ouvre par le menu du compte ou la palette (Ctrl K).
- **Accueil** (D330) : `features/home/`, une requête `tableauDeBordQuery(depuis)` qui lit les
  faits des séances ; tout s'agrège dans `shared/tableau-de-bord.ts`, dans le fuseau du web. La
  période vit dans `localStorage` (`features/home/periode.ts`). Supprimer une séance invalide
  `["tableau-de-bord"]`.
- Routines, Historique, Exercices : `ListDetailPage` (liste | détail redimensionnable, largeur
  mémorisée). **L'élément ouvert vit dans le chemin** (`$id`, `$slug`, `new`), en route enfant
  rendue par `<Outlet />` ; la liste reste montée et garde ses filtres. Une ligne est un `Link`
  (`data-status="active"` marque la sélection).
- Paramètres : navigation à gauche, chaque réglage s'enregistre dès qu'on le choisit (D273). Le
  thème est un réglage d'appareil (`localStorage`, lu par le script de `index.html`).
- Composants shadcn plutôt que maison. **Tout composant externe hors shadcn se fait valider avant
  installation** (D228).
- **Silhouette** (`BodyMap`, D331) : le dessin du mobile, tracés dans `body-map-traces.ts`
  (données MIT, ne pas reformater à la main) ; elle prend des noms de muscles du catalogue.
- La seule couleur porteuse de sens est le type de série (`lib/series.ts`, `SetBadge`) : W
  ambre, F rose (le rouge est au danger), D bleu.

## Pièges

- **`ScrollArea` de Radix** : son contenu est un `display: table` qui s'élargit au lieu de
  couper. Une liste à `truncate` force `[&_[data-slot=scroll-area-viewport]>div]:block!`.
- **Serveur de dev laissé tournant** : le greffon de routes réécrit `routeTree.gen.ts`, et
  `core.autocrlf=true` le rend « modifié » sans différence, ce qui bloque un `git pull` ou un
  changement de branche avec un `git diff` vide. Arrêter le serveur avant de fusionner et
  vérifier que le port 3000 est libre (`TaskStop` ne tue pas toujours le Vite enfant).
- **Les rôles shadcn** se traduisent dans `@theme inline` (`styles/globals.css`) : un rôle non
  déclaré n'émet aucune règle, en silence.
- **Graphiques** : une bibliothèque qui anime en JavaScript échappe à `prefers-reduced-motion` ;
  couper ses animations explicitement.

## Vérifier

- `pnpm --filter @better-lift/web e2e` : suite Playwright contre l'API de dev, compte
  `e2e@better-lift.local` (identifiants dans `apps/web/.env.e2e`) ; chaque test crée ce qu'il
  lit, préfixé `e2e-`, et le supprime. Jamais le compte `controle@`, qui porte la démo.
- `CAPTURES=page1,page2 pnpm --filter @better-lift/web e2e captures` photographie des pages avec
  la session E2E.
- Après tout changement visible : une capture de la page dans ses états.
