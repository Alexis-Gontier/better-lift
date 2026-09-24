# better-lift — Lot 7 : l'historique et les records

**Date :** 24 septembre 2026
**Critère de sortie :** l'historique et les meilleures charges sont consultables ; pendant une
séance, on voit ce qu'on a fait la dernière fois.

Registre à partir de **D63**.

## 1. L'état de départ

- L'écran d'historique web existe depuis le lot 2 (liste et détail sur factices), avec le cas
  piège du fuseau (séance à 23 h 30 à Paris, qui doit rester au bon jour).
- `FUSEAU` y est dupliqué dans deux fichiers, et le volume s'affiche en « t » codé en dur — le
  piège des unités du § 13.
- Les séances sont en base depuis le lot 6 ; `BadgeRecord` (D28) attend ses données.

## 2. Les décisions

| | Décision | Pourquoi |
|---|---|---|
| **D63** | **Records à la Hevy** : charge max, 1RM estimé (Epley, D4), meilleure série en volume ; au poids du corps, reps max. Séries faites, hors échauffement | Choix délégué à l'agent, sur le modèle de Hevy demandé par l'utilisateur |
| **D64** | **Un badge marque le record battu À CE MOMENT-LÀ**, pas le record actuel | C'est l'événement qu'on veut revoir ; un record battu depuis ne l'efface pas |
| **D65** | **Tout est dérivé à la lecture** (D13) : aucune table de records | Corriger une séance ne demande aucun recalcul |
| **D66** | **Fuseau `Europe/Paris` fixé en un seul endroit** (`apps/web/src/lib/fuseau.ts`) | Même logique que D52, en attendant un profil |
| **D67** | **« La dernière fois » en indication sur mobile**, copiée dans le brouillon au démarrage | Disponible hors ligne et après un arrêt forcé ; les cases gardent les cibles (D59) |
| **D68** | **Historique sur le web seulement** | Le web est l'atelier d'analyse |

## 3. La logique partagée (`shared/records.ts`, TDD)

```ts
type SerieHisto = { type: TypeSerie; reps: number | null; chargeKg: number | null; faite: boolean };
type TypeRecord = "CHARGE" | "UN_RM" | "VOLUME" | "REPS";
type Record_ = { type: TypeRecord; valeur: number; reps: number; chargeKg: number | null; date: string };

compte(s): boolean                       // faite, hors échauffement, reps > 0
recordsDe(series: (SerieHisto & { date })[]): Record_[]   // chronologique ; au poids du corps : REPS seul
marquerRecords(avant: Record_[], series: SerieHisto[]): TypeRecord[][]  // par série, les records battus
```

Égalité : un record n'est battu que s'il est **strictement** dépassé (à charge max égale, plus de reps).

## 4. L'API (session requise)

| Route | Rend |
|---|---|
| `GET /seances?page` | Résumés antéchronologiques : id, nom, debut, fin, séries faites, volume (D58) |
| `GET /seances/:id` | Détail ; chaque série porte `records: TypeRecord[]`, calculés contre l'historique antérieur |
| `GET /seances/precedentes?slugs=a,b` | Par slug, les séries faites de la dernière séance qui le contenait |
| `GET /exercices/:slug/records` | Les records actuels de l'utilisateur sur cet exercice |

`/seances/precedentes` est déclarée avant `/seances/:id`.

## 5. Le web

Écran du lot 2 branché ; volume par `formaterCharge` ; `FUSEAU` unique ; `BadgeRecord` reçoit le
type de record. Fiche d'exercice : le bloc « Record » affiche les records actuels et leur date.

## 6. Le mobile

`ExerciceEnCours.precedent?: { reps, chargeKg }[]`, rempli au démarrage par
`/seances/precedentes` (échec réseau : pas d'indication, jamais de blocage). Sous chaque série :
« préc. 82,5 × 6 » ; un appui recopie dans les cases.

## 7. Découpage

| PR | Contenu |
|---|---|
| **1** | `records.ts`, les quatre routes, historique web, records dans la fiche d'exercice |
| **2** | « La dernière fois » sur mobile, validé sur l'émulateur |

## 8. Hors périmètre

Courbes, calendrier d'activité, historique mobile, modification ou suppression d'une séance.
