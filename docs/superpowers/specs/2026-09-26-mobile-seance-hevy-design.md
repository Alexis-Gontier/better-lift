# Séance en cours façon Hevy — conception

**Date** : 26 septembre 2026 · **Statut** : validée · **Surface** : mobile (Expo Go), `shared`, API,
base (une colonne), web (lecture de la note).

## But

Rendre l'écran de séance aussi direct que celui de Hevy : chaque exercice se lit comme un bloc
compact — image, nom, menu —, sa note, son repos, un tableau de séries aligné, et les actions
rares rangées dans un menu. Les boutons rétrécissent : l'écran actuel, dessiné pour le pouce,
gaspille la hauteur (une série + sa ligne « préc. » occupaient ~90 px).

Les **supersets** sont un lot à part (lot B) : ils demandent `supersetGroupe` sur
`SeanceExercice`, l'envoi, l'historique et l'éditeur de routine. Ici, l'entrée du menu est
visible et désactivée (« bientôt »).

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D86** | **Un bloc par exercice, sans carte** : en-tête (vignette 40 px, nom, ⋯), note, ligne de repos, tableau `Série · Précédent · KG · Reps · ✓`, « + Ajouter une série ». Les blocs sont séparés par un filet, pleine largeur | Hevy ; la carte bordée coûtait des marges sur deux axes |
| **D87** | **Le précédent devient une colonne** de la ligne (« 82,5 × 6 », texte pâle), et non plus une ligne sous la série. L'appui recopie toujours (D59) | Une ligne par série au lieu de deux ; c'est la colonne « Previous » de Hevy |
| **D88** | **Échelle compacte en séance** : cases et ✓ de 36 px (au lieu de 48), police des cases 17, boutons d'action de 36 à 44 px. Le ✓ et l'étiquette de série gagnent 6 px de `hitSlop` (cible de 48) | Demande de l'utilisateur (boutons trop grands). Hevy tient ses lignes à ~40 px ; la cible tactile, elle, ne rétrécit pas |
| **D89** | **Menu ⋯ en feuille basse** : Réorganiser les exercices · Remplacer l'exercice · Superset (désactivé) · Retirer l'exercice (danger, confirmé) | Les actions rares sortent de la carte ; « Retirer » à côté de « + série » provoquait des erreurs de doigt |
| **D90** | **Note libre par exercice**, saisie sous le nom (« Ajouter une note… »), stockée : `SeanceExercice.note` (texte ≤ 500, nullable) | Ce que Hevy met sous le nom ; « siège cran 4 », « prise serrée » servent la fois suivante |
| **D91** | **Repos réglable par exercice** depuis la ligne « ⏱ Repos : 1 min 30 », choix dans une feuille (désactivé, 30 s … 5 min) | Le repos venait seulement de la routine ; une séance libre n'en avait jamais |
| **D92** | **Numéro de série appuyable** : feuille pour choisir le type (Normale, Échauffement, Dégressive, Échec) ou supprimer la série | Hevy ; `retirerSerie` existait sans interface. Pas de glisser pour supprimer : geste caché, conflit avec le défilement |
| **D93** | **Ajouter et remplacer passent par la modale `choisir-exercices`** (multiple pour ajouter, simple pour remplacer, `?mode=remplacer`). La modale inline de `seance.tsx` disparaît | Une seule sélection d'exercices sur mobile, déjà avec images et groupes |
| **D94** | **En-tête compact** : nom, puis trois chiffres Durée · Volume · Séries (`bilanSeance`), « Terminer » en aplat réduit (36 px) | Hevy ; le chrono en 34 pt prenait un cinquième de l'écran |

## Logique — `shared/seance.ts`

Fonctions pures, testées :

- `ExerciceEnCours.note?: string | null` (absent des vieux brouillons : lu comme `null`). La note
  s'écrit **à chaque frappe** : à la sortie du champ, un appui sur ✓ qui garde le clavier ouvert
  la perdait.
- `modifierNote(s, iE, note)` — chaîne vide → `null`.
- `modifierReposExercice(s, iE, reposSec | null)`.
- `deplacerExercice(s, de, vers)`.
- `remplacerExercice(s, iE, slug, nom)` — garde le nombre et le type des séries, vide reps,
  charges et coches, retire `precedent` et la note ; garde le repos.
- `versEnvoi` envoie `note` ; `exerciceEnvoye` l'accepte, optionnelle et nullable (≤ 500).

`modifierSerie` accepte déjà `type` ; `retirerSerie` existe.

## Données

Migration `seance_exercice_note` : `note VARCHAR(500) NULL` sur `SeanceExercice`. Le service
l'écrit à l'envoi et la rend dans le détail d'une séance. Le web et le mobile l'affichent sous le
nom de l'exercice dans l'historique. Un vieux mobile sans le champ reste accepté (D57).

## Écran

```
┌──────────────────────────────────────┐
│ Push mobile                [Terminer]│
│ Durée 12:30 · Volume 2 450 kg · 7    │
├──────────────────────────────────────┤
│ [img] Développé couché à la barre  ⋯ │
│ Ajouter une note…                    │
│ ⏱ Repos : 1 min 30                   │
│ SÉRIE PRÉCÉDENT     KG   REPS    ✓   │
│  É    40 × 10      [40] [10]   [✓]   │
│  1    82,5 × 6     [82,5][6]   [✓]   │
│ [        + Ajouter une série       ] │
├──────────────────────────────────────┤
│ …                                    │
│ [      + Ajouter un exercice       ] │
│        Abandonner la séance          │
└──────────────────────────────────────┘
```

- Nom de l'exercice à l'encre (le lime en texte reste le registre du record).
- Série faite : ligne teintée `accentLavis`, ✓ en aplat lime (inchangé).
- Numéro : `É`, `D`, `X` pour les types, le rang sinon (compté hors échauffement, comme Hevy).
- Réorganiser : une modale `app/reorganiser.tsx`, liste compacte avec poignées
  (`react-native-draggable-flatlist`, déjà en place), qui rend l'ordre par un canal comme
  `lib/choix-exercices.ts`.
- Le bandeau de repos passe sur **une seule ligne** : −15 · temps (30) · +15 · Passer. Il ne masque
  plus qu'une série.

## Hors périmètre

Supersets (lot B) ; reprise automatique de la note de la dernière fois ; minuteur de repos en
notification système.

## Tests

`shared` : chaque nouvelle fonction, `versEnvoi` avec note, schéma avec et sans note. API :
l'envoi stocke la note, le détail la rend. Écran vérifié sur l'émulateur.
