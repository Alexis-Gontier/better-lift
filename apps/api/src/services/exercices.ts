import { prisma } from "@better-lift/db";
import type { ExerciceDetail, ExerciceResume, Groupe, RequeteCatalogue } from "@better-lift/shared";
import { CIBLES, EQUIPEMENTS_PRINCIPAUX, normaliserRecherche } from "@better-lift/shared";

/**
 * Le catalogue, côté métier. Ce module ne connaît pas Hono : il ne voit ni
 * requête, ni contexte, ni code de statut.
 *
 * Il est coupé en deux à dessein. Les fonctions PURES portent tout ce qui peut
 * se tromper — le filtre, la projection — et se testent sans base, ce qui compte
 * parce que la CI n'en a pas. Le DÉPÔT ne fait que les appels Prisma, et c'est
 * lui qu'un test de route remplace par un double.
 */

/** Ce qu'on lit en base. Les champs sont ceux du modèle, donc en anglais. */
export type LigneExercice = {
  slug: string;
  /** Le nom anglais du dataset (D44). */
  name: string;
  nomFr: string;
  /** Les deux noms normalisés (`texteRecherche`), écrits par le semis. */
  nomRecherche: string;
  bodyPart: Groupe;
  equipment: string;
  target: string;
  secondary: string[];
  instructions: string[];
  gifUrl: string | null;
};

// `gifUrl` entre dans le résumé : l'image fixe de la liste s'en déduit.
const CHAMPS_RESUME = {
  slug: true,
  nomFr: true,
  nomRecherche: true,
  bodyPart: true,
  equipment: true,
  target: true,
  gifUrl: true,
} as const;
const CHAMPS_DETAIL = {
  ...CHAMPS_RESUME,
  name: true,
  secondary: true,
  instructions: true,
} as const;

export function filtreCatalogue(requete: RequeteCatalogue): Record<string, unknown> {
  const filtre: Record<string, unknown> = { archivedAt: null };

  // LA ligne qui fait tout marcher : la colonne contient les deux noms passés
  // par `normaliserRecherche` (via `texteRecherche`), la saisie doit donc y
  // passer aussi. Comparer la saisie brute ne rendrait jamais rien — et sans
  // erreur pour le dire.
  if (requete.q) filtre.nomRecherche = { contains: normaliserRecherche(requete.q) };
  if (requete.groupe) filtre.bodyPart = requete.groupe;
  if (requete.equipement) filtre.equipment = requete.equipement;
  if (requete.cible) filtre.target = requete.cible;
  if (requete.slugs) filtre.slug = { in: requete.slugs };

  return filtre;
}

/**
 * L'image fixe d'un exercice. Le dataset publie, pour chaque animation
 * `videos/<id>.gif`, une image `images/<id>.jpg` au même commit : on la déduit
 * plutôt que de la stocker (D46 — rien n'est copié, et pas de migration).
 */
export function imageDe(gifUrl: string | null): string | null {
  if (!gifUrl) return null;
  const image = gifUrl.replace("/videos/", "/images/").replace(/\.gif$/, ".jpg");
  // Une URL qui ne suit pas la convention n'a pas d'image connue.
  return image === gifUrl ? null : image;
}

// Ne reçoit que les champs du résumé : c'est tout ce que `CHAMPS_RESUME` lit.
export function versResume(
  ligne: Pick<
    LigneExercice,
    "slug" | "nomFr" | "nomRecherche" | "bodyPart" | "equipment" | "target" | "gifUrl"
  >,
): ExerciceResume {
  return {
    slug: ligne.slug,
    nom: ligne.nomFr,
    groupe: ligne.bodyPart,
    equipement: ligne.equipment,
    cible: ligne.target,
    image: imageDe(ligne.gifUrl),
    recherche: ligne.nomRecherche,
  };
}

export function versDetail(ligne: LigneExercice): ExerciceDetail {
  return {
    ...versResume(ligne),
    nomAnglais: ligne.name,
    gif: ligne.gifUrl,
    secondaires: ligne.secondary,
    instructions: ligne.instructions,
  };
}

/** Le rang d'un élément dans une liste de référence ; les absents après tous les autres. */
function rangDans(liste: readonly string[], valeur: string): number {
  const i = liste.indexOf(valeur);
  return i === -1 ? liste.length : i;
}

/**
 * Bat les cartes en tours : chaque paquet donne son premier, puis son deuxième… Les paquets
 * passent dans l'ordre reçu.
 */
function alterner<T>(paquets: T[][]): T[] {
  const sortie: T[] = [];
  const tours = Math.max(0, ...paquets.map((p) => p.length));
  for (let i = 0; i < tours; i++) {
    for (const p of paquets) if (p[i] !== undefined) sortie.push(p[i] as T);
  }
  return sortie;
}

function grouperPar<T>(liste: T[], cle: (t: T) => string): Map<string, T[]> {
  const groupes = new Map<string, T[]>();
  for (const t of liste) groupes.set(cle(t), [...(groupes.get(cle(t)) ?? []), t]);
  return groupes;
}

/**
 * L'ordre « pertinence » du catalogue (D210). Le catalogue n'a ni popularité ni note : les
 * signaux sont le nom et le vocabulaire.
 *
 * - **Avec une recherche** : le nom français qui COMMENCE par la saisie, puis celui dont un
 *   mot commence par elle, puis le reste ; à égalité, le nom le plus court — « Curl à la
 *   barre » avant « Curl à la barre en prise serrée » —, puis l'ordre alphabétique.
 * - **Sans recherche** : un catalogue VARIÉ (Baymard : un premier écran d'un seul type fait
 *   croire le choix étroit). Muscle après muscle (`CIBLES`), et dans chaque muscle équipement
 *   après équipement (les principaux d'abord, en décalant d'un cran parmi eux à chaque muscle
 *   pour que le premier tour mêle les équipements). Dans chaque case, la FAMILLE la plus fournie
 *   d'abord — le premier mot du nom : « Pompe », « Curl », « Développé » comptent des
 *   dizaines de variantes, « Cocons » une seule —, puis le nom le plus court.
 */
export function ordonnerPertinence(exercices: ExerciceResume[], q?: string): ExerciceResume[] {
  const parNom = (a: ExerciceResume, b: ExerciceResume) =>
    a.nom.length - b.nom.length || a.recherche.localeCompare(b.recherche);
  const saisie = q ? normaliserRecherche(q) : "";
  if (saisie) {
    // `recherche` commence par le nom français normalisé : c'est lui qu'on juge.
    const score = (e: ExerciceResume) => {
      const nom = normaliserRecherche(e.nom);
      if (nom.startsWith(saisie)) return 0;
      return ` ${nom}`.includes(` ${saisie}`) ? 1 : 2;
    };
    return [...exercices].sort((a, b) => score(a) - score(b) || parNom(a, b));
  }
  const famille = (e: ExerciceResume) => normaliserRecherche(e.nom).split(" ")[0] ?? "";
  const tailles = grouperPar(exercices, famille);
  const parFamille = (a: ExerciceResume, b: ExerciceResume) =>
    (tailles.get(famille(b))?.length ?? 0) - (tailles.get(famille(a))?.length ?? 0) || parNom(a, b);
  const muscles = [...grouperPar(exercices, (e) => e.cible)].sort(
    ([a], [b]) => rangDans(CIBLES, a) - rangDans(CIBLES, b) || a.localeCompare(b),
  );
  return alterner(
    muscles.map(([, duMuscle], i) => {
      const cases = [...grouperPar(duMuscle, (e) => e.equipement)]
        .sort(
          ([a], [b]) =>
            rangDans(EQUIPEMENTS_PRINCIPAUX, a) - rangDans(EQUIPEMENTS_PRINCIPAUX, b) ||
            a.localeCompare(b),
        )
        .map(([, une]) => une.sort(parFamille));
      // Le décalage : le muscle n° i commence par son i-ème équipement PRINCIPAL ; les
      // équipements rares (corde, médecine-ball) ne passent jamais en tête.
      const principaux = cases.filter(
        (c) => c[0] && (EQUIPEMENTS_PRINCIPAUX as readonly string[]).includes(c[0].equipement),
      ).length;
      const debut = i % Math.max(1, principaux);
      return alterner([...cases.slice(debut), ...cases.slice(0, debut)]);
    }),
  );
}

export type DepotExercices = {
  lister(requete: RequeteCatalogue): Promise<{ exercices: ExerciceResume[]; total: number }>;
  parSlug(slug: string): Promise<ExerciceDetail | null>;
  /** Les variantes (D204) ; `null` si l'exercice n'existe pas. */
  variantes(slug: string): Promise<ExerciceResume[] | null>;
};

/** Au plus 8 variantes : une par équipement, les principaux d'abord, puis par nom. */
const MAX_VARIANTES = 8;

/** Les mots d'au moins 4 lettres d'un nom normalisé : « developpe couche barre ». */
const mots = (recherche: string) => new Set(recherche.split(" ").filter((m) => m.length >= 4));

/**
 * Choisit les variantes d'un exercice parmi ceux du même muscle ciblé : un par équipement
 * autre que le sien, celui dont le nom partage le plus de mots avec la source (« développé
 * couché » appelle « développé couché aux haltères »), puis le premier par nom ; les
 * équipements principaux d'abord (D204).
 */
export function choisirVariantes(
  source: { slug: string; equipement: string; recherche: string },
  candidats: ExerciceResume[],
): ExerciceResume[] {
  const motsSource = mots(source.recherche);
  const proximite = (c: ExerciceResume) =>
    [...mots(c.recherche)].filter((m) => motsSource.has(m)).length;
  const parEquipement = new Map<string, ExerciceResume>();
  const tries = [...candidats].sort(
    (a, b) => proximite(b) - proximite(a) || a.recherche.localeCompare(b.recherche),
  );
  for (const c of tries) {
    if (c.slug === source.slug || c.equipement === source.equipement) continue;
    if (!parEquipement.has(c.equipement)) parEquipement.set(c.equipement, c);
  }
  const rang = (e: string) => {
    const i = (EQUIPEMENTS_PRINCIPAUX as readonly string[]).indexOf(e);
    return i === -1 ? EQUIPEMENTS_PRINCIPAUX.length : i;
  };
  return [...parEquipement.values()]
    .sort(
      (a, b) => rang(a.equipement) - rang(b.equipement) || a.equipement.localeCompare(b.equipement),
    )
    .slice(0, MAX_VARIANTES);
}

export const depotPrisma: DepotExercices = {
  async lister(requete) {
    const where = filtreCatalogue(requete);
    if (requete.ordre === "pertinence") {
      // Tout le résultat filtré (1 316 lignes au plus, quelques champs) est trié en mémoire :
      // l'ordre dépend de l'ensemble, une page seule ne suffit pas.
      const lignes = await prisma.exercise.findMany({ where, select: CHAMPS_RESUME });
      const tries = ordonnerPertinence(
        lignes.map((l) => versResume(l as Parameters<typeof versResume>[0])),
        requete.q,
      );
      const debut = (requete.page - 1) * requete.taille;
      return { exercices: tries.slice(debut, debut + requete.taille), total: tries.length };
    }
    const [lignes, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        select: CHAMPS_RESUME,
        orderBy: { nomRecherche: "asc" },
        skip: (requete.page - 1) * requete.taille,
        take: requete.taille,
      }),
      prisma.exercise.count({ where }),
    ]);
    // `bodyPart` sort de Prisma typé par son enum, dont les valeurs sont celles de
    // `Groupe` — `source.test.ts` tient les deux d'accord.
    return {
      exercices: lignes.map((l) => versResume(l as Parameters<typeof versResume>[0])),
      total,
    };
  },

  async parSlug(slug) {
    const ligne = await prisma.exercise.findUnique({
      where: { slug, archivedAt: null },
      select: CHAMPS_DETAIL,
    });
    return ligne ? versDetail(ligne as LigneExercice) : null;
  },

  async variantes(slug) {
    const source = await prisma.exercise.findUnique({
      where: { slug, archivedAt: null },
      select: { slug: true, equipment: true, target: true, nomRecherche: true },
    });
    if (!source) return null;
    const lignes = await prisma.exercise.findMany({
      where: { archivedAt: null, target: source.target },
      select: CHAMPS_RESUME,
    });
    return choisirVariantes(
      { slug: source.slug, equipement: source.equipment, recherche: source.nomRecherche },
      lignes.map((l) => versResume(l as Parameters<typeof versResume>[0])),
    );
  },
};
