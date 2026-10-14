---
paths:
  - "apps/web/**"
---

# Interface web

## Coquille (D69–D73, D81)

Conception : [`2026-09-24-coquille-shadcn-design.md`](../../docs/superpowers/specs/2026-09-24-coquille-shadcn-design.md),
refondue par [`2026-10-06-web-refonte-design.md`](../../docs/superpowers/specs/2026-10-06-web-refonte-design.md) (D132–D144),
nettoyée par [`2026-10-06-web-nettoyage-design.md`](../../docs/superpowers/specs/2026-10-06-web-nettoyage-design.md) (D154–D160),
rhabillée par [`2026-10-14-web-neobrutalism-design.md`](../../docs/superpowers/specs/2026-10-14-web-neobrutalism-design.md) (D193–D197).

- **Le web est le poste d'analyse (D132)** : on y regarde et on y prépare ; aucune entrée ne
  lance une séance.

- **Layout remis à zéro (2026-10-14), à redessiner** : l'en-tête commun (`PageHeader`,
  `InHeader`, fil d'Ariane) et la palette Ctrl K sont supprimés. `AppShell` pose la **`Sidebar`
  de shadcn** (`SidebarProvider` + `SidebarInset`, repliable par Ctrl B), **vide** pour l'instant :
  seul le pied porte le compte (`SideNav` / `NavUser` de `side-nav.tsx` : avatar, nom et adresse,
  menu Profil / Se déconnecter). Ajoutée par le CLI sans écraser nos primitives ; les variables
  `--sidebar*` et la variante `dark` qu'il pose dans `globals.css` ont été retirées : les rôles
  `sidebar-*` restent traduits dans `@theme inline`. **Conséquences assumées** : aucune
  navigation hors du menu du compte (on passe par l'URL), pas de `h1`
  de page, et les détails ont perdu leurs actions — Annuler / Enregistrer et Supprimer d'une
  routine, Ouvrir la routine / Supprimer d'une séance, la croix de fermeture. Leurs props
  (`onSave`, `saving`, `onClose`, `title`, `to`, `actions`) restent dans les types et sont
  toujours passées par les routes : à rebrancher quand le layout sera dessiné.
- Liste et détail redimensionnables, tailles persistées.
- **Le détail ouvert vit dans le CHEMIN** : `/exercises/$slug`, `/sessions/$id`, `/routines/$id`,
  `/routines/new`. Les paramètres de recherche ne portent que ce qui filtre (`q`, `group`)
  ou force un état (`state`), et suivent d'un détail à l'autre (`search: (s) => s`).
- **Le gabarit est monté par la route de chaque écran, jamais par `__root.tsx`** :
  `ListDetailPage` (liste / détail, prop `to`) ou `PageLayout` (`width` `pleine` ou
  `lecture`). Les deux posent `AppShell`.
  `_authenticated.exercises.tsx`, `_authenticated.sessions.tsx`, `_authenticated.routines.tsx` montent le gabarit
  et la liste ; le détail est une **route enfant** rendue par `<Outlet />`. La mise en page lit
  le paramètre de l'enfant par `useParams({ strict: false })` : la coquille change alors son jeu
  de panneaux — donc sa clé de persistance — selon qu'il y a un détail.
- `Resizable` de shadcn. Composants shadcn plutôt que maison : `ScrollArea`, `Skeleton`, `Badge`, `Card`, `Table`, `Select`, `Tabs`, `Tooltip`.

## Écrans

- **Routines** en disposition `column` (`ListDetailPage`) : lignes à gauche (filtre `?q=` par
  `fold` de `lib/text.ts`, « Nouvelle routine » en contour), routine ouverte **toujours
  modifiable** à droite. Annuler / Enregistrer vivent dans l'en-tête commun (`InHeader`) et
  n'apparaissent qu'une fois la copie différente de la version enregistrée (`empreinte`) :
  Enregistrer est le seul aplat de l'écran. Cartes d'exercice à la Hevy : image,
  « dernière fois » (`meilleureSerie`), pastille de repos, séries étiquetées É/1/2/3
  (`etiquettesSeries`). La colonne se **réordonne** à la poignée (souris ou clavier :
  Espace, flèches, Espace ; poignées masquées tant qu'un filtre est actif) par `useReorderRoutines`, mutation OPTIMISTE sur
  `["routines","list"]` (D142) : c'est l'ordre que suit « À suivre » sur le mobile.
- **Supersets dans l'éditeur (D151, D152)** : un groupe se rend d'un bloc — `SupersetLabel`
  (« Superset A », casse normale, ouvre « Défaire le superset »), puis ses cartes derrière un filet de 3 px
  `border-superset` ; le `SortableContext` garde la liste PLATE des clés. Toute retouche passe par
  `update` et les fonctions de `shared/supersets.ts` (glisser : `deplacerAvecGroupes`, jamais
  `arrayMove`). Menu ⋯ : « Superset avec le suivant » (`peutLierAuSuivant`), « Retirer du
  superset ». Repos masqué sur les membres non derniers (`roleRepos`).
- **`/` est l'Accueil, vide** (D197) : la coquille et son en-tête, sans contenu, en attendant la
  suite du chantier. Le tableau de bord (`features/tableau/` (supprimé)) a été retiré ; les routes `/stats`
  de l'API restent.
- **Profil** (`/profile`, D143) : bilan de toujours, objectif hebdo et repos par défaut (SUR LE
  COMPTE, `["preferences"]`, `preferencesOptions` de `features/profile/queries.ts`), unités et
  fuseau (affichés), export CSV par un simple lien, déconnexion (aussi au menu du pied de barre).
  Une `Card` par section, lignes séparées par des filets. Plus de choix du thème (D194).
- **Auth en deux pages minimales (D196)** : `/login` et `/register`, autour de
  `AuthForm` (`features/auth/`). Un titre, l'e-mail, le mot de passe, le bouton, le lien vers
  l'autre page — **ni logo, ni carte, ni sous-titre, ni œil**. Trois refus distincts (`refusalOf`,
  testé : 403 = hors liste blanche), `?redirect=` transmis d'une page à l'autre, `?state=` gardé.
  Une session ouverte est renvoyée vers `/` par le `beforeLoad` des deux routes.
- **Séances** en disposition `feed` (liste 34 % / détail 66 %, sa propre clé de persistance) :
  fil groupé par mois (`groupByMonth`, fuseau), filtré par `?q=` (`filterSessions` : nom et
  aperçu, sans casse ni accents, sur les pages chargées ; le filtre garde le chemin du détail),
  ↑ / ↓ d'une séance à l'autre DANS le fil filtré ; sélection en `bg-muted` + liseré d'encre ;
  actions du détail dans l'en-tête (`InHeader`), chiffres en tuiles jointives, relevé en `Table` ; détail = relevé
  comparé (`ecartSerie` face à `precedentes`, toutes les séries), menu « ⋯ » → Supprimer, qui
  RETIRE le détail puis invalide `["sessions"]`, `["stats"]`, `["records"]`.
  Un superset fait en séance se relit d'un bloc dans le relevé (D153) : étiquette texte
  « SUPERSET A » et filet `border-superset`, en lecture seule (`groupes` de `shared`).
- **`ScrollArea` de Radix** : son contenu est un `display: table` qui s'élargit au lieu de couper.
  Une liste à `truncate` doit forcer `[&_[data-slot=scroll-area-viewport]>div]:block!`.
- **Exercices** (D200–D210, `2026-10-14-web-exercices-design.md`) : grille seule, ou grille dans
  un panneau de gauche redimensionnable (`ListDetailPage` disposition `catalog`) quand une fiche
  est ouverte à droite (D206).
  - **Grille** `/exercises` (`features/exercises/exercise-grid.tsx`, `exercise-filters.tsx`) : cartes
    illustrées (image fixe), filtres en pastilles dans l'URL — `?q=`, `?target=` (les 19
    `CIBLES` de `shared`, 8 visibles + menu « + 11 »), `?equipment=` (`EQUIPEMENTS_PRINCIPAUX` +
    menu « Autres »), `?mine=1` (« Mes exercices », par `/exercices/pratiques`, clé
    `["sessions","practiced"]`), tri toujours visible (D210) : Pertinence par défaut (tes exercices récents en tête sous « Tes exercices », puis le catalogue en `ordre=pertinence` de l'API, varié ou par début de nom), `?sort=count` Plus pratiqués, `?sort=name` Nom ; deux requêtes dans `use-exercise-list.ts`. Pastille `×N` en contour
    pour un exercice pratiqué. Défilement infini par un repère `IntersectionObserver`.
  - **Fiche** `/exercises/$slug` = route ENFANT (`Outlet` de la grille), dans le panneau de
    droite ; une croix la ferme en gardant les filtres (sans `period`). Dans le panneau étroit, les
    pastilles de filtre deviennent deux `Select` (`compact`), la carte ouverte est enfoncée sur
    `bg-muted`. En-tête (GIF,
    `h1`, muscle ciblé en `Badge outline`, secondaires en `bg-muted`, équipement — jamais
    l'orange ; un muscle des `CIBLES` est un lien qui filtre la grille, D209), analyse si pratiqué (`exercise-analysis.tsx` : Charge max / 1RM / Volume / Reps en
    `ToggleGroup`, période `?period=` 3 M par défaut, écart en contour, dernier point orange s'il
    est record, résumé de la période), meilleures séries par reps (`best-sets-table.tsx`, depuis
    toujours, masqué au poids du corps), consignes, variantes (`/exercices/:slug/variantes`).
    Tout le calcul vient de `shared/analyse-exercice.ts` sur l'historique existant.
- **`RecordBadge`** (`features/exercises/record-badge.tsx`) est la SEULE pastille record du web :
  ne jamais recopier ses classes.
- **Cartes d'exercice** : image fixe (JPG ~6 Ko) déduite de `gifUrl` par `imageDe` — aucune
  colonne ni migration. Le GIF reste réservé aux fiches.
- **Adresse inconnue et route qui plante** : `defaultNotFoundComponent` et
  `defaultErrorComponent` du routeur (`main.tsx`), dans `components/states/router-pages.tsx`. Ni
  coquille ni requête : ils tiennent quand c'est elles qui tombent. La 404 prend la page,
  l'erreur ne remplace que la route fautive (la coquille reste). Une 404 se voit à toute
  adresse inconnue.
- **Le code du web est en anglais (D198)** : adresses, fichiers, dossiers, composants, fonctions,
  variables et clés de cache TanStack Query. Les **textes affichés** et les **commentaires** restent
  en français. Les champs du JSON de l'API et les noms importés de `shared` (`formaterCharge`,
  `ecartSerie`, `deplacerAvecGroupes`…) restent en français tant que l'API et `shared` ne
  basculent pas : `{ nom: name }` dans une déstructuration est normal.
- **Les quatre états par l'URL** : `?state=loading|error|empty`, derrière
  `import.meta.env.DEV`. `vide` vide le jeu de données plutôt que de substituer un composant.

## Thème : Neobrutalism, light seulement (D193–D195, D199)

- **La palette Orange de neobrutalism.dev** (D193 ; le bleu de D199 a été essayé puis abandonné
  le 2026-10-14), une seule valeur par token (`styles/tokens.css`) : fond `--background`
  `hsl(33 100% 92%)` crème, `--secondary-background` blanc (champs, cartes, menus), `--main`
  `#ff7a05` (l'action, en aplat, texte noir), `--main-ink` `#a33f00` (l'orange EN TEXTE : le
  record, 5,6:1 ; `#ff7a05` ne fait que 2,3:1 sur le crème), `--muted` `#f6dcc2` /
  `--muted-foreground` `#4d4036`, `--border` et `--ring` noirs, `--overlay` noir à 60 %,
  `--shadow` `4px 4px 0 0`, `--radius-base` `5px`. Pas de `dark:`, pas de `data-theme`, pas de
  sélecteur de thème.
- **La grammaire** : bordure noire de 2 px (`border-2 border-border`), ombre dure
  (`shadow-shadow`), rayon `rounded-base`. Les boutons pleins s'enfoncent au survol
  (`hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none`). Une carte
  qu'on glisse double son ombre. Les items survolés des menus, l'onglet actif, l'entrée active de
  la barre et les bascules prennent l'aplat orange.
- **Les primitives shadcn sont réhabillées, pas remplacées** : Radix, mêmes variantes (`default`
  = aplat orange, `outline` / `secondary` blancs bordés, `ghost`, `link`, `destructive` rouge).
  Les composants de neobrutalism.dev (`@base-ui/react`, variantes `neutral` / `noShadow`) ne sont
  pas installés. Une surface codée hors des primitives reprend la même grammaire à la main.
- **Les primitives parlent leur propre vocabulaire**, traduit dans `@theme inline`
  (`globals.css`). Un rôle non déclaré n'émet aucune règle, en silence. `primary` = `--main` ;
  `accent` (et `sidebar-accent`) = la **surface de survol** `--muted`, jamais l'orange, sinon
  chaque survol deviendrait un aplat.
- Police **DM Sans** 500 / 700 (`@fontsource/dm-sans`, D199) ; l'utilitaire `chiffre`
  (chiffres héros) est gras et serré.
- `--superset` `#5a4bbf` (D151), `--destructive` `#e5484d` (aplat, texte noir 5,4:1) et
  `--destructive-ink` `#b42318` (texte, 5,7:1). Vignettes sur `--image-bg` blanc.

## Pièges

- **Serveur de dev laissé tournant** : le greffon de routes réécrit `routeTree.gen.ts`, et
  `core.autocrlf=true` le rend « modifié » sans différence, ce qui bloque un `git pull` ou un
  changement de branche avec un `git diff` vide. Arrêter le serveur avant de fusionner, et
  vérifier que le port 3000 est libre (`TaskStop` ne tue pas toujours le Vite enfant).
- `UNIT_SYSTEM` (`src/lib/units.ts`) et le fuseau (`src/lib/time-zone.ts`, Europe/Paris) sont
  fixés à un seul endroit chacun, tant que le Profil ne permet pas de les changer.
- Logo : `src/components/logo.tsx`, source vectorielle `public/favicon.svg`.
- Biome lit aussi `.superpowers/` (maquettes non versionnées) : ses erreurs y sont sans effet
  sur la CI, ignorer celles qui en viennent.
