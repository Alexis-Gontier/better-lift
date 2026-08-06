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
└── (app)/                          # layout authentifié : sidebar, sans barre haute
    ├── loading.tsx                 # squelette rendu DANS la coquille
    ├── error.tsx
    ├── not-found.tsx               # identifiant mort, navigation conservée
    ├── dashboard/
    ├── routines/
    │   ├── layout.tsx              # deux volets : navigation | contenu
    │   ├── page.tsx                # volet droit vide — la liste est à gauche
    │   ├── new/
    │   └── [id]/
    │       ├── page.tsx            # l'éditeur, directement
    │       └── edit/               # 308 vers ../ — l'aperçu n'existe plus
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

`(app)/layout.tsx` monte `SidebarProvider` → `AppSidebar` + `SidebarInset` (`AppContent` directement, sans barre haute séparée — voir plus bas). Les composants vivent dans `features/navigation/`, la liste des destinations dans `nav-items.ts` et la règle d'état actif — testée — dans `active.ts`.

**`AppContent` porte la mesure de lecture — `max-w-7xl` centrée — sur tous les écrans sauf `/routines`.** C'est la seule exception de mise en page de la zone authentifiée : `/routines` a une colonne de navigation à gauche, et une colonne de navigation doit toucher le bord. Décollée de 192 px sur un écran de 1920, elle ne se lit plus comme la continuation de la barre latérale de l'app mais comme un panneau qui flotte — or c'est exactement ce que produit le centrage du conteneur dès que la fenêtre dépasse la mesure.

Deux solutions ont été écartées. Un **groupe de routes `(contained)`** portant le conteneur aurait été la forme la plus idiomatique, mais il déplace cinq segments pour un layout de trois lignes. Une **marge négative** dans le layout de `/routines` annule le `px-8`, jamais le `mx-auto` : un enfant ne peut pas déborder la largeur maximale de son parent, et le décollement réapparaîtrait au-delà de 1536 px, c'est-à-dire précisément sur les écrans où il se voit.

La largeur est par ailleurs passée de `6xl` à `7xl` (1152 → 1280 px) avec le passage de `/routines` en deux volets. 1280 px reste une mesure de lecture, pas un plein écran.

**Le layout est `async` et lit le cookie `sidebar_state` côté serveur.** La primitive persiste l'état replié dans ce cookie ; sans lecture serveur, le premier rendu montre toujours la colonne dépliée, puis l'hydratation la replie — 16 rem qui sautent à chaque chargement, précisément pour qui a choisi de la replier.

**`SidebarInset` *est* l'élément `<main>`.** Les pages du groupe rendent donc du contenu nu : un `<main>` dans une page produirait un second repère imbriqué, ce qui est du balisage invalide et laisse un lecteur d'écran devant deux « contenus principaux ». De même, `SidebarContent` ne rend qu'un `<div>` — le repère `<nav aria-label="Navigation principale">` est ajouté explicitement, sinon la colonne n'en est plus un.

**L'état actif reste celui de la primitive, et il est ténu.** `bg-sidebar-accent` s'applique à l'entrée active **et** au survol ; seule la graisse du libellé les sépare, si bien que « où je suis » et « ce que je pointe » se ressemblent. Le renforcer demanderait une couleur d'accent, que la palette n'a pas (D25). `aria-current="page"` porte l'information de façon non ambiguë là où elle compte le plus, et le sujet se rouvrira avec la reteinte.

`collapsible="icon"` : replier réduit aux pictogrammes plutôt que de faire disparaître la navigation, et chaque entrée porte un `tooltip` qui redonne son libellé dans cet état. Sous `md`, la primitive bascule seule en tiroir `Sheet`. Les libellés des commandes de repli (`SidebarTrigger`, `SidebarRail`) sont réécrits en français depuis l'app : le registre les livre en anglais et en dur.

**Il n'y a pas de barre haute.** `AppTopbar` a existé, puis a été retirée : elle ne portait que le bouton de repli et le nom de la section courante, et chaque écran affiche déjà son propre titre. Le bouton de repli vit désormais dans l'en-tête de la sidebar elle-même (`AppSidebar`), sous la marque plutôt qu'à côté — la colonne repliée à l'icône ne fait que 3 rem de large, tout juste la place d'un bouton `icon-sm` à la fois.

Ce déplacement crée un problème propre au mobile, et une commande à part le résout. Sous `md`, la sidebar n'est plus repliée aux pictogrammes : elle devient un tiroir `Sheet` entièrement hors écran, fermé par défaut. Le bouton de repli étant maintenant **dans** la sidebar, il est lui-même caché tant que le tiroir est fermé — l'état où on a justement besoin de l'ouvrir. `MobileSidebarTrigger` (`features/navigation/`) est un bouton flottant (`fixed`, pas `sticky` : il n'y a plus de barre haute pour l'ancrer dans le flux), posé en dehors de la sidebar et visible uniquement sous `md` (`md:hidden`, donc absent de l'ordre de tabulation sur desktop, pas seulement masqué). Sur desktop il ne sert à rien, le bouton de l'en-tête suffit.

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

## Langues

`next-intl` en provider client, monté sous `QueryProvider` — la langue vient du **profil**, qu'il lit dans le cache de TanStack Query. Les catalogues vivent dans `apps/web/messages/{fr,en}.json`, le français étant la source dont le type des clés dérive.

Trois sources, dans cet ordre : le **profil**, la **langue du navigateur** (avant la connexion, seul indice disponible), puis le français. La résolution est une fonction pure et testée — c'est elle qui décide ce que voit quelqu'un qui n'a pas encore de compte.

**Le premier rendu est toujours en français**, la langue bascule après le montage : le serveur ne connaît ni le profil ni le navigateur, et résoudre au premier rendu client casserait l'hydratation. Le raisonnement complet, et son coût, sont en [D29](09-decisions.md).

**Un composant qui affiche du texte est client.** Une page serveur ne peut pas traduire, faute de locale dans la requête : le titre et la description d'un écran descendent donc dans un composant client (`sign-in-screen.tsx` pour la connexion), la page ne gardant que ses `metadata` — qui restent en français.

**Migration en cours** : l'écran de connexion et le panneau éditorial des écrans d'authentification sont traduits, ainsi que tous les messages de validation de formulaire. Le reste suit écran par écran.

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
│   · Les records se calculent  │  ───────────  ou  ───────────  │
│   · Gratuit, et ça le reste   │                                │
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

**Fournisseurs OAuth.** Logos officiels en SVG inline, pas d'icône générique : un bouton « Continuer avec GitHub » se reconnaît à la forme avant d'être lu. Les boutons sont affichés inconditionnellement, même si l'API n'a pas les identifiants — une erreur explicite se diagnostique mieux qu'un bouton absent, qui passerait pour un bug de rendu. **GitHub est aujourd'hui le seul fournisseur** (D26), mais la liste reste un tableau : Apple s'y ajoutera avant la première soumission iOS.

## Dashboard

C'est l'écran d'accueil de la zone connectée. Il doit répondre en un coup d'œil à : **est-ce que je suis régulier, est-ce que je progresse, qu'est-ce que je fais aujourd'hui ?**

```
┌──────────────────────────────────────────────────────────────┐
│  Bonjour Alex          [Semaine ▾]        [Démarrer séance]  │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ Séances      │ Volume total │ Temps        │ Records         │
│ 4  ▲ +1      │ 22,4 t  ▲ 8% │ 4 h 12  ▬    │ 2  ▲            │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│  Volume par semaine (12 semaines)     [aire, dégradé]         │
├────────────────────────────────┬─────────────────────────────┤
│  Répartition musculaire (30 j) │  Séances récentes           │
│  [barres horizontales]         │  · Push A — hier — 1 h 12   │
│                                │  · Legs  — mar. — 58 min    │
├────────────────────────────────┼─────────────────────────────┤
│  Régularité (heatmap 12 sem.)  │  Records récents            │
└────────────────────────────────┴─────────────────────────────┘
```

**Cartes KPI.** Chaque valeur est accompagnée de sa variation par rapport à la période précédente — un chiffre isolé n'informe pas. Données issues de `GET /v1/stats/summary` (`previousPeriod` inclus, un seul appel).

Deux garde-fous sur la variation : une période précédente **vide** affiche un tiret et non « +∞ % » (passer de 0 à 12 séances est un début, pas une progression mesurable), et un écart **inférieur à 1 %** est rendu comme stable — sans ce seuil, 0,3 % afficherait une flèche montante pour du bruit de mesure.

La flèche est achromatique, comme le reste. Une baisse de volume n'est de toute façon pas une erreur à signaler en rouge : une semaine de décharge en produit une, et elle est voulue.

**Volume par semaine.** Aire (Recharts `AreaChart`, dégradé vers la transparence), 12 dernières semaines. C'est le graphique le plus utile pour repérer une déload involontaire ou une dérive — la surface sous la courbe rend la tendance plus lisible qu'une suite de barres, sans ajouter d'information que le tracé seul ne porterait pas.

**Répartition musculaire.** Nombre de séries par partie du corps sur 30 jours, en barres horizontales triées. Un radar est plus joli mais nettement moins lisible pour comparer des valeurs — on privilégie la lecture.

Ces barres-là sont en **CSS, pas en Recharts** : un `BarChart` horizontal apporterait un axe, une grille et une infobulle pour rendre ce qu'une largeur en pourcentage dit déjà, et il faudrait de toute façon réécrire les étiquettes à côté. L'échelle est le **maximum** et non le total — rapporter au total écrase toutes les barres dès qu'il y a plus de trois parties du corps.

**Régularité.** Heatmap type contributions GitHub sur 12 semaines, via le `contribution-graph` de Kibo UI (`packages/ui`) plutôt qu'une grille CSS maison. Signal comportemental fort, coût d'implémentation faible. Les couleurs du registre (`fill-muted`, puis quatre paliers d'opacité sur `muted-foreground`) sont déjà achromatiques par défaut — rien à écarter, contrairement au logo de la sidebar. `weekStart={1}` aligne le regroupement du composant sur la convention de l'API, qui sert toujours des semaines commençant un lundi. La grille elle-même est `aria-hidden` — 84 cases (et leurs infobulles à la souris) annoncées une à une seraient inexploitables — et un résumé en une phrase la double juste en dessous. Les libellés de mois du registre sont régénérés depuis la locale du profil plutôt que recopiés à la main, pour rester justes en français comme en anglais.

**Animation des graphiques : `isAnimationActive={false}`, et ce n'est pas un choix esthétique.** Recharts anime en JavaScript — l'attribut `height` d'une barre, le chemin `d` d'une aire — et le bloc `prefers-reduced-motion` de `globals.css` ne l'atteint pas, puisqu'il ne pilote que des animations CSS. Sans cette prop, la préférence serait ignorée précisément sur l'écran qui porte le plus de mouvement.

**État vide.** Un nouvel utilisateur voit un dashboard sans données : prévoir explicitement une variante « premiers pas » (créer une routine → démarrer une séance) plutôt que des cartes à zéro. C'est souvent oublié et c'est le tout premier écran que voit un inscrit.

**Chargement.** Server Component pour la coquille, `<Suspense>` par bloc avec squelettes. Les blocs ne se bloquent pas mutuellement.

## Éditeur de routines

L'écran le plus important du web, et celui qui justifie l'existence de l'app web. Cible : construire une routine de 6 exercices en moins de deux minutes.

```
┌───────────────────────────────────────────────────────────────┐
│  ← Aperçu      [Push A________]   Dossier: [PPL ▾]  [Enreg.] │
├───────────────────────────────────────────────────────────────┤
│  ⠿ 1. Développé couché barre                       [Retirer]  │
│     Repos 3:00 · Notes                                        │
│     ┌──────────┬──────────┬────────┬────────┬───┐             │
│     │ Éch.   ▾ │  40      │  10    │  RPE   │ × │             │
│     │ Normale▾ │ 100      │   5    │  8     │ × │             │
│     └──────────┴──────────┴────────┴────────┴───┘             │
│     + Ajouter une série   · Dupliquer la dernière             │
│                                                               │
│  ⠿ 2. Développé militaire                          [Retirer]  │
│     …                                                         │
│                                                               │
│  [+ Ajouter un exercice]  ← ouvre le dialogue ci-dessous      │
└───────────────────────────────────────────────────────────────┘

        ┌──── Ajouter un exercice ──────────────────── × ┐
        │ Cochez-en autant que nécessaire.               │
        │ ┌────────────────────────────────────────────┐ │
        │ │ 🔍 Rechercher…                             │ │
        │ └────────────────────────────────────────────┘ │
        │ [Pectoraux][Dos][Épaules][Bras][Cuisses][…]    │
        │ ─────────────────────────────────────────────  │
        │ ☑ Développé couché      Pectoraux · Barre      │
        │ ☐ Développé incliné     Pectoraux · Haltères   │
        │ ☑ Écarté poulie         Pectoraux · Poulie     │
        │ ☐ …                                            │
        │            ┌──────────────────────────┐        │
        │            │ 2 exercices │ + Ajouter │× │      │← ActionBar
        │            └──────────────────────────┘        │
        └────────────────────────────────────────────────┘
```

### Comportements attendus

- **Glisser-déposer** sur les exercices et sur les séries, via `dnd-kit`. Poignée dédiée (`⠿`) : rendre toute la ligne draggable rend la sélection de texte impossible. Sur une **carte d'exercice**, la poignée est étirée sur toute sa hauteur (`SortableRow stretch`) — la carte fait plusieurs centaines de pixels, et viser un carré de 28 px à côté de son titre est un geste de précision pour une action qui n'en demande pas. Une ligne de série garde la poignée compacte : elle fait la hauteur d'un champ, l'étirement n'y changerait rien et doublerait visuellement la colonne de gauche.
- **Chaque carte porte la vignette de l'exercice**, et son nom ouvre une **fiche en dialogue** (`ExerciseQuickView`). L'image n'est pas décorative : dans une routine de dix lignes, elle distingue un développé incliné d'un décliné plus vite que le nom, qui ne diffère que par un mot au milieu. Le dialogue répond sur place à « c'est bien celui prise serrée ? » — aller sur `/exercises/:id` obligerait à quitter l'éditeur, donc à traverser l'avertissement de fermeture pour lever un doute de trois secondes. Le lien vers la fiche complète reste en pied, pour l'historique et les records.

  **La requête vit dans un composant enfant du `DialogContent`**, et c'est structurant : Radix démonte le contenu d'un dialogue fermé, donc `useExercise` n'existe qu'à l'ouverture. Placée dans le parent, elle partirait pour chaque carte d'une routine de dix exercices, au chargement de l'écran, pour des instructions que personne n'aura demandées. Le reste de la fiche vient du résumé déjà en main et s'affiche sans attendre le réseau.

  L'attribution du média (D17) est portée par le dialogue et non par la vignette : c'est le seul endroit où le média est vraiment *montré*, et une ligne de copyright sous chaque miniature noierait l'écran sans informer personne.
- **Ajout par lot depuis un dialogue à sélection multiple.** C'est un revirement, et il vaut d'être expliqué : la première version était un panneau latéral de 20 rem toujours ouvert, au motif qu'« on ajoute rarement un seul exercice » et qu'un panneau à rouvrir six fois transformerait la construction d'une routine en six allers-retours. Le raisonnement tenait, la conclusion moins. Ce que la colonne coûtait, c'était 20 rem prélevées en permanence sur l'écran qui en a le plus besoin — et une fois le volet de navigation de `/routines` ajouté, l'éditeur passait à trois colonnes et la grille des séries tombait sous le seuil de lisibilité en dessous de 1536 px. **La sélection multiple règle le problème d'origine sans en payer le prix** : on ouvre une fois, on coche six exercices, on valide. Un aller-retour, et un seul clic d'ajout au lieu de six.
- **Duplication de série** : la plupart des séries d'un exercice sont identiques. Un bouton « dupliquer la dernière » économise l'essentiel des saisies.
- **Notes et repos par exercice**, en clair sur la carte plutôt que derrière un menu `⋯` : deux champs qu'on remplit en construisant, pas des actions rares. Restent à faire, quand elles auront un usage : remplacer un exercice, et créer un superset avec le suivant — le modèle porte `supersetGroup` mais l'interface est repoussée en V2 (D8).
- **Brouillon local.** L'état de l'éditeur vit dans un `useReducer` — pas de Zustand : un seul écran le consomme, et le réducteur se teste sans monter un composant. Rien n'est envoyé avant l'enregistrement, qui fait un unique `POST` ou `PUT /v1/routines/:id`.
- **Protection contre la perte.** `beforeunload` si le brouillon est modifié, plus une sauvegarde automatique en `localStorage`, **proposée** au retour et jamais imposée : l'écran ne doit pas se remplir tout seul d'un état que l'utilisateur ne reconnaîtrait pas.
- **Raccourcis clavier** : `⌘S` / `Ctrl+S` enregistre. `⌘K` n'existe toujours pas, mais la raison a changé : le panneau n'est plus ouvert en permanence, il est devenu un dialogue avec son propre déclencheur en bas de liste. Un raccourci global viendra s'il se révèle nécessaire — il ne l'était pas quand le panneau était là, il reste à démontrer maintenant.
- **La barre de modifications** vient de Dice UI (`ActionBar`). Elle n'existe que tant qu'il y a quelque chose à enregistrer, et c'est tout son intérêt : elle répond à « est-ce que j'ai des changements en cours ? » par sa seule présence, question qu'un bouton permanent laisse ouverte. Il n'y a donc **plus de bouton « Enregistrer » dans l'en-tête** — un bouton sur un écran intouché propose une action sans effet. Elle porte l'enregistrement et l'abandon, se porte sur `document.body` et suit donc le défilement : on modifie une série au bas d'une routine de dix exercices sans avoir à remonter. `⌘S` reste actif.

  Piège : `ActionBarItem` referme la barre après un clic sauf si `onSelect` prévient l'événement. Sans ça, elle disparaîtrait avant la réponse du serveur — y compris quand celle-ci est une erreur.
- **Le dialogue d'exercices a un pied fixe, pas une barre flottante.** Le compte et les deux actions sont toujours à la même place et ne masquent jamais une ligne. Deux colonnes de cartes plutôt qu'une liste : un catalogue de 1 324 entrées se parcourt du regard, et deux colonnes divisent par deux la hauteur à balayer. Les filtres sont repliés dans des menus qui affichent leur nombre d'actifs — étalés en pastilles, les onze parties du corps mangeaient deux lignes avant le premier résultat, et un filtre actif invisible fait conclure que le catalogue est cassé.
- **« Récemment utilisés » vient du `localStorage`, pas de l'API.** Ce serait plus juste de le dériver de l'historique des séances, mais il faudrait un endpoint pour une commodité de saisie. Le cas réel est couvert : on construit ses routines depuis le même ordinateur, sur les mêmes vingt mouvements. Le stockage est volontairement approximatif — perdre la liste ne perd rien, elle se reconstruit à l'usage. On y stocke le résumé entier et non l'identifiant : le résoudre demanderait une requête avant de pouvoir afficher une section qui doit être là instantanément.
- **Les cases sont associées par `htmlFor`, jamais par enveloppement.** `Checkbox` de Radix rend un `<button role="checkbox">` et non un `<input>` : un `<label>` qui l'entoure ne le bascule pas. Un `<button>` étant un élément étiquetable, l'association explicite fonctionne et le libellé redevient la cible cliquable de toute la carte.
- **Accessibilité.** L'alternative clavier de `dnd-kit` est câblée et annoncée en français : la poignée est un `<button>` focalisable, Espace saisit, les flèches déplacent, Entrée dépose, Échap annule.

**Un piège de `dnd-kit` qui ne se voit pas à la souris.** Un seul `DndContext` couvre les exercices et les séries — imbriquer deux contextes rend le routage des événements dépendant de l'ordre de montage. Les identifiants sont donc préfixés (`ex:` / `set:`), et la détection de collision **filtre les cibles de même nature** avant de déléguer à `closestCenter`. Sans ce filtre, la cible la plus proche du centre d'un exercice est une ligne de série, le déposé est rejeté, et le déplacement ne se produit tout simplement pas — sans erreur. C'est l'essai au clavier qui l'a révélé.

## Autres écrans

### Routines — deux volets

**Fait au 2026-08-04.** `/routines` n'est plus une page-liste suivie d'une page-éditeur : le segment porte un `layout.tsx` à deux volets — navigation à gauche, contenu de la route à droite.

```
┌──────────────────────┬─────────────────────────────┬──────────────┐
│ [+ Nouvelle routine] │  ← Aperçu                   │ AJOUTER UN   │
│ [🔍 Filtrer…]        │  Nom [Push A_____________]  │ EXERCICE     │
│                      │  Dossier [PPL ▾]  [Enreg.]  │ [🔍        ] │
│ ⌄ PUSH PULL LEGS (3) │  ┌────────────────────────┐ │ [Pecs][Dos]  │
│   ▸ Push A       ⋯   │  │ ⠿ 1. Développé couché  │ │ ────────     │
│     5 exercices      │  │   Repos · Notes        │ │ ▸ …          │
│   ▸ Pull A           │  │   ⠿ Éch. 37,5 · 10     │ │ ▸ …          │
│   ▸ Legs A           │  │   ⠿  2   72,5 ·  5     │ │              │
│ ⌄ RENFO & MOBILITÉ   │  └────────────────────────┘ │              │
│ ⌄ SANS DOSSIER (1)   │                             │              │
│ + Nouveau dossier    │                             │              │
└──────────────────────┴─────────────────────────────┴──────────────┘
  RoutineRail (17 rem)   volet droit = la route         20 rem
  layout, jamais remonté
```

**La colonne touche le bord, et court sur toute la hauteur.** `AppContent` retire la mesure de lecture sur ce segment, donc le volet vient se coller à la barre latérale de l'application, dont il prolonge la logique — on descend de « Routines » dans la navigation générale vers *quelle* routine dans la navigation locale. Sa hauteur est **fixée** (`h-dvh`, toute la fenêtre — il n'y a pas de barre haute à déduire) et non bornée : avec un simple `max-h`, une colonne plus courte que l'écran s'arrête où son contenu s'arrête, et le filet vertical avec elle — il pend au milieu de la page au lieu de séparer deux volets. La liste défile à l'intérieur.

Le volet droit porte alors sa propre mesure (`max-w-5xl`) : à 1280 px à côté d'une colonne de 17 rem, le bouton d'enregistrement se retrouverait à l'autre bout de l'écran. Il est en `flex flex-col` de bout en bout, ce qui donne une hauteur réelle à ce qu'il contient — sans quoi l'état « aucune routine choisie » se collerait en haut, faute de savoir sur quelle hauteur se centrer.

**Une routine s'ouvre directement en modification.** Il y avait un aperçu en lecture seule et un bouton « Modifier » pour en sortir : deux écrans pour la même chose, l'aperçu montrant exercices, séries et charges cibles que l'éditeur montre à l'identique dans des champs. Personne ne consulte une routine pour le plaisir — on l'ouvre pour ajuster une charge, et le bouton était un péage entre l'intention et le geste. `RoutinePreview` est supprimé, `/routines/:id/edit` redirige en 308 vers `/routines/:id` (la route a circulé, `safeNextPath` la restitue après reconnexion), et l'entrée « Modifier » du menu de la colonne a disparu — le lien de la ligne y mène déjà.

Ce que l'aperçu apportait — regarder sans risquer de changer — est conservé par l'éditeur : rien ne part avant l'enregistrement explicite, et la barre de modifications ne s'affiche qu'une fois quelque chose touché. Ouvrir puis repartir ne modifie rien.

**Le volet gauche vit dans le layout, donc au-dessus des routes qu'il dessert.** Next ne le remonte pas d'une navigation à l'autre : l'état replié des dossiers, la position de défilement et le filtre survivent au passage d'une routine à la suivante, et seul le volet droit est rendu à nouveau. Le même écran construit en page unique aurait à choisir entre remonter la colonne à chaque clic et renoncer aux URL par routine.

**Une routine se rejoint par son URL**, pas par un état de sélection : c'est ce qui garde le bouton Précédent, le partage de lien et l'ouverture dans un nouvel onglet. L'identifiant actif se lit dans `usePathname`, jamais dans un `useState`.

**Le seuil est `xl` (1280 px), et il se calcule.** Il a d'abord été posé à `2xl` : l'éditeur avait alors une seconde colonne — le panneau d'ajout, 20 rem —, et à 1280 px il ne serait resté ~320 px aux cartes, où la grille `type · charge · reps · RPE` devient illisible. Le panneau étant passé en dialogue, l'éditeur n'a plus qu'une colonne et les 20 rem récupérées rendent 1280 px tenable. La dépendance est réelle : rétablir le panneau latéral obligerait à remonter le seuil.

En dessous, on bascule en **maître-détail** : un seul volet visible à la fois, celui que l'URL désigne — la liste sur `/routines`, le contenu partout ailleurs. C'est le même arbre aux deux tailles, seule la visibilité change ; `BackToList` est le retour, et il disparaît dès que les deux volets cohabitent.

Quand elle occupe l'écran entière, la colonne est bornée à `max-w-md` : ce sont des noms de routines, pas un tableau, et étirée à 1080 px la ligne « Push A » laisse un boulevard entre son nom et son menu.

**Un piège de la variante `ghost`, invisible à la relecture.** Elle porte `aria-expanded:bg-muted` — sa convention pour un déclencheur de menu. L'en-tête de dossier est un `CollapsibleTrigger`, donc *déplié* la plupart du temps : sans neutralisation, chaque dossier ouvert prend le fond de la routine active et « où je suis » se perd dans trois bandeaux identiques.

Le **regroupement par dossier se fait côté client** : la liste n'est pas paginée et arrive entière, donc un appel par dossier serait du trafic pur. Les dossiers vides restent affichés hors filtre — c'est le seul endroit d'où on peut les supprimer, et un dossier qu'on vient de créer doit se voir. Les routines sans dossier forment un groupe en fin de liste plutôt que d'être classées d'office quelque part. Pendant une recherche, en revanche, un groupe sans résultat est du bruit et disparaît.

**Le filtre est local, pas dans l'URL**, contrairement au catalogue : ici l'adresse désigne déjà ce qu'on édite, et y ajouter un filtre ferait deux sujets dans une même URL.

**Chaque routine est une carte, et la poignée en est le flanc gauche.** Elle n'est pas posée à côté de la carte mais fait partie du cadre, séparée par un filet et étirée sur toute sa hauteur — saisissable partout sur son bord, sans avoir l'air d'un bouton perdu dans la marge. La carte porte le nom, puis `N exercices · N séries`.

**Pas de bouton « Démarrer » dans la colonne.** Démarrer une séance est le geste du mobile (doc 06) ; le web est l'atelier. Un bouton d'action primaire répété sur chaque ligne concurrencerait la seule chose qu'on vient y faire — choisir quoi modifier.

**La poignée réordonne *et* range.** Un `SortableContext` par groupe et un seul `DndContext` pour la colonne — deux contextes imbriqués rendent le routage des événements dépendant de l'ordre de montage, piège déjà payé dans l'éditeur. Chaque groupe est en plus une **zone de dépose** (`useDroppable`) : sans elle, un dossier vide n'aurait aucune cible à survoler, or un dossier qu'on vient de créer est précisément vide et c'est le moment où on veut le remplir. La détection de collision est `closestCorners` et non `closestCenter` : le centre d'un dossier vide est loin de tout et ne gagne jamais contre la routine la plus proche.

Un glissement fait donc deux choses qu'il faut distinguer. Dans le même dossier : un seul appel, l'ordre complet. Vers un autre dossier : un `PATCH` sur la routine, **puis** l'ordre complet — l'inverse rangerait les positions d'une routine encore rattachée à son ancien dossier, et le second appel les réécrirait. Deux requêtes parce que le contrat les sépare : `reorder` ne connaît que des positions, le dossier est une métadonnée (doc 04).

Le sélecteur de dossier de l'éditeur reste : il sert quand on est déjà dans la routine, et il ne demande pas de viser.

**Le serveur reçoit l'ordre complet, tous dossiers confondus.** `position` est globale en base, pas relative au dossier : n'envoyer que les identifiants d'un groupe leur donnerait les positions 0..n, en collision avec celles des autres, et l'ordre entre groupes deviendrait indéterminé. On aplatit donc les groupes dans leur ordre d'affichage et on réécrit tout — ce que `reorderSchema` attend de toute façon, la liste complète et jamais un déplacement relatif.

**Les dossiers se créent, se renomment et se suppriment en dialogue** (`folder-dialogs.tsx`), contrairement au reste de l'app qui confirme en place. Le geste est rare et la colonne est étroite : un formulaire dépliant y pousse toute la liste vers le bas, et on perd de vue ce qu'on faisait pour saisir un nom. La suppression passe par `AlertDialog` — elle touche ce que le dossier contient, ce qui demande une phrase et non un bouton rouge de plus dans une ligne de 240 px. Un même formulaire sert la création et le renommage : les séparer aurait garanti qu'un jour l'un accepte un nom vide que l'autre refuse.

Le volet est `sticky top-0 h-dvh` : sans barre haute, rien ne se cale plus au-dessus de lui — il touche directement le haut de la fenêtre et en prend toute la hauteur.

`setCount` a été ajouté à `RoutineSummary` pour cette carte : le nombre d'exercices seul ne dit rien du volume — trois exercices à cinq séries et trois à deux séries donnent la même ligne. Le total se compte en deux temps côté service, `_count` ne sachant pas traverser deux niveaux de relation : un compteur par exercice, sommé à la lecture. La liste n'est pas paginée mais elle est bornée par l'effort de son auteur.

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

La suppression avertit de sa vraie conséquence — les records de la séance sont **recalculés depuis le reste de l'historique**, et l'un d'eux peut disparaître.

### Modifier une séance passée

**Fait au 2026-08-03** (D10). `/workouts/:id/edit` reprend les partis pris de l'éditeur de routines : brouillon local, valeurs en texte jusqu'à l'envoi, un unique `PUT` qui remplace la structure entière. Le même dialogue d'ajout d'exercice sert les deux écrans — il vit dans `features/exercises`, choisir un exercice étant la même question des deux côtés.

Quatre écarts, tous délibérés :

- **La coche « Fait » est l'information centrale.** Une série décochée reste affichée : elle dit ce qui était prévu et n'a pas été fait, et ne compte ni dans le volume ni dans les records. La décocher est la correction la plus courante — la série notée par erreur — et elle ne doit pas obliger à supprimer la ligne.
- **Deux boutons Monter / Descendre, pas de glisser-déposer.** Corriger une séance, c'est réparer des valeurs, très rarement rejouer l'ordre. Le glissement demanderait toute la machinerie de l'éditeur de routines pour un geste qu'on fait une fois par an, quand deux boutons sont accessibles au clavier par construction.
- **Zéro série est permis**, contrairement à une routine : un exercice commencé puis abandonné existe vraiment, et le contrat des séances l'accepte.
- **Pas de brouillon en `localStorage`.** Une routine se construit en plusieurs fois ; une correction se fait d'un trait, et restaurer une correction vieille de trois jours sur une séance modifiée depuis serait plus dangereux qu'utile.

**Les charges se saisissent en kg**, quelle que soit l'unité du profil, et l'écran le dit aux profils impériaux. Écrire « lb » sur la colonne mentirait sur ce qu'on édite, et convertir à l'aller comme au retour ferait dériver la charge par arrondis successifs à chaque enregistrement.

**Piège payé une fois, invisible à la lecture : `useUpdateWorkout` doit recevoir la locale.** Elle fait partie de la clé de cache de la séance. Sans elle, la mutation écrit sa réponse sous `["workout", id, null]` pendant que le détail lit `["workout", id, "fr"]` — l'écran d'arrivée affiche alors les **anciens chiffres** après un enregistrement pourtant réussi.

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

**Fait au 2026-08-03**, sauf la courbe de progression, qui reste en V2. Les records et l'historique viennent de deux requêtes **à part** de la fiche (`/v1/exercises/:id/{records,history}`) : ils dépendent des séances et non du catalogue, leurs caches n'ont donc ni la même durée de vie ni les mêmes invalidations, et ils montent après la fiche plutôt que de la retarder. L'historique s'empile page par page — la pagination est par curseur, il n'existe pas de « page 4 ».

La valeur d'un record passe par `<RecordValue>`, partagé avec le tableau de bord : seules les charges se convertissent en lb, pas des répétitions ni des secondes, et deux copies de ce `switch` finiraient par diverger sans que rien ne le signale sur un profil métrique.

### Statistiques
Version approfondie du dashboard : sélecteur de période, progression par exercice, comparaison de périodes, records par exercice. V2 pour l'essentiel.

### Réglages
Profil (nom, pseudo, avatar, bio) · Préférences (unités, langue, fuseau, repos par défaut, visibilité, thème) · Compte (adresse e-mail, mot de passe, export JSON, suppression du compte).

**Enregistrement explicite, jamais à la volée.** Le bouton reste désactivé tant que rien n'a bougé, ce qui répond à « est-ce que j'ai enregistré ? » sans avoir à poser la question. Trois des préférences transforment l'interface entière : les appliquer sans qu'on l'ait demandé serait déroutant. Le thème fait exception — il vit hors du profil, dans le navigateur, et s'applique immédiatement.

**Seuls les champs modifiés partent** dans le `PATCH`. Ce n'est pas une optimisation : envoyer tout le profil écraserait un champ changé entre-temps depuis le mobile par une valeur lue avant sa modification. `username` et `bio` deviennent `null` quand on les vide, l'API distinguant « absent » (ne pas toucher) de `null` (effacer).

**Le 409 sur pseudo pris s'affiche sous le champ**, pas en bandeau : l'erreur porte sur une entrée précise, la montrer ailleurs obligerait à deviner laquelle. Le message vient du `details` de l'API.

**Le fuseau ne se choisit pas dans une liste.** Les ~400 fuseaux IANA demanderaient une recherche, donc deux primitives de plus pour un champ qu'on règle une fois. L'écran affiche le fuseau courant et propose celui de l'appareil quand ils diffèrent — le cas réel est « mon fuseau est faux parce que je me suis inscrit en voyage ».

**L'export vient avant la suppression** dans l'onglet Compte, et ce n'est pas un détail de mise en page : on ne récupère pas ses données après coup. Le fichier est construit à la demande et téléchargé depuis la page (D27) ; l'écran nomme ce qu'il contient **et** ce qu'il ne contient pas, sans quoi l'absence du catalogue commun passerait pour un export incomplet.

**La suppression se confirme par ce que le compte possède.** Avec un mot de passe, c'est lui. Sans — compte GitHub seul (D26) —, l'API se contente de la fraîcheur de la session, et l'écran demande alors d'écrire `SUPPRIMER` : ce n'est pas de la sécurité, c'est du temps de réflexion, ce qui manque précisément à un clic de trop. L'écran sait lequel des deux demander en lisant `listAccounts` de Better Auth, seule source qui connaisse les moyens de connexion — `GET /v1/me` décrit le profil, pas l'authentification. Si cette lecture échoue, l'écran demande le mot de passe : le trop-demander est rattrapable, le pas-assez conduit à un envoi refusé sans que rien ne l'ait annoncé.

Une fois le compte supprimé, la sortie est un **rechargement complet** vers `/login?deleted=1`, jamais une navigation cliente : la session n'existe plus, et le shell resté monté repartirait aussitôt en 401. Le bandeau qui accueille là-bas n'est pas décoratif — sans lui, la suppression se solde par une redirection muette, indistinguable d'une session expirée.

**Ce qui manque encore au Compte** : la modification de l'adresse e-mail (elle demande de vérifier la nouvelle avant de basculer, sans quoi une faute de frappe enferme dehors) et la liste des sessions actives.

## Détails d'implémentation

**Server / Client Components.** Server par défaut. Passent en client : l'éditeur de routines, les graphiques, la recherche instantanée, les formulaires. La liste des routines et l'historique se rendent côté serveur avec hydratation TanStack Query pour la pagination.

**Affichage des unités.** Un composant `<Weight value={kg} />` lit la préférence utilisateur et formate. Aucun composant n'appelle une conversion à la main — sinon un écran finira en kg pendant que le voisin est en lb. Son pendant `<Distance>` fait la même chose pour les mètres, et les deux vivent dans `features/account/units.tsx`. Les en-têtes de colonne passent par `useWeightUnitLabel` / `useDistanceUnitLabel` plutôt qu'un « kg » écrit en dur, qui mentirait pour un profil impérial.

**Une seule exception, et elle est nommée** : `formatVolume` (`features/dashboard/format.ts`), pour les volumes cumulés. `<Weight>` rend une charge telle quelle ; un total hebdomadaire y donnerait un nombre à six chiffres que personne ne lit, d'où la bascule en tonnes — et en **tonnes courtes** (2 000 lb, notées « t (US) ») pour un profil impérial, parce qu'écrire « t » des deux côtés ferait passer 1 000 kg pour 907 kg. La conversion passe par `toDisplayWeight` de `packages/core`, comme `<Weight>`. Le défaut existait dans la première version du tableau de bord, où le volume restait en kilogrammes quel que soit le profil : c'est l'écran de préférences qui l'a rendu visible.

**Formatage localisé.** `Intl.NumberFormat` et `Intl.DateTimeFormat` avec la locale du profil, pas celle du navigateur : un utilisateur qui a choisi le français sur un navigateur anglais s'attend à du français partout.

**Thème.** Clair et sombre, `next-themes` en `attribute="class"` (la classe `.dark` sur `<html>`, ce qu'attend `@custom-variant dark` côté CSS). Le premier chargement suit `prefers-color-scheme` — `defaultTheme="system"`. Le « sombre par défaut » que visait le produit décrit l'identité visuelle, pas un forçage : imposer le sombre à quelqu'un dont le système est clair, ce serait précisément ne pas respecter la préférence. `<html>` porte `suppressHydrationWarning`, requis parce que le script de next-themes pose la classe avant l'hydratation pour éviter le flash — c'est le seul endroit où l'avertissement est légitime.

**Le sélecteur de thème vit dans le menu du compte**, en pied de sidebar (trois choix : système, clair, sombre). Depuis le 2026-08-04, c'est un **sélecteur segmenté** repris de Kibo UI (`packages/ui/src/components/theme-switcher.tsx`) et non plus trois `DropdownMenuRadioItem` : une ligne au lieu de trois pour un réglage qu'on change une fois par an, et le thème courant se lit à la position de la pastille sans rien parcourir.

Trois écarts au composant du registre, tous marqués `ÉCART ASSUMÉ` dans le fichier :

- **Transition CSS au lieu de `motion`.** Le registre anime la pastille avec `motion/react`. C'est ~34 ko sur toutes les pages pour un trajet entre trois positions fixes qu'un `translate-x` couvre — et surtout une animation JavaScript **échappe au bloc `prefers-reduced-motion` de `globals.css`**, qui ne pilote que du CSS. Exactement le piège déjà payé avec Recharts.
- **`useState` au lieu de `useControllableState`.** Une dépendance de moins pour un composant toujours piloté par `next-themes` ici.
- **Sémantique de groupe radio et focus glissant aux flèches.** Le registre rend trois `<button>` sans relation : un lecteur d'écran ne peut pas dire lequel est actif. Ce n'est pas qu'un point de conformité — le composant vit dans un `DropdownMenu` Radix, **qui ferme le menu sur `Tab`**. Sans navigation aux flèches, les deux dernières options y seraient inatteignables au clavier. D'où `role="radiogroup"`, `aria-checked`, un seul bouton dans l'ordre de tabulation, et un `stopPropagation` sur les flèches pour que le menu ne déplace pas *aussi* son propre focus.

Il n'est pas rendu comme un `DropdownMenuItem` : un item se sélectionne et referme le menu, alors qu'on veut voir l'écran changer derrière. Il était initialement prévu dans Réglages › Préférences ; on le règle en regardant l'écran qu'il transforme, pas depuis un formulaire au bout de deux clics. Il est **aussi** proposé dans Réglages › Préférences avec les unités et la langue, les deux commandes écrivant la même valeur — c'est un doublon assumé, pas un oubli. Les écrans d'authentification gardent leur propre bascule (`ThemeToggle`), seul endroit où elle est atteignable avant d'avoir un compte.

**Graphiques.** Recharts. Toujours accompagnés d'une table de données accessible en lecteur d'écran, ou d'un `aria-label` décrivant la tendance.

**Notifications éphémères.** `sonner`, monté une fois dans `providers/toast-provider.tsx`. Un toast annonce qu'une action **a eu lieu quand l'écran ne le montre pas de lui-même** : dupliquer une routine, créer ou renommer un dossier, archiver un exercice, enregistrer une séance dont les records ont été recalculés côté serveur. Ces gestes étaient muets jusqu'au 2026-08-04 — le seul signal était une liste qui changeait, et il fallait déjà savoir où regarder.

Il ne remplace **ni** l'erreur de formulaire, qui reste sous son champ, **ni** l'état d'une requête en cours, qui reste sur le bouton (`Spinner` + `disabled` + `aria-busy`) : un toast est un compte rendu, pas un indicateur de progression.

Deux règles pour décider s'il en faut un. **Pas de toast quand le résultat est là où on vient d'agir** : réordonner une routine ne dit rien, on voit la ligne bouger sous le curseur. **Un toast quand le résultat est ailleurs, ou invisible** : ranger une routine dans un autre dossier peut la sortir de la vue, et le recalcul des records d'une séance corrigée ne se voit nulle part.

`richColors` est écarté : la palette est achromatique et `destructive` est la seule couleur de l'interface (D25). Un vert de succès y ferait entrer une teinte que rien d'autre ne porte et affaiblirait le rouge. Position en bas à droite — en haut, sans barre haute, un toast recouvrirait directement le contenu, c'est-à-dire ce qu'on regardait ; à gauche, il tomberait sur la sidebar.

**Les raccourcis s'affichent là où ils agissent.** `⌘S` existait depuis le début de l'éditeur de routines sans que rien ne le dise ; il est désormais écrit dans la barre de modifications, avec la primitive `kbd`. Un raccourci qu'il faut deviner n'est pas un raccourci.

**Peut-on remplir une séance sur le web ?** Oui, dès la V1 (D7), en réutilisant l'API. Ce n'est pas le parcours principal mais le coût est faible et ça débloque deux cas réels : la correction d'une séance mal saisie, et l'utilisateur qui note son entraînement depuis un ordinateur.
