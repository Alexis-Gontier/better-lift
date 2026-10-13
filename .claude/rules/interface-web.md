---
paths:
  - "apps/web/**"
---

# Interface web

## Coquille (D69–D73, D81)

Conception : [`2026-09-24-coquille-shadcn-design.md`](../../docs/superpowers/specs/2026-09-24-coquille-shadcn-design.md),
refondue par [`2026-10-06-web-refonte-design.md`](../../docs/superpowers/specs/2026-10-06-web-refonte-design.md) (D132–D144),
nettoyée par [`2026-10-06-web-nettoyage-design.md`](../../docs/superpowers/specs/2026-10-06-web-nettoyage-design.md) (D154–D160).

- **Le web est le poste d'analyse (D132)** : on y regarde et on y prépare ; aucune entrée ne
  lance une séance.

- **Coquille plate (D154–D156)** : `Sidebar collapsible="none"` (sans variante : non repliable,
  shadcn rend un simple bloc), filet `border-r` posé à la main, même fond que le contenu
  — **rien de permanent ne flotte**. Barre de 220 px en groupes : Tableau de bord seul,
  **Entraînement** (Séances, Routines), **Catalogue** (Exercices). Champ « Rechercher » (ouvre la
  palette). Pied `NavUser` : nom tiré de l'adresse (`nom-compte.ts`), menu Profil / Se déconnecter.
- **En-tête commun `EnTetePage` (D157)**, posé par les deux gabarits : 44 px, fil d'Ariane dont le
  premier élément est le `h1` de la page (lien vers la liste quand un détail est ouvert), actions
  à droite. Un détail s'y inscrit par `<DansEnTete titre="…">actions</DansEnTete>` : le titre par
  l'état du contexte, les actions par un portail dans l'emplacement.
- Liste et détail redimensionnables sous l'en-tête, tailles persistées.
- **Le détail ouvert vit dans le CHEMIN** : `/exercices/$slug`, `/seances/$id`, `/routines/$id`,
  `/routines/nouvelle`. Les paramètres de recherche ne portent que ce qui filtre (`q`, `groupe`)
  ou force un état (`etat`), et suivent d'un détail à l'autre (`search: (s) => s`).
- **Le gabarit est monté par la route de chaque écran, jamais par `__root.tsx`** :
  `PageListeDetail` (liste / détail, prop `vers`) ou `PageTableau` (`largeur` `pleine` ou
  `lecture`). Les deux posent `Coquille` et `EnTetePage`.
  `_protege.exercices.tsx`, `_protege.seances.tsx`, `_protege.routines.tsx` montent le gabarit
  et la liste ; le détail est une **route enfant** rendue par `<Outlet />`. La mise en page lit
  le paramètre de l'enfant par `useParams({ strict: false })` : la coquille change alors son jeu
  de panneaux — donc sa clé de persistance — selon qu'il y a un détail.
- `Resizable`, `Sidebar` et `Command` (palette `Cmd+K`) de shadcn. Composants shadcn plutôt que
  maison : `ScrollArea`, `Skeleton`, `Badge`, `Card`, `Table`, `Select`, `Tabs`, `Tooltip`.

## Écrans

- **Routines** en disposition `colonne` (`PageListeDetail`) : lignes à gauche (filtre `?q=` par
  `plier` de `lib/texte.ts`, « Nouvelle routine » en contour), routine ouverte **toujours
  modifiable** à droite. Annuler / Enregistrer vivent dans l'en-tête commun (`DansEnTete`) et
  n'apparaissent qu'une fois la copie différente de la version enregistrée (`empreinte`) :
  Enregistrer est le seul aplat de l'écran. Cartes d'exercice à la Hevy : image,
  « dernière fois » (`meilleureSerie`), pastille de repos, séries étiquetées É/1/2/3
  (`etiquettesSeries`). La colonne se **réordonne** à la poignée (souris ou clavier :
  Espace, flèches, Espace ; poignées masquées tant qu'un filtre est actif) par `useOrdonnerRoutines`, mutation OPTIMISTE sur
  `["routines","liste"]` (D142) : c'est l'ordre que suit « À suivre » sur le mobile.
- **Supersets dans l'éditeur (D151, D152)** : un groupe se rend d'un bloc — `EtiquetteSuperset`
  (« Superset A », casse normale, ouvre « Défaire le superset »), puis ses cartes derrière un filet de 3 px
  `border-chart-2` ; le `SortableContext` garde la liste PLATE des clés. Toute retouche passe par
  `modifier` et les fonctions de `shared/supersets.ts` (glisser : `deplacerAvecGroupes`, jamais
  `arrayMove`). Menu ⋯ : « Superset avec le suivant » (`peutLierAuSuivant`), « Retirer du
  superset ». Repos masqué sur les membres non derniers (`roleRepos`).
- **`/` est le Tableau de bord**, protégé (D134) : `features/tableau/`, période dans l'URL
  (`?periode=`, défaut `mois`). Deux lectures de `/stats/periode` (la période, et `annee` pour le
  calendrier qui montre toujours 12 mois, D138) ; le calcul propre au web est dans `calculs.ts`
  (testé). Cartes : `Carte` enveloppe la `Card` shadcn (D158) ; tuiles à pastille d'écart en
  contour sans couleur ; période en `ToggleGroup` ; volume en `Chart` (Recharts 3.8.0,
  animations coupées, `minPointSize` pour que la semaine en cours reste visible). Carte du corps : `corps-svg.ts`, GÉNÉRÉ depuis `react-native-body-highlighter` (MIT),
  à ne pas modifier à la main. **Profil** (`/profil`, ex-`/parametres`, D143) :
  bilan de toujours, objectif hebdo et repos par défaut (SUR LE COMPTE, `["preferences"]`, la
  clé des tuiles du Tableau de bord), thème (appareil, seul endroit où il se change), unités et
  fuseau (affichés), export CSV par un simple lien, déconnexion (aussi au menu du pied de
  barre). Une `Card` par section, lignes séparées par des filets. **Connexion** : le formulaire
  dans une `Card` sous le logo.
- **Séances** en disposition `fil` (liste 34 % / détail 66 %, sa propre clé de persistance) :
  fil groupé par mois (`grouperParMois`, fuseau), filtré par `?q=` (`filtrerSeances` : nom et
  aperçu, sans casse ni accents, sur les pages chargées ; le filtre garde le chemin du détail),
  ↑ / ↓ d'une séance à l'autre DANS le fil filtré ; sélection en `bg-muted` + liseré d'encre ;
  actions du détail dans l'en-tête (`DansEnTete`), chiffres en tuiles jointives, relevé en `Table` ; détail = relevé
  comparé (`ecartSerie` face à `precedentes`, toutes les séries), menu « ⋯ » → Supprimer, qui
  RETIRE le détail puis invalide `["seances"]`, `["stats"]`, `["records"]`.
  Un superset fait en séance se relit d'un bloc dans le relevé (D153) : étiquette texte
  « SUPERSET A » et filet `border-chart-2`, en lecture seule (`groupes` de `shared`).
- **`ScrollArea` de Radix** : son contenu est un `display: table` qui s'élargit au lieu de couper.
  Une liste à `truncate` doit forcer `[&_[data-slot=scroll-area-viewport]>div]:block!`.
- **Exercices** en disposition `fil` : catalogue à gauche, **fiche en une page** (D141) — GIF,
  1RM estimé et sa courbe en `Chart` (Recharts, tracé `linear`, animations coupées ; `courbe`
  de `calculs.ts`, testée, ne sert plus qu'aux chiffres ; dernier point en `primary` s'il est record),
  blocs en `Card`, historique en `Table`, nom dans le fil d'Ariane et nom anglais en sous-titre, records, historique (`["seances","historique",slug]`, invalidé par la
  suppression d'une séance), consignes.
- **`BadgeRecord`** (`features/exercices/badge-record.tsx`) est la SEULE pastille record du web :
  ne jamais recopier ses classes.
- **Liste des exercices** : image fixe (JPG ~6 Ko) déduite de `gifUrl` par `imageDe` — aucune
  colonne ni migration. Le GIF reste réservé aux fiches.
- **Adresse inconnue et route qui plante** : `defaultNotFoundComponent` et
  `defaultErrorComponent` du routeur (`main.tsx`), dans `components/etats/pages-routeur.tsx`. Ni
  coquille ni requête : ils tiennent quand c'est elles qui tombent. La 404 prend la page,
  l'erreur ne remplace que la route fautive (la coquille reste). Une 404 se voit à toute
  adresse inconnue.
- **Les quatre états par l'URL** : `?etat=chargement|erreur|vide`, derrière
  `import.meta.env.DEV`. `vide` vide le jeu de données plutôt que de substituer un composant.

## Thème (D192)

- **Thème par défaut de shadcn, Neutral**, tel que la doc le donne (`globals.css`) : variables,
  rayons, police par défaut de Tailwind, `tw-animate-css`. **Classes canoniques seulement**
  (`text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-card`, `border-border`,
  `bg-primary`, `text-destructive`, `chart-1..5`), aucun token maison, aucune couleur en dur —
  exception : `bg-white` derrière les images d'exercice, détourées sur blanc. Les primitives de
  `components/ui/` ne sont pas retouchées.
- L'action est l'aplat `primary` ; le record, `BadgeRecord` (`Badge variant="outline"` +
  `TrendingUp`) ; le danger, `destructive`. Intensités (calendrier, carte du corps) : `primary`
  en opacités. Superset : `chart-2`.
- Le sombre suit `data-theme` (posé avant le rendu par `index.html`), pas une classe `.dark` :
  `@custom-variant dark` dans `globals.css`, `THEMES` de `components/ui/chart.tsx`.
- **Rien de permanent ne flotte** (D154) : liste et détail jointifs, séparés par un filet. Les
  cartes se détachent par leur filet.

## Pièges

- **Serveur de dev laissé tournant** : le greffon de routes réécrit `routeTree.gen.ts`, et
  `core.autocrlf=true` le rend « modifié » sans différence, ce qui bloque un `git pull` ou un
  changement de branche avec un `git diff` vide. Arrêter le serveur avant de fusionner, et
  vérifier que le port 3000 est libre (`TaskStop` ne tue pas toujours le Vite enfant).
- `SYSTEME_UNITES` (`src/lib/unites.ts`) et le fuseau (`src/lib/fuseau.ts`, Europe/Paris) sont
  fixés à un seul endroit chacun, tant qu'aucun profil n'existe.
- Logo : `src/components/logo.tsx`, source vectorielle `public/favicon.svg`.
- Le lien `/` de la barre latérale porte `exact` : sans lui, il reste actif sur toutes les pages.
- Biome lit aussi `.superpowers/` (maquettes non versionnées) : ses erreurs y sont sans effet
  sur la CI, ignorer celles qui en viennent.
