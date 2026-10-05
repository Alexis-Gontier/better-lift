# Refonte des pages du mobile — conception

**Date** : 5 octobre 2026 · **Statut** : validée (arbitrages du 5 octobre) · **Surface** : mobile,
`shared`, API, base (deux ajouts).

**Source** : la séance de maquettes du 5 octobre (compagnon visuel, `.superpowers/brainstorm/`, non
versionné). Chaque écran y a été choisi parmi deux ou trois versions ; cette spec consigne les
choix. Elle prolonge [la refonte du 3 octobre](2026-10-03-mobile-refonte-design.md) : tokens,
typographie, échelle, mouvement et micro-textes (D101–D104, D113, D114) restent en vigueur.

## But

L'app est propre, mais ses pages sont **fades et trop « listes »** (constat de l'utilisateur) : une
suite de lignes de même poids, et deux sections — l'Historique et les Exercices — sans onglet,
joignables seulement par lien. On garde la barre d'onglets (D115) et la séance en cours (D116) ;
**on repense tout le reste, contenu compris** : ce que chaque page montre, dans quel ordre, et sous
quelle forme.

## Recherche

- **Barre d'onglets** : 3 à 5 destinations, icône et libellé, toujours visible ; un bouton d'action
  central est un usage reconnu (Material 3, *bottom app bar*). La barre actuelle s'y conforme.
- **Salle de sport** : une main, doigts moites, lumière faible — une action claire par écran,
  cibles larges, chiffres lisibles en moins de 5 secondes (UW, *You have 5 seconds*).
- **Accueil d'un tracker** : montrer le minimum pour s'engager (but, durée, exercices) et laisser
  voir le détail avant de lancer (Strong : « entraînement du jour » ; Hevy : journal et modèles).

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D117** | **Plan de l'app, « journal en tête »** : Accueil = « À suivre » puis le fil de **toutes** les séances ; Routines = routines **et** exercices ; Stats = la progression ; Profil = le compte, les réglages, le bilan. L'Historique devient le fil de l'Accueil, les Exercices une vue de l'onglet Routines : **plus aucun écran orphelin** (fin des `href: null` de D115) | Choix de l'utilisateur entre trois plans (par moment, journal, centré exercice) |
| **D118** | **Langage commun des pages** : cartes sur `surface1` (rayon `carte`, D104) ; titre de page en 800 ; en-têtes de section en petites capitales `encreAttenuee` ; un chiffre se met en valeur par sa **taille**, pas par sa couleur ; **vignette blanche** d'exercice (`fondImage`) partout où un exercice est nommé. **« Lancer » en contour** partout ; le seul aplat lime d'un écran reste son action principale (D105) | Les pages manquaient d'image et de hiérarchie ; les vignettes donnent la couleur sans toucher au lime |
| **D119** | **Accueil** : carte « À suivre » **neutre** (nom, muscles, durée estimée ; « Lancer » en contour ; toucher la carte ouvre la routine), puis le **fil riche** façon Hevy : par séance, nom, date, badge record, tuiles durée · volume · séries, puis les trois premiers exercices (vignette, nombre de séries, **meilleure série**) et « + n exercices ». Le fil se charge par pages (`GET /seances` paginé). **Remplace D110** : « Cette semaine » quitte l'Accueil pour les Stats | Choix de l'utilisateur (carte riche) ; on relit une séance sans l'ouvrir |
| **D120** | **Démarrer = une feuille basse** ouverte par le rond central, par-dessus l'onglet courant : « À suivre » avec l'aplat **« Commencer \<routine\> »**, puis les autres routines et « Séance vide ». Elle se ferme en glissant. L'écran `demarrer.tsx` disparaît. Une séance en cours : le rond y ramène, comme aujourd'hui | Deux appuis pour le cas courant ; une action garde le contexte |
| **D121** | **Routines** : sélecteur **« Mes routines » \| « Exercices »** en tête ; chaque vue a toute la page. Carte de routine : nom, résumé, liste des exercices en une ligne, « Lancer » en contour. La vue Exercices reprend le catalogue (recherche, filtres de muscle) | Le catalogue (400+ exercices) mérite une vue entière sans alourdir les routines |
| **D122** | **Page d'une routine : lire, puis modifier.** Résumé, muscles (carte du corps réduite), « Lancer » en contour, puis chaque exercice avec ce qui a été fait **la dernière fois** ; chacun ouvre sa fiche. « Modifier » ouvre l'éditeur, restylé selon D118 sans changer son fonctionnement (D85) | On consulte bien plus qu'on ne modifie ; un doigt mal placé ne change pas une charge |
| **D123** | **Détail d'une séance : le relevé comparé.** En-tête durée · volume (avec son écart) · séries · records ; puis chaque exercice et ses séries, **chaque série dit son écart avec la même position de la séance précédente de cet exercice** (« +1 rep », « +2,5 kg », « = »), alignement de CLAUDE.md (toutes les séries, pas les seules faites). Menu « ⋯ » : **Refaire** (démarre une séance depuis celle-ci) et **Supprimer** (confirmé, danger) | La progression séance par séance, sans passer par les Stats |
| **D124** | **Fiche d'un exercice : une page qui défile.** GIF en tête, nom et muscle, **1RM estimé** (Epley) avec son écart sur la période et sa **courbe**, records (charge max, meilleure série), puis l'historique (date, routine, séries, badge record), enfin les consignes. Ouverte depuis la vue Exercices, une séance ou une routine | Choix de l'utilisateur ; la fiche porte désormais la progression d'un mouvement |
| **D125** | **Stats par période** : sélecteur **Semaine · Mois · 3 mois · Année** qui pilote toute la page. Dans l'ordre : tuiles **séances · séries · durée** comparées à la période précédente ; **calendrier façon GitHub** ; **muscles travaillés** (carte du corps face/dos + barres de séries par muscle) ; **volume** (barres par semaine, par mois en Année) ; **records** de la période. **Remplace D112** | Demande de l'utilisateur |
| **D126** | **Le calendrier** : lignes = jours (L → D), colonnes = semaines, mois en tête, légende « Moins → Plus ». L'intensité suit le **volume du jour en 5 niveaux** (quantiles des jours entraînés de la période), aujourd'hui cerclé ; toucher un jour ouvre sa séance (ou une feuille s'il y en a plusieurs). Taille selon la période : 1, 5, 13 ou 53 colonnes (Année : défilement horizontal, ouvert sur la semaine en cours). En-tête : moyenne par semaine et **série de semaines tenues** (objectif D127) | Demande de l'utilisateur (« un meilleur calendrier GitHub ») |
| **D127** | **Le lime dit aussi l'effort fourni** : le calendrier prend un dégradé lime à 5 niveaux (tokens `calendrier0..4`, deux valeurs ; en clair, vers l'olive de `recordEncre`). **Deuxième exception** à la règle du lime, après la carte du corps (D84), et de même nature : une intensité d'entraînement, jamais une action ni un record | Le gris rendait le calendrier terne ; l'exception reste bornée à un dégradé d'intensité |
| **D128** | **Profil** : en-tête avec le **bilan de toujours** (nom, « depuis \<mois année\> », séances, tonnage) ; **objectif hebdomadaire** (séances par semaine, 1 à 7, facultatif) ; **repos par défaut** (remplace la valeur en dur, s'applique aux exercices sans repos propre) ; **thème** Système · Sombre · Clair (révise D102 : le système reste le défaut) ; vibrations ; **export CSV** ; compte ; envoi | Choix de l'utilisateur |
| **D129** | **Préférences** : l'objectif et le repos par défaut sont **sur le compte** (table `Preferences`, `GET` / `PUT /preferences`) ; le thème et les vibrations restent **sur le téléphone** (AsyncStorage) — ce sont des réglages d'appareil | L'objectif sert aux Stats et pourra servir au web ; le thème dépend de l'écran qu'on tient |
| **D130** | **Fin de séance : la récompense d'abord.** Les records battus en vedette (sans record : la progression la plus nette) ; puis la comparaison avec la dernière séance de la même routine (volume, séries, durée) ; l'encart des séries non validées ; le nom et une **note** (`Seance.note`, facultative) ; l'aplat « Enregistrer ». **Révise D111** | Le moment où l'app peut dire « tu progresses » ; rien n'est retiré, l'ordre change |
| **D131** | **Connexion** : logo (haltère redressée sur aplat lime) et nom en haut, champs e-mail et mot de passe et « Se connecter » **en bas**, au-dessus du clavier ; une seule étape | Choix de l'utilisateur ; tout sous le pouce |

## Données

Toute la logique de calcul est pure et vit dans `shared` (testée) ; l'API lit et agrège.

| Besoin | Changement |
|---|---|
| Fil riche (D119) | `GET /seances` ajoute le `gifUrl` des exercices ; la meilleure série par exercice se calcule dans `shared` (`meilleureSerie`) |
| Stats (D125, D126) | `GET /stats?periode=semaine\|mois\|trimestre\|annee` (dans le fuseau) : totaux et **totaux de la période précédente** ; volume **par jour** ; séries par muscle ; volume par semaine (par mois en Année) ; records de la période ; bilan de toujours (D128). **Sans `periode`, la réponse actuelle reste** : le web s'en sert |
| Fiche (D124) | `GET /exercices/:slug/historique` (exige la session) : séances de l'exercice et leurs séries ; `shared` : `unRmEpley`, la courbe et son écart |
| Détail comparé (D123) | `GET /seances/precedentes` reçoit `avant=<date>` : la séance précédente de chaque exercice **avant** celle qu'on regarde ; `shared` : `ecartSerie` |
| Suppression (D123) | `DELETE /seances/:id` ; la séance d'autrui est introuvable (404) |
| Note (D130) | Colonne `Seance.note` (texte, facultative), dans `seanceSaisie` |
| Préférences (D129) | Table `Preferences` (`userId` clé, `objectifHebdo Int?`, `reposDefautSec Int?`) ; `GET` / `PUT /preferences` |
| Export (D128) | `GET /export.csv` : une ligne par série (date, séance, exercice, position, type, charge, reps) ; partagé par `expo-sharing` |

Le cache hors ligne (D96) persiste les nouvelles lectures comme les anciennes, avec leur date.

## Découpage

Un lot = une PR depuis `main`, squash, check requis. **Préalable** : fusionner #82 puis #83
(reciblée sur `main`), pour partir d'une base qui porte D116.

1. **Fondations** — composants `Carte`, `Section`, `Vignette`, `Segments`, `Tuile` ; feuille basse
   qui se ferme en glissant ; tokens `calendrier0..4` ; migration `Seance.note` et `Preferences`,
   routes `/preferences`.
2. **Accueil et Démarrer** — D119, D120 ; suppression de `demarrer.tsx`.
3. **Routines** — D121, D122 ; la vue Exercices reprend `exercices/index.tsx`.
4. **Détail et fiche** — D123, D124 ; `avant=`, `DELETE`, `/historique`.
5. **Stats** — D125 à D127.
6. **Profil et connexion** — D128, D129, D131 ; export CSV.
7. **Fin de séance** — D130.

## Tests

- **`shared`** (Vitest) : découpage des périodes et de la période précédente **dans le fuseau**
  (le dimanche 21 h à Paris) ; volume par jour et ses 5 niveaux ; séries par muscle ;
  `meilleureSerie` ; `unRmEpley` ; `ecartSerie` aligné position par position ; semaines tenues
  selon l'objectif.
- **API** : chaque route nouvelle ou changée, session injectée ; la donnée d'autrui rend 404 ;
  `GET /stats` sans `periode` rend toujours l'ancienne forme.
- **Mobile** : chaque écran vérifié sur l'émulateur, **sombre et clair**, dans ses **quatre états**
  (vide, chargement, erreur, nominal).

## Hors périmètre

- **Modifier une séance passée** : demande une route de remplacement et un éditeur ; à reprendre si
  l'épreuve du jalon le réclame.
- **La séance en cours** (D108, D116) et la barre d'onglets (D115) : inchangées.
- **Le web** : aucune page web ne change ; seules ses lectures d'API sont préservées.
- « Mes mouvements » épinglés, équilibre poussée / tirage : proposés, non retenus.
