/**
 * Calendrier civil dans le fuseau de l'utilisateur.
 *
 * Une séance appartient au jour où on l'a faite, pas au jour UTC de son
 * horodatage. À Paris, un entraînement du samedi 21 h tombe le dimanche en UTC
 * pendant l'heure d'été : sans conversion, la heatmap le range dans la mauvaise
 * case et la série de semaines se rompt sans raison. Toutes les statistiques
 * découpent donc le temps ici, à partir du `timezone` du profil.
 *
 * `Intl` est la seule dépendance, et c'est de la bibliothèque standard
 * (ECMA-402), pas une API de plateforme : la règle n°9 reste tenue. C'est aussi
 * la seule façon de connaître les décalages d'un fuseau IANA sans embarquer une
 * base de données de fuseaux.
 *
 * Une **date civile** est ici une chaîne `YYYY-MM-DD`. Elle se compare et se
 * trie comme du texte, ce qui évite de reconvertir en `Date` à chaque
 * regroupement — et donc d'y réintroduire un fuseau par mégarde.
 */

/** Date civile `YYYY-MM-DD`, sans heure ni fuseau. */
export type CivilDate = string;

const DAY_MS = 86_400_000;

/**
 * Le format `en-CA` rend `YYYY-MM-DD`, mais on lit les composants plutôt que la
 * chaîne : le format d'une locale n'est pas un contrat, et une mise à jour des
 * données ICU pourrait le changer sous nos pieds.
 */
function partsInZone(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

const pad = (value: number, size = 2) => String(value).padStart(size, "0");

/** Jour civil d'un instant, dans un fuseau donné. */
export function civilDate(instant: Date, timeZone: string): CivilDate {
  const { year, month, day } = partsInZone(instant, timeZone);
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/**
 * Décalage du fuseau à un instant donné, en millisecondes.
 *
 * Se lit à l'envers : on demande l'heure murale à cet instant, on la relit
 * comme si elle était UTC, et l'écart avec l'instant réel *est* le décalage.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = partsInZone(instant, timeZone);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  /**
   * L'heure murale n'a pas de millisecondes : on tronque l'instant à la seconde
   * avant de comparer, sinon le décalage sort faux du nombre de millisecondes
   * de l'horodatage. `Math.floor` et non `%`, qui rendrait un reste négatif
   * avant 1970 et décalerait alors d'une seconde entière.
   */
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

function parseCivil(date: CivilDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year: year ?? 1970, month: month ?? 1, day: day ?? 1 };
}

/**
 * Instant du début d'un jour civil, dans un fuseau donné.
 *
 * Deux passes, et elles sont nécessaires : le décalage à appliquer dépend de
 * l'instant qu'on cherche justement à calculer. La première estimation peut
 * tomber du mauvais côté d'un changement d'heure ; on relit alors le décalage
 * au point trouvé et on corrige. Dans les rares fuseaux où minuit n'existe pas
 * (le passage à l'heure d'été s'y fait à 00 h 00), le résultat atterrit à
 * 01 h 00 locale — ce qui est le bon jour, et c'est tout ce qui compte pour un
 * regroupement.
 */
export function zonedDayStart(date: CivilDate, timeZone: string): Date {
  const { year, month, day } = parseCivil(date);
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0);

  const firstGuess = new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  const corrected = new Date(naive - zoneOffsetMs(firstGuess, timeZone));

  return corrected;
}

/** Instant du début du jour **suivant** : borne haute exclusive d'un jour. */
export function zonedDayEnd(date: CivilDate, timeZone: string): Date {
  return zonedDayStart(addDays(date, 1), timeZone);
}

/**
 * Décale une date civile de `count` jours.
 *
 * L'arithmétique se fait en UTC sur les composants civils, sans fuseau : un
 * jour civil suit toujours le précédent, y compris la semaine d'un changement
 * d'heure où il ne dure pourtant pas 24 heures.
 */
export function addDays(date: CivilDate, count: number): CivilDate {
  const { year, month, day } = parseCivil(date);
  const shifted = new Date(Date.UTC(year, month - 1, day) + count * DAY_MS);

  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Nombre de jours civils entre deux dates, `to` exclue. */
export function daysBetween(from: CivilDate, to: CivilDate): number {
  const a = parseCivil(from);
  const b = parseCivil(to);

  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS,
  );
}

/**
 * Lundi de la semaine ISO, la convention française — et celle du reste du
 * monde hors Amérique du Nord. Une semaine qui commence le dimanche couperait
 * le week-end en deux, alors que c'est justement le bloc que les gens lisent
 * d'un seul tenant quand ils regardent leur régularité.
 */
export function startOfWeek(date: CivilDate): CivilDate {
  const { year, month, day } = parseCivil(date);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  // `getUTCDay` rend 0 pour dimanche : on le ramène à 6 jours après lundi.
  return addDays(date, -((weekday + 6) % 7));
}

export function startOfMonth(date: CivilDate): CivilDate {
  const { year, month } = parseCivil(date);
  return `${pad(year, 4)}-${pad(month)}-01`;
}

/** Toutes les dates civiles de `from` à `to`, bornes incluses. */
export function eachDay(from: CivilDate, to: CivilDate): CivilDate[] {
  const days: CivilDate[] = [];

  for (let day = from; day <= to; day = addDays(day, 1)) {
    days.push(day);
  }

  return days;
}

/**
 * Tous les débuts de période entre deux dates, bornes incluses.
 *
 * Les périodes vides sont **présentes** : c'est le point de la fonction. Un
 * graphique qui saute les semaines sans séance ment sur le rythme, et c'est
 * exactement la coupure involontaire qu'on cherche à repérer.
 */
export function eachPeriodStart(
  from: CivilDate,
  to: CivilDate,
  groupBy: "week" | "month",
): CivilDate[] {
  const step = groupBy === "week" ? startOfWeek : startOfMonth;
  const last = step(to);
  const starts: CivilDate[] = [];

  let current = step(from);

  while (current <= last) {
    starts.push(current);
    current =
      groupBy === "week" ? addDays(current, 7) : startOfMonth(addDays(startOfMonth(current), 32));
  }

  return starts;
}

/**
 * Fenêtre d'observation des statistiques.
 *
 * Le type est redéclaré ici plutôt qu'importé de `validators` : `core` n'a
 * **aucune dépendance** et c'est ce qui garantit sa pureté. Les deux
 * définitions sont structurellement identiques, et TypeScript le vérifie à
 * l'appel dans le service.
 */
export type StatsWindow = "7d" | "30d" | "90d" | "1y" | "all";

const WINDOW_DAYS: Record<Exclude<StatsWindow, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/**
 * Bornes civiles d'une fenêtre et de celle qui la précède, toutes incluses.
 *
 * « 30 jours » compte **aujourd'hui compris** : la fenêtre va de J-29 à J. La
 * période précédente est la fenêtre de même longueur juste avant, ce qui rend
 * les deux comparables — c'est tout l'objet de `previousPeriod`.
 *
 * `all` n'a pas de borne basse ni de précédent : il n'existe rien avant
 * l'inscription, et renvoyer des zéros ferait afficher une chute de 100 %.
 */
export function rangeWindow(
  range: StatsWindow,
  today: CivilDate,
): {
  fromDay: CivilDate | null;
  toDay: CivilDate;
  previousFromDay: CivilDate | null;
  previousToDay: CivilDate | null;
} {
  if (range === "all") {
    return { fromDay: null, toDay: today, previousFromDay: null, previousToDay: null };
  }

  const length = WINDOW_DAYS[range];

  return {
    fromDay: addDays(today, -(length - 1)),
    toDay: today,
    previousFromDay: addDays(today, -(2 * length - 1)),
    previousToDay: addDays(today, -length),
  };
}

/**
 * Série de semaines consécutives comptant au moins une séance.
 *
 * `weeksWithWorkout` porte des lundis (`startOfWeek`). On remonte depuis la
 * semaine courante, et **celle-ci ne rompt jamais la série** : elle n'est pas
 * finie, l'utilisateur a encore le temps de s'entraîner. Sans cette tolérance,
 * tout le monde verrait sa série tomber à zéro le lundi matin, ce qui est le
 * contraire de l'encouragement recherché.
 */
export function weekStreak(
  weeksWithWorkout: ReadonlySet<CivilDate>,
  currentWeekStart: CivilDate,
): { currentWeeks: number; longestWeeks: number } {
  let currentWeeks = 0;
  let cursor = currentWeekStart;

  if (!weeksWithWorkout.has(cursor)) {
    cursor = addDays(cursor, -7);
  }

  while (weeksWithWorkout.has(cursor)) {
    currentWeeks += 1;
    cursor = addDays(cursor, -7);
  }

  const sorted = [...weeksWithWorkout].sort();
  let longestWeeks = 0;
  let run = 0;
  let previous: CivilDate | undefined;

  for (const week of sorted) {
    run = previous !== undefined && addDays(previous, 7) === week ? run + 1 : 1;
    longestWeeks = Math.max(longestWeeks, run);
    previous = week;
  }

  return { currentWeeks, longestWeeks: Math.max(longestWeeks, currentWeeks) };
}
