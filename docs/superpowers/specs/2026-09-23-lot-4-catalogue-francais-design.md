# better-lift — Lot 4 : le catalogue français

**Date :** 23 septembre 2026
**Portée :** glossaire, traduction des 1 324 noms, semis, API du catalogue, extraction de
`packages/api-client`, branchement des écrans du lot 2.
**Critère de sortie :** n'importe quel exercice se retrouve, en français, et sans accents à la
saisie.

Ce document complète la conception principale
[`2026-09-22-better-lift-redemarrage-design.md`](2026-09-22-better-lift-redemarrage-design.md),
dont la section 7 pose le cadre, et poursuit le registre des décisions à partir de **D37**.

---

## 1. L'état de départ, vérifié

La branche Neon `dev` porte le schéma mais **zéro exercice** : le semis part de rien, il n'y a
aucune migration de données à faire.

Le dataset cloné dans `Desktop/dev/exercises-dataset` contient 1 324 entrées. Ce qui s'y trouve
déjà en français, et qu'il ne faut donc pas retraduire :

- **`instructions.fr`** — présente pour les 1 324.
- **`instruction_steps.fr`** — un tableau d'étapes pour les 1 324, **déjà au tutoiement**
  (« Allonge-toi sur le dos, les genoux fléchis… »), ce qui correspond au ton du projet.

Ce qui est en anglais, et qu'il faut traduire :

| Surface | Volume | Nature |
|---|---|---|
| Noms d'exercices | **1 324** noms, **566 mots distincts** | Le chantier |
| Équipements | 28 | Vocabulaire fixe |
| Muscles secondaires | 40 | Vocabulaire fixe |
| Muscles cibles | 19 | Vocabulaire fixe |
| Parties du corps | 10 | Vocabulaire fixe, **reste une enum anglaise** (§ 4) |

Les 97 termes des vocabulaires fixes s'écrivent à la main, une fois. Seuls les noms demandent une
chaîne.

## 2. Les décisions de ce lot

| | Décision | Pourquoi |
|---|---|---|
| **D37** | **Glossaire versionné + `traductions.json` versionné**, produits en deux temps | Une correction sur un nom irrégulier doit pouvoir vivre sans tordre une règle générale |
| **D38** | **La couverture du glossaire est un test**, pas une relecture | Un mot non traduit doit faire échouer la suite, pas dormir dans la longue traîne |
| **D39** | **Colonne `nomRecherche` normalisée**, remplie au semis | « developpe couche » doit trouver « Développé couché » |
| **D40** | **`normaliserRecherche` vit dans `shared`** et sert des deux côtés | Si l'écriture et la lecture normalisent différemment, rien ne se trouve |
| **D41** | **`bodyPart` reste une enum anglaise** ; le libellé français vient de `shared` | Une clé de données n'est pas un affichage |
| **D42** | **`packages/api-client` est extrait ici** | C'est le lot où deux surfaces consomment les mêmes routes |
| **D43** | **Deux PR sous un même lot** : fabriquer le catalogue, puis le servir | Mêler 1 324 lignes de français à du TypeScript rend les deux illisibles |

---

## 3. La chaîne de traduction

### Trois artefacts, deux temps

**Le glossaire porte des locutions, pas seulement des mots.** `bench press` se rend par
`développé couché` d'un bloc ; le traduire mot à mot donnerait « banc presse ». La substitution
procède donc **de la locution la plus longue à la plus courte**, et le test de couverture du § 3
se fait sur ce qui reste une fois les locutions consommées — sans quoi il exigerait une entrée
pour `bench` seul, qui n'a pas de traduction utile hors contexte.

Dans `packages/db/catalogue/` :

```
glossaire.json      mot ou locution anglaise -> français. Relu AVANT la passe.
traduire.ts         applique le glossaire une fois, produit le fichier suivant.
traductions.json    id du dataset -> nom français. COMMITÉ.
```

**`traduire.ts` ne tourne pas au semis.** Il tourne à la main, quand le glossaire change, et son
résultat est commité. Le semis ne fait que lire `traductions.json`. Conséquences voulues :

- deux semis donnent le même catalogue, sans dépendre du code de traduction du jour ;
- une correction sur un nom irrégulier s'écrit dans `traductions.json` et **se relit en diff** ;
- le glossaire reste un fichier de règles, que personne n'a besoin de tordre pour corriger un cas.

Le glossaire est relu **avant** la passe de masse, parce qu'une erreur y est multipliée :
`Dumbbell` ouvre 286 noms, `curl` en touche 180, `press` 164, `barbell` 158, `cable` 156.

### La précision, rendue vérifiable

La spec principale disait « la longue traîne se corrige à l'usage ». C'est une politique
raisonnable pour la *qualité* d'une traduction, mais pas pour son *exhaustivité* : un nom resté à
moitié anglais ne se corrige à l'usage que le jour où on le cherche, c'est-à-dire trop tard.

**D38 remplace cet espoir par un test.** Deux invariants, dans la suite de `packages/db` :

1. **Couverture** — une fois les locutions du glossaire consommées de la plus longue à la plus
   courte, **il ne doit rester aucun mot inconnu** dans les 1 324 noms. Le message d'échec nomme le
   mot et un exercice qui le porte, pour qu'on sache quoi ajouter et dans quel contexte.
2. **Résidu** — aucun nom de `traductions.json` ne contient encore un mot du glossaire sous sa
   forme anglaise.

Ces deux tests transforment « on verra à l'usage » en « la CI refuse ». Ils ne garantissent pas
qu'une traduction soit *bonne* — seule la relecture le fait — mais ils garantissent qu'aucune ne
soit *absente*.

### Le registre

**Le français d'usage**, comme le fixe la spec principale : les anglicismes réellement employés en
salle sont conservés, parce que ce sont eux qu'on tape dans une recherche. `curl` reste `curl`,
`squat` reste `squat`, `pushdown` reste `pushdown`. Personne ne cherche « flexion des avant-bras ».

---

## 4. Le schéma

`Exercise` gagne une colonne :

```prisma
nomRecherche String  // nom dépouillé de ses accents, en minuscules. Rempli au semis.
@@index([nomRecherche])
```

Un index B-tree ordinaire suffit, et **aucune extension PostgreSQL n'est requise** — pas de
`unaccent` à activer sur chaque branche Neon, pas d'index d'expression, et un comportement
identique en local, en CI et sur Neon.

`bodyPart` **reste l'enum anglaise existante** (`CHEST`, `BACK`, `UPPER_LEGS`…). C'est une clé de
données : elle sert aux filtres, aux index et aux URL, et elle ne doit pas changer parce qu'un
libellé change. Le français vient d'une table de correspondance dans `shared`, déclarée
`Record<BodyPart, string>` — **TypeScript refuse alors de compiler si une valeur de l'enum n'a pas
de libellé**, ce qui rend l'exhaustivité structurelle plutôt que surveillée.

`equipment`, `target` et `secondary` restent des chaînes, et stockent **le français** : le
catalogue est aplati et sans table de traductions (D20), donc rien ne justifie de garder l'anglais
en base.

---

## 5. La recherche

```ts
// packages/shared/src/recherche.ts
export function normaliserRecherche(s: string): string;
```

Dépouille les diacritiques (`NFD` puis retrait de `\p{Diacritic}`), met en minuscules, détoure.

**Le point qui fait tout : la même fonction sert à l'écriture et à la lecture.** Le semis la passe
sur le nom pour remplir `nomRecherche` ; la requête la passe sur la saisie avant de comparer. Si
les deux normalisaient différemment — ne serait-ce qu'une casse — la colonne serait inutile et
rien ne se trouverait. C'est pour cette raison qu'elle vit dans `shared` et nulle part ailleurs,
et qu'elle est écrite en TDD.

Les cas que les tests doivent tenir : accents (`developpe` → `développé`), casse, espaces autour,
apostrophes, et le fait qu'une chaîne déjà normalisée le reste (idempotence).

---

## 6. L'API et le branchement

Deux routes, `services/` portant la logique et ne connaissant jamais le contexte Hono :

- **liste** — recherche (`q`), filtres (`groupe`, `equipement`), pagination. La recherche compare
  `nomRecherche` à la saisie normalisée.
- **détail par slug** — le slug est stable et lisible, et c'est lui qui vit dans l'URL du web.

**`packages/api-client` est extrait ici** (D42), et c'est le lot où il gagne sa raison d'être : la
spec principale avait explicitement reporté sa création faute d'un second consommateur. Le client
RPC quitte `apps/web/src/lib/api.ts` pour le paquet, et les deux surfaces l'importent. L'extraction
est mécanique — le fichier déménage.

Les écrans du lot 2 troquent ensuite `EXERCICES` factice contre `useQuery`. Les quatre états
restent atteignables par `?etat=` et **cessent d'être des simulations** : chargement et erreur
deviennent réels. C'est le moment de vérité de la méthode du lot 2 — si le dessin était juste,
le branchement ne découvre rien.

**Le piège des clés de cache** s'applique dès ici : toute donnée présente dans la clé de lecture
doit l'être dans la clé d'écriture. Une recherche ou un filtre absent de la clé fait afficher les
résultats précédents.

---

## 7. La coupe en deux PR

| PR | Contenu | Se relit en lisant |
|---|---|---|
| **1** | Glossaire, `traduire.ts`, `traductions.json`, migration `nomRecherche`, semis, tests de couverture | du français |
| **2** | `normaliserRecherche`, routes, `api-client`, branchement des trois écrans | du TypeScript |

Mêler 1 324 lignes de traduction à du code rend les deux illisibles : on ne relit pas une
traduction avec les yeux qu'on met sur une requête. Chacune produit du logiciel qui tient debout
seule — après la PR 1, le catalogue est en base et interrogeable à la main ; après la PR 2, il est
à l'écran.

---

## 8. Tests

**En TDD, parce qu'un test y attrape vraiment quelque chose :**

- `normaliserRecherche` dans `shared` — accents, casse, espaces, idempotence.
- Les libellés français des vocabulaires fixes — exhaustivité tenue par le typage pour `bodyPart`,
  par un test pour les trois autres.

**Tests de données, propres à ce lot :** couverture du glossaire et absence de résidu anglais
(§ 3). Ils portent sur des fichiers, pas sur du comportement, et c'est délibéré : le risque de ce
lot est un trou dans les données, pas un bug de logique.

**Testé côté API :** que la recherche sans accents trouve l'exercice accentué. C'est le critère de
sortie réduit à une assertion.

**Vérifié en exécutant :** les trois écrans branchés, avec leurs quatre états devenus réels, et la
recherche tapée à la main dans la liste.

---

## 9. Pièges connus de ce lot

- **Le semis doit être rejouable.** Un `upsert` sur le slug, jamais un `create` : relancer le
  semis ne doit ni dupliquer ni échouer.
- **Les 1 324 lignes en une transaction** sont lentes sur Neon depuis Francfort ; semer par lots.
- **`gif_url` est présent pour les 1 324**, mais pointe vers un dépôt tiers. Le stocker tel quel
  au lot 4 ; décider de l'héberger ou non est une question de lot 7, pas d'ici.
- **La branche Neon visée** : `dev`, jamais `production`. Le `.env` n'est pas lisible par l'agent —
  vérifier l'endpoint par l'API Neon avant toute migration, comme au lot 3.
- **Turborepo filtre l'environnement** : toute variable nouvelle doit être déclarée dans la tâche
  de `turbo.json`, pas seulement posée sur l'étape du workflow.

---

## 10. Hors périmètre

- **L'hébergement des images et des GIF** — lot 7 ou jamais.
- **La recherche floue** (tolérance aux fautes de frappe) — la normalisation des accents couvre le
  cas fréquent ; le reste attendra qu'il manque vraiment.
- **Les exercices personnalisés** créés par l'utilisateur — hors du catalogue, et hors de ce lot.
- **Les routines et les séances côté serveur** — lots 5 et 6.
