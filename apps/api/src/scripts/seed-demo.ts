/**
 * Jeu de démonstration pour **un compte de développement**.
 *
 * ```bash
 * pnpm --filter=api seed:demo                       # alexis.gontier03@gmail.com
 * pnpm --filter=api seed:demo -- --email=a@a.com    # un autre compte
 * pnpm --filter=api seed:demo -- --weeks=6 --keep   # plus court, sans effacer
 * ```
 *
 * ## Pourquoi il passe par les services et pas par Prisma
 *
 * Les records sont calculés serveur (règle non négociable n°6) et les agrégats
 * d'une séance sont dénormalisés à l'écriture (doc 03, §3). Un seed qui
 * écrirait ses lignes directement devrait rejouer ces deux calculs à la main —
 * donc les dupliquer, donc les laisser diverger au premier changement de
 * formule. Ici tout passe par `createWorkout`, `createRoutine` et
 * `createFolder` : les données de démo empruntent exactement le chemin d'un
 * appel d'API réel, et un jeu de démo qui casse signale un vrai défaut.
 *
 * Les entrées sont **parsées par les schémas de `packages/validators`** avant
 * d'atteindre les services, pour la même raison : ce script ne peut pas écrire
 * une structure que l'API refuserait.
 *
 * ## Déterminisme
 *
 * Aucun `Math.random`. Le bruit vient d'un générateur congruentiel semé par une
 * constante : deux exécutions le même jour produisent le même historique, ce
 * qui rend une capture d'écran comparable d'un jour sur l'autre. Les
 * identifiants de séance sont dérivés de la semaine et du jour — donc stables,
 * donc idempotents au regard de la règle n°7.
 *
 * ## Ce qu'il efface
 *
 * Par défaut, **toutes** les routines, dossiers, séances, records et exercices
 * personnalisés du compte visé, avant de réécrire. `--keep` s'en abstient. Le
 * script refuse de tourner en `NODE_ENV=production`.
 */

import { prisma } from "@better-lift/db";
import {
  createExerciseSchema,
  createWorkoutSchema,
  DEFAULT_LOCALE,
  type Locale,
  routineFolderInputSchema,
  routineStructureSchema,
} from "@better-lift/validators";

import { env } from "../lib/env.js";
import { createExercise } from "../services/exercise.service.js";
import { createRoutine } from "../services/routine.service.js";
import { createFolder } from "../services/routine-folder.service.js";
import { createWorkout } from "../services/workout.service.js";

// ── Arguments ─────────────────────────────────────────────────────────────

const DEFAULT_EMAIL = "alexis.gontier03@gmail.com";
const DEFAULT_WEEKS = 12;

function flag(name: string): string | undefined {
  const match = process.argv.slice(2).find((arg) => arg.startsWith(`--${name}=`));

  return match?.slice(name.length + 3);
}

const email = flag("email") ?? DEFAULT_EMAIL;
const weeks = Number(flag("weeks") ?? DEFAULT_WEEKS);
const keep = process.argv.includes("--keep");

if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) {
  throw new Error("--weeks attend un entier entre 1 et 52.");
}

/**
 * Le garde-fou tient en une ligne parce qu'il ne doit dépendre de rien : ce
 * script efface l'historique d'un compte, et l'erreur qu'on ne rattrape pas
 * est celle du `.env` resté pointé sur la mauvaise branche Neon.
 */
if (env.NODE_ENV === "production") {
  throw new Error("seed:demo ne tourne pas en production.");
}

// ── Aléa déterministe ─────────────────────────────────────────────────────

/**
 * Générateur congruentiel linéaire (Numerical Recipes). Il ne s'agit pas de
 * qualité statistique mais de reproductibilité : le même appel dans le même
 * ordre rend la même suite, donc le même historique à chaque exécution.
 */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;

    return state / 0x1_00_00_00_00;
  };
}

const random = makeRandom(20_260_804);

/** Entier dans `[min, max]`, bornes comprises. */
function between(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Les charges de salle se posent par pas de 2,5 kg — pas au gramme près.
 *
 * Le retour est une **chaîne** : les `Decimal` traversent l'API sérialisés
 * ainsi (règle non négociable n°4), et les schémas de `packages/validators`
 * refusent un nombre. Passer par `toFixed` ici, une fois, évite de disséminer
 * la conversion sur chaque champ.
 */
function roundToPlate(kg: number): string {
  return Math.max(2.5, Math.round(kg / 2.5) * 2.5).toFixed(2);
}

/** `Decimal(3,1)` côté contrat : une décimale, jamais deux. */
function toRpe(value: number): string {
  return Math.min(10, Math.max(1, value)).toFixed(1);
}

// ── Catalogue utilisé ─────────────────────────────────────────────────────

/**
 * Les exercices sont désignés par leur `slug`, seule clé stable du dataset :
 * les `id` sont des cuid régénérés à chaque re-seed du catalogue.
 */
const SLUGS = {
  bench: "barbell-bench-press",
  overheadPress: "barbell-seated-overhead-press",
  inclineDumbbell: "dumbbell-incline-bench-press",
  lateralRaise: "dumbbell-lateral-raise",
  pushdown: "cable-pushdown",
  deadlift: "barbell-deadlift",
  pullUp: "pull-up",
  seatedRow: "lever-seated-row",
  curl: "barbell-curl",
  squat: "barbell-full-squat",
  romanianDeadlift: "barbell-romanian-deadlift",
  legExtension: "lever-leg-extension",
  legCurl: "lever-lying-leg-curl",
  plank: "power-point-plank",
  legRaise: "hanging-leg-raise",
  pushUp: "push-up",
} as const;

type SlugKey = keyof typeof SLUGS;

/**
 * Prescription d'un exercice dans une routine, et base de la progression.
 *
 * `base` et `step` décrivent une progression linéaire hebdomadaire — la
 * réalité d'un débutant intermédiaire, et surtout ce qui produit des records
 * espacés plutôt qu'un record à chaque séance (qui ne dirait plus rien) ou
 * aucun (qui laisserait l'écran des records vide).
 */
interface Prescription {
  readonly slug: SlugKey;
  /** Kilos à la première semaine. Absent pour un exercice sans charge. */
  readonly base?: number;
  /** Kilos gagnés par semaine. */
  readonly step?: number;
  readonly reps: number;
  readonly sets: number;
  /** Une série d'échauffement en tête : exclue du volume et des records. */
  readonly warmup?: boolean;
  readonly restSec?: number;
  readonly notes?: string;
  /** Secondes tenues, pour un exercice de type `DURATION`. */
  readonly durationSec?: number;
  readonly durationStep?: number;
}

interface RoutinePlan {
  readonly name: string;
  readonly folder: string | null;
  readonly notes?: string;
  readonly exercises: readonly Prescription[];
}

const ROUTINES: readonly RoutinePlan[] = [
  {
    name: "Push A",
    folder: "Push Pull Legs",
    notes: "Barre à 20 kg. Développé couché en premier, toujours.",
    exercises: [
      {
        slug: "bench",
        base: 72.5,
        step: 1.25,
        reps: 5,
        sets: 4,
        warmup: true,
        restSec: 180,
        notes: "Pause 1 s en bas.",
      },
      { slug: "overheadPress", base: 42.5, step: 0.75, reps: 6, sets: 3, restSec: 150 },
      { slug: "inclineDumbbell", base: 24, step: 0.4, reps: 10, sets: 3, restSec: 120 },
      { slug: "lateralRaise", base: 10, step: 0.15, reps: 15, sets: 3, restSec: 60 },
      { slug: "pushdown", base: 30, step: 0.5, reps: 12, sets: 3, restSec: 90 },
    ],
  },
  {
    name: "Pull A",
    folder: "Push Pull Legs",
    notes: "Soulevé de terre en ouverture, puis tractions à l'échec.",
    exercises: [
      { slug: "deadlift", base: 110, step: 2.5, reps: 5, sets: 3, warmup: true, restSec: 240 },
      { slug: "pullUp", reps: 8, sets: 4, restSec: 150, notes: "Lestage à venir." },
      { slug: "seatedRow", base: 55, step: 1.25, reps: 10, sets: 3, restSec: 120 },
      { slug: "curl", base: 27.5, step: 0.5, reps: 10, sets: 3, restSec: 90 },
    ],
  },
  {
    name: "Legs A",
    folder: "Push Pull Legs",
    exercises: [
      { slug: "squat", base: 95, step: 2, reps: 5, sets: 4, warmup: true, restSec: 210 },
      { slug: "romanianDeadlift", base: 80, step: 1.5, reps: 8, sets: 3, restSec: 150 },
      { slug: "legExtension", base: 45, step: 1, reps: 12, sets: 3, restSec: 90 },
      { slug: "legCurl", base: 40, step: 1, reps: 12, sets: 3, restSec: 90 },
    ],
  },
  {
    name: "Gainage express",
    folder: "Renfo & mobilité",
    notes: "15 minutes en fin de séance, ou seul les jours creux.",
    exercises: [
      { slug: "plank", reps: 1, sets: 3, durationSec: 45, durationStep: 2, restSec: 60 },
      { slug: "legRaise", reps: 1, sets: 3, durationSec: 30, durationStep: 1, restSec: 60 },
    ],
  },
  {
    name: "Full body — voyage",
    folder: null,
    notes: "Sans matériel. Hôtel, vacances, salle fermée.",
    exercises: [
      { slug: "pushUp", reps: 20, sets: 4, restSec: 90 },
      { slug: "pullUp", reps: 6, sets: 3, restSec: 120 },
      { slug: "squat", base: 60, step: 0, reps: 12, sets: 3, restSec: 120 },
    ],
  },
];

const FOLDERS = ["Push Pull Legs", "Renfo & mobilité"] as const;

/**
 * Exercices personnalisés. Sans eux, le filtre « Les miens » du catalogue et
 * l'écran de création n'ont rien à montrer — or c'est précisément le parcours
 * qu'une revue d'interface doit pouvoir regarder.
 */
const CUSTOM_EXERCISES = [
  {
    name: "Développé couché prise serrée",
    type: "WEIGHT_REPS",
    bodyPart: "UPPER_ARMS",
    equipment: "barbell",
    target: "triceps",
    secondaryMuscles: ["pectorals", "delts"],
    instructions: [
      "Mains à largeur d'épaules sur la barre.",
      "Coudes serrés le long du buste à la descente.",
      "Marquer une pause au contact, puis pousser.",
    ],
  },
  {
    name: "Gainage latéral lesté",
    type: "DURATION",
    bodyPart: "WAIST",
    equipment: "weighted",
    target: "obliques",
    secondaryMuscles: ["abs"],
    instructions: ["Disque posé sur la hanche.", "Bassin haut, épaules alignées."],
  },
] as const;

// ── Calendrier ────────────────────────────────────────────────────────────

/**
 * Une semaine type : trois séances en semaine, plus le gainage un samedi sur
 * deux. `week % skipEvery === skipOn` retire une séance de temps en temps —
 * une régularité parfaite sur douze semaines ne ressemble à personne, et la
 * heatmap du tableau de bord n'aurait plus rien à montrer.
 */
interface SessionSlot {
  readonly routine: string;
  /** Jour de la semaine, 1 = lundi. */
  readonly weekday: number;
  /** Heure de début, en heure locale de Paris. */
  readonly hour: number;
  readonly minutes: readonly [number, number];
  readonly skipEvery?: number;
  readonly skipOn?: number;
}

const WEEK: readonly SessionSlot[] = [
  { routine: "Push A", weekday: 1, hour: 18, minutes: [55, 80] },
  { routine: "Pull A", weekday: 3, hour: 18, minutes: [55, 85], skipEvery: 7, skipOn: 4 },
  { routine: "Legs A", weekday: 5, hour: 17, minutes: [60, 90], skipEvery: 5, skipOn: 2 },
  { routine: "Gainage express", weekday: 6, hour: 10, minutes: [14, 20], skipEvery: 2, skipOn: 1 },
];

/**
 * Semaine de décharge : toutes les charges à 85 %, aucun record.
 *
 * Elle n'est pas décorative. Le tableau de bord affiche la variation de volume
 * d'une période à l'autre, et sans creux volontaire on ne voit jamais à quoi
 * ressemble une baisse — qui est le cas où l'affichage doit rester lisible
 * sans crier à l'erreur (doc 05).
 */
const DELOAD_WEEK_FROM_END = 4;

/**
 * Ancre du calendrier : le lundi de la semaine en cours, à minuit UTC.
 *
 * Toutes les dates sont dérivées d'ici, donc l'historique reste collé au
 * présent quel que soit le jour où le script tourne.
 */
function mondayOfCurrentWeek(): Date {
  const now = new Date();
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  // `getUTCDay()` rend 0 le dimanche : le ramener à 7 fait commencer la semaine
  // le lundi, comme partout dans l'app.
  const weekday = monday.getUTCDay() === 0 ? 7 : monday.getUTCDay();

  monday.setUTCDate(monday.getUTCDate() - (weekday - 1));

  return monday;
}

/**
 * Décalage de Paris sur UTC pour une date donnée, en heures.
 *
 * Douze semaines peuvent enjamber un changement d'heure : écrire « 18 h » en
 * UTC ferait glisser les séances d'une heure au passage, et l'historique
 * montrerait des entraînements à 17 h une semaine sur deux. On demande donc à
 * `Intl` l'heure réellement affichée à Paris et on en déduit l'écart.
 */
function parisOffsetHours(utc: Date): number {
  /**
   * `formatToParts` et non `format` : en français, une heure seule se rend
   * « 18 h », que `Number` lit `NaN`. Le fautif ne se voit pas à la lecture et
   * ne se signale qu'au premier `toISOString` sur la date qui en découle.
   */
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utc);

  const parisHour = Number(parts.find((part) => part.type === "hour")?.value);

  const diff = parisHour - utc.getUTCHours();

  // Le format ne rend qu'une heure, sans le jour : un écart négatif signale
  // qu'on a franchi minuit.
  return diff < -12 ? diff + 24 : diff;
}

/** Instant UTC d'une séance, à partir de son heure locale parisienne. */
function startedAt(monday: Date, weekday: number, hour: number): Date {
  const day = new Date(monday);

  day.setUTCDate(day.getUTCDate() + (weekday - 1));
  day.setUTCHours(hour, between(0, 55), 0, 0);

  return new Date(day.getTime() - parisOffsetHours(day) * 3_600_000);
}

// ── Génération d'une séance ───────────────────────────────────────────────

type ExerciseRef = { readonly id: string; readonly name: string };

/**
 * Séries réalisées pour un exercice, à une semaine donnée.
 *
 * Le bruit est ce qui rend le jeu crédible : la dernière série tombe parfois
 * une répétition en dessous, une série sur vingt reste décochée. Une grille
 * parfaite ne montrerait ni le rendu d'une série manquée, ni celui d'une
 * série non validée — deux états que l'interface doit traiter.
 */
function buildSets(prescription: Prescription, week: number, deload: boolean, endedAt: Date) {
  const sets: {
    type: "WARMUP" | "NORMAL";
    reps?: number | null;
    weightKg?: string | null;
    durationSec?: number | null;
    rpe?: string | null;
    completed: boolean;
    completedAt?: string | null;
  }[] = [];

  const completedAt = endedAt.toISOString();

  if (prescription.durationSec !== undefined) {
    for (let index = 0; index < prescription.sets; index += 1) {
      const held =
        prescription.durationSec +
        (prescription.durationStep ?? 0) * week +
        between(-3, 3) -
        index * 2;

      sets.push({
        type: "NORMAL",
        durationSec: Math.max(15, held),
        completed: true,
        completedAt,
      });
    }

    return sets;
  }

  const weight =
    prescription.base === undefined
      ? null
      : roundToPlate((prescription.base + (prescription.step ?? 0) * week) * (deload ? 0.85 : 1));

  if (prescription.warmup && weight !== null) {
    sets.push({
      type: "WARMUP",
      reps: prescription.reps + 5,
      weightKg: roundToPlate(Number(weight) * 0.5),
      completed: true,
      completedAt,
    });
  }

  for (let index = 0; index < prescription.sets; index += 1) {
    // La fatigue coûte une répétition sur les dernières séries, et la décharge
    // se fait en gardant les répétitions : c'est la charge qui baisse.
    const fade = deload ? 0 : index >= prescription.sets - 2 ? between(0, 1) : 0;
    const reps = Math.max(1, prescription.reps - fade);

    // Une série sur vingt-cinq n'est pas validée. C'est le seul moyen de voir
    // à l'écran une série « prévue mais pas faite », qui ne compte ni dans le
    // volume ni dans les records.
    const completed = random() > 0.04;

    sets.push({
      type: "NORMAL",
      reps,
      weightKg: weight,
      // RPE sur les seules séries lourdes : le noter partout serait faux, on
      // ne mesure pas son effort sur des élévations latérales.
      rpe: prescription.reps <= 8 ? toRpe(7 + index * 0.5 + (deload ? -2 : 0)) : null,
      completed,
      completedAt: completed ? completedAt : null,
    });
  }

  return sets;
}

// ── Programme ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, locale: true },
  });

  if (!user) {
    throw new Error(
      `Aucun compte ${email} sur cette base. Vérifier la branche Neon visée par DATABASE_URL.`,
    );
  }

  const locale = (user.locale === "en" ? "en" : DEFAULT_LOCALE) satisfies Locale;

  if (!keep) {
    /**
     * Ordre imposé par les clés étrangères : les records survivraient à leur
     * séance (`onDelete: SetNull`), et un exercice personnalisé est bloqué en
     * `Restrict` tant qu'une routine ou une séance le référence.
     */
    await prisma.$transaction([
      prisma.personalRecord.deleteMany({ where: { userId: user.id } }),
      prisma.workout.deleteMany({ where: { userId: user.id } }),
      prisma.routine.deleteMany({ where: { userId: user.id } }),
      prisma.routineFolder.deleteMany({ where: { userId: user.id } }),
      prisma.exercise.deleteMany({ where: { ownerId: user.id } }),
    ]);

    console.warn(`Compte ${email} remis à zéro.`);
  }

  // ── Catalogue ────────────────────────────────────────────────────────

  const catalogue = await prisma.exercise.findMany({
    where: { slug: { in: Object.values(SLUGS) }, ownerId: null },
    select: { id: true, slug: true, name: true },
  });

  const bySlug = new Map(catalogue.map((row) => [row.slug, row] as const));
  const exercises = new Map<SlugKey, ExerciseRef>();

  for (const [key, slug] of Object.entries(SLUGS) as [SlugKey, string][]) {
    const row = bySlug.get(slug);

    if (!row) {
      throw new Error(`Exercice « ${slug} » absent du catalogue. Lancer pnpm db:seed d'abord.`);
    }

    exercises.set(key, { id: row.id, name: row.name });
  }

  for (const input of CUSTOM_EXERCISES) {
    await createExercise(createExerciseSchema.parse(input), user.id, locale);
  }

  console.warn(`${CUSTOM_EXERCISES.length} exercices personnalisés créés.`);

  // ── Dossiers et routines ─────────────────────────────────────────────

  const folderIds = new Map<string, string>();

  for (const name of FOLDERS) {
    const folder = await createFolder(routineFolderInputSchema.parse({ name }), user.id);

    folderIds.set(name, folder.id);
  }

  const routineIds = new Map<string, string>();

  for (const plan of ROUTINES) {
    const structure = routineStructureSchema.parse({
      name: plan.name,
      folderId: plan.folder === null ? null : folderIds.get(plan.folder),
      notes: plan.notes ?? null,
      exercises: plan.exercises.map((prescription) => {
        const exercise = exercises.get(prescription.slug);

        return {
          exerciseId: exercise?.id,
          restSec: prescription.restSec ?? null,
          notes: prescription.notes ?? null,
          sets: Array.from(
            { length: prescription.sets + (prescription.warmup ? 1 : 0) },
            (_, index) => {
              const warmup = prescription.warmup === true && index === 0;

              if (prescription.durationSec !== undefined) {
                return { type: "NORMAL", targetDurationSec: prescription.durationSec };
              }

              return {
                type: warmup ? "WARMUP" : "NORMAL",
                targetReps: warmup ? prescription.reps + 5 : prescription.reps,
                targetWeightKg:
                  prescription.base === undefined
                    ? null
                    : roundToPlate(warmup ? prescription.base * 0.5 : prescription.base),
              };
            },
          ),
        };
      }),
    });

    const routine = await createRoutine(structure, user.id, locale);

    routineIds.set(plan.name, routine.id);
  }

  console.warn(`${FOLDERS.length} dossiers et ${ROUTINES.length} routines créés.`);

  // ── Historique ───────────────────────────────────────────────────────

  const monday = mondayOfCurrentWeek();
  const plansByName = new Map(ROUTINES.map((plan) => [plan.name, plan] as const));

  let created = 0;
  let records = 0;

  for (let week = 0; week < weeks; week += 1) {
    // `week` court du plus ancien au plus récent : la progression s'appuie
    // dessus, et la semaine `weeks - 1` est la semaine en cours.
    const weekStart = new Date(monday);

    weekStart.setUTCDate(weekStart.getUTCDate() - (weeks - 1 - week) * 7);

    const deload = week === weeks - DELOAD_WEEK_FROM_END;

    for (const slot of WEEK) {
      if (slot.skipEvery !== undefined && week % slot.skipEvery === (slot.skipOn ?? 0)) {
        continue;
      }

      const plan = plansByName.get(slot.routine);
      const routineId = routineIds.get(slot.routine);

      if (!plan || !routineId) {
        continue;
      }

      const begin = startedAt(weekStart, slot.weekday, slot.hour);

      // Une séance à venir n'existe pas : le calendrier de la semaine en cours
      // s'arrête à aujourd'hui, sinon l'historique afficherait des séances
      // datées de demain.
      if (begin.getTime() > Date.now()) {
        continue;
      }

      const end = new Date(begin.getTime() + between(...slot.minutes) * 60_000);

      const payload = createWorkoutSchema.parse({
        // Déterministe, donc idempotent (règle n°7) : relancer le script sans
        // `--keep` réécrit le même historique plutôt que de l'empiler.
        id: `demo-${String(week).padStart(2, "0")}-${slot.weekday}-${routineId.slice(-8)}`,
        routineId,
        title: deload ? `${plan.name} (décharge)` : plan.name,
        notes: deload ? "Semaine de décharge : charges à 85 %." : null,
        startedAt: begin.toISOString(),
        endedAt: end.toISOString(),
        exercises: plan.exercises.map((prescription) => ({
          exerciseId: exercises.get(prescription.slug)?.id,
          restSec: prescription.restSec ?? null,
          notes: prescription.notes ?? null,
          sets: buildSets(prescription, week, deload, end),
        })),
      });

      const result = await createWorkout(payload, user.id, locale);

      created += result.created ? 1 : 0;
      records += result.workout.newRecords.length;
    }
  }

  console.warn(
    `${created} séances enregistrées sur ${weeks} semaines · ${records} records établis.`,
  );
  console.warn(`Compte ${email} (${user.name}) prêt.`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
