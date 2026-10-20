# Registre des décisions

L'état présent, une ligne par décision. Le code cite ces numéros en commentaire (« D57 ») : chacun
y renvoie ici. Une décision est un choix du moment, pas un dogme : si elle gêne, on en écrit une
nouvelle qui la révise, et on met cette page à jour dans la même PR.

Seules figurent les décisions **en vigueur**, et celles **retirées que le code cite encore**
(marquées *retirée*, avec ce qui les remplace). Les autres ont quitté ce registre le 19 octobre
2026 ; leur texte complet reste dans l'historique git (`git show 7375aff:docs/superpowers/specs/`).

Les décisions D179 à D220 vivent sur des branches non fusionnées (`feat/mobile-mvp-pages`,
`feat/web-refonte`) et n'ont jamais atteint `main`.

## Produit et architecture

- **D1** — Base Neon en UE (Francfort) : le Royaume-Uni n'a qu'une adéquation révocable.
- **D2** — Node 24, pas de Cloudflare Workers.
- **D3** — Web et mobile passent par l'API ; jamais d'accès direct à la base depuis un client.
- **D12** — Contrat par Hono RPC, pas d'OpenAPI. Zod dans `shared` est la source unique.
- **D14** — Français seulement, aucune machinerie d'internationalisation.
- **D17** — Web en SPA Vite, sans rendu serveur.
- **D18** — Un seul projet Vercel : SPA et API sur la même origine, donc aucun CORS en production.
- **D22** — Inscription fermée par une liste blanche d'adresses (`SIGNUP_ALLOWLIST`).
- **D25** — L'interface passe avant la logique : on dessine et valide un écran, avec ses quatre
  états (vide, chargement, erreur, nominal), avant de le brancher.
- **D178** — *Révisée par D316.* Le mobile se resserre sur la salle : barre **Routines · Démarrer · Profil**.
  Retirés : Accueil, Progrès, détail d'une séance. L'historique se consulte sur le web. `/`
  redirige vers `/routines`.
- **D316** — *Révisée par D319 (barre d'onglets) et D321 (page d'une routine).* Le mobile repart de zéro en wireframe, en trois lots, comme le web avant lui ; la
  direction artistique viendra une fois l'app construite. Lot 1 : un seul accueil, sans onglets
  (« Séance vide », routines qui se lancent d'un appui, Profil en en-tête, bandeau
  « Reprendre ») ; retirés : l'édition des routines (le web prépare), la page d'une routine et sa
  carte du corps, la fiche d'un exercice, la feuille Démarrer, le logo et l'accroche, Barlow.
  React Native Reusables sur Uniwind, tokens `neutral` dans `global.css`, police système.
  L'ancien thème (`lib/theme.ts`, `lib/palette.ts`) reste, passé au gris, pour la séance, la fin
  et le Profil jusqu'aux lots 2 et 3.
- **D317** — Lot 2 de D316, la séance en wireframe : saisie au **clavier du système** (une case
  vide montre la cible en indication, la valeur s'écrit à la sortie du champ, une saisie
  invalide n'est jamais écrite) ; le pavé maison part. Le repos tient dans **un bandeau** en bas
  (−15 s / +15 s, Passer), comme Hevy ; l'horloge plein écran part. Les supersets restent, leur
  repère réduit à un filet gris. Toute écriture de l'écran part de la séance du moment
  (`changer`), pour que la fin d'une saisie et la coche qui ferme le clavier ne s'écrasent pas.
- **D318** — Lot 3 de D316, qui clôt le chantier. Fin de séance : bilan (durée, séries,
  volume), records battus dans un contour, note, séries non validées, hors ligne ; l'écart avec
  la dernière séance et le message de régularité partent. Profil au minimum : thème, repos par
  défaut, vibrations, file d'envoi si une séance attend, déconnexion ; le bilan, l'objectif et
  l'export restent au web (`expo-file-system`, `expo-sharing` retirés). L'ancien thème
  (`lib/theme.ts`, `lib/palette.ts` et son test) est supprimé : tout le mobile passe par
  Reusables et les tokens de `global.css`.
- **D319** — Révise D316 : le mobile retrouve une barre d'onglets, **Routines · Historique ·
  Profil**, libellés toujours visibles (icônes Lucide `Dumbbell`, `History`, `User`). L'onglet
  actif se marque par la forme : pilule `bg-secondary` derrière l'icône, libellé en gras.
  `Tabs` d'Expo Router avec une barre à nous (`components/barre-onglets.tsx`), pas `NativeTabs`
  (ni Lucide, ni accessoire au-dessus de la barre sous Android). Le bandeau « Reprendre » se
  pose au-dessus de la barre, sur les trois onglets ; « Séance vide » reste en tête de Routines.
  L'onglet Historique n'a qu'un état vide pour l'instant ; son contenu viendra.
- **D326** — Révise D316 et D322 (« les écrans restent sans logo ») pour la seule connexion du
  mobile : le logo « La charge » (tuile de l'icône, 72) et le nom, centrés dans le haut que le
  formulaire laisse libre. `components/logo.tsx` le dessine en `react-native-svg` aux couleurs
  du thème (`primary` / `primary-foreground`), donc inversé en sombre comme le favicon (D323).
- **D320** — *Révisée par D321 (la carte a deux actions).* Révise D298 : l'onglet Routines du mobile range les routines **par dossier**, comme
  le web (D257) — têtes repliables (chevron, nom, nombre ; tout déplié à l'ouverture, l'état
  replié n'est pas gardé), « Sans dossier » en dernier, aucune tête quand le compte n'a pas de
  dossier. Une carte par routine : nom, « 5 exercices · muscles », « ~30 min », « Il y a 17 j ».
  L'appui lance toujours la séance, sans chevron (D316). Les dossiers se gèrent sur le web.
  `parDossier`, `musclesRoutine`, `dureeRoutine`, `joursEcoules`, `ilYa` vivent dans
  `shared/liste-routines.ts`, lus par les deux surfaces.
- **D321** — Révise D316 (page d'une routine retirée) et D320 (toute la carte lance) : comme
  Hevy, la carte d'une routine a deux actions — le segment de droite « Lancer », en aplat
  `primary` sur toute la hauteur, lance la séance ; le reste ouvre la page de la routine
  (`app/routine/[id].tsx`), en lecture seule : résumé, « Lancer », note, exercices repliés
  comme dans l'éditeur du web (D253 ; ouverts : séries et repos ; nom sur une ligne, vignette
  carrée), et la **carte des muscles** face et dos comme opengym (`react-native-body-highlighter`,
  `shared/muscles.ts` : principaux à l'encre, secondaires en gris, légende). Ni modification ni lien vers
  le web. Le résumé des séries (`resumeSeries`) vit dans `shared`, lu par le web et le mobile.
- **D322** — Icône de l'app mobile : « La charge » (trois disques qui grandissent sur une barre
  courte, vue de profil), **en diagonale montante à 45°**, blanc sur `#171717` (le `primary` clair
  du MVP, sans couleur de marque tant que la DA attend). Sources dans `apps/mobile/assets`
  (`icon`, `adaptive`, `monochrome`, `splash`, `logo.svg`). Les écrans restent sans logo (D229, D316).
- **D324** — Complète D318 : la fin de séance s'intitule « Fin de séance » (rien n'est encore
  enregistré) et liste, sous les records, chaque exercice avec sa meilleure série
  (`meilleureSerieComptee`) et ses séries faites ; un exercice sans série s'écrit en retrait,
  « Aucune série », pour se voir avant d'enregistrer.
- **D224** — Le web sert à analyser et préparer ; pas de séance en direct sur le web.
- **D292** — Le web vit sous `/app` (Vite `base`, routeur `basepath`) ; la racine est laissée à
  une future landing et redirige (307) vers `/app` en attendant. `/api` ne bouge pas.

## Données et API

- **D4** — 1RM estimé par Epley, `poids × (1 + reps / 30)`, arrondi au dixième ; 1 rep vaut la
  charge, 0 rep vaut 0.
- **D5** — Le poids de corps est exclu du volume ; un échauffement aussi.
- **D11** — *Révisée par D145* : les supersets sont dans l'interface.
- **D13** — Records dérivés à la lecture, aucune table (voir D63–D65).
- **D15** — Pas de vérification d'adresse e-mail (la liste blanche la rend inutile) ; donc aucun
  envoi d'e-mail, ni mot de passe oublié.
- **D20** — Catalogue aplati, sans table de traductions.
- **D47** — Cibles série par série : type, reps et charge, tous facultatifs.
- **D50** — `PUT /routines/:id` remplace toute la routine (exercices, séries) dans une transaction.
- **D51** — Suppression réelle d'une routine, sans `deletedAt` : une séance ne dépend pas d'elle.
- **D52** — Charge stockée en kg ; tout affichage et toute saisie passent par `formaterCharge` /
  `lireCharge` de `shared`, le système d'unités fixé en un seul endroit par surface.
- **D53** — Toute route de données personnelles exige une session (`exigerSession`) ; la donnée
  d'autrui répond 404, jamais 403.
- **D56** — L'identifiant d'une séance est généré par le client ; `POST /seances` est idempotent.
- **D57** — Le corps de `POST /seances` n'est pas strict et accepte un exercice archivé : perdre
  un entraînement réel est pire qu'un champ ignoré.
- **D58** — Aucun total stocké sur une séance : volume, séries et durée se dérivent.
- **D90** — Note libre par exercice de séance (`SeanceExercice.note`, 500 caractères).
- **D110** — *Accueil retiré (D178)*. Restent dans `shared/accueil.ts` : `routineASuivre` (la
  routine qui suit la dernière faite, dans l'ordre de la liste — sert à Démarrer et à Routines)
  et `resumeSemaine` (fin de séance). Le résumé d'une séance porte `nbRecords`.
- **D112** — *Écran Stats retiré, puis `GET /stats/bilan` (D328).*
- **D119** — *Fil de l'Accueil retiré (D178)*. Restent `meilleureSerie` / `meilleureSerieComptee`
  (`shared/apercu.ts`) et `versFil` côté API, qui alimente `GET /seances`.
- **D129** — Objectif hebdomadaire et repos par défaut sont **sur le compte** (table
  `Preferences`, `GET` / `PUT /preferences`) ; thème et vibrations restent sur l'appareil.
- **D293** — Seuls dossiers et notes de routine ont gagné une API pour le web ; note et cible
  d'exercice, correction de séance, import Hevy, préférences étendues n'en ont pas.
- **D295** — Les routes sans écran partent avec leur service et leurs tests (`/stats`,
  `/stats/periode`, `/stats/exercices` retirées). Chaque `c.json` porte un code explicite, et
  chaque code a son test.
- **D328** — Suite de D295 : `GET /stats/bilan` part, sans client depuis le Profil minimal
  (D318), avec `services/stats.ts`, son test, le type `Bilan` et `shared/stats.ts`
  (`semainesRecentes`, sans appelant). La clé `["stats"]` quitte le cache hors ligne du mobile.
- **D296** — Un dossier est une table (`Dossier` : nom unique par compte, `position`) ;
  `Routine.dossierId` nullable en `SetNull`, `Routine.note` (1000 caractères).
- **D297** — `GET /routines` rend `{ routines, dossiers }` ; `POST`, `PATCH`, `DELETE
  /dossiers/:id`, `PUT /dossiers/ordre`, `PATCH /routines/:id` (`dossierId`). Nom pris : 409.
- **D298** — *Révisée par D320 (le mobile affiche les dossiers).* Le mobile renvoie tels quels `note` et `dossierId`, qu'il n'affiche pas : un `PUT`
  ne doit rien effacer.
- **D310** — `RoutineResume` porte `derniereSeance`, `dossierId`, `exercices` (nom, muscle) et
  `dureeEstimeeSec`.
- **D311** — `GET /seances?routine=<id>` ; les stats d'une routine se calculent côté web sur ces
  résumés.
- **D312** — `GET /exercices/faits` (avant `/:slug`) : par exercice fait, sa ligne du catalogue,
  `derniereFois`, `meilleur1Rm`, le plus récent d'abord.

## Authentification

- **D30** — La liste blanche mord sur `databaseHooks.user.create.before` : valable pour tout
  chemin de création, présent ou futur. Le garde par route ne sert qu'au message lisible.
- **D31** — E-mail et mot de passe seulement. Pas de connexion GitHub ni d'autre fournisseur
  (tranché le 19 octobre 2026).
- **D35** — `estAutorisee` est une fonction pure de `shared`, testée.
- **D100** — Mobile : la garde ne renvoie à la connexion que sur une absence de session
  confirmée, jamais sur une erreur de lecture (hors ligne en salle).
- **D301** — Web : la session est lue avant le premier rendu et posée dans le contexte du
  routeur ; `_app` garde en `beforeLoad` (vers `/login?redirect=`), `_auth` renvoie un connecté
  vers l'Accueil. API injoignable = pas de session, jamais une page blanche.

## Catalogue

- **D39** — Colonne `nomRecherche` normalisée, remplie au semis.
- **D40** — `normaliserRecherche` vit dans `shared` et sert à l'écriture comme à la lecture.
- **D41** — `bodyPart` reste une enum anglaise ; le libellé français vient de `shared`.
- **D42** — Le client d'API vit dans `packages/api-client`.
- **D44** — Le nom anglais (`name`) reste, le français (`nomFr`) s'ajoute ; on affiche le
  français, on cherche sur les deux.
- **D45** — `noms-fr.json` est une donnée écrite (id → nom), relue en diff ; un test vérifie que
  chaque id a son nom.
- **D46** — Les animations sont affichées depuis le dépôt du dataset, figé sur un commit, avec
  « © Gym visual » ; aucun média dans le dépôt.
- **D97** — Mobile : le catalogue complet descend une fois et se filtre sur le téléphone
  (`filtrerCatalogue` de `shared`).
- **D286** — Pas d'exercice personnel : le catalogue suffit, `Exercise` n'a pas de propriétaire.

## Records

- **D63** — Records à la Hevy : charge max, 1RM estimé (12 reps au plus), meilleur volume d'une
  série ; au poids du corps, reps max. Séries faites, hors échauffement.
- **D64** — Un badge marque le record battu **à ce moment-là**, pas le record actuel.
- **D65** — Tout est dérivé à la lecture (`shared/records.ts`).
- **D66** — Mobile : fuseau `Europe/Paris` fixé en un seul endroit (`lib/fuseau.ts`) ; le web
  prend celui du navigateur (D313). Jamais l'UTC pour découper un jour.
- **D67** — « La dernière fois » est copiée dans le brouillon au démarrage : disponible hors
  ligne. Elle s'aligne position par position sur toutes les séries précédentes.

## Séance (mobile et `shared`)

- **D10** — File d'envoi : une séance en attente quitte l'écran ; une séance refusée y reste,
  avec son message.
- **D55** — Le brouillon vit en AsyncStorage sous une clé unique (Expo Go, pas de MMKV), et
  transite par le disque, jamais par un paramètre de route.
- **D59** — Les cases sont pré-remplies par les cibles de la routine.
- **D61** — La logique de séance vit dans `shared`, pure et testée ; le mobile garde le disque
  et les écrans.
- **D79** — Écran maintenu allumé pendant la séance ; repos ajustable de −15 s / +15 s.
- **D87** — « Précédent » est une colonne de la ligne de série ; l'appui recopie.
- **D88** — Échelle compacte en séance : cases de 36, cible tenue à 48 par `hitSlop`.
- **D89** — Les actions rares d'un exercice sont dans un menu ⋯ en feuille basse.
- **D91** — Repos réglable par exercice depuis sa puce.
- **D92** — Le numéro de série s'appuie : choisir son type ou la supprimer.
- **D93** — Ajouter et remplacer passent par la modale `choisir-exercices` (`?mode=remplacer`).
- **D95** — Les onglets reviennent en arrière par l'historique (`backBehavior="history"`).
- **D96** — Cache de requêtes persistant, **filtré** par présence de donnée (`gardeHorsLigne`) :
  routines, records, stats, préférences, catalogue complet, précédents. La déconnexion l'efface.
- **D98** — Démarrer lit le réseau d'abord sous délai, le cache en repli, le cache direct hors
  ligne. Jamais de `fetchQuery` nu dans un chemin de salle.
- **D99** — L'envoi se relance au retour du réseau et du premier plan.
- **D105** — Un seul aplat par écran ; « Terminer » est secondaire.
- **D107** — *Révisée par D316, puis D319.* Bandeau « séance en cours », neutre, au-dessus de la barre ; tout le bandeau ramène
  à la séance.
- **D108** — Direction « Carnet » : puces repos et note sous le nom, ligne de série en états,
  valeurs fantômes.
- **D109** — *Révisée par D317.* Pavé numérique intégré ; le clavier système ne s'ouvre pas.
- **D111** — Fin de séance : records battus calculés sur le téléphone contre le cache ; sans série
  validée, rien ne s'enregistre.
- **D113** — On vibre pour confirmer ce qui se fait sans regarder, jamais pour décorer ;
  réglage « Vibrations » sur le téléphone. `useReducedMotion` remplace les glissements par des
  fondus.
- **D114** — Micro-textes : tutoiement, phrases courtes avec un point, pas d'exclamation.
- **D116** — La ✓ est une case à cocher : vide à faire, pleine à l'encre une fois faite. La
  prochaine série se repère par un liseré, sans couleur d'action.
- **D120** — *Révisée par D316.* Démarrer est une feuille basse ouverte par le rond central.
- **D130** — *Révisée par D318.* Fin de séance, la récompense d'abord : records, écarts avec la dernière séance de la
  même routine, note de séance (`Seance.note`).
- **D167** — La feuille Démarrer a un bouton Fermer en plus du glisser.
- **D168** — *Révisée par D317.* L'horloge de salle : chaque repos lancé monte une feuille aux deux tiers (décompte
  en affiche orange, « Ensuite », −15 s · +15 s · Passer) ; glissée vers le bas, elle devient
  le bandeau.
- **D169** — En-tête de séance resserré : chevron, nom, « 3 / 15 séries », « Terminer » en
  secondaire à droite, barre de progression.
- **D170** — Fin de séance : « Séance terminée », records en contour, écarts, note,
  « Enregistrer » en aplat.

## Supersets

- **D145** — `supersetGroupe` facultatif sur l'exercice de routine et de séance ; absent, il vaut
  `null`.
- **D146** — Un groupe est une suite consécutive de même numéro ; `normaliserGroupes` corrige au
  lieu de refuser, et l'API normalise à l'écriture.
- **D147** — Opérations : « Superset avec le suivant », « Retirer du superset », « Défaire le
  superset ».
- **D148** — Réordonner, retirer, remplacer, ajouter : une règle par geste, toutes finies par
  `normaliserGroupes` (`deplacerAvecGroupes`, jamais `arrayMove`).
- **D149** — Le repos part quand le tour est complet ; durée du dernier membre, repli sur le repos
  par défaut. Le repos des autres membres est gardé mais masqué.
- **D150** — Prochaine série tour par tour (A1, B1, A2…).
- **D151** — *Révisée par D317.* Repère identique partout : filet de 3 px et étiquette « Superset A », rôle
  `superset` (`#9a8cf0` / `#5a4bbf`).
- **D152** — Les actions vivent dans le menu ⋯ et sur l'étiquette.
- **D153** — Le détail d'une séance rend `supersetGroupe` ; l'historique web le relit en lecture
  seule.

## Interface mobile

- **D28** — Une seule couleur pour l'action et le record, distinguée par la forme : l'action est
  un aplat, le record un contour (texte coloré sur fond teinté, flèche montante). La couleur
  est l'orange depuis D161.
- **D36** — Le danger a sa propre couleur et ne porte jamais l'action ni le record.
- **D74** — *Révisée par D316.* *Révisée par D178* : les onglets sont Routines · Démarrer · Profil.
- **D80** — Dépendances d'Expo Go seulement.
- **D82** — *Révisée par D316.* Le mobile crée, modifie et supprime les routines sans le web.
- **D83** — *Révisée par D316, rétablie en gris par D321.* Carte des muscles (`react-native-body-highlighter`) sur la page d'une routine.
- **D84** — *Révisée par D316.* Les muscles se peignent en couleur d'action : exception bornée au dessin du corps.
- **D85** — La copie de travail de l'éditeur de routine vit dans `shared`
  (`brouillon-routine.ts`), le système d'unités en paramètre.
- **D101** — *Révisée par D318.* Couleurs par rôle, deux valeurs (sombre / clair) ; valeurs actuelles en D161.
- **D102** — *Révisée par D318.* Les styles se construisent depuis le thème courant (`creerStyles` / `useStyles`),
  jamais par un `StyleSheet.create` au niveau du module.
- **D103** — *Révisée par D163* (Barlow remplace Archivo).
- **D104** — *Révisée par D318.* Espacements en base 4, cible tactile de 48, ligne de série de 52 ; rayons révisés
  par D164.
- **D327** — Complète D176 sur le mobile : le squelette prend la forme de l'écran attendu —
  `Chargement forme="routines"` (cartes et segment « Lancer »), `"routine"` (résumé,
  « Lancer », carte des muscles, exercices repliés), `"lignes"` par défaut (lignes du
  catalogue) —, au lieu de trois barres communes.
- **D118** — *Révisée par D316.* Langage commun des pages : `Section`, `Vignette` (fond blanc), `Tuile`,
  `BoutonContour`, `FeuilleBasse` ; un chiffre se distingue par sa taille, pas sa couleur.
- **D121** — *Révisée par D171* : le catalogue n'a plus de vue dans Routines.
- **D122** — *Révisée par D316.* Page d'une routine : on la lit avant de la modifier ; « Lancer » en contour.
- **D123** — *Détail d'une séance retiré du mobile (D178)* ; `ecartSerie` de `shared` reste.
- **D124** — *Révisée par D316.* Fiche d'un exercice : une page qui défile (1RM estimé et sa courbe, records,
  historique, consignes). Son historique n'ouvre plus rien (D178).
- **D125**, **D126**, **D127** — *Écran Progrès retiré (D178)*, son calendrier et son token avec.
  Reste la `Tuile` à écart.
- **D128** — *Révisée par D318.* Profil : bilan de toujours, objectif hebdomadaire, repos par défaut, thème
  (Système · Sombre · Clair), vibrations, export CSV, compte, envoi.
- **D161** — *Révisée par D316.* Palette « Underground orange » : valeurs dans `lib/palette.ts`, contrastes tenus par
  `palette.test.ts`.
- **D162** — *Révisée par D316.* L'orange ne porte que l'action et le record ; exceptions bornées : carte du corps,
  horloge de salle.
- **D163** — *Révisée par D316.* Barlow pour l'interface ; Barlow Condensed 800 en capitales (l'« affiche ») pour
  titres de page, noms en tête, chrono, horloge, valeurs de record — jamais dans un contrôle.
- **D164** — *Révisée par D316.* Rayons 6 (cartes, boutons, cellules), 16 (feuilles), pilule (puces) ; profondeur
  par les surfaces, sans ombre.
- **D165** — *Révisée par D316.* Onglet actif dans une pilule `surface3` (Material 3) ; rond orange central
  Démarrer / Reprendre.
- **D171** — *Révisée par D316.* Onglet Routines : une liste de cartes, sans segments ni « Lancer » ; le rond lance,
  la carte ouvre.
- **D172** — *Révisée par D316.* Page d'une routine : « Lancer » en contour, la carte du corps repliée derrière une
  ligne.
- **D174** — *Révisée par D316.* Fiche d'un exercice : vignette et nom, puis 1RM, records, historique, consignes.
- **D175** — *Révisée par D318.* Profil groupé par portée : Entraînement (compte) · Ce téléphone · Données · Compte ;
  la file d'envoi n'apparaît que si une séance attend.
- **D176** — Chargement en squelette de page ; rien sous une seconde ; état vide qui dit l'état et
  mène à l'action.
- **D325** — Complète D317 : en séance, chaque exercice tient dans une carte bordée
  (`rounded-lg`), comme les cartes de routine (D320), au lieu d'un trait entre deux exercices ;
  nom en `text-base`. L'écart entre deux cartes vit dans le repère de superset, dont le filet
  relie toujours les membres.

## Interface web

- **D228** — Hors shadcn, tout composant externe se fait valider avant installation.
- **D229** — Pas de logo : le nom « better-lift » en texte (`Brand`).
- **D323** — Complète D229 : l'onglet porte l'icône de l'app mobile (D322) en favicon
  (`apps/web/public` : `favicon.svg`, inversé en mode sombre comme le `primary` ; `favicon.ico`
  16–48 px ; `apple-touch-icon.png`). Les écrans gardent le nom en texte.
- **D329** — Révise D229 et D323 pour la barre latérale : son en-tête assemble le symbole
  « La charge » seul, sans tuile (`Logo`, `currentColor`, `viewBox` recadré sur le dessin), et le
  nom. Le symbole (20 px) est centré sur la colonne des icônes du menu ; l'écart (6 px) fait
  commencer le nom au même x que les libellés du menu. Repliée en icônes, la barre ne garde que le
  symbole ; le nom n'est pas masqué mais rogné par la largeur, pour suivre l'animation. Les pages
  d'authentification portent le même assemblage en tête. L'Accueil prend l'icône
  `LayoutDashboard`.
- **D231** — shadcn sur Radix, style Nova, police Inter, curseur pointeur. Le code des registres
  (`components/ui/**`) reste tel que livré ; Biome n'y lève pas les règles d'accessibilité.
- **D232** — Clavier : Ctrl K (palette) et Ctrl B (barre latérale) seulement.
- **D233** — Gabarit de page `Page` : contenu centré, titre sobre, onglets et actions en tête.
- **D234** — Routines, Exercices, Historique : liste | détail redimensionnable sur toute la
  surface (`ListDetailPage`), largeur mémorisée.
- **D235** — L'élément ouvert vit dans le chemin (`$id`, `$slug`, `new`), route enfant rendue par
  `<Outlet />` ; la liste reste montée. Rien d'ouvert : le panneau le dit, sans redirection.
- **D236** — Les onglets d'un élément ouvert vivent dans l'en-tête du panneau de droite.
- **D238** — Pas de page de modification : on modifie là où on lit ; créer insère une ligne
  brouillon en tête de liste, rien n'est créé avant d'enregistrer.
- **D239** — Quitter un élément modifié non enregistré demande confirmation
  (`useUnsavedGuard`).
- **D242** — Tête de détail collante ; créer est un formulaire (« Créer ») ; confirmations par
  toast `sonner` avec *Annuler*.
- **D243** — La routine ouverte EST l'éditeur.
- **D244** — Vignette carrée d'exercice (image fixe) dans les listes, GIF dans la fiche.
- **D246**, **D248**, **D249** — Carte d'exercice de l'éditeur : poignée à gauche, repos en
  liste, séries en champs − / + ; le type de série s'ouvre sur son étiquette, en couleur comme
  Hevy (W échauffement ambre, F échec rose, D dégressive bleue) — seule couleur du web.
- **D250** — Un champ modifiable a un fond teinté, sans contour.
- **D251** — Ligne ouverte : fond `muted/50` et liseré de 3 px ; `--muted-foreground` à
  `oklch(0.52)` pour tenir 4,5:1.
- **D252** — Un bouton d'enregistrement grisé dit pourquoi (`saveBlocker`) ; « Même charge
  partout », « Recopier la dernière fois ».
- **D253** — Cartes d'exercice repliées à l'ouverture, avec le résumé des séries
  (`setsSummary`).
- **D254**, **D255** — Colonne de droite de l'éditeur en cartes ; exercices et colonne
  défilent chacun.
- **D257** — Routines en dossiers repliables ; glisser change de dossier ; création en pied de
  liste.
- **D258** — Une carte par routine ; l'ouverte prend un contour d'encre.
- **D260** — États de `/routines` : rien d'ouvert, vide guidé, squelettes à la forme réelle,
  erreur dans la liste seule.
- **D261** — Historique des modifications (↶ ↷, Ctrl Z / Ctrl Y, Ctrl S), « Tout annuler »
  rattrapable, cartes marquées « Modifié » / « Nouveau ».
- **D262** — Ajout de plusieurs exercices par un dialogue en cartes ; fiche rapide ; un seul
  panneau sous 760 px ; bornes de `routineSaisie` (50 exercices, 20 séries, 1 000 kg, 999 reps).
- **D263**, **D264** — Séance et fiche d'exercice reprennent la tête de l'éditeur ; elles sont en
  **lecture seule** depuis D294.
- **D265** — Résumés en carte à lignes (`SummaryCard`) : libellé à gauche, valeur à droite.
- **D266** — L'état d'une modification se lit à gauche des flèches ↶ ↷.
- **D271** — Paramètres : navigation à gauche (Compte, Préférences, Entraînement, Données).
- **D272** — Les Paramètres collent à Better Auth et à la base : nom modifiable, e-mail en
  lecture, `changePassword`, sessions (`listSessions`, `revokeSession`).
- **D273** — Un réglage s'enregistre dès qu'on le choisit, confirmé par un toast.
- **D280** — Le détail d'une routine porte ses stats (dernière fois, séances, tendance du volume,
  records).
- **D283** — *Révisée par D330.* L'Accueil est vide : son contenu viendra quand l'usage dira ce qui y sert.
- **D330** — L'Accueil du web est un tableau de bord, bilan d'abord : la semaine en cours en
  bandeau (jours entraînés, objectif hebdomadaire) ; une période **4 sem. · 3 mois · 1 an**,
  dernier choix gardé dans le navigateur (`localStorage`, 3 mois par défaut ; ni URL ni
  gestionnaire d'état) ; quatre chiffres clés comparés à la période précédente (flèche et signe,
  sans couleur) ; tendance en aire (semaines, ou mois sur un an) à côté des dernières séances ;
  séries par muscle et silhouette à côté des records récents. Pas de routine à suivre.
  `GET /tableau-de-bord?depuis=` rend les faits par séance (records rejoués sur tout
  l'historique, seuls les exercices faits colorent la silhouette) ; le web les agrège dans son
  fuseau par `shared/tableau-de-bord.ts`.
- **D289** — Paramètres s'ouvre par le menu du compte ou la palette, pas par la barre.
- **D290** — Barre latérale en une liste : Accueil, Routines, Historique, Exercices.
- **D294** — Ce qui n'est pas branché quitte l'interface (import Hevy, export JSON, préférences
  sans champ, correction de séance, note et cible d'exercice, mot de passe oublié).
- **D299** — Les écrans consomment les types de l'API (inférés par le RPC) ; les calculs viennent
  de `shared`.
- **D300** — Une couche de requêtes par feature (`features/<x>/queries.ts`) ; les loaders
  préchargent sans attendre, la page lit par `useQuery`, pas de Suspense ; toute réponse non
  `ok` devient une `ErreurApi` (`lib/api.ts`).
- **D302** — Supprimer est différé : la ligne quitte le cache, le `DELETE` part à la fin du toast
  « Annuler » (5 s) ; un départ de page envoie les suppressions en attente.
- **D303** — Les quatre états viennent de la requête ; `?etat=` les force toujours ;
  `etatAffiche` choisit pour toutes les pages.
- **D304** — Suite Playwright de bout en bout (`apps/web/e2e/`), compte `e2e@better-lift.local`
  sur la branche Neon `dev`, données préfixées `e2e-` et nettoyées. Pas en CI (pas de base).
- **D306** — Une règle par dossier : voir `.claude/rules/interface-web.md`.
- **D307** — Les calculs du web vont dans `shared` s'ils valent pour le mobile, sinon dans la
  feature qui les lit ; jamais l'UTC pour découper un jour.
- **D308** — `?etat=` est lu par `useEtat` (`components/states/`) ; la barre d'état ne
  s'affiche qu'en développement.
- **D309** — Knip voit tout le web ; seuls `components/ui/` et `lib/utils.ts` sont des entrées.
- **D313** — Fuseau du navigateur et système métrique, fixés dans `lib/locale.ts` seul.
- **D314** — Page Records (`/records`), dans la barre entre Historique et Exercices (révise
  D290) : une ligne par exercice fait, ses records actuels datés, le dernier battu d'abord. Ils
  viennent des exercices faits (`records` ajouté à D312), sans nouvelle route. Dans l'historique,
  le compte de records se lit à droite du nom de la séance, et le trophée d'une série vit dans
  une colonne de largeur fixe pour ne pas décaler sa ligne.
- **D315** — En-tête : la recherche suit la largeur de l'en-tête et devient une loupe sous
  42 rem (Ctrl K affiché au-delà de 52 rem) ; le fil d'Ariane tient sur une ligne et tronque sa
  dernière miette.
