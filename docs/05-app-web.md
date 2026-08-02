# 05 — Application web

Next.js 16, App Router, Turbopack. Le web est **l'atelier** : préparation des routines, lecture des statistiques, gestion du compte.

## Arborescence des routes

```
app/
├── layout.tsx                      # <html>, globals.css, <Providers>
├── loading.tsx                     # filet : segments sans loading plus proche
├── error.tsx                       # filet : erreurs hors layout racine
├── global-error.tsx                # erreur DU layout racine — fournit <html>/<body>
├── not-found.tsx                   # 404 global, hors coquille applicative
├── unauthorized.tsx                # 401 — unauthorized(), cf. authInterrupts
├── forbidden.tsx                   # 403 — forbidden(), rare (voir plus bas)
├── (marketing)/
│   ├── page.tsx                    # landing
│   ├── pricing/                    # V2
│   └── legal/{cgu,confidentialite}/
├── (auth)/
│   ├── layout.tsx
│   ├── error.tsx
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── reset-password/
└── (app)/                          # layout authentifié : sidebar + topbar
    ├── loading.tsx                 # squelette rendu DANS la coquille
    ├── error.tsx
    ├── not-found.tsx               # identifiant mort, navigation conservée
    ├── dashboard/
    ├── routines/
    │   ├── page.tsx                # liste + dossiers
    │   ├── new/
    │   └── [id]/
    │       ├── page.tsx            # aperçu
    │       └── edit/
    ├── workouts/
    │   ├── page.tsx                # historique (liste + calendrier)
    │   └── [id]/
    ├── exercises/
    │   ├── page.tsx                # catalogue
    │   ├── new/                    # créer un exercice personnalisé
    │   └── [id]/
    │       ├── page.tsx            # fiche + historique + records
    │       └── edit/               # exercices personnalisés uniquement
    ├── stats/
    └── settings/
        ├── layout.tsx              # titre + les trois onglets
        ├── page.tsx                # redirige vers profile/
        ├── profile/
        ├── preferences/
        └── account/
```

## La coquille `(app)`

`(app)/layout.tsx` monte `SidebarProvider` → `AppSidebar` + `SidebarInset` (barre haute, puis contenu en `max-w-6xl`). Les composants vivent dans `features/navigation/`, la liste des destinations dans `nav-items.ts` et la règle d'état actif — testée — dans `active.ts`.

**Le layout est `async` et lit le cookie `sidebar_state` côté serveur.** La primitive persiste l'état replié dans ce cookie ; sans lecture serveur, le premier rendu montre toujours la colonne dépliée, puis l'hydratation la replie — 16 rem qui sautent à chaque chargement, précisément pour qui a choisi de la replier.

**`SidebarInset` *est* l'élément `<main>`.** Les pages du groupe rendent donc du contenu nu : un `<main>` dans une page produirait un second repère imbriqué, ce qui est du balisage invalide et laisse un lecteur d'écran devant deux « contenus principaux ». De même, `SidebarContent` ne rend qu'un `<div>` — le repère `<nav aria-label="Navigation principale">` est ajouté explicitement, sinon la colonne n'en est plus un.

**L'état actif reste celui de la primitive, et il est ténu.** `bg-sidebar-accent` s'applique à l'entrée active **et** au survol ; seule la graisse du libellé les sépare, si bien que « où je suis » et « ce que je pointe » se ressemblent. Le renforcer demanderait une couleur d'accent, que la palette n'a pas (D25). `aria-current="page"` porte l'information de façon non ambiguë là où elle compte le plus, et le sujet se rouvrira avec la reteinte.

`collapsible="icon"` : replier réduit aux pictogrammes plutôt que de faire disparaître la navigation, et chaque entrée porte un `tooltip` qui redonne son libellé dans cet état. Sous `md`, la primitive bascule seule en tiroir `Sheet`. Les libellés des commandes de repli (`SidebarTrigger`, `SidebarRail`) sont réécrits en français depuis l'app : le registre les livre en anglais et en dur.

Le `proxy.ts` Next protège `(app)/*` : session absente → redirection vers `/login?next=<chemin>`. En Next 16 le fichier s'appelle `proxy.ts`, plus `middleware.ts`, et l'export nommé est `proxy` (voir [doc 10](10-versions.md)).

**Ce n'est pas une frontière de sécurité**, et il ne faut pas le lire comme telle. Il constate la *présence* d'un cookie de session pour éviter d'afficher une coquille vide à un visiteur anonyme ; il ne vérifie ni signature ni expiration, ce qui imposerait un aller-retour vers l'API à chaque navigation pour une garantie que l'API redonne de toute façon. L'autorisation réelle est côté API, et nulle part ailleurs. Un cookie forgé n'obtient qu'un écran qui se remplira d'erreurs 401.

Deux détails qui ont coûté du temps et sont détaillés en [doc 10](10-versions.md) : les chemins du `matcher` s'écrivent en toutes lettres (un groupe `(app)` n'apparaît jamais dans une URL), et le cookie change de nom en HTTPS (`__Secure-`).

Le paramètre `next` est **filtré avant redirection** (`safeNextPath`) : il vient de l'URL, donc de n'importe qui, et un `/login?next=https://exemple.test` ferait de l'écran de connexion un tremplin de redirection ouverte.

### Fichiers de convention

Chaque groupe porte ses propres frontières plutôt que de tout remonter à la racine : `(app)/error.tsx` rend **dans** la coquille authentifiée, donc la navigation survit à la panne d'un écran et on peut partir ailleurs sans recharger. Un `error.tsx` racine seul afficherait une page nue à la place de tout.

Pas de `loading.tsx` dans `(auth)` : ces écrans sont des formulaires clients sans donnée serveur à attendre, un squelette n'y produirait qu'un clignotement. Et les erreurs de saisie (mauvais mot de passe, e-mail déjà pris) restent rendues dans le formulaire, au plus près du champ — `(auth)/error.tsx` ne couvre que le plantage de la page.

`unauthorized()` et `forbidden()` demandent `experimental.authInterrupts: true` dans `next.config.ts` ; sans ce drapeau les deux fichiers sont du code mort. Leur usage réel est étroit :

- **`unauthorized.tsx`** ne sert pas au visiteur anonyme — `proxy.ts` l'a déjà redirigé vers `/login?next=…`, ce qui vaut mieux qu'un cul-de-sac à 401. Il sert au cas que le proxy ne peut pas voir : cookie **présent mais expiré ou invalide**, découvert par le premier appel serveur vers l'API.
- **`forbidden.tsx`** sera rarement atteinte. La règle n°8 impose 404 et non 403 pour la ressource d'autrui — un 403 confirmerait son existence. Restent les refus où l'existence n'est pas un secret : rôle, quota, compte suspendu. Aucun n'existe encore.

`global-error.tsx` est la seule page de l'app qui déclare `<html>` et `<body>` : le layout racine est justement ce qui a échoué. Elle réimporte `globals.css` pour la même raison, tourne sans aucun provider — donc sans `next-themes`, donc en thème clair — et l'overlay de développement la masque : pour la voir, il faut `next build && next start`.

## Écrans d'authentification

**Deux colonnes à partir de `lg`** (`(auth)/layout.tsx`) : panneau éditorial à gauche, formulaire à droite. Sous `lg`, le panneau disparaît entièrement et la colonne du formulaire prend l'écran — c'est la même mise en page, pas une variante mobile à maintenir en parallèle.

**35 / 65, pas 50 / 50.** À parts égales, le formulaire fait 384 px au milieu d'une colonne de 720 : 168 px de vide de chaque côté à 1440 px, 448 à 2560. Les deux moitiés cessent alors de se lire comme une composition, ce sont deux îlots. La grille est écrite `lg:grid-cols-[1fr_minmax(30rem,35%)]` — le pourcentage seul donnerait 358 px au seuil `lg`, moins que le formulaire lui-même, qui serait comprimé ; le plancher de 480 px le garde entier et le pourcentage ne reprend la main qu'à partir de ~1370 px.

Le contenu du panneau est **centré** dans sa colonne, pas calé sur la gouttière : aligné à gauche, tout le vide se retrouve du même côté et le texte se lit comme s'il fuyait la couture. Sa largeur suit la colonne (`max-w-lg`, puis `xl:max-w-xl`) et s'arrête à 576 px — au-delà, une ligne devient pénible à lire et la place gagnée doit rester du blanc.

```
┌───────────────────────────────┬────────────────────────────────┐
│                               │  BETTER-LIFT            [thème]│
│   Le carnet,                  │                                │
│   sans le carnet.             │  Se connecter                  │
│   ───                         │  Reprenez là où vous en étiez. │
│                               │                                │
│   · Vos routines, prêtes      │  [ Continuer avec GitHub    ]  │
│   · Les records se calculent  │  [ Continuer avec Google    ]  │
│   · Gratuit, et ça le reste   │  ───────────  ou  ───────────  │
│                               │  … formulaire e-mail …         │
│                               │                                │
│                               │  Gratuit, sans publicité.      │
└───────────────────────────────┴────────────────────────────────┘
  AuthPanel — hidden lg:flex          max-w-sm, centré
  65 %  ·  lg:order-1                 35 %  ·  lg:order-2
```

**Le formulaire est premier dans le DOM**, déplacé à droite par `lg:order-2`. L'ordre visuel change, pas l'ordre de lecture : un lecteur d'écran et la touche Tab suivent le DOM, et faire entendre trois arguments avant d'atteindre le champ e-mail serait un obstacle pour la seule personne qui ne peut pas sauter la colonne du regard.

**Les capitales de la marque viennent de `uppercase`, pas du texte source.** Écrire « BETTER-LIFT » en dur ferait épeler le mot lettre par lettre à certains lecteurs d'écran ; la transformation CSS laisse le nom accessible intact. `tracking-wide` l'accompagne obligatoirement — des capitales au crénage d'un texte en bas de casse se touchent.

**Pas de carte.** Le panneau cadre déjà l'écran ; une bordure autour du formulaire ferait un double encadrement. Le motif « carte centrée sur fond vide » ne vaut que lorsqu'il n'y a rien d'autre à l'écran, ce qui n'est plus le cas. `AuthScreen` ne porte donc que le `<h1>`, l'accroche et le rythme vertical.

**Un seul `<h1>` par page** : celui du formulaire. Le grand texte du panneau est un `<p>` — deux titres de même niveau feraient croire à deux écrans.

**Aucune navigation** dans l'en-tête : à ce stade du parcours, tout lien qui n'est pas l'action en cours est une occasion de partir. Deux exceptions — la marque, parce qu'un logo qui ne ramène nulle part est un piège, et la bascule de thème, seul endroit où elle est atteignable avant d'avoir un compte.

**Pas de témoignage dans le panneau.** Inventer des gens pour meubler une colonne, c'est fabriquer une preuve. Trois promesses que le produit tient réellement, à la place.

**Fournisseurs OAuth au-dessus du formulaire.** La majorité clique un bouton social ; les reléguer dessous oblige tout le monde à parcourir des champs qu'une minorité remplira. L'e-mail reste juste en dessous, sans repli ni bascule — cacher une option pour en pousser une autre est le défaut inverse.

**Champs de 44 px** (`h-11`), contre 36 par défaut. Ces formulaires sont remplis une fois, souvent debout, sur un téléphone : c'est exactement là qu'un champ trop court se rate.

**Bascule d'affichage du mot de passe.** Pas un confort : sans elle on tape à l'aveugle sur un clavier mobile qui corrige tout seul. Le bouton porte `aria-pressed` (c'est un interrupteur) et `tabIndex={-1}` — au clavier on veut aller du mot de passe au bouton d'envoi, pas s'arrêter sur un œil.

**Validation au `blur`, levée à la frappe, muette sur un champ vide.** Signaler « adresse invalide » au deuxième caractère revient à réprimander quelqu'un en train de bien faire ; laisser l'erreur affichée sous un champ qu'on corrige est l'autre moitié du même défaut. Et un champ quitté sans avoir été rempli n'est pas une faute — le premier champ portant l'autofocus, il suffit de cliquer sur la bascule de thème pour déclencher un `blur` sur un champ vide, ce qui reprocherait à quelqu'un qui n'a rien fait de n'avoir rien saisi. D'où `validateIfFilled`, réservé au `blur` : les champs manquants sont rattrapés à l'envoi, où l'intention est explicite. Les formulaires sont en `noValidate` — la bulle native n'est pas stylable, suit la locale du navigateur et n'est pas lue par tous les lecteurs d'écran. Revalidation complète à l'envoi, parce que le `blur` du dernier champ ne se produit pas quand le formulaire part à la touche Entrée.

**Où va l'erreur.** Sous le champ fautif (`FieldError`, `role="alert"`, relié par `aria-describedby`, `aria-invalid` sur l'input) quand un champ est en cause — y compris « un compte existe déjà », qui vise l'e-mail. Dans un bandeau en haut (`FormAlert`) seulement quand aucun champ ne l'est : identifiants refusés, quota, API injoignable. Un message groupé oblige sinon à retrouver soi-même le champ coupable.

**Ce que ces écrans ne disent pas.** « Mot de passe oublié » répond identiquement que l'adresse soit connue ou non — l'API aussi, et l'annoncer ici ferait de ce formulaire un outil d'énumération de comptes. À la connexion, la longueur minimale du mot de passe n'est **pas** validée côté client : l'afficher révélerait la politique de mots de passe et laisserait entendre que le compte existe. C'est `validatePassword(value, "existing" | "new")` qui porte cette distinction, et un test la verrouille.

**Fournisseurs OAuth.** Logos officiels en SVG inline, pas d'icône générique : un bouton « Continuer avec Google » se reconnaît à la forme avant d'être lu. Les boutons sont affichés inconditionnellement, même si l'API n'a pas les identifiants — une erreur explicite se diagnostique mieux qu'un bouton absent, qui passerait pour un bug de rendu.

## Dashboard

C'est l'écran d'accueil de la zone connectée. Il doit répondre en un coup d'œil à : **est-ce que je suis régulier, est-ce que je progresse, qu'est-ce que je fais aujourd'hui ?**

```
┌──────────────────────────────────────────────────────────────┐
│  Bonjour Alex          [Semaine ▾]        [Démarrer séance]  │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ Séances      │ Volume total │ Temps        │ Records         │
│ 4  ▲ +1      │ 22,4 t  ▲ 8% │ 4 h 12  ▬    │ 2  ▲            │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│  Volume par semaine (12 semaines)          [barres]          │
├────────────────────────────────┬─────────────────────────────┤
│  Répartition musculaire (30 j) │  Séances récentes           │
│  [barres horizontales]         │  · Push A — hier — 1 h 12   │
│                                │  · Legs  — mar. — 58 min    │
├────────────────────────────────┼─────────────────────────────┤
│  Régularité (heatmap 12 sem.)  │  Records récents            │
└────────────────────────────────┴─────────────────────────────┘
```

**Cartes KPI.** Chaque valeur est accompagnée de sa variation par rapport à la période précédente — un chiffre isolé n'informe pas. Données issues de `GET /v1/stats/summary` (`previousPeriod` inclus, un seul appel).

**Volume par semaine.** Barres, 12 dernières semaines. C'est le graphique le plus utile pour repérer une déload involontaire ou une dérive.

**Répartition musculaire.** Nombre de séries par partie du corps sur 30 jours, en barres horizontales triées. Un radar est plus joli mais nettement moins lisible pour comparer des valeurs — on privilégie la lecture.

**Régularité.** Heatmap type contributions GitHub sur 12 semaines. Signal comportemental fort, coût d'implémentation faible.

**État vide.** Un nouvel utilisateur voit un dashboard sans données : prévoir explicitement une variante « premiers pas » (créer une routine → démarrer une séance) plutôt que des cartes à zéro. C'est souvent oublié et c'est le tout premier écran que voit un inscrit.

**Chargement.** Server Component pour la coquille, `<Suspense>` par bloc avec squelettes. Les blocs ne se bloquent pas mutuellement.

## Éditeur de routines

L'écran le plus important du web, et celui qui justifie l'existence de l'app web. Cible : construire une routine de 6 exercices en moins de deux minutes.

```
┌───────────────────────────────────────────────────────────────┐
│  ← Routines    [Push A________]   Dossier: [PPL ▾]  [Enreg.] │
├────────────────────────────────────────┬──────────────────────┤
│  ⠿ Développé couché barre       [⋯]    │  Ajouter un exercice │
│    Repos 3:00 · Notes                  │  ┌────────────────┐  │
│    ┌──────┬────────┬──────┬─────┐      │  │ 🔍 recherche   │  │
│    │ Éch. │  40 kg │ 10   │ [×] │      │  └────────────────┘  │
│    │  1   │ 100 kg │  5   │ [×] │      │  [Pecs][Dos][Jamb.]  │
│    │  2   │ 100 kg │  5   │ [×] │      │  ─────────────────   │
│    └──────┴────────┴──────┴─────┘      │  ▸ Développé couché  │
│    + Ajouter une série                 │  ▸ Développé incliné │
│                                        │  ▸ Écarté poulie     │
│  ⠿ Développé militaire          [⋯]    │  ▸ …                 │
│    …                                   │                      │
│                                        │                      │
│  + Ajouter un exercice                 │                      │
└────────────────────────────────────────┴──────────────────────┘
```

### Comportements attendus

- **Glisser-déposer** sur les exercices et sur les séries, via `dnd-kit`. Poignée dédiée (`⠿`) : rendre toute la ligne draggable rend la sélection de texte impossible.
- **Ajout en un clic** depuis le panneau latéral, qui reste ouvert — on ajoute rarement un seul exercice.
- **Duplication de série** : la plupart des séries d'un exercice sont identiques. Un bouton « dupliquer la dernière » économise l'essentiel des saisies.
- **Notes et repos par exercice**, en clair sur la carte plutôt que derrière un menu `⋯` : deux champs qu'on remplit en construisant, pas des actions rares. Restent à faire, quand elles auront un usage : remplacer un exercice, et créer un superset avec le suivant — le modèle porte `supersetGroup` mais l'interface est repoussée en V2 (D8).
- **Brouillon local.** L'état de l'éditeur vit dans un `useReducer` — pas de Zustand : un seul écran le consomme, et le réducteur se teste sans monter un composant. Rien n'est envoyé avant l'enregistrement, qui fait un unique `POST` ou `PUT /v1/routines/:id`.
- **Protection contre la perte.** `beforeunload` si le brouillon est modifié, plus une sauvegarde automatique en `localStorage`, **proposée** au retour et jamais imposée : l'écran ne doit pas se remplir tout seul d'un état que l'utilisateur ne reconnaîtrait pas.
- **Raccourcis clavier** : `⌘S` / `Ctrl+S` enregistre. `⌘K` n'existe pas — le panneau de recherche est toujours ouvert, il n'y a rien à invoquer ni à fermer.
- **Accessibilité.** L'alternative clavier de `dnd-kit` est câblée et annoncée en français : la poignée est un `<button>` focalisable, Espace saisit, les flèches déplacent, Entrée dépose, Échap annule.

**Un piège de `dnd-kit` qui ne se voit pas à la souris.** Un seul `DndContext` couvre les exercices et les séries — imbriquer deux contextes rend le routage des événements dépendant de l'ordre de montage. Les identifiants sont donc préfixés (`ex:` / `set:`), et la détection de collision **filtre les cibles de même nature** avant de déléguer à `closestCenter`. Sans ce filtre, la cible la plus proche du centre d'un exercice est une ligne de série, le déposé est rejeté, et le déplacement ne se produit tout simplement pas — sans erreur. C'est l'essai au clavier qui l'a révélé.

## Autres écrans

### Routines (liste)
Cartes de routine affichant le nom, le nombre d'exercices et la date de dernière exécution. Actions : modifier, dupliquer, supprimer — « démarrer » attend les séances.

Le **regroupement par dossier se fait côté client** : la liste n'est pas paginée et arrive entière, donc un appel par dossier serait du trafic pur. Les dossiers vides restent affichés — c'est le seul endroit d'où on peut les supprimer, et un dossier qu'on vient de créer doit se voir. Les routines sans dossier forment un groupe en fin de liste plutôt que d'être classées d'office quelque part.

Le déplacement d'une routine passe par le sélecteur de dossier de l'éditeur. Le glisser-déposer entre dossiers viendra avec le repliement des dossiers, quand il y aura assez de routines pour que ça compte.

### Historique
Deux vues commutables : liste antéchronologique paginée, et calendrier mensuel avec pastilles. Filtres par routine et par période. L'état vit dans l'URL, comme au catalogue.

**Les jours se découpent dans le fuseau du profil, pas celui du navigateur.** Une séance du mardi 22 h 30 à Paris est stockée en UTC : bucketée dans le fuseau du navigateur, elle sauterait au mercredi pour quelqu'un qui consulte depuis un aéroport. Le calendrier doit montrer les jours tels qu'ils ont été vécus.

Conséquence directe : les bornes envoyées à l'API pour un mois sont **élargies d'un jour de chaque côté**. Elles portent sur `startedAt` en UTC alors que la grille est découpée dans un autre fuseau — à Auckland (UTC+13), une séance du 1er au matin tomberait hors d'une fenêtre stricte et disparaîtrait. Les jours en trop sont écartés au bucketing, qui, lui, connaît le fuseau.

La vue calendrier demande la **page maximale** (100) et non les 20 par défaut : une grille n'a pas de « charger la suite », donc une deuxième page se traduirait par des pastilles manquantes que rien ne signalerait. À cinq séances par semaine, un mois en compte une vingtaine — 20 est exactement la limite qu'on frôle. Au-delà de 100, la grille le dit.

Les périodes de la vue liste sont des préréglages (30 jours, 3 mois, 12 mois, tout) et se calculent en **jours**, pas en mois calendaires : `setUTCMonth` déborde silencieusement — le 31 mars moins un mois donne le 3 mars.

### Détail d'une séance
Résumé (durée, volume, séries, répétitions, records), puis les exercices avec leurs séries. Les séries record portent un trophée, les séries non validées restent affichées mais en retrait — elles ne comptent ni dans le volume ni dans les records.

Le résumé lit les **agrégats dénormalisés** de la séance plutôt que de sommer les séries à l'affichage : ce sont les mêmes chiffres que la carte d'historique, calculés une fois à l'écriture. Les recalculer ici finirait par diverger de l'autre écran.

Les colonnes durée et distance n'apparaissent que si l'exercice s'en sert : toujours affichées, elles donneraient quatre colonnes de tirets sur un développé couché ; jamais affichées, une planche serait entièrement vide et se lirait comme une donnée perdue.

Aucun lien « voir la routine » sur les exercices : une séance est un instantané, la routine a pu changer dix fois depuis, et la comparaison induirait en erreur.

La suppression avertit de sa vraie conséquence — les records de la séance sont **recalculés depuis le reste de l'historique**, et l'un d'eux peut disparaître. **La modification d'une séance passée n'est pas encore faite** : `PUT /v1/workouts/:id` existe côté API, il lui manque l'éditeur.

### Catalogue d'exercices
Grille avec vignettes, recherche instantanée (debounce 250 ms), filtres persistés dans l'URL — un filtre doit être partageable et survivre à un rechargement.

Le catalogue commun et les exercices personnalisés y sont **mêlés**, un sélecteur d'origine (tous / catalogue / les miens) permettant de n'en garder qu'un. La provenance est écrite sur chaque carte : sans elle, un exercice personnalisé et son homonyme du catalogue seraient indiscernables.

**« Les miens » sans résultat n'est pas un échec de recherche** : c'est le seul moment où l'on sait que rien n'a été créé. L'état vide propose alors de créer, il ne conseille pas d'élargir les filtres.

### Exercice personnalisé
Un formulaire unique sert la création et la modification — deux composants finiraient par valider différemment. Il valide avec **le schéma de l'API** (`packages/validators`), jamais avec des règles réécrites : sinon l'utilisateur découvre la vraie contrainte en recevant un 422.

Un exercice du catalogue ouvert en modification est refusé **avant la saisie**, et non à l'enregistrement : le `GET` réussit puisqu'il est visible de tous, un formulaire pré-rempli s'afficherait donc sans problème apparent pour échouer en 403 une fois rempli.

L'archivage demande une confirmation en place, en deux temps, plutôt qu'une `confirm()` : bloquante, non stylable, et supprimée par certains navigateurs dans les iframes.

### Fiche exercice
GIF d'animation, muscles primaires et secondaires, instructions numérotées dans la langue de l'utilisateur, courbe de progression, records, dernières séries réalisées. Mention d'attribution du média obligatoire (voir doc 08).

### Statistiques
Version approfondie du dashboard : sélecteur de période, progression par exercice, comparaison de périodes, records par exercice. V2 pour l'essentiel.

### Réglages
Profil (nom, pseudo, avatar, bio) · Préférences (unités, langue, repos par défaut, visibilité) · Compte (mot de passe, sessions actives, export, suppression).

## Détails d'implémentation

**Server / Client Components.** Server par défaut. Passent en client : l'éditeur de routines, les graphiques, la recherche instantanée, les formulaires. La liste des routines et l'historique se rendent côté serveur avec hydratation TanStack Query pour la pagination.

**Affichage des unités.** Un composant `<Weight value={kg} />` lit la préférence utilisateur et formate. Aucun composant n'appelle une conversion à la main — sinon un écran finira en kg pendant que le voisin est en lb. Son pendant `<Distance>` fait la même chose pour les mètres, et les deux vivent dans `features/account/units.tsx`, seul fichier du web qui convertit une unité. Les en-têtes de colonne passent par `useWeightUnitLabel` / `useDistanceUnitLabel` plutôt qu'un « kg » écrit en dur, qui mentirait pour un profil impérial.

**Formatage localisé.** `Intl.NumberFormat` et `Intl.DateTimeFormat` avec la locale du profil, pas celle du navigateur : un utilisateur qui a choisi le français sur un navigateur anglais s'attend à du français partout.

**Thème.** Clair et sombre, `next-themes` en `attribute="class"` (la classe `.dark` sur `<html>`, ce qu'attend `@custom-variant dark` côté CSS). Le premier chargement suit `prefers-color-scheme` — `defaultTheme="system"`. Le « sombre par défaut » que visait le produit décrit l'identité visuelle, pas un forçage : imposer le sombre à quelqu'un dont le système est clair, ce serait précisément ne pas respecter la préférence. `<html>` porte `suppressHydrationWarning`, requis parce que le script de next-themes pose la classe avant l'hydratation pour éviter le flash — c'est le seul endroit où l'avertissement est légitime.

**Le sélecteur de thème vit dans le menu du compte**, en pied de sidebar (trois choix : système, clair, sombre). Il était initialement prévu dans Réglages › Préférences ; on le règle en regardant l'écran qu'il transforme, pas depuis un formulaire au bout de deux clics. Il sera **aussi** proposé dans Réglages › Préférences avec les unités et la langue, les deux commandes écrivant la même valeur — c'est un doublon assumé, pas un oubli. Les écrans d'authentification gardent leur propre bascule (`ThemeToggle`), seul endroit où elle est atteignable avant d'avoir un compte.

**Graphiques.** Recharts. Toujours accompagnés d'une table de données accessible en lecteur d'écran, ou d'un `aria-label` décrivant la tendance.

**Peut-on remplir une séance sur le web ?** Oui, dès la V1 (D7), en réutilisant l'API. Ce n'est pas le parcours principal mais le coût est faible et ça débloque deux cas réels : la correction d'une séance mal saisie, et l'utilisateur qui note son entraînement depuis un ordinateur.
