---
paths:
  - "apps/web/**"
---

# Interface web

## Arborescence (D306)

Conception : [`2026-10-18-web-api-design.md`](../../docs/superpowers/specs/2026-10-18-web-api-design.md).

- `routes/` : la route seule — `validateSearch`, garde, loader, choix de l'état. Aucune
  logique, aucun JSX au-delà de l'appel au composant de la feature.
- `features/<x>/` : tout ce qui est propre à une page — `queries.ts`, ses composants
  (`<x>-*.tsx`), sa logique pure (`*.ts`) et ses tests à côté. Une feature n'importe pas
  une autre feature ; ce qu'elles partagent monte dans `components/` ou `lib/`.
- `components/` : les briques communes à plusieurs features (`list-detail`, `editable`,
  `row-menu`, `body-map`…) ; `components/shell/` la coquille ; `components/states/` les
  quatre états ; `components/ui/`, `reui/`, `kibo-ui/` le code des registres, non modifié
  sauf nécessité. Les hooks communs vont dans `hooks/`.
- `lib/` : sans React ni feature — config, client d'API, auth, formatage, lecture.
- `packages/shared` : le calcul métier commun au web et au mobile (records, 1RM, volume,
  dates civiles). Le web ne réécrit jamais un calcul que `shared` a déjà.
- Knip voit tout le web (D309) : seuls `components/ui/` et `lib/utils.ts` sont des entrées ;
  le code des registres (`reui/`, `kibo-ui/`) n'est dispensé que de ses exports inutilisés.

## Données (D299–D304, D313)

- **Une couche de requêtes par page** : `features/<x>/queries.ts` (clés, `queryOptions`,
  mutations) ; ce que plusieurs pages lisent vit dans `lib/` (`catalogue.ts`, `exercices.ts`).
  Les écrans consomment les types de l'API ; les calculs viennent de `shared`.
- **Tout appel passe par `lire()`** (`lib/api.ts`) : une réponse non `ok` devient une `ErreurApi`
  (message de `{ erreur }`, statut ; 0 si le serveur est injoignable). Un 401 relit la session et
  la garde renvoie à la connexion (`main.tsx`).
- **Les routes préchargent sans attendre** (`prefetchQuery` dans `loader`) ; la page lit par
  `useQuery` et choisit son état par `etatAffiche(useEtat(), requête, vide)` — `?etat=` force
  toujours un des quatre états (D303), la barre d'état ne s'affiche qu'en développement.
- **Le libellé d'une page de détail** dans le fil d'Ariane : `useCrumbLabel(nom)`.
- **Supprimer** : `useSuppression` (`components/use-suppression.ts`) — l'élément sort du cache,
  l'appel part à la fin du toast « Annuler » (`lib/differe.ts`, `keepalive`), D302.
- **Éditeur de routine** : le `Brouillon` de `shared` (charges en texte « 82,5 »), la version
  enregistrée gardée en état pour que ses clés suivent le brouillon ; `useEditable` attend
  l'enregistrement (succès dit après la réponse, échec gardé).
- **Fuseau et kilos** : `lib/locale.ts` seul (`jourCivil`, `joursDepuis`, `SYSTEME`), D313.
- **E2E** : `apps/web/e2e/`, compte `e2e@` seulement, données préfixées `e2e-` et nettoyées ;
  `CAPTURES=page1,page2 … e2e captures` photographie des pages avec la session E2E.

> Les sections qui suivent décrivent l'**ancien web** (poste d'analyse, D132–D160), remplacé par
> le wireframe (D221+) puis branché (D293+). Ce qui y vaut encore : les principes de coquille et
> d'élévation ; les noms de fichiers, d'écrans et de routes, non.

## Coquille (D69–D73, D81)

Conception : [`2026-09-24-coquille-shadcn-design.md`](../../docs/superpowers/specs/2026-09-24-coquille-shadcn-design.md),
refondue par [`2026-10-06-web-refonte-design.md`](../../docs/superpowers/specs/2026-10-06-web-refonte-design.md) (D132–D144),
nettoyée par [`2026-10-06-web-nettoyage-design.md`](../../docs/superpowers/specs/2026-10-06-web-nettoyage-design.md) (D154–D160).

- **Le web est le poste d'analyse (D132)** : on y regarde et on y prépare ; aucune entrée ne
  lance une séance.

- **Coquille plate (D154–D156)** : `Sidebar collapsible="none"` (sans variante : non repliable,
  shadcn rend un simple bloc), filet `border-r` posé à la main, fond `--canvas` comme le contenu
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
  `border-superset` ; le `SortableContext` garde la liste PLATE des clés. Toute retouche passe par
  `modifier` et les fonctions de `shared/supersets.ts` (glisser : `deplacerAvecGroupes`, jamais
  `arrayMove`). Menu ⋯ : « Superset avec le suivant » (`peutLierAuSuivant`), « Retirer du
  superset ». Repos masqué sur les membres non derniers (`roleRepos`).
- **`/` est le Tableau de bord**, protégé (D134) : `features/tableau/`, période dans l'URL
  (`?periode=`, défaut `mois`). Deux lectures de `/stats/periode` (la période, et `annee` pour le
  calendrier qui montre toujours 12 mois, D138) ; le calcul propre au web est dans `calculs.ts`
  (testé). Cartes : `Carte` enveloppe la `Card` shadcn (D158) ; tuiles à pastille d'écart en
  contour (lime si hausse) ; période en `ToggleGroup` ; volume en `Chart` (Recharts 3.8.0,
  animations coupées, `minPointSize` pour que la semaine en cours reste visible). Carte du corps : `corps-svg.ts`, GÉNÉRÉ depuis `react-native-body-highlighter` (MIT),
  à ne pas modifier à la main. `--cal-0` s'écarte du mobile (posé sur une carte). **Profil** (`/profil`, ex-`/parametres`, D143) :
  bilan de toujours, objectif hebdo et repos par défaut (SUR LE COMPTE, `["preferences"]`, la
  clé des tuiles du Tableau de bord), thème (appareil, seul endroit où il se change), unités et
  fuseau (affichés), export CSV par un simple lien, déconnexion (aussi au menu du pied de
  barre). Une `Card` par section, lignes séparées par des filets. **Connexion** : le formulaire
  dans une `Card` sous le logo.
- **Séances** en disposition `fil` (liste 34 % / détail 66 %, sa propre clé de persistance) :
  fil groupé par mois (`grouperParMois`, fuseau), filtré par `?q=` (`filtrerSeances` : nom et
  aperçu, sans casse ni accents, sur les pages chargées ; le filtre garde le chemin du détail),
  ↑ / ↓ d'une séance à l'autre DANS le fil filtré ; sélection en `--surface-2` + liseré d'encre ;
  actions du détail dans l'en-tête (`DansEnTete`), chiffres en tuiles jointives, relevé en `Table` ; détail = relevé
  comparé (`ecartSerie` face à `precedentes`, toutes les séries), menu « ⋯ » → Supprimer, qui
  RETIRE le détail puis invalide `["seances"]`, `["stats"]`, `["records"]`.
  Un superset fait en séance se relit d'un bloc dans le relevé (D153) : étiquette texte
  « SUPERSET A » et filet `border-superset`, en lecture seule (`groupes` de `shared`).
- **`ScrollArea` de Radix** : son contenu est un `display: table` qui s'élargit au lieu de couper.
  Une liste à `truncate` doit forcer `[&_[data-slot=scroll-area-viewport]>div]:block!`.
- **Exercices** en disposition `fil` : catalogue à gauche, **fiche en une page** (D141) — GIF,
  1RM estimé et sa courbe en `Chart` (Recharts, tracé `linear`, animations coupées ; `courbe`
  de `calculs.ts`, testée, ne sert plus qu'aux chiffres ; dernier point en lime s'il est record),
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

## Élévation et thème

- **Rien de permanent ne flotte** (D154, révise D71). Liste et détail sont jointifs, séparés par
  un filet de 1 px. Flou, ombre portée et voile sont réservés au momentané (palette, menus,
  dialogues). Les cartes (`Card`, D158) se détachent par leur filet sur `--surface-1`
  (`--color-card`), sans ombre, rayon `rounded-xl`.
- Rôles `--sidebar-*` et `card` traduits dans `@theme inline` (D72). L'élément actif de la
  navigation est `--surface-3`, jamais le lime. La variante `dark:` suit `data-theme`, pas la
  préférence du système (`@custom-variant` dans `globals.css`).
- Sombre par défaut, clair accessible. Hiérarchie par échelle de surfaces et quatre niveaux
  d'encre. Contraste AA : 4,5:1, ou 3:1 dès 24 px.
- **Les primitives shadcn parlent leur propre vocabulaire**, traduit dans `@theme inline`.
  Un rôle non déclaré n'émet aucune règle, en silence. L'aplat est `bg-primary` /
  `text-primary-foreground`. `accent` désigne chez shadcn la **surface de survol** et pointe vers
  `--surface-3` : ne jamais rendre `bg-accent` au lime, chaque survol deviendrait un aplat.
- **Les valeurs des tokens suivent `apps/mobile/lib/theme.ts`** (D135) : en changer une, c'est
  changer les deux. Police **Archivo** (`@fontsource-variable/archivo/wdth.css`), chiffres héros
  par l'utilitaire `chiffre` (`font-stretch: 72%`). Calendrier `--cal-0..4`, vignettes
  `--image-bg` (blanc dans les deux thèmes).
- `--superset` (D151) : `#9a8cf0` / `#5a4bbf`, le repère d'un superset — ni lime ni danger.
- `--accent-ink` passe à `#4d6a12` en clair (sur blanc, `#a8cf45` tombe sous 2:1).
  `--danger` = `#a83e39` : encre à 5,65:1, aplat détaché du fond à 3,24:1 — plus foncé, le
  bouton disparaît.

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
