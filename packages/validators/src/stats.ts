import { z } from "zod";

import { bodyPartSchema } from "./exercise.js";
import { recordTypeSchema } from "./workout.js";

/**
 * Contrats des statistiques (doc 04, § Statistiques).
 *
 * Toutes ces routes sont en **lecture seule** et servent le tableau de bord.
 * Elles n'agrègent presque rien à la volée : les colonnes dénormalisées de
 * `Workout` — volume, séries, répétitions, durée, records — sont recalculées à
 * chaque écriture (doc 03, §3). Seule la répartition musculaire descend
 * jusqu'aux séries, faute d'un agrégat par partie du corps.
 */

/**
 * Fenêtre d'observation.
 *
 * `all` existe parce qu'un total depuis l'inscription est la seule valeur qui
 * ne bouge pas sous les pieds : c'est ce qu'on regarde quand on veut savoir
 * « combien en tout », pas « est-ce que je progresse ».
 */
export const statsRangeSchema = z.enum(["7d", "30d", "90d", "1y", "all"]);

export const statsSummaryQuerySchema = z.object({
  range: statsRangeSchema.default("30d"),
});

/**
 * Période précédente de **même durée**, pour afficher une variation sans second
 * appel — un chiffre isolé n'informe pas (doc 05).
 *
 * Volontairement réduite à deux mesures : ce sont les seules que les cartes
 * comparent. Tout renvoyer en double coûterait deux agrégats de plus pour des
 * valeurs que personne n'affiche.
 */
export const statsPreviousPeriodSchema = z.object({
  workoutCount: z.number().int().min(0),
  totalVolumeKg: z.string(),
});

export const statsSummarySchema = z.object({
  range: statsRangeSchema,
  /** Borne basse incluse, absente quand `range` vaut `all`. */
  from: z.string().datetime().nullable(),
  to: z.string().datetime(),
  workoutCount: z.number().int().min(0),
  /** `Decimal` sérialisé en chaîne, échelle 2 (règle non négociable n°4). */
  totalVolumeKg: z.string(),
  totalDurationSec: z.number().int().min(0),
  /** Arrondi à la seconde, `0` sans séance — jamais une division par zéro. */
  avgDurationSec: z.number().int().min(0),
  totalSets: z.number().int().min(0),
  prCount: z.number().int().min(0),
  /**
   * `null` quand `range` vaut `all` : il n'y a pas d'« avant l'inscription »,
   * et renvoyer des zéros ferait afficher une chute de 100 %.
   */
  previousPeriod: statsPreviousPeriodSchema.nullable(),
});

export const statsVolumeQuerySchema = z.object({
  groupBy: z.enum(["week", "month"]).default("week"),
  /**
   * Bornes en date civile (`YYYY-MM-DD`) et non en horodatage : on demande
   * « depuis le 1er mars », pas « depuis le 1er mars à 00 h 00 UTC ». La
   * conversion en instants se fait côté serveur, dans le fuseau du profil.
   */
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

/**
 * `periodStart` est une date civile : le lundi de la semaine ou le 1er du mois,
 * dans le fuseau du profil. Les périodes sans séance sont **présentes avec des
 * zéros** — un graphique à barres qui saute les semaines vides ment sur le
 * rythme, et c'est précisément la déload involontaire qu'on cherche à voir.
 */
export const statsVolumePointSchema = z.object({
  periodStart: z.iso.date(),
  volumeKg: z.string(),
  workoutCount: z.number().int().min(0),
});

export const statsVolumeResponseSchema = z.object({
  groupBy: z.enum(["week", "month"]),
  data: z.array(statsVolumePointSchema),
});

export const statsMuscleDistributionQuerySchema = z.object({
  range: statsRangeSchema.default("30d"),
});

export const statsMuscleDistributionPointSchema = z.object({
  bodyPart: bodyPartSchema,
  setCount: z.number().int().min(0),
});

export const statsMuscleDistributionResponseSchema = z.object({
  range: statsRangeSchema,
  /** Total des séries comptées, pour afficher un pourcentage sans resommer. */
  totalSets: z.number().int().min(0),
  /** Trié par nombre de séries décroissant ; les parties à zéro sont omises. */
  data: z.array(statsMuscleDistributionPointSchema),
});

/** 53 semaines : une année pleine, plafond d'une heatmap lisible. */
export const MAX_STREAK_WEEKS = 53;

export const statsStreakQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(MAX_STREAK_WEEKS).default(12),
});

/** Une case de la heatmap : un jour civil du fuseau du profil. */
export const statsStreakDaySchema = z.object({
  date: z.iso.date(),
  workoutCount: z.number().int().min(0),
});

export const statsStreakResponseSchema = z.object({
  /**
   * Semaines consécutives comptant au moins une séance, en remontant depuis la
   * semaine courante. Celle-ci ne rompt jamais la série tant qu'elle n'est pas
   * finie : sans cette tolérance, tout le monde verrait zéro le lundi matin.
   */
  currentWeeks: z.number().int().min(0),
  longestWeeks: z.number().int().min(0),
  /** Une entrée par jour de la fenêtre, y compris les jours sans séance. */
  days: z.array(statsStreakDaySchema),
});

export const MAX_STATS_RECORDS = 50;

export const statsRecordsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_STATS_RECORDS).default(10),
});

export const statsRecordSchema = z.object({
  id: z.string(),
  type: recordTypeSchema,
  /** Normalisé : kg pour les charges et le 1RM, unités brutes sinon. */
  value: z.string(),
  /** Contexte lisible, pour afficher « 100 kg × 5 » plutôt qu'un nombre nu. */
  reps: z.number().int().nullable(),
  weightKg: z.string().nullable(),
  achievedAt: z.string().datetime(),
  exercise: z.object({ id: z.string(), name: z.string() }),
  /** Nul si la séance d'origine a été supprimée : le record, lui, reste vrai. */
  workoutId: z.string().nullable(),
});

export const statsRecordsResponseSchema = z.object({ data: z.array(statsRecordSchema) });

export type StatsRange = z.infer<typeof statsRangeSchema>;
export type StatsSummaryQuery = z.infer<typeof statsSummaryQuerySchema>;
export type StatsSummary = z.infer<typeof statsSummarySchema>;
export type StatsVolumeQuery = z.infer<typeof statsVolumeQuerySchema>;
export type StatsVolumePoint = z.infer<typeof statsVolumePointSchema>;
export type StatsVolumeResponse = z.infer<typeof statsVolumeResponseSchema>;
export type StatsMuscleDistributionQuery = z.infer<typeof statsMuscleDistributionQuerySchema>;
export type StatsMuscleDistributionResponse = z.infer<typeof statsMuscleDistributionResponseSchema>;
export type StatsStreakQuery = z.infer<typeof statsStreakQuerySchema>;
export type StatsStreakResponse = z.infer<typeof statsStreakResponseSchema>;
export type StatsRecordsQuery = z.infer<typeof statsRecordsQuerySchema>;
export type StatsRecord = z.infer<typeof statsRecordSchema>;
export type StatsRecordsResponse = z.infer<typeof statsRecordsResponseSchema>;
