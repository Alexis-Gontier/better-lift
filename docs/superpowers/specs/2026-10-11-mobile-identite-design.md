# Nouvelle identité et allègement du mobile — conception

**Date** : 11 octobre 2026 · **Statut** : validée (arbitrages du 11 octobre) · **Surface** : mobile,
`shared`, API (un ajout, une route).

**Source** : la séance de maquettes du 11 octobre (compagnon visuel,
`.superpowers/brainstorm/652-1791752728/`, non versionné) : directions A à E, puis « E orange » v1
et v2, les pages, l'Accueil avec stats. Elle prolonge les refontes du
[3 octobre](2026-10-03-mobile-refonte-design.md) et du [5 octobre](2026-10-05-mobile-refonte-pages-design.md) :
ce que cette spec ne révise pas reste en vigueur (séance D108–D116, pavé D109, hors ligne D96–D100,
supersets D145–D153, mouvement et vibrations D113, micro-textes D114).

## But

Deux constats de l'utilisateur : l'app est **propre mais sans caractère** (le look), et ses pages
montrent **trop de choses** (densité). La séance et la structure de navigation fonctionnent : on
les garde. On change ce qu'on voit, et la quantité qu'on en montre.

## Recherche

Ce qui a guidé les choix, et où le relire.

- **Lois de l'UX** ([lawsofux.com](https://lawsofux.com/)). **Hick** : une action évidente par
  écran, l'app choisit pour l'utilisateur (« À suivre »). **Fitts** : cibles d'au moins 1 cm,
  2 cm pour l'action principale ([NN/g](https://www.nngroup.com/articles/touch-target-size/)).
  **Jakob** : le modèle Hevy / Strong (routine → séance → tableau Série · Précédent · kg · reps)
  est un acquis. **Miller / chunking** : lire par blocs. **Pic et fin** : la fin de séance est le
  moment qui reste. **Zeigarnik / gradient d'objectif** : « 3 / 16 », « 2 / 3 séances ».
  **Doherty** : écriture optimiste, hors ligne d'abord.
- **Prise en main** (Hoober, [2013](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php),
  [2017](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php)) :
  75 % des appuis au pouce, mais on touche surtout **au centre**, où l'on est le plus précis
  (7 mm suffisent au centre, 12 mm dans les coins). Contenu au centre, navigation et actions
  secondaires sur les bords, tertiaire en menu de coin, dangereux à l'écart.
- **Divulgation progressive** ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)) :
  deux niveaux au plus ; pas d'onglets dans les onglets. **Feuilles basses**
  ([NN/g](https://www.nngroup.com/articles/bottom-sheet/)) : interactions courtes, jamais
  empilées, toujours un bouton Fermer visible. **Chargement**
  ([NN/g](https://www.nngroup.com/articles/skeleton-screens/)) : rien sous 1 s, squelette de 1 à
  10 s. **États vides** ([NN/g](https://www.nngroup.com/articles/empty-state-interface-design/)) :
  dire l'état, apprendre la fonction, mener à l'action.
- **Salle de sport** : une main, doigts moites, un coup d'œil entre deux séries — grandes cibles,
  lecture instantanée, une chose à la fois.
- **Style** : d'abord la hiérarchie en gris, la couleur en dernier (Refactoring UI) ; tokens en
  trois couches (brutes → rôles → composants) ; en sombre, pas de noir pur (halo du texte clair)
  et un accent légèrement désaturé ; une police condensée en capitales ne se lit bien qu'en grand.
- **Skill impeccable** (mode *Operate*, plateforme Android) : sur un écran où l'on travaille, le
  monde visuel ne prête que **la typo, la palette, la densité et un geste signature** — jamais la
  mise en page, la navigation ni les contrôles, qui restent ceux de Material 3. Interdits relevés
  sur la première maquette : sur-titre au-dessus d'un titre, liseré coloré sur les cartes,
  gabarit « gros chiffre, petite étiquette, stats annexes ».
- **Inspirations** : les salles de l'utilisateur. **On Air** (relevé sur onair-fitness.fr) : noir
  et blanc, rouge `#c10e0f`, angles presque vifs, univers industriel et urbain. **Basic-Fit**
  (relevé sur basic-fit.com) : orange `#eb6800` / `#fe7000`, titres très gras. Retenu :
  **l'ossature d'On Air avec l'orange de Basic-Fit**. On s'inspire sans copier : ni logo, ni nom,
  ni police propriétaire.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D161** | **Palette « Underground orange »** (révise D101). Un token par rôle, deux valeurs : canevas `#121412` / `#f4f4f2` ; surfaces `#1b1e1b`, `#242824`, `#2c312c` en sombre, blanc et gris clairs en clair ; encre `#f3f4f1` / `#121412` ; encre secondaire `#9aa09b` / `#5c625d` (6,9:1 / 5,7:1). **Action** : aplat `#f47a20` en sombre, `#fe7000` en clair, texte `#121412` dessus (6,7:1 / 6,6:1). **Record** : contour et flèche, `#f47a20` en sombre, `#b34d00` en clair (5,3:1 sur blanc, 4,8:1 sur le canevas clair). **Danger** : `#ff4d6d` / `#c4213f` (5,2:1 et plus sur les surfaces), toujours avec un mot — l'ancien rouge serait trop proche de l'orange. Le lime quitte le mobile | Choix de l'utilisateur (direction E « façon On Air », en orange Basic-Fit). Pas de noir pur en sombre ; l'orange s'adoucit en sombre pour ne pas vibrer, reste franc en clair. Texte blanc sur l'orange : 2,8:1, refusé |
| **D162** | **L'invariant reste, la couleur change** : une seule couleur pour l'action et le record, distinguée par la forme (aplat / contour). Exceptions bornées : la carte du corps (D84) et le calendrier (D127) passent à l'orange ; **l'horloge de salle (D168) est la troisième**. Rien d'autre ne porte l'orange : ni les lignes de série, ni l'onglet actif, ni les titres | Von Restorff : un signal ne se retient que s'il reste rare |
| **D163** | **Typo : Barlow et Barlow Condensed** (remplace D103). Barlow (400 à 700) pour toute l'interface ; Barlow Condensed 800 **en capitales** seulement pour les titres de page, le nom en tête d'une routine ou d'un exercice, le chrono, l'horloge et les valeurs de record. Jamais dans un bouton, une étiquette, une puce ni un tableau. Les deux viennent de `@expo-google-fonts` (coupes statiques publiées) : la coupe condensée générée (`scripts/polices/`) disparaît | Une famille, deux largeurs (impeccable : pas de police d'affichage dans les contrôles). Le condensé ne se lit bien qu'en grand |
| **D164** | **Formes et profondeur** (révise D104). Rayon **6** pour cartes, boutons, cellules ; **16** pour le haut des feuilles ; pilule seulement pour les puces et l'indicateur d'onglet. Profondeur par surfaces plus claires, sans ombre. Échelle d'espacement en base 4, cibles de 48 inchangées. **Interdits** : sur-titre au-dessus d'un titre, liseré coloré de plus de 1 px sur une carte, gabarit « gros chiffre, petite étiquette » | L'angle franc d'On Air sans tranchant ; les tics de design généré relevés par impeccable |
| **D165** | **Barre d'onglets** : Accueil · Routines · **rond orange** Démarrer / Reprendre · **Progrès** · Profil (D115 tenue pour le rond). L'onglet actif prend l'**indicateur en pilule** de Material 3 (`surface3` autour de l'icône, libellé en encre) — remplace « onglet actif en lime ». Le bandeau de séance en cours (D107) reste au-dessus | Choix de l'utilisateur pour le rond ; Material 3 pour le reste |
| **D166** | **Accueil, tableau de bord de la semaine** (révise D119). Dans l'ordre : la carte **« Prochaine séance »** (nom, « Ta prochaine séance · durée · n exercices », muscles ; toucher ouvre la routine ; pas de bouton, le rond lance) ; le bloc **« Cette semaine »** : les sept jours (entraînés en orange, aujourd'hui cerclé), l'objectif « x / y séances », puis volume avec son écart à la semaine d'avant, séries, durée ; le **dernier record** de la semaine (masqué sans record) ; le **journal**, une ligne par séance (nom ; date · durée · volume ; badge du nombre de records), qui ouvre le détail. Les cartes riches du fil (tuiles, trois exercices, meilleure série) disparaissent | L'app est privée : l'Accueil est un tableau de bord (choix de l'utilisateur, version « la semaine »). Une séance passée pesait autant que la prochaine |
| **D167** | **Démarrer** (D120 tenue) : la feuille gagne un **bouton Fermer** visible en plus du glisser | NN/g : le glisser seul se rate |
| **D168** | **L'horloge de salle, geste signature.** Toute série validée qui lance un repos fait monter une feuille de repos (environ deux tiers de l'écran) : « Repos », le décompte en Barlow Condensed orange (~120), la barre du repos écoulé, « Ensuite : Série 3 · 82,5 kg × 8 » (`prochaineSerie`), puis −15 s · +15 s · Passer. Glisser vers le bas la **réduit** au bandeau d'une ligne d'aujourd'hui ; à zéro, elle vibre (`vibrer.finRepos`) et se ferme. Elle s'ouvre à chaque repos. Réduire les animations : fondu. Texte plafonné (`PLAFOND_TEXTE_DENSE`). Pas de réglage pour la couper avant l'épreuve du jalon | Le moment le plus regardé de la séance devient le plus reconnaissable ; lisible téléphone posé sur le banc |
| **D169** | **Séance, restylée** (D108, D116 tenues). En-tête resserré : chevron, « nom · 3 / 16 », « Terminer » en texte secondaire en haut à droite (loin du pouce, exprès), barre de progression. Nom d'exercice en Barlow Condensed ; tableau Série · Précédent · kg · reps · ✓ inchangé ; aucune couleur d'action sur les lignes | Ce qui marche ne change pas de logique |
| **D170** | **Fin de séance** (D130 tenue, forme revue) : titre « Séance terminée » ; les records battus dans un bloc en contour record ; durée, séries, volume en lignes avec leur écart ; la note ; l'aplat « Enregistrer » en bas | Pic et fin |
| **D171** | **Routines sans segments** (révise D121) : une liste de cartes (nom en Barlow Condensed ; durée et exercices en une ligne), « + » en tête pour créer. **Plus de « Lancer » sur les cartes** : le rond lance, la carte ouvre la routine | Plus d'onglet dans l'onglet ; un chemin par action |
| **D172** | **Page d'une routine** (révise D122) : « Lancer » en contour, « Modifier » en icône dans l'en-tête, exercices avec cible et « dernière fois ». La carte du corps devient une ligne **« Muscles travaillés › »** qui l'ouvre | Elle prenait un écran entier pour une information secondaire |
| **D173** | **Progrès remplace Stats** (révise D125). Sélecteur de période ; **régularité** (séances, « objectif tenu x / y semaines », calendrier) ; **records** (les trois derniers, « Tous › ») ; **« Tes exercices »** : les exercices faits sur la période, du plus récent au plus ancien, chacun avec son **1RM estimé** et son écart sur la période en mots (« +4 kg ce mois », « stable »), qui ouvrent la fiche ; **« Détail de la période › »** : tuiles comparées, carte du corps et séries par zone, volume. **Le catalogue complet quitte les onglets** : il ne vit plus que dans « Choisir des exercices » ; la pile `exercices` garde la fiche | Sept blocs sans priorité ; la progression d'un mouvement était à trois appuis |
| **D174** | **Fiche d'un exercice** (D124 tenue, ordre revu) : vignette et nom en tête (l'animation s'agrandit au toucher), puis le 1RM estimé, son écart et sa courbe, les records, l'historique, les consignes | Le chiffre qui compte d'abord |
| **D175** | **Profil** (D128 tenue, ordre revu) : le bilan en tête, puis **Entraînement** (sur le compte) · **Ce téléphone** · **Données** · **Compte**. La section **Envoi** n'apparaît que si une séance attend | Grouper par portée ; masquer ce qui est vide |
| **D176** | **États** : chargement en **squelette** de la page (plus d'indicateur au milieu du contenu) ; **état vide** qui dit l'état, apprend la fonction et mène à l'action ; erreur et hors ligne comme aujourd'hui (D96–D100) | NN/g |
| **D177** | **Le web suit, après** : ce chantier ne livre que le mobile ; un chantier web court bascule ensuite ses tokens (orange, Barlow, fond) sans toucher à sa structure, puis l'invariant de couleur de `CLAUDE.md` passe du lime à l'orange. Entre les deux, les deux identités coexistent | Choix de l'utilisateur : une seule identité à terme |

## Écarts assumés avec les maquettes

- Les maquettes HTML sont des intentions, pas des mesures : tailles et espacements se règlent sur
  l'émulateur, dans l'échelle D164.
- Les icônes de la barre y sont des carrés : ce sont les icônes Lucide d'aujourd'hui.
- Le détail d'une séance, l'éditeur de routine, le choix d'exercices et la connexion n'ont pas été
  dessinés : ils se restylent sans changer de logique.

## Données

Toute la logique de calcul est pure et vit dans `shared` (testée) ; l'API lit et agrège.

| Besoin | Changement |
|---|---|
| Écart de volume (D166, D173) | `Totaux` gagne `volumeKg`, dans `totaux` et `precedents` de `calculerPeriode`. Ajout : `GET /stats` (forme D112, lue par le web) ne change pas |
| Tes exercices (D173) | `GET /stats/exercices?periode=&fuseau=`, derrière `exigerSession` : pour chaque exercice fait sur la période, `slug`, `nom`, `gifUrl`, `derniereFois`, `unRm` (estimé sur la dernière séance) et `unRmDebut` (le premier de la période), triés par `derniereFois`. Calcul dans `shared` à partir de `courbeUnRm`. Persisté hors ligne (`gardeHorsLigne`, clé `["stats", "exercices", periode]`) comme les autres stats |
| Accueil (D166) | Lit `GET /stats/periode?periode=semaine` (déjà persisté) et le fil paginé existant |

Forme d'une réponse persistée changée (`Totaux`) : monter `buster` dans `app/_layout.tsx`.

## Découpage

Un lot = une branche depuis `main`, une PR, squash, check requis.

| Lot | Contenu | Dépend de |
|---|---|---|
| 0 | `chore` : les skills de design (impeccable, emil-design-eng, industrial-brutalist-ui) et cette spec | — |
| 1 | **Système** : tokens D161–D162, Barlow D163, formes D164 ; `Appuyable`, boutons, puces, badge record, feuilles, états (squelettes D176) ; **tous les écrans changent de peau sans changer de mise en page**. Suppression d'Archivo et de `scripts/polices/` | 0 |
| 2 | **Navigation et Accueil** : D165, D166, D167 ; `volumeKg` dans `Totaux` | 1 |
| 3 | **Séance, horloge, fin** : D168, D169, D170 | 1 |
| 4 | **Routines** : D171, D172 ; retrait de la vue Exercices de l'onglet | 1 |
| 5 | **Progrès et fiche** : D173, D174 ; `GET /stats/exercices` | 1 |
| 6 | **Le reste** : Profil D175, connexion, détail d'une séance, éditeur, choix d'exercices ; `DESIGN.md` du nouveau système ; mise à jour de `.claude/rules/mobile.md` | 1 |
| — | **Chantier web** (D177), à part | 6 |

Un composant naît dans le lot qui s'en sert le premier (Knip refuse un export sans usage).

## Tests

- **`shared`** (Vitest) : `volumeKg` des totaux et de la période précédente, découpés **dans le
  fuseau** ; la liste « Tes exercices » (1RM du début et de la fin de période, tri, exercice fait
  une seule fois, séries au-delà de 12 reps écartées comme pour le record).
- **API** : `GET /stats/exercices` avec session injectée ; la donnée d'autrui n'y figure jamais ;
  `GET /stats` sans `periode` rend toujours l'ancienne forme.
- **Mobile** : chaque écran sur l'émulateur, **sombre et clair**, dans ses **quatre états** ;
  contraste mesuré de tout nouveau token avant qu'il entre ; taille de texte système à 1,3
  (`font_scale`) sur l'Accueil, la séance et l'horloge ; l'horloge éprouvée avec Réduire les
  animations.

## Hors périmètre

- **Le calcul des disques** (charge dessinée en disques sur la barre) : proposé comme geste
  signature, non retenu ; à reprendre comme fonctionnalité si l'épreuve du jalon le réclame.
- **Un réglage pour couper l'horloge de salle** : seulement si l'usage le demande.
- **Le web** (D177) : chantier suivant.
- La logique de la séance, du pavé, du hors ligne et des supersets : inchangée.
