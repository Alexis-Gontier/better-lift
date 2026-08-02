import {
  addDays,
  type CivilDate,
  civilDate,
  eachDay,
  eachPeriodStart,
  rangeWindow,
  startOfMonth,
  startOfWeek,
  weekStreak,
  zonedDayEnd,
  zonedDayStart,
} from "@better-lift/core";
import { type Prisma, prisma } from "@better-lift/db";
import {
  type BodyPart,
  DEFAULT_LOCALE,
  type Locale,
  type StatsMuscleDistributionQuery,
  type StatsMuscleDistributionResponse,
  type StatsRecordsQuery,
  type StatsRecordsResponse,
  type StatsStreakQuery,
  type StatsStreakResponse,
  type StatsSummary,
  type StatsSummaryQuery,
  type StatsVolumeQuery,
  type StatsVolumeResponse,
} from "@better-lift/validators";

import { toDecimalString } from "../lib/decimal.js";

/**
 * Statistiques du tableau de bord (doc 04, § Statistiques).
 *
 * ## Pourquoi c'est bon marché
 *
 * `Workout` porte ses agrégats **dénormalisés**, recalculés dans la transaction
 * d'écriture (doc 03, §3) : volume, séries, répétitions, durée, records. Quatre
 * des cinq lectures d'ici ne touchent donc jamais `WorkoutSet`, et tournent sur
 * l'index `[userId, startedAt desc]`.
 *
 * La répartition musculaire est la seule exception : il n'existe pas d'agrégat
 * par partie du corps, et en fabriquer un demanderait une colonne de plus à
 * tenir à jour à chaque écriture pour un seul écran. Elle descend donc jusqu'aux
 * séries, bornée par une fenêtre de temps.
 *
 * ## Le fuseau n'est pas un détail
 *
 * Tout le découpage se fait dans le fuseau du **profil**, jamais en UTC. À
 * Paris, une séance du samedi 21 h est déjà dimanche en UTC pendant l'heure
 * d'été : rangée en UTC, elle tombe dans la mauvaise case de la heatmap et rompt
 * la série de semaines sans que rien ne le signale. C'est `packages/core`
 * (`calendar.ts`) qui porte cette arithmétique, et elle y est testée sans base.
 *
 * ## Isolation
 *
 * Aucune fonction ne prend d'identifiant d'utilisateur depuis une entrée
 * client : la route le lit dans la session (règle non négociable n°8). Toutes
 * les requêtes filtrent sur `userId`.
 */

/** Échelle de la colonne `Workout.totalVolumeKg`. */
const VOLUME_SCALE = 2;

/** Somme de volume nulle : `Decimal` absent quand aucune ligne n'est agrégée. */
const ZERO_VOLUME = "0.00";

/**
 * Fenêtre d'instants correspondant à une plage de jours civils.
 *
 * La borne haute est **exclusive** et vaut le début du jour suivant : `lte` sur
 * la fin du jour obligerait à choisir entre 23:59:59 et 23:59:59.999, et les
 * séances de la dernière milliseconde seraient perdues dans un cas.
 */
function instantWindow(
  fromDay: CivilDate | null,
  toDay: CivilDate,
  timeZone: string,
): Prisma.DateTimeFilter {
  return {
    ...(fromDay ? { gte: zonedDayStart(fromDay, timeZone) } : {}),
    lt: zonedDayEnd(toDay, timeZone),
  };
}

/** Fuseau du profil, avec repli sur UTC si la colonne porte une valeur invalide. */
async function profileTimeZone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  const candidate = user?.timezone ?? "UTC";

  /**
   * La colonne est un `String` libre : Better Auth crée des comptes sans passer
   * par nos validateurs. Un fuseau inconnu ferait lever `Intl` et donc échouer
   * tout le tableau de bord — mieux vaut des statistiques en UTC qu'un 500.
   */
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return "UTC";
  }
}

async function aggregateWindow(
  userId: string,
  window: Prisma.DateTimeFilter,
): Promise<{ workoutCount: number; volumeKg: string }> {
  const result = await prisma.workout.aggregate({
    where: { userId, startedAt: window },
    _count: { _all: true },
    _sum: { totalVolumeKg: true },
  });

  return {
    workoutCount: result._count._all,
    volumeKg: toDecimalString(result._sum.totalVolumeKg, VOLUME_SCALE) ?? ZERO_VOLUME,
  };
}

export async function getSummary(
  query: StatsSummaryQuery,
  userId: string,
  now: Date = new Date(),
): Promise<StatsSummary> {
  const timeZone = await profileTimeZone(userId);
  const today = civilDate(now, timeZone);
  const { fromDay, toDay, previousFromDay, previousToDay } = rangeWindow(query.range, today);

  const window = instantWindow(fromDay, toDay, timeZone);

  const [current, previous] = await Promise.all([
    prisma.workout.aggregate({
      where: { userId, startedAt: window },
      _count: { _all: true },
      _sum: { totalVolumeKg: true, durationSec: true, totalSets: true, prCount: true },
    }),
    previousFromDay && previousToDay
      ? aggregateWindow(userId, instantWindow(previousFromDay, previousToDay, timeZone))
      : Promise.resolve(null),
  ]);

  const workoutCount = current._count._all;
  const totalDurationSec = current._sum.durationSec ?? 0;

  return {
    range: query.range,
    from: fromDay ? zonedDayStart(fromDay, timeZone).toISOString() : null,
    to: zonedDayEnd(toDay, timeZone).toISOString(),
    workoutCount,
    totalVolumeKg: toDecimalString(current._sum.totalVolumeKg, VOLUME_SCALE) ?? ZERO_VOLUME,
    totalDurationSec,
    // Garde contre la division par zéro : un compte à zéro donne une moyenne à zéro.
    avgDurationSec: workoutCount === 0 ? 0 : Math.round(totalDurationSec / workoutCount),
    totalSets: current._sum.totalSets ?? 0,
    prCount: current._sum.prCount ?? 0,
    previousPeriod: previous
      ? { workoutCount: previous.workoutCount, totalVolumeKg: previous.volumeKg }
      : null,
  };
}

/**
 * Volume par semaine ou par mois.
 *
 * Le regroupement se fait **en mémoire** et non en SQL : `date_trunc` de
 * Postgres ne connaît pas le fuseau du profil sans `AT TIME ZONE`, que Prisma
 * ne sait pas exprimer hors `$queryRaw`. La fenêtre est bornée à un an de
 * séances par le contrat des dates, soit quelques centaines de lignes de deux
 * colonnes — le coût est celui d'un tri, pas d'un parcours de séries.
 */
export async function getVolume(
  query: StatsVolumeQuery,
  userId: string,
  now: Date = new Date(),
): Promise<StatsVolumeResponse> {
  const timeZone = await profileTimeZone(userId);
  const today = civilDate(now, timeZone);

  /**
   * Sans bornes, la fenêtre par défaut couvre les douze dernières semaines du
   * tableau de bord (doc 05) — ou douze mois en regroupement mensuel.
   */
  const toDay = query.to ?? today;
  const fromDay =
    query.from ??
    (query.groupBy === "week"
      ? addDays(startOfWeek(toDay), -7 * 11)
      : startOfMonth(addDays(startOfMonth(toDay), -1 - 30 * 11)));

  const rows = await prisma.workout.findMany({
    where: { userId, startedAt: instantWindow(fromDay, toDay, timeZone) },
    select: { startedAt: true, totalVolumeKg: true },
  });

  const buckets = new Map<CivilDate, { volume: Prisma.Decimal | null; workoutCount: number }>();

  for (const row of rows) {
    const day = civilDate(row.startedAt, timeZone);
    const key = query.groupBy === "week" ? startOfWeek(day) : startOfMonth(day);
    const bucket = buckets.get(key) ?? { volume: null, workoutCount: 0 };

    buckets.set(key, {
      volume: bucket.volume === null ? row.totalVolumeKg : bucket.volume.plus(row.totalVolumeKg),
      workoutCount: bucket.workoutCount + 1,
    });
  }

  return {
    groupBy: query.groupBy,
    // Les périodes vides sont **présentes** : un graphique qui les saute ment
    // sur le rythme, et c'est la coupure involontaire qu'on cherche à voir.
    data: eachPeriodStart(fromDay, toDay, query.groupBy).map((periodStart) => {
      const bucket = buckets.get(periodStart);

      return {
        periodStart,
        volumeKg: toDecimalString(bucket?.volume ?? null, VOLUME_SCALE) ?? ZERO_VOLUME,
        workoutCount: bucket?.workoutCount ?? 0,
      };
    }),
  };
}

/**
 * Séries par partie du corps.
 *
 * Seule lecture qui descende jusqu'aux séries, faute d'agrégat dénormalisé par
 * partie du corps. Le `groupBy` est poussé en base : rien ne remonte ligne à
 * ligne, seulement dix compteurs au plus.
 *
 * **Les séries non validées et d'échauffement sont exclues**, comme partout
 * ailleurs (doc 03) : compter ce qu'on a planifié sans le faire donnerait une
 * répartition qui décrit l'intention, pas l'entraînement.
 */
export async function getMuscleDistribution(
  query: StatsMuscleDistributionQuery,
  userId: string,
  now: Date = new Date(),
): Promise<StatsMuscleDistributionResponse> {
  const timeZone = await profileTimeZone(userId);
  const today = civilDate(now, timeZone);
  const { fromDay, toDay } = rangeWindow(query.range, today);

  const rows = await prisma.workoutSet.groupBy({
    by: ["workoutExerciseId"],
    where: {
      completed: true,
      type: { not: "WARMUP" },
      workoutExercise: {
        workout: { userId, startedAt: instantWindow(fromDay, toDay, timeZone) },
      },
    },
    _count: { _all: true },
  });

  if (rows.length === 0) {
    return { range: query.range, totalSets: 0, data: [] };
  }

  /**
   * Deuxième requête plutôt qu'un `include` : `groupBy` ne sait pas joindre. On
   * résout les parties du corps des seuls exercices apparus, ce qui borne la
   * liste au nombre d'exercices distincts de la fenêtre.
   */
  const links = await prisma.workoutExercise.findMany({
    where: { id: { in: rows.map((row) => row.workoutExerciseId) } },
    select: { id: true, exercise: { select: { bodyPart: true } } },
  });

  const bodyPartById = new Map(links.map((link) => [link.id, link.exercise.bodyPart]));
  const counts = new Map<BodyPart, number>();
  let totalSets = 0;

  for (const row of rows) {
    const bodyPart = bodyPartById.get(row.workoutExerciseId);

    if (!bodyPart) {
      continue;
    }

    counts.set(bodyPart, (counts.get(bodyPart) ?? 0) + row._count._all);
    totalSets += row._count._all;
  }

  return {
    range: query.range,
    totalSets,
    data: [...counts.entries()]
      .map(([bodyPart, setCount]) => ({ bodyPart, setCount }))
      // `bodyPart` départage les ex æquo : sans lui l'ordre des barres change
      // d'un rafraîchissement à l'autre pour des valeurs identiques.
      .sort((a, b) => b.setCount - a.setCount || a.bodyPart.localeCompare(b.bodyPart)),
  };
}

export async function getStreak(
  query: StatsStreakQuery,
  userId: string,
  now: Date = new Date(),
): Promise<StatsStreakResponse> {
  const timeZone = await profileTimeZone(userId);
  const today = civilDate(now, timeZone);

  /**
   * La heatmap commence un lundi et finit aujourd'hui : des colonnes de
   * semaines complètes, sinon les jours ne s'alignent pas d'une colonne à
   * l'autre et la grille devient illisible.
   */
  const fromDay = addDays(startOfWeek(today), -7 * (query.weeks - 1));

  const rows = await prisma.workout.findMany({
    where: { userId, startedAt: instantWindow(fromDay, today, timeZone) },
    select: { startedAt: true },
  });

  const perDay = new Map<CivilDate, number>();

  for (const row of rows) {
    const day = civilDate(row.startedAt, timeZone);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  /**
   * La série la plus longue se mesure sur **tout** l'historique, pas sur la
   * fenêtre affichée : un record de régularité vieux d'un an reste un record,
   * et le tronquer à douze semaines le ferait disparaître sans raison.
   */
  const allWorkouts = await prisma.workout.findMany({
    where: { userId },
    select: { startedAt: true },
  });

  const weeksWithWorkout = new Set(
    allWorkouts.map((row) => startOfWeek(civilDate(row.startedAt, timeZone))),
  );

  return {
    ...weekStreak(weeksWithWorkout, startOfWeek(today)),
    days: eachDay(fromDay, today).map((date) => ({
      date,
      workoutCount: perDay.get(date) ?? 0,
    })),
  };
}

export async function getRecentRecords(
  query: StatsRecordsQuery,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<StatsRecordsResponse> {
  const rows = await prisma.personalRecord.findMany({
    where: { userId },
    // `id` départage deux records du même instant, fréquents : une séance en
    // produit plusieurs et ils portent alors le même `achievedAt`.
    orderBy: [{ achievedAt: "desc" }, { id: "asc" }],
    take: query.limit,
    select: {
      id: true,
      type: true,
      value: true,
      reps: true,
      weightKg: true,
      achievedAt: true,
      workoutId: true,
      exercise: {
        select: {
          id: true,
          name: true,
          /**
           * La locale demandée **et** le repli anglais, en une seule requête —
           * même schéma que `exercise.service.ts`. `Exercise.name` est le nom
           * canonique du dataset, en anglais : l'afficher tel quel donnerait
           * « Barbell Bench Press » dans une interface française.
           */
          translations: { where: { locale: { in: [locale, "en"] } } },
        },
      },
    },
  });

  return {
    data: rows.map((row) => {
      const translation =
        row.exercise.translations.find((entry) => entry.locale === locale) ??
        row.exercise.translations[0];

      return {
        id: row.id,
        type: row.type,
        value: row.value.toFixed(VOLUME_SCALE),
        reps: row.reps,
        weightKg: toDecimalString(row.weightKg, VOLUME_SCALE),
        achievedAt: row.achievedAt.toISOString(),
        workoutId: row.workoutId,
        exercise: { id: row.exercise.id, name: translation?.name ?? row.exercise.name },
      };
    }),
  };
}
