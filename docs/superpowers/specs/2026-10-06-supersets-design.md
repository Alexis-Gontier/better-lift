# Supersets — conception

**Date** : 6 octobre 2026 · **Statut** : validée (arbitrages du 6 octobre) · **Surfaces** : base (une
colonne), `shared`, API, web (éditeur de routine, relevé de séance), mobile (éditeur et page de
routine, séance, détail d'une séance).

Le « lot B » annoncé par [`2026-09-26-mobile-seance-hevy-design.md`](2026-09-26-mobile-seance-hevy-design.md).
Révise **D11** (« portés par le modèle, absents de l'interface ») : les supersets entrent dans
l'interface.

## But

Regrouper deux exercices **consécutifs** ou plus en superset, comme dans Hevy. On les enchaîne sans
repos, et le repos ne vient qu'au bout du tour. Le groupe se crée et se défait dans l'éditeur de
routine (web et mobile) ou en séance (mobile), se voit partout et se relit dans l'historique.

## État de départ (vérifié le 6 octobre)

- `RoutineExercice.supersetGroupe Int?` existe en base (migration `20260924144755_routines`), et
  rien ne le lit ni ne l'écrit.
- `SeanceExercice` n'a pas la colonne.
- `routineSaisie` / `exerciceSaisi` (`shared/routines.ts`, `z.object`, non strict) et
  `seanceSaisie` / `exerciceEnvoye` (`shared/seance.ts`, `looseObject`, D57) ne portent pas le
  champ.
- Le menu ⋯ d'un exercice en séance a une entrée inerte « Ajouter à un superset »
  (`apps/mobile/components/seance/carte-exercice.tsx`, `inactive: "bientôt"`).

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D145** | **Données** : `SeanceExercice.supersetGroupe Int?` (migration `seance_exercice_superset`). Le champ est **facultatif** dans `exerciceSaisi` (routine) et `exerciceEnvoye` (séance) : `z.number().int().min(1).max(100).nullable().optional()`. Absent, il vaut `null`. Démarrer une routine (`demarrerDepuisRoutine`) et refaire une séance recopient les groupes. Records et « la dernière fois » ne changent pas : ils restent calculés par exercice | Une séance en file d'une ancienne version du mobile (D56, D95–D100) doit toujours passer ; elle se relit simplement sans groupe |
| **D146** | **Un groupe est une suite consécutive d'exercices portant le même numéro.** `normaliserGroupes` (`shared/supersets.ts`) : coupe un numéro qui reparaît plus loin (la seconde suite devient un autre groupe), remet à `null` une suite d'un seul exercice, renumérote 1…n dans l'ordre d'apparition. Les clients normalisent après chaque opération ; **l'API normalise à l'écriture** (routine comme séance) au lieu de refuser | La colonne `Int?` existe déjà. Corriger plutôt que rejeter, comme D57 : un groupe mal formé ne doit jamais faire perdre une séance. Écarté : un booléen « lié au suivant », consécutif par construction, mais il faudrait remplacer une colonne existante |
| **D147** | **Opérations** (génériques sur `{ supersetGroupe?: number \| null }`, donc les mêmes pour le brouillon de routine et la séance) : **Superset avec le suivant** lie `i` à `i + 1` et fusionne leurs groupes s'ils en ont : c'est ainsi qu'on fait un groupe de 3 ou plus. **Retirer du superset** : l'exercice repasse à `null`, et s'il était au milieu il se place juste après le groupe, pour que le reste demeure d'un seul tenant. **Défaire le superset** : tout le groupe repasse à `null`. Pas de limite propre au nombre d'exercices d'un groupe | Pas de choix libre « superset avec n'importe quel exercice » comme dans Hevy : il oblige à déplacer des exercices en silence. « Avec le suivant », répété au besoin, reste prévisible |
| **D148** | **Ce que deviennent les groupes.** *Réordonner* : l'exercice déplacé quitte son groupe ; posé **entre deux membres** d'un autre groupe, il le rejoint ; posé sur un bord ou entre deux groupes, il reste seul. *Retirer un exercice* : le groupe se resserre ; réduit à un seul, il disparaît. *Remplacer* : même place, même groupe. *Ajouter* : en fin de liste, hors de tout groupe | Une règle par geste, et toutes finissent par `normaliserGroupes` : un groupe n'est jamais coupé en silence |
| **D149** | **Repos : il part quand le tour est complet.** Le tour *k* d'un groupe est formé des *k*-ièmes séries (position dans le tableau, échauffements compris) de ses exercices qui en ont une. Cocher une série d'un groupe lance le repos **seulement si son tour est alors entièrement coché**, dans n'importe quel ordre de coche. Durée : le repos du **dernier** exercice du groupe, avec en repli le repos par défaut du compte (D128). Le repos des autres membres est **gardé mais masqué** (il revient si on défait le groupe) ; en séance comme dans l'éditeur, la puce n'apparaît que sur le dernier : « Repos après le groupe » | Le comportement de Hevy. Le tour, plutôt que « une coche sur le dernier », reste juste quand on coche dans le désordre ou que les nombres de séries diffèrent |
| **D150** | **Navigation en séance : tour par tour.** `prochaineSerie` parcourt un groupe en alternant les exercices (A1, B1, A2, B2…) et saute un exercice qui n'a plus de série à ce rang ; hors des groupes, l'ordre ne change pas. Le repère « prochaine » (D116) et le défilement automatique existants font le reste : aucun écran nouveau | Après A1, l'écran descend vers B1, comme dans Hevy, sans geste en plus |
| **D151** | **Repère visuel, identique sur les deux surfaces** : un **filet vertical continu de 3 px** à gauche des blocs du groupe et une **étiquette « Superset A »** en tête, en petites capitales. Les groupes sont lettrés A, B… dans l'ordre de la séance ou de la routine ; les lettres distinguent deux groupes voisins. Nouveau rôle de couleur **`superset`** (violet ardoise, ≈ `#9a8cf0` en sombre, `#5a4bbf` en clair, valeurs fixées après mesure : 3:1 au moins pour le filet, 4,5:1 pour l'étiquette sur sa surface), ajouté à `Couleurs` (mobile) et en `--superset` (web) | Ni lime (action, record) ni `--danger`. Un filet plutôt qu'une carte : le bloc de séance reste pleine largeur (D86) |
| **D152** | **Où l'on agit.** Menu ⋯ d'un exercice, en séance (l'entrée « bientôt » devient active) et dans les éditeurs web et mobile : « Superset avec le suivant » (inactif sur le dernier exercice) ou, dans un groupe, « Retirer du superset ». Le toucher ou le menu de l'étiquette « Superset A » : « Défaire le superset » | Les actions rares restent dans le menu (D89) |
| **D153** | **Historique** : l'API rend `supersetGroupe` dans le détail d'une séance (`GET /seances/:id`). Le relevé comparé du web (D140) et le détail d'une séance sur le mobile (D123) montrent le même filet et la même étiquette. Fil, aperçu (`apercuExercices`), export CSV et stats restent tels quels | Une séance faite en superset se relit comme telle ; le reste n'en dit rien d'utile |

## Logique — `shared/supersets.ts`

Fonctions pures et immuables, testées, génériques sur
`T extends { supersetGroupe?: number | null }` :

- `normaliserGroupes(liste)` (D146).
- `groupes(liste)` : les suites, `{ debut, fin, lettre }[]`, pour l'affichage (filet, étiquette,
  « dernier du groupe »).
- `lierAuSuivant(liste, i)`, `retirerDuGroupe(liste, i)`, `defaireGroupe(liste, i)` (D147).
- `deplacerAvecGroupes(liste, de, vers)` (D148), que réutilisent `deplacerExercice` de `seance.ts`
  et les éditeurs.

Dans `seance.ts` :

- `ExerciceEnCours.supersetGroupe?: number | null` (absent d'un vieux brouillon : `null`).
- `validerSerie` applique D149 ; `prochaineSerie` applique D150.
- `retirerExercice`, `remplacerExercice`, `deplacerExercice`, `ajouterExercice` suivent D148.
- `versEnvoi` envoie `supersetGroupe` normalisé.
- Les opérations de D147 s'exposent sur la séance (`lierExercices`, `delierExercice`,
  `defaireSuperset`).

Dans `brouillon-routine.ts` : `ExerciceBrouillon.supersetGroupe`, lu par `versBrouillon`, écrit par
`versSaisie` (normalisé), compté par `empreinte`. Dans `routines.ts` : `ExerciceRoutine.supersetGroupe`
(lecture), `exerciceSaisi.supersetGroupe` (écriture).

## API

- Routines : le service écrit `supersetGroupe` (normalisé) et le rend dans le détail.
- Séances : le service écrit `supersetGroupe` (normalisé) à l'envoi et le rend dans le détail ;
  un envoi sans le champ reste accepté.

## Écrans

```
Séance mobile                         Éditeur (web ou mobile)
┃ SUPERSET A                          ┃ SUPERSET A                  ⋯
┃ [img] Développé couché          ⋯   ┃ [img] Développé couché      ⋯
┃  1  80×8   [80][8]  [✓]             ┃   3 × 8 · 80 kg
┃  2  80×8   [80][8]  [ ]             ┃ [img] Tirage horizontal     ⋯
┃ [img] Tirage horizontal         ⋯   ┃   3 × 10 · 60 kg
┃ ⏱ Repos après le groupe : 2 min    ┃   ⏱ Repos après le groupe : 2 min
┃  1  60×10  [60][10] [▢] ← prochaine
┃  2  60×10  [60][10] [ ]             [img] Curl (hors groupe)       ⋯
```

- **Séance mobile** : filet et étiquette autour des blocs du groupe ; puce de repos sur le dernier
  seulement ; menu ⋯ (D152). La réorganisation (`app/reorganiser.tsx`) montre la lettre du groupe
  à côté de chaque nom.
- **Éditeurs** : même repère ; le glisser applique D148. La page d'une routine sur le mobile (D122)
  montre aussi le groupe.
- **Historique** : même repère dans le relevé (web) et le détail (mobile).
- Les quatre états du web ne changent pas : le groupe vient avec les données.

## Lots

Une branche et une PR par lot, `/verif` avant chaque PR.

1. **Données et contrat** : migration (branche Neon `dev`, base `betterlift`), `shared/supersets.ts`,
   contrats, `seance.ts`, `brouillon-routine.ts`, services et routes de l'API, tests. L'API part en
   premier : un client plus récent ne trouve jamais une API qui ignore le champ.
2. **Éditeur de routine** (web et mobile) et page d'une routine (mobile) ; le rôle `superset` naît
   ici.
3. **Séance mobile.**
4. **Historique** (web et mobile).

## Hors périmètre

Choix libre du partenaire de superset ; repos propre au groupe (champ dédié) ; groupe dans le fil,
l'aperçu, l'export CSV et les stats ; circuits (tours avec repos entre chaque exercice).

## Tests

- `shared` : chaque opération de `supersets.ts` (groupes de 2, 3, voisins, coupés, à un seul) ;
  `validerSerie` (tour complet dans l'ordre et dans le désordre, nombres de séries inégaux, repos
  du dernier, repli sur le repos par défaut) ; `prochaineSerie` tour par tour ; `versEnvoi` ;
  schémas avec et sans le champ ; brouillon de routine aller-retour.
- API : une routine et une séance écrites avec un groupe le rendent normalisé ; une séance envoyée
  sans le champ passe.
- Écrans : Playwright pour le web (compte de contrôle, sans effacer la démo) ; pour le mobile, une
  liste de vérifications sur le téléphone à chaque lot.
