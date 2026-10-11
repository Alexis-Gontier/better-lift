# better-lift — système visuel « Underground orange »

Ce que voit et touche l'utilisateur de l'app mobile, en un seul endroit. La décision et ses raisons
sont dans [`docs/superpowers/specs/2026-10-11-mobile-identite-design.md`](docs/superpowers/specs/2026-10-11-mobile-identite-design.md)
(D161–D177) ; le code fait foi pour les valeurs (`apps/mobile/lib/palette.ts`, `lib/theme.ts`).
**Le web garde encore le lime** : il bascule dans un chantier à part (D177).

## Thèse

Une salle « underground » — l'ossature d'On Air — avec l'orange de Basic-Fit. Sur un écran où l'on
travaille, le monde ne prête que **la typo, la palette, la densité et un geste signature** ; la
mise en page, la navigation et les contrôles restent ceux de Material 3 et d'une bonne app de
muscu (Hevy, Strong).

## Couleur

Un token par rôle, deux valeurs (sombre / clair). `lib/palette.test.ts` vérifie chaque contraste.

| Rôle | Sombre | Clair | Usage |
|---|---|---|---|
| `canevas` | `#121412` | `#f4f4f2` | Fond. Jamais de noir pur (halo du texte clair) |
| `surface1/2/3` | `#1b1e1b` `#242824` `#2c312c` | blanc, `#ebebe7`, `#e1e1dc` | Cartes, feuilles, puces ; la profondeur monte en éclaircissant, sans ombre |
| `encre` · `encreSecondaire` · `encreTertiaire` · `encreAttenuee` | `#f3f4f1` · `#c3c8c3` · `#9aa09b` · `#939a93` | `#121412` · `#3b403c` · `#5c625d` · `#626862` | Tout texte ≥ 4,5:1 sur canevas, cartes, feuilles |
| `action` / `surAction` | `#f47a20` / `#121412` | `#fe7000` / `#121412` | **Aplat** : la seule action principale de l'écran |
| `recordEncre` / `recordFond` / `recordLigne` | `#f47a20`, orange 14 %, 40 % | `#a84800`, orange 10 %, 40 % | **Contour + flèche ↑** : un record |
| `danger` / `dangerEncre` | `#c42443` / `#ff4d6d` | `#c4213f` | Toujours avec un mot ; rouge rosé, loin de l'orange |
| `superset` | `#9a8cf0` | `#5a4bbf` | Repère de superset |

**L'orange ne porte que l'action (aplat) et le record (contour).** Trois exceptions bornées, des
intensités d'effort : la carte du corps, le calendrier (et les jours entraînés de l'Accueil),
l'horloge de salle. Jamais sur les lignes de série, l'onglet actif ou un titre.

## Typographie

- **Barlow** (400–700) pour toute l'interface : texte, boutons, étiquettes, tableaux.
- **L'affiche** : **Barlow Condensed 800 en capitales**, seulement pour les titres de page, le nom
  en tête d'une routine, d'un exercice ou d'une séance, le chrono, l'horloge et les valeurs de
  record. Elle ne se lit bien qu'en grand.
- Échelle : 13 · 16 · 18 · 20 · titre de page 32. Chiffres en `tabular-nums`.

## Forme et espace

- Rayons : **6** (cartes, boutons, cellules, bandeaux), **16** (haut des feuilles), pilule pour
  les puces et l'indicateur d'onglet. Toujours par `rayon`.
- Espacement en base 4 ; marge d'écran 16. Cible tactile **48** au minimum (`CIBLE`).

## Composants qui portent l'identité

- **Barre d'onglets** : Accueil · Routines · rond orange Démarrer / Reprendre · Progrès · Profil ;
  l'onglet actif dans une pilule `surface3` (la forme dit la position).
- **L'horloge de salle** (geste signature) : après chaque coche qui lance un repos, une feuille
  aux deux tiers de l'écran, décompte en affiche orange ~128, « Ensuite », −15 s · +15 s · Passer ;
  glissée vers le bas, elle redevient le bandeau d'une ligne.
- **Badge record** : contour orange, fond teinté, flèche montante.
- **Squelette** : le chargement d'une page dessine ses cartes et pulse doucement.

## Mouvement

150–250 ms, il dit un état, jamais une décoration. `useReducedMotion` remplace les glissements par
des fondus et fige le squelette. On vibre pour confirmer ce qui se fait sans regarder (valider,
fin de repos), par `lib/vibrations.ts`.

## Interdits

Sur-titre au-dessus d'un titre ; liseré coloré de plus de 1 px sur une carte ; gabarit « gros
chiffre, petite étiquette, stats annexes » ; ombre portée décorative ; couleur en dur dans un
écran ; police d'affiche dans un contrôle ; onglet dans un onglet ; plus de deux niveaux de
divulgation.
