# better-lift — Lot 5 : les routines

**Date :** 24 septembre 2026
**Portée :** éditeur de routines web (dessin puis branchement), modèle, API protégée.
**Critère de sortie :** une séance se prépare à l'avance — on crée, modifie, réordonne et
supprime une routine, et elle survit au rechargement.

Complète la conception principale et poursuit le registre à partir de **D47**.

---

## 1. L'état de départ, vérifié

- **Aucun modèle de routine dans le schéma.** La conception principale les disait « repris,
  inchangés » ; le lot 0 n'a repris que le catalogue et Better Auth. Ils sont à créer.
- **Le lot 2 n'a dessiné qu'une lecture** (liste, détail) sur des routines factices décrites
  *par exercice* (« 4 × 6–8 »). **L'éditeur n'a jamais été dessiné**, alors que le jalon exige
  création, modification, suppression et réordonnancement.
- **L'API n'a pas de garde de session** : le catalogue n'en avait pas besoin (lot 4).
- `shared` porte déjà `kgToLb`, `lbToKg` et `UnitSystem`.

## 2. Les décisions

| | Décision | Pourquoi |
|---|---|---|
| **D47** | **Cibles série par série** : chaque série a son type, ses reps et sa charge, optionnels | Choix de l'utilisateur ; c'est ce que la séance (lot 6) pré-remplira ligne à ligne |
| **D48** | **Glisser-déposer des exercices** avec `@dnd-kit/sortable`, clavier compris. **Les séries ne se glissent pas** | Pas de contexte imbriqué, donc pas le piège du § 13 de la conception principale |
| **D49** | **L'éditeur vit dans le panneau détail**, `?id=…&edition=1` | La coquille à trois panneaux reste entière, et l'édition survit au rechargement |
| **D50** | **Un `PUT` remplace la routine entière**, exercices et séries, dans une transaction | Trois comptes, aucun conflit d'écriture : une route par série serait du code pour rien |
| **D51** | **Suppression réelle**, pas de `deletedAt` | Une séance est un instantané indépendant (lot 6) : rien ne pointe vers la routine qu'il faille préserver |
| **D52** | **La charge est stockée en kg et passe par `formaterCharge` / `lireCharge` de `shared`**, le système d'unités étant fixé à `metric` en un seul endroit tant qu'aucun profil n'existe | Tient la règle « tout affichage de charge passe par le système d'unités » sans inventer le profil |
| **D53** | **Toutes les routes de routines exigent une session** ; la routine d'un autre répond **404**, jamais 403 | On ne révèle pas l'existence de ce qui ne nous appartient pas |
| **D54** | **Deux PR** : l'éditeur dessiné sur données factices et validé à l'écran, puis le branchement | D25 : l'interface passe avant la logique |

## 3. Le modèle

```prisma
enum TypeSerie { ECHAUFFEMENT NORMALE ECHEC DEGRESSIVE }

model Routine {
  id        String   @id @default(cuid())
  userId    String
  nom       String   @db.VarChar(120)
  position  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercices RoutineExercice[]
  @@index([userId, position])
}

model RoutineExercice {
  id             String   @id @default(cuid())
  routineId      String
  exerciseId     String
  position       Int
  reposSec       Int?
  supersetGroupe Int?     // D11 : porté par le modèle, absent de l'interface
  routine        Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exercise       Exercise @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
  series         RoutineSerie[]
  @@unique([routineId, position])
}

model RoutineSerie {
  id                String          @id @default(cuid())
  routineExerciceId String
  position          Int
  type              TypeSerie       @default(NORMALE)
  repsCible         Int?
  chargeCibleKg     Decimal?        @db.Decimal(7, 2)
  exercice          RoutineExercice @relation(fields: [routineExerciceId], references: [id], onDelete: Cascade)
  @@unique([routineExerciceId, position])
}
```

`exercise` en `Restrict` : un exercice du catalogue n'est jamais supprimé, il s'archive.

## 4. Le contrat (`shared`)

- `routineSaisie` (Zod) — ce que l'éditeur envoie : `nom` (1–120), `exercices[]` ordonnés, chacun
  `{ slug, reposSec?, series[] }`, chaque série `{ type, repsCible?, chargeCibleKg? }`. Bornes :
  1–50 exercices, 1–20 séries, reps 0–999, charge 0–1000 kg. L'ordre du tableau **est** la
  position : le client n'envoie aucune position.
- `ordreRoutines` — `{ ids: string[] }`.
- `formaterCharge(kg, systeme)` et `lireCharge(texte, systeme)` (D52), en TDD.

## 5. L'API

| Route | Effet |
|---|---|
| `GET /routines` | Résumés : `id`, `nom`, `nbExercices`, `nbSeries`, ordonnés par `position` |
| `GET /routines/:id` | Détail complet, exercices avec leur nom français |
| `POST /routines` | Crée, en dernière position ; rend l'`id` |
| `PUT /routines/:id` | Remplace nom, exercices et séries dans une transaction (D50) |
| `DELETE /routines/:id` | Supprime (D51) |
| `PUT /routines/ordre` | Réordonne la liste |

Un middleware `exigerSession` lit la session Better Auth et pose `userId` dans le contexte ;
sans session, **401**. Le service reçoit `userId` en argument et ne connaît pas Hono. Toute requête
filtre par `userId` ; une routine d'autrui est introuvable, donc **404** (D53). Un slug d'exercice
inconnu rend **400**.

## 6. L'éditeur (web)

Dans le panneau détail, `?id=…&edition=1` ; une routine neuve est `?id=nouvelle&edition=1`.

- **En-tête** : champ du nom ; « Enregistrer » (aplat), « Annuler », « Supprimer » (danger, avec
  confirmation dans un dialogue).
- **Exercices** : des cartes réordonnables par glisser-déposer (poignée), au clavier aussi. Chaque
  carte : nom français, repos optionnel, bouton retirer, et le **tableau des séries** — type (menu),
  reps, charge — avec « + série » (qui recopie la précédente) et une suppression par ligne.
- **« + exercice »** ouvre un dialogue de recherche qui réutilise le catalogue (bilingue, sans
  accents).
- **État local** : l'éditeur travaille sur une copie ; rien ne part tant qu'on n'enregistre pas.
- **Quatre états** : chargement, erreur, vide (« aucune routine — en créer une »), nominal ; plus
  l'éditeur d'une routine neuve.

La lecture (détail hors édition) affiche chaque série ligne à ligne ; la liste garde son résumé.

## 7. Découpage

| PR | Contenu | Validation |
|---|---|---|
| **1** | `formaterCharge`/`lireCharge`, éditeur dessiné sur factices, dnd-kit, quatre états | **L'utilisateur valide l'éditeur à l'écran** |
| **2** | Schéma et migration, contrat, `exigerSession`, service, routes, requêtes, branchement | `/verif`, vérification Playwright |

## 8. Tests

- **TDD** : `formaterCharge`, `lireCharge`, `routineSaisie` (bornes, ordre), le service sur ses
  fonctions pures (construction des lignes à écrire depuis la saisie).
- **Routes** avec un dépôt injecté et une session simulée : 401 sans session, 404 sur la routine
  d'autrui, 400 sur un slug inconnu.
- **À l'écran** : créer, réordonner, recharger, modifier, supprimer.

## 9. Hors périmètre

Dossiers, supersets dans l'interface, notes, avertissement sur modifications non enregistrées,
démarrer une séance (lot 6), mobile (lot 6), statistiques d'usage (`lastPerformedAt`).
