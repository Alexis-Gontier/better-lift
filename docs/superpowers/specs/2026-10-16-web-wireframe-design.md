# Web : wireframe de zéro

Date : 2026-10-16 · Branche : `feat/web-wireframe` (depuis `main`)

## 1. Intention

On remet l'application web à zéro pour repenser **quelles pages** elle porte et **ce qu'il y a
dedans**, avant tout travail de style. Le résultat est un wireframe **cliquable**, en gris, construit
avec de vrais composants shadcn et des **données factices**. L'API n'est pas branchée.

Le style (couleurs, police, densité) sera décidé ensuite, étape par étape. Cette spec ne le fixe pas.

**Révise** D132 (le web devient « analyse + préparation + planification »), D196–D198 (pages
d'auth, Accueil vide), D216–D220 (contenu des écrans de la refonte) et laisse en suspens D193–D195
et D199 (style), qui seront repris après validation du wireframe.

## 2. Décisions

- **D221 — Remise à zéro du web.** On garde le socle : Vite, React 19, TanStack Router,
  Tailwind, `components.json`. On supprime tout le reste de `apps/web/src` (routes, features,
  shell, états, auth, composants `ui/`) et on réinstalle les composants shadcn à neuf, au fil du
  besoin, thème neutre par défaut.
- **D222 — Front seul.** Aucun appel à l'API, aucun `@better-lift/api-client`. Les données vivent
  dans `src/mocks/`, typées, et sont lues par de petits hooks (`useMock…`) qu'on remplacera plus
  tard par des requêtes TanStack Query. La connexion est simulée.
- **D223 — Variantes et états pilotés par l'URL.** Chaque page propose 2 à 3 variantes de mise
  en page (`?v=a|b|c`) et ses quatre états (`?etat=nominal|vide|chargement|erreur`). Une
  **barre de prototypage** flottante, repliable, permet de basculer les deux. Elle disparaîtra au
  branchement de l'API.
- **D224 — Web = analyse, préparation, planification.** Pas de séance en direct sur le web : elle
  reste sur le mobile.
- **D225 — Planning remplace Programmes.** On planifie une routine sur un jour ; on peut répéter
  une semaine. Pas de moteur de cycles, pas de « prochaine séance » déduite.
- **D226 — Records = onglet de Progression**, pas une page.
- **D227 — Objectifs** sur un exercice (charge ou 1RM estimé) ou sur le poids de corps.
- **D228 — Composants hors shadcn validés** : Kibo UI *Contribution Graph*, ReUI *Stepper*,
  *Sortable* et *Number Field*, `react-body-highlighter` (silhouette des muscles). Tout autre
  composant externe se fait valider avant installation (recherche sur shoogle.dev).
- **D229 — Pas de logo pour l'instant.** Ni icône de site ni favicon : le nom « better-lift » en
  texte en tête de sidebar, masqué quand elle est repliée. L'identité viendra avec le style.
- **D231 — shadcn : Radix, style Nova, curseur pointeur.** `components.json` en `radix-nova`
  (marges réduites), police **Inter** (`@fontsource-variable/inter`, à la place de la Geist du preset), option `--pointer` de `init`. Radix plutôt que Base
  UI (défaut de shadcn depuis juillet 2026) : Kibo UI s'appuie dessus et Radix reste maintenu.
  `SelectContent` s'ouvre par défaut en `position="popper"`, `align="start"`. Biome ne lève pas
  les règles d'accessibilité du code vendorisé (`components/ui/**`, override dans `biome.json`) :
  les composants restent tels que shadcn les livre, réinstallables sans retouche.
- **D232 — Pas de navigation au clavier.** Ni séquences `G` + lettre, ni `?`, ni `N`, ni fenêtre
  des raccourcis. Restent Ctrl K, qui ouvre la recherche, et Ctrl B, natif de la sidebar.
- **D233 — Gabarit des pages inspiré d'ElevenLabs** (la coquille, elle, n'en hérite pas) :
  composant `Page` (`components/page.tsx`), contenu centré `max-w-6xl`, grand dégagement en haut,
  titre sobre, puis une ligne d'onglets soulignée avec les actions à droite (l'action principale
  en aplat, en dernier), affichée seulement si la page a des onglets ou des actions.
- **D234 — Variantes de la passe 4** (barre « Proto » ou `?v=`), pour choisir sur pièce :
  - Routines, Exercices, Historique (listes) — **A** détail sur sa page, **B** liste | détail
    redimensionnable (largeur mémorisée), **C** détail en panneau latéral. **Tranché le
    2026-10-17 : B**, sur toute la surface sous l'en-tête (`ListDetailPage`) ; le titre, les
    onglets et l'action vivent en tête de la liste, A et C sont retirés de ces pages ;
  - Accueil — **A** grille de cartes, **B** colonne principale + colonne latérale ;
  - Planning — **A/B** onglets Semaine et Mois, **C** agenda en liste ;
  - Progression — **A** quatre graphiques, **B** un grand graphique et un sélecteur de mesure ;
  - Corps — **A** courbe puis tableau, **B** tableau à gauche, courbe à droite ;
  - Routine (détail) — **A** une carte par exercice, **B** tableau compact ;
  - Exercice (Résumé) — **A** courbe en tête, **B** silhouette et chiffres en tête.
  Les autres pages n'ont qu'une variante. Les grilles des listes et des détails suivent la
  largeur de leur conteneur (requêtes de conteneur), pas celle de la fenêtre.
- **D235 — L'élément ouvert vit dans le chemin, plus de page de détail séparée.**
  `_app.routines.tsx`, `_app.exercises.tsx` et `_app.history.tsx` montent `ListDetailPage` et
  la liste ; le détail est la route enfant (`$id`, `$slug`, `new`), rendue par `<Outlet />`. La
  liste reste montée d'un élément à l'autre : ses filtres (état local) tiennent. Les lignes sont
  de simples `Link` (`data-status=active` marque la sélection) ; `SelectableRow` et
  `useSelection` disparaissent. Tout lien vers un élément (Accueil, Planning, palette, fil
  d'Ariane) ouvre donc la liste | détail. Sans élément (`/routines`), le panneau dit
  « Choisissez… » : pas de redirection vers le premier, l'adresse reste honnête.
- **D236 — Les onglets d'une fiche vivent dans l'en-tête du panneau de droite** (`?onglet=`,
  Résumé · Historique · Records pour un exercice). L'onglet de la liste des exercices (Catalogue ·
  Mes exercices) devient un état local, initialisé d'après l'exercice ouvert.
- **D237 — Variantes de détail tranchées** (pour libérer `?v=`) : routine en **cartes** (l'édition
  en a besoin), Résumé d'exercice **courbe en tête** (A). `RoutineDetailCompact` et
  `ExerciseSummaryHero` sont retirés.
- **D238 — Plus de page de modification.** `/routines/$id/edit` est supprimée ; on modifie là où
  on lit. Créer passe par la liste : « Nouvelle routine » (`/routines/new`) ou « Exercice
  personnalisé » (`/exercises/new`) insère une ligne brouillon « Sans nom » en tête de liste,
  sélectionnée, et ouvre le panneau vide, le curseur dans le nom. Rien n'est créé avant le
  premier enregistrement ; Annuler retire la ligne.
- **D239 — Trois façons de modifier, à comparer par `?v=`** sur une routine et sur une séance :
  **A** toujours modifiable (champs nus, barre Annuler / Enregistrer en pied de panneau dès qu'il
  y a un changement) ; **B** lecture, puis bouton *Modifier* qui bascule le panneau sur place
  (Annuler / Terminer) ; **C** champ par champ (clic sur une valeur, enregistrée en la quittant,
  toast avec *Annuler* ; la structure par le menu ⋯ et des contrôles au survol). Sur une séance,
  on corrige charges, répétitions, note et durée ; ajouter ou retirer un exercice d'une séance
  passée reste hors périmètre. Pressenti : A pour les routines, C pour les séances.
- **D240 — Fiche d'exercice : seule la note se modifie**, au clic, enregistrée en la quittant. Un
  exercice du catalogue n'est jamais modifiable ; un exercice personnalisé a, en plus, un court
  formulaire (nom, muscle, équipement).
- **D241 — Le gabarit liste | détail n'est pas étendu.** Accueil, Planning et Progression sont
  des vues d'ensemble, pas des collections ; Paramètres a déjà sa navigation. Seul candidat
  écarté pour l'instant : Corps › Mensurations.
- **D242 — Détails tranchés en construisant la passe 6** :
  - la tête du panneau de détail (`DetailHeader`) est **collante** : Annuler / Enregistrer
    restent à portée sur une longue routine ;
  - **créer est un formulaire dans toutes les variantes** : tant que la routine n'a ni nom ni
    exercice, il n'y a rien à enregistrer champ par champ ; bouton *Créer*, pas *Enregistrer* ;
  - quitter un élément modifié non enregistré (A, B, création) ouvre « Quitter sans
    enregistrer ? » (`useUnsavedGuard`, sur `useBlocker` du routeur) ;
  - les retouches champ par champ et les suppressions s'annoncent par un toast `sonner`
    (en bas au centre, la barre Proto tient le coin droit) qui propose *Annuler* ;
  - la ligne ouverte défile dans la vue à l'arrivée par une adresse ; l'Historique se déplie
    jusqu'au mois de la séance ouverte ; l'onglet de la liste des exercices suit l'exercice ouvert ;
  - sans aucun élément (`?etat=vide`), le panneau reste vierge : il n'y a rien à choisir ;
  - sans API, les enregistrements vivent dans des magasins en mémoire (`mocks/*-store.ts`,
    jusqu'au rechargement). Une séance corrigée relit son volume ; ses badges de record restent
    ceux d'origine — ils seront dérivés à la lecture au branchement.
- **D243 — Routine : une seule façon de modifier, A** (tranché le 2026-10-17, révise D239 pour
  les routines). La routine ouverte EST l'éditeur, en champs nus, avec son résumé chiffré en tête
  (exercices, séries, durée et volume estimés, muscles), qui suit la saisie. B et C sont retirés
  des routines ; `?v=` reste à comparer sur les séances.
- **D244 — Médias d'exercice simulés** (`components/exercise-media.tsx`) : vignette carrée
  (40 px, image fixe au branchement, `imageDe`) dans la liste des exercices, l'éditeur de routine
  et le relevé d'une séance ; GIF carré dans la fiche, carte « Exécution » à côté de la courbe.
  La note épinglée passe en tête de la fiche, sur toute la largeur.
- **D245 — La barre « Proto » ne montre que ce que la page propose** (révise D223). Chaque route
  déclare `staticData.proto` : ses variantes, nommées (« Calendrier », « Agenda » plutôt que A, C),
  et si elle répond aux quatre états (`states`, posé une fois sur `_app`). Fusion du parent à
  l'enfant. Sans variante, pas de boutons ; sans rien à changer (pages d'auth), pas de barre.
- **D246 — Carte d'exercice de l'éditeur de routine.** Poignée de glisser sur toute la hauteur à
  gauche (colonne séparée par un filet) ; en tête la vignette, le nom, le muscle, le repos en
  `Select` (valeurs usuelles, « Sans repos ») et le menu ⋯ (Retirer) ; un filet sur toute la
  largeur ; puis les séries : Série · Dernière fois · Charge (kg) · Répétitions, en `InputGroup`
  avec l'unité et des boutons − / + maison (pas de 2,5 kg ou 1 répétition, `stepValue`, testé),
  visibles au survol ou au focus seulement, sans les flèches natives ; *Ajouter une série* sur toute la largeur. Le *Number
  Field* de ReUI (D228) n'est pas installé : il tire `@base-ui/react` (écarté par D231) et
  réécrit `label.tsx`.
- **D247 — Superset depuis le menu ⋯ de l'éditeur.** *Superset avec le suivant* (grisé sans
  suivant, ou s'il est déjà lié) et *Retirer du superset*. Un superset est une suite CONTIGUË de
  même lettre : après lier, délier, glisser ou retirer, `normalizeSupersets` défait un groupe
  coupé, ôte la lettre d'un exercice seul et renomme A, B… dans l'ordre (testé). Chaque membre
  porte l'étiquette « Superset A » ; seul le dernier garde son repos, les autres disent
  « Enchaîné ».
- **D248 — Éditeur de routine lisible comme un formulaire** (révise D243 et D246, 2026-10-17).
  Plus de champs nus : champs, − / + et listes se voient d'emblée, les boutons ont leur contour
  (menu ⋯, *Ajouter une série*). Poignée plus étroite (20 px). Un filet au-dessus d'*Ajouter
  une série*, qui prend toute la largeur. **Type de série comme dans Hevy** : l'étiquette de la
  ligne est un bouton qui ouvre Normale · Échauffement (É) · Dégressive (D) · Jusqu'à l'échec
  (X) ; les séries normales sont numérotées entre elles (`setLabels`, testé : É 1 2 D). Une
  série ajoutée est normale. `MockSet.type` absent = série normale.
- **D249 — Types de série en couleur, comme Hevy** (révise D248). Ordre et lettres de Hevy :
  W Échauffement (ambre), 1 Normale, F Échec (rouge), D Dégressive (bleu) — « Dégressive »
  plutôt que l'« Abandon » de la traduction de Hevy. C'est la seule couleur du wireframe : elle
  porte un sens. Poignée 28 px, repos et menu ⋯ rapprochés, *Ajouter un exercice* sur toute la
  largeur.
- **D250 — Éditeur de routine resserré** (suite de la critique du 2026-10-17, P1 n° 1 et 2).
  Le nom se modifie dans la tête du panneau (plus de champ en double), le dossier est une liste
  sous le nom, suivie des chiffres en une ligne (exercices · séries · durée · volume prévu ·
  dernière fois) ; les notes sont repliées derrière *Ajouter une note*. Le premier exercice
  passe de ~520 px à ~240 px du haut. **Un champ modifiable a un fond teinté, sans contour** :
  nom, dossier, repos, charge, répétitions, type de série ; *Ajouter une série* en bouton
  rempli ; ✕ en encre atténuée. « Dernière fois » a une largeur fixe : les champs restent près
  de l'étiquette de série.
- **D251 — Liste des routines en lignes, sélection par liseré, contraste** (suite de la critique,
  P2). Les routines s'alignent sur Exercices et Historique : une ligne (nom ; nombre d'exercices
  et muscles ; durée estimée et dernière fois), dans une carte à filets ; le clic droit duplique
  et supprime pour de bon (toast avec *Annuler*). La ligne ouverte, dans les trois listes, prend
  un fond léger (`muted/50`) et un liseré d'encre de 3 px à gauche. `--muted-foreground` passe de
  `oklch(0.556)` à `oklch(0.52)` en clair : le texte atténué tient 4,5:1 sur tout fond gris clair
  (le détecteur relevait 4,3:1, venu des touches Ctrl K et de l'avatar). Le panneau de détail
  garde 96 px en bas pour que la barre Proto ne cache rien.
- **D252 — Ce qui reste de la critique** (2026-10-18). Un *Enregistrer* ou *Créer* grisé dit
  pourquoi, à sa gauche et en `aria-describedby` : « Donnez-lui un nom », puis « Ajoutez au moins
  un exercice » (`saveBlocker`, testé). Menu ⋯ d'un exercice : *Même charge partout* (la première
  série normale donne charge et répétitions aux autres séries normales) et *Recopier la dernière
  fois* (rang par rang, puis la dernière série connue), tous deux testés. Le F de l'échec passe
  au rose (`rose-600`) : le rouge appartient au danger. Le nom s'ajuste à son texte
  (`field-sizing: content`). *Ajouter une série* reste un bouton rempli : la demande « on doit
  voir que ce sont des boutons » l'emporte sur la critique.
- **D253 — Éditeur de routine en deux colonnes, cartes repliables** (2026-10-18, révise D250).
  La tête ne porte plus que le nom (modifiable) et les actions. **Les cartes d'exercice sont
  repliées à l'ouverture** : la tête seule, avec le résumé des séries (`setsSummary`, testé :
  « 3 × 12 · 10 kg », plages « 3 × 10–12 · 8–10 kg », « 1 W + 3 × 12 ») ; un clic sur la tête
  (chevron) ouvre le tableau ; plusieurs ouvertes à la fois ; *Tout déplier / Tout replier* ;
  un exercice ajouté s'ouvre seul ; réordonner se fait cartes fermées. **Colonne de droite**
  (17 rem dès `@3xl`, collée sous la tête, bornée à l'écran et défilant seule ; sous les
  exercices quand le panneau est étroit) : *Aperçu* — durée, séries, volume prévu, exercices,
  silhouette des muscles travaillés (`bodyMuscles`), séries de travail par muscle en barres
  (`setsByMuscle`, échauffements exclus, testés), dernière fois — puis *Réglages* : dossier et
  notes. Tout suit la saisie.
- **D254 — Colonne de droite en cartes, filet vertical, titre entier** (2026-10-18). Une carte
  par sujet : *Chiffres* (avec la dernière fois), *Muscles travaillés*, *Réglages*. Un filet
  vertical sépare les exercices de la colonne, de la tête au bas du panneau. Les cartes de la
  colonne ne rétrécissent pas (`*:shrink-0`) quand sa hauteur est bornée. Le titre d'une
  `DetailHeader` ne se coupe (`truncate`) que s'il est un texte : un titre-champ garde son bord
  et son anneau de focus.
- **D255 — Deux défilements, mini-cartes, silhouette seule** (2026-10-18, révise D253–D254).
  `ListDetailPage` prend `detailScroll="columns"` sur Routines : le panneau ne défile plus d'un
  bloc ; sous la tête fixe, les exercices et la colonne de droite ont chacun leur défilement
  (`overscroll-contain`) ; étroit, une seule colonne défile. Les chiffres sont des mini-cartes
  (durée, séries, volume prévu, exercices, puis la dernière fois sur toute la largeur), hors de
  toute carte englobante. *Muscles travaillés* ne garde que la silhouette, en petit (96 px de
  haut) : la liste
  des séries par muscle (`setsByMuscle`) est retirée.
- **D256 — Exercices | aperçu redimensionnables, en `ScrollArea`** (2026-10-18, révise D255).
  Sous la tête fixe, un `ResizablePanelGroup` (largeur mémorisée, `routine-editeur`) : les
  exercices (70 %, **560 px au moins** — le tableau des séries a des colonnes fixes) et
  l'aperçu (30 %, de 220 px à 50 %), chacun dans la `ScrollArea` de shadcn. La poignée tient
  lieu de filet. Les mini-cartes passent à deux par ligne dès 13 rem de colonne.
- **D257 — Liste des routines en dossiers** (2026-10-18, révise D251). Les dossiers sont des
  sections repliables (nom, nombre, menu ⋯ : *Nouvelle routine ici*, *Renommer* sur place,
  *Supprimer* — ses routines passent dans « Sans dossier », toast avec *Annuler*). « Sans
  dossier » n'apparaît que s'il a des routines ; un dossier vide dit « Glissez une routine ici ».
  Les pastilles de filtre disparaissent : la recherche ne montre que les dossiers qui ont un
  résultat, dépliés. **Glisser sert à changer de dossier** (pas à réordonner) : poignée à gauche
  de chaque ligne (`@dnd-kit/core`, déjà là par le *Sortable* de ReUI), dossier entier — tête
  comprise, même replié — comme cible, ligne fantôme qui suit le pointeur, toast avec
  *Annuler*. **La création passe en bas** de la liste, fixe et séparée d'un filet (prop `footer`
  de `ListDetailPage`) : *Nouvelle routine* et *Dossier*. Les réglages d'une routine proposent
  les dossiers du magasin et « Sans dossier ».
- **D258 — Une carte par routine** (2026-10-18, révise D251 pour les routines). Dans un dossier,
  les routines sont des cartes séparées (8 px), plus des lignes collées sous filets. La routine
  ouverte prend un contour d'encre (`ring-2`, 30 %) et un fond léger : plus de liseré à gauche
  dans cette liste. Exercices et Historique gardent leurs lignes et leur liseré.
- **D259 — L'éditeur de routine tient aux largeurs moyennes** (2026-10-18, critique en sombre).
  La liste ne descend pas sous 300 px et part à 30 % quand le détail est en colonnes. Le détail
  sous 720 px empile la colonne de droite sous les exercices, dans un seul défilement ; au-dessus,
  exercices 74 % (480 px mini) et aperçu 26 %. Une carte d'exercice de moins de 31rem efface la
  colonne « Dernière fois », les champs restent entiers. Le nom d'exercice passe sur deux lignes
  au lieu d'être tronqué. Silhouette : corps sur un token `--body-map` (gris qui se détache de la
  carte dans les deux thèmes), couleurs relues au changement de thème. En sombre, les champs
  remplis (D250) montent d'un cran (`input/70`) pour se distinguer de la carte et du survol.
- **D260 — Les états de `/routines` et le panneau sans routine ouverte** (2026-10-18). Rien
  d'ouvert : un état vide franc (« Aucune routine ouverte », choisir dans la liste ou créer, bouton
  Nouvelle routine en contour). Une vue d'ensemble (routines à refaire, muscles couverts) a été
  essayée puis retirée. `vide` : la liste
  le dit d'une ligne, la droite guide la première création en trois étapes et porte le bouton.
  `chargement` : les squelettes ont la forme réelle (recherche, deux dossiers et leurs cartes ;
  l'éditeur avec son nom, ses cartes et sa colonne de droite) ; sans routine ouverte, la droite
  attend la liste. `erreur` : seule la liste le dit, la droite reste vide ; « Réessayer » passe sous le message (pour toutes les pages), car dans une
  colonne étroite le titre glissait sous le bouton en coin.
- **D261 — Une routine modifiée** (2026-10-18, critique de l'éditeur). Les modifications ont un
  **historique** : ↶ / ↷ dans la tête, Ctrl Z, Ctrl Maj Z ou Ctrl Y ; des changements à moins de
  800 ms l'un de l'autre (une saisie, des « + » répétés) font un seul pas. Sous le nom :
  « • N modifications non enregistrées » (un exercice touché, ajouté ou retiré, le nom, le
  dossier, les notes, l'ordre comptent chacun pour un), ou ce qui empêche d'enregistrer (D252).
  « Annuler » devient **« Tout annuler »**, un pas d'historique rattrapable (toast « Rétablir »).
  Ctrl S enregistre. Les cartes touchées portent « Modifié » ou « Nouveau » ; les chiffres de
  droite montrent leur écart avec la version enregistrée. Quitter propose Rester, Ne pas
  enregistrer, Enregistrer (sans ce dernier quand l'élément n'est pas enregistrable).
- **D262 — Ajout d'exercices, fiche rapide, petits écrans, bornes réelles** (2026-10-18).
  « Ajouter des exercices » ouvre un **dialogue en cartes** (vignette, nom, muscle · équipement),
  recherche sans accents sur le nom français ET le nom anglais, filtre par muscle ; on coche
  **plusieurs** exercices, chacun montre son **rang** et ils s'ajoutent dans cet ordre, ouverts,
  la page descendant jusqu'au premier. Les exercices **déjà dans la routine sont retirés** du
  dialogue ; une recherche qui ne trouve qu'eux le dit (« Déjà dans la routine »). Menu ⋯ d'une carte : **« Voir la fiche »**, une fenêtre (animation,
  muscles, note épinglée, dernière fois) avec « Fiche complète » vers `/exercises/$slug`.
  **Petits écrans** : sous 760 px de contenu, la page liste | détail n'affiche qu'un panneau (la
  liste, ou l'élément ouvert ; le fil d'Ariane ramène à la liste) ; la liste ne dépasse pas 55 % ;
  une carte d'exercice de moins de 28rem cache sa vignette et compacte son repos. La poignée
  porte seule le rôle de déplacement (la carte n'est plus un arrêt de tabulation).
  **Bornes de `routineSaisie`** (shared) : 50 exercices, 20 séries, 1 000 kg, 999 répétitions,
  nom de 120 caractères ; les boutons d'ajout le disent quand la borne est atteinte.
  **Contrôle sur les données de production** (lecture seule, agrégats) : aucune charge cible n'y
  est notée (101 séries sur 101), 4 séries sans répétitions cibles, échauffements et dégressives
  présents, deux exercices en superset, repos de 90 à 180 s, nom d'exercice jusqu'à 82
  caractères. D'où : répétitions et charges cibles facultatives dans la maquette, résumé replié
  sans « — kg », « Volume prévu » à « — » sans charge. **Les cartes gardent leur hauteur** : le
  nom tient sur une ligne, coupé par « … » quand la place manque, entier dans l'infobulle — dans
  l'éditeur comme dans le dialogue d'ajout.
  **Écarts encore ouverts avec le modèle** : le dossier et les notes d'une routine n'existent pas
  en base (migration à prévoir) ; `reposSec` nul signifie « repos par défaut » du profil, que
  l'éditeur ne propose pas ; un exercice archivé dans une routine n'a pas d'état ; l'unité est
  figée en kg alors que l'affichage passe par `formaterCharge` ; l'ordre en base est un
  `position` global, à étendre au dossier ; la durée estimée devra venir de `shared`.

## 3. Coquille

> **État au 2026-10-17** : sidebar réduite à ses liens (avec Paramètres), header réduit au
> bouton de repli suivi du **fil d'Ariane** (le nom réel sur les pages de détail). Le contenu décrit ci-dessous est la cible ; il revient pas à
> pas, validé élément par élément. La palette s'ouvre par Ctrl K.

```
┌──────────┬───────────────────────────────────────────────────────────┐
│ ▣ Logo   │ [≡] Routines › Push A   [ 🔍 Rechercher…  Ctrl K ]  ◐ ⌨ ☺ │
│──────────│───────────────────────────────────────────────────────────│
│ ⌂ Accueil│                                                           │
│ ENTRAÎN. │                    contenu de la page                     │
│ ▦ Planning                                                           │
│ ☰ Routines                                                           │
│ ◎ Exercices                                                          │
│ ⟲ Historique                                                         │
│ ANALYSE  │                                                           │
│ ↗ Progression                                                        │
│ ⚖ Corps  │                                                           │
│──────────│                                                           │
│ ☺ Compte▾│                                                           │
└──────────┴───────────────────────────────────────────────────────────┘
```

- **Sidebar** shadcn, `collapsible="icon"` (bloc `sidebar-07` + header collant de `sidebar-16`).
  Repliée, chaque icône porte un tooltip. Tête : le nom en texte (D229). Pied : menu du compte
  (Paramètres, Déconnexion). État replié mémorisé (cookie du composant).
- **Header** collant :
  - gauche : `SidebarTrigger`, séparateur, `Breadcrumb` ;
  - centre : faux champ « Rechercher… » + `Kbd` Ctrl K, qui ouvre un `CommandDialog` ;
  - droite : thème clair/sombre, menu du compte (avatar).
- **Palette de commandes** : groupes *Aller à* (toutes les pages), *Routines*, *Exercices*,
  *Séances* (recherche dans les mocks), *Actions* (Nouvelle routine, Planifier, Noter mon poids,
  Importer depuis Hevy).
- **Clavier** : seulement Ctrl K (palette) et Ctrl B (sidebar, natif du composant). Pas de
  navigation au clavier (D232).
- **Motif liste | détail** : `ResizablePanelGroup` horizontal, liste à gauche (min 20 %, défaut
  30 %), détail à droite, poignée visible. Taille mémorisée par page. Utilisé par Routines,
  Exercices et Historique.
- **Transverse** : `sonner` pour les confirmations, `ContextMenu` (clic droit) sur les lignes de
  liste, `Skeleton` pour le chargement, `Empty` pour les états vides, `AlertDialog` pour toute
  suppression.

## 4. Pages

### 4.1 Auth (hors coquille)

- **Connexion** `/login` — e-mail, mot de passe, lien « Mot de passe oublié », lien inscription.
- **Inscription** `/register` — nom, e-mail, mot de passe.
- **Mot de passe oublié** `/forgot-password` — e-mail, puis écran « e-mail envoyé ».
- **Nouveau mot de passe** `/reset-password` — deux champs ; lien expiré = état erreur.
L'onboarding est reporté : il viendra quand l'inscription sera branchée.

Variantes : formulaire centré seul (a), deux colonnes formulaire + panneau illustré (b).

### 4.2 Accueil `/`

- **Aujourd'hui** : la routine planifiée pour le jour (lien vers elle), ou « Repos », ou
  « Rien de planifié » avec bouton *Planifier*.
- **Semaine** : 4 chiffres clés (séances, volume, durée, jours d'affilée), chacun comparé à la
  semaine précédente.
- **Volume par semaine** sur 12 semaines (graphique en barres).
- **Régularité** : Contribution Graph sur l'année.
- **Objectifs** : barres d'avancement (ex. 92,5 / 100 kg au développé couché).
- **Poids** : valeur actuelle, tendance 7 jours, mini-courbe.
- **Dernières séances** (5) et **records récents** (30 jours).

Variantes : grille de cartes façon tableau de bord (a), colonne principale + colonne latérale
étroite (b).

### 4.3 Planning `/planning`

- Calendrier **semaine** ou **mois** (`ToggleGroup`), navigation précédent / aujourd'hui / suivant.
- Jours passés : séances **faites** (plein). Jours à venir : routines **planifiées** (contour).
  Planifiée et non faite : **manquée**.
- Planifier : glisser une routine depuis un panneau latéral sur un jour, ou clic sur un jour →
  `Popover` avec la liste des routines.
- **Répéter la semaine** : copie la semaine affichée sur N semaines (`Dialog`).
- Clic sur une séance faite → Historique ; sur une planifiée → la routine.

Variantes : semaine en colonnes de jours (a), mois en grille (b), agenda en liste (c).

### 4.4 Routines `/routines`, `/routines/$id`

- **Liste** : recherche, **dossiers** repliables, ligne = nom, nombre d'exercices, dernière fois
  faite ; bouton *Nouvelle routine*.
- **Détail** : en-tête (nom, dossier, durée et volume estimés, badges des muscles ciblés),
  exercices avec séries cibles (charge × répétitions, repos), supersets groupés, dernière
  exécution ; actions *Modifier*, *Planifier*, *Dupliquer*, *Supprimer*.
- **Éditeur** (révisé par D238 : dans le panneau de détail, plus de page à part) : nom,
  dossier, exercices en `Sortable`, ajout par une recherche d'exercices, séries en
  `Number Field`, regroupement en superset, notes.

Variantes du détail : liste d'exercices en cartes (a), tableau compact (b).

### 4.5 Exercices `/exercises`, `/exercises/$slug`

- **Liste** : recherche, filtres muscle et équipement, ligne = nom, muscle principal, dernière
  fois ; bouton *Exercice personnalisé*.
- **Détail** en onglets :
  - **Résumé** : silhouette des muscles (principal / secondaires), note personnelle épinglée,
    courbe du 1RM estimé et de la meilleure charge (avec objectif en pointillés), tableau des %
    du 1RM (50 → 100 %) ;
  - **Historique** : chaque séance où il apparaît, avec ses séries ;
  - **Records** : meilleure charge, meilleur 1RM estimé, meilleur volume, meilleur par nombre
    de répétitions.

Variantes du Résumé : courbe en haut, silhouette à droite (a) ; silhouette en haut, chiffres
clés en ligne (b).

### 4.6 Historique `/history`, `/history/$id`

- **Liste** : séances groupées par mois ; ligne = date, routine, durée, volume, nombre de
  records ; filtres par routine et par exercice.
- **Détail** : exercices et séries, badges de record, notes, durée, et **écart avec la séance
  précédente** de la même routine (volume ±, records).

Variantes de la liste : lignes denses (a), cartes (b).

### 4.7 Progression `/progress`

Sélecteur de période (4 semaines, 3 mois, 1 an, tout, ou plage personnalisée). Deux onglets :

- **Graphiques** : volume par groupe musculaire (barres et silhouette colorée), fréquence par
  muscle (séances par semaine), durée et nombre de séances dans le temps.
- **Records** : tableau triable (exercice, type, valeur, date) filtrable par muscle.

Variantes de Graphiques : grille 2 × 2 (a), un grand graphique + sélecteur de métrique (b).

### 4.8 Corps `/body`

- **Poids** : courbe avec moyenne mobile 7 jours, objectif en pointillés, saisie rapide de la
  pesée du jour, tableau des pesées.
- **Mensurations** (onglet) : tours (bras, taille, cuisse…), une courbe par mesure.

Variantes : courbe pleine largeur + tableau dessous (a), tableau à gauche + courbe à droite (b).

### 4.9 Paramètres `/settings/*`

Page avec sa propre navigation secondaire à gauche, façon Linear :

- **Compte** `/settings/account` : profil (nom, e-mail, fuseau), sécurité (mot de passe,
  sessions ouvertes), **zone de danger** (supprimer le compte).
- **Préférences** `/settings/preferences` : unités, format de date, premier jour de la semaine,
  apparence.
- **Entraînement** `/settings/training` : repos par défaut, incrément de charge, poids de la
  barre, disques disponibles, formule du 1RM (Epley / Brzycki), RPE / RIR activé.
- **Données** `/settings/data` : import Hevy en `Stepper` (fichier CSV → correspondance des
  exercices → aperçu → import simulé), export CSV / JSON, supprimer toutes les données.

Une seule variante : c'est un écran de formulaire.

### 4.10 Système

- **404** : message, lien vers l'Accueil.
- **Erreur générale** : `errorComponent` du routeur, bouton *Réessayer*.

## 5. Structure du code

```
apps/web/src/
  main.tsx, routeTree.gen.ts, styles/globals.css
  routes/                 une route par page (TanStack Router, fichiers plats)
  components/ui/          shadcn et registres validés (D228)
  components/shell/       sidebar, header, palette, liste-détail
  components/proto/       barre de prototypage, lecture de ?v= et ?etat=
  components/states/      squelettes, vide, erreur réutilisables
  features/<page>/        composants propres à une page, une variante par fichier
  mocks/                  données factices typées + hooks useMock…
```

- Code et adresses en anglais, textes en français.
- Chaque page lit `v` et `etat` via `validateSearch` du routeur ; la barre de prototypage les
  écrit. Une variante = un composant (`home-variant-a.tsx`…), choisi par la route.
- Les mocks couvrent un compte réaliste : ~25 routines en 4 dossiers, ~60 exercices, ~120
  séances sur 8 mois, 90 pesées, quelques objectifs, un planning sur 4 semaines.

## 6. Ordre : du général au spécifique

On construit par passes successives, chaque passe validée à l'écran avant la suivante :

1. **Socle** : remise à zéro, coquille (sidebar, header, palette), barre de
   prototypage, toutes les routes présentes avec un simple titre.
2. **Squelette des pages** : chaque page reçoit ses zones (cadres titrés, liste | détail en
   place), une seule variante, données factices minimales.
3. **Contenu** : vrais composants dans chaque zone, mocks complets, quatre états.
4. **Variantes** : les variantes B et C, page par page.
5. **Détails** : éditeur de routine, import Hevy, interactions (glisser-déposer, menus
   contextuels).

**Avancement au 2026-10-16** : les cinq passes sont faites. Restent ouverts le choix d'une
variante par page (D234) et le contenu du header, vidé à la demande (§ 3).

6. **Liste | détail repensée** (D235–D241, 2026-10-17), étape par étape, un commit et une
   capture chacune : sélection dans le chemin et retrait des pages de détail ; variantes
   d'édition A/B/C d'une routine ; création par la liste ; variantes d'édition d'une séance ;
   note d'exercice et exercice personnalisé. **Faite le 2026-10-17** ; routines en A (D243), reste à choisir A, B ou C
   pour les séances (D239).

Le catalogue n'est pas figé : à chaque passe, on peut chercher d'autres composants (shoogle.dev,
recherches web, applications de référence comme Hevy, Strong ou Liftosaur). Chaque nouveau
composant externe est présenté et validé avant installation (D228).

## 7. Vérification

- `pnpm --filter @better-lift/web typecheck` et `build` passent ; Biome et Knip propres.
- Chaque page, chaque variante et chaque état est atteignable par l'URL et vérifié par une
  capture (Playwright).
- Pas de test unitaire sur le wireframe : il n'y a pas de logique métier. Les rares calculs
  (moyenne mobile, % du 1RM) vivent dans `mocks/` et seront remplacés par ceux de `shared`.

## 8. Hors périmètre

Style définitif, branchement de l'API, séance en direct, mobile, moteur de programmes,
onboarding.
