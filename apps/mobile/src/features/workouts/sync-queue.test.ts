import { describe, expect, it } from "vitest";

import { ApiClientError } from "@better-lift/api-client";
import { type CreateWorkoutInput } from "@better-lift/validators";

import {
  afterFailure,
  afterSuccess,
  dueEntry,
  enqueue,
  isRetryable,
  nextWakeUpMs,
  type QueuedWorkout,
  retryDelayMs,
  retryNow,
  wakeAll,
} from "./sync-queue";

const NOW = new Date("2026-08-03T18:00:00.000Z");
const NOW_MS = NOW.getTime();

function input(id: string): CreateWorkoutInput {
  return {
    id,
    routineId: null,
    title: "Push A",
    startedAt: "2026-08-03T17:00:00.000Z",
    endedAt: "2026-08-03T18:00:00.000Z",
    exercises: [],
  };
}

function queued(overrides: Partial<QueuedWorkout> = {}): QueuedWorkout {
  return {
    input: input("wkt_1"),
    queuedAt: NOW.toISOString(),
    attempts: 0,
    nextAttemptAt: NOW_MS,
    lastError: null,
    blocked: false,
    ...overrides,
  };
}

describe("enqueue", () => {
  it("should send right away, the queue holding rather than delaying", () => {
    const [entry] = enqueue([], input("wkt_1"), NOW);

    expect(entry?.nextAttemptAt).toBe(NOW_MS);
    expect(dueEntry([entry as QueuedWorkout], NOW_MS)).toBeDefined();
  });

  it("should replace an entry with the same id rather than queue it twice", () => {
    const queue = enqueue(enqueue([], input("wkt_1"), NOW), input("wkt_1"), NOW);

    // C'est la même séance : l'API la traiterait comme telle, l'identifiant
    // étant ce qui porte l'idempotence.
    expect(queue).toHaveLength(1);
  });

  it("should keep other workouts in order", () => {
    const queue = enqueue(enqueue([], input("wkt_1"), NOW), input("wkt_2"), NOW);

    expect(queue.map((entry) => entry.input.id)).toEqual(["wkt_1", "wkt_2"]);
  });
});

describe("retryDelayMs", () => {
  it("should grow but stay under the ceiling", () => {
    expect(retryDelayMs(1)).toBe(5_000);
    expect(retryDelayMs(2)).toBe(15_000);
    expect(retryDelayMs(3)).toBe(45_000);
    // Au-delà, c'est le retour du réseau qui réveille la file, pas l'horloge.
    expect(retryDelayMs(20)).toBe(15 * 60_000);
  });
});

describe("isRetryable", () => {
  it("should retry what a later attempt can resolve", () => {
    expect(isRetryable(new ApiClientError(0, "NETWORK_ERROR", "Réseau injoignable."))).toBe(true);
    expect(isRetryable(new ApiClientError(503, "INTERNAL", "Service indisponible."))).toBe(true);
    expect(isRetryable(new ApiClientError(429, "RATE_LIMITED", "Trop de requêtes."))).toBe(true);
    // La session se rouvrira : la séance doit attendre, pas disparaître.
    expect(isRetryable(new ApiClientError(401, "UNAUTHENTICATED", "Session expirée."))).toBe(true);
  });

  it("should not retry what comes from the content of the request", () => {
    expect(isRetryable(new ApiClientError(422, "VALIDATION_FAILED", "Charge invalide."))).toBe(
      false,
    );
    // 409 : l'identifiant appartient à quelqu'un d'autre. Réessayer donnera
    // éternellement la même réponse.
    expect(isRetryable(new ApiClientError(409, "CONFLICT", "Identifiant déjà pris."))).toBe(false);
  });

  it("should retry an error it cannot read", () => {
    // Perdre une séance est bien pire que de réessayer pour rien.
    expect(isRetryable(new TypeError("boom"))).toBe(true);
  });
});

describe("afterFailure", () => {
  it("should back off and keep the message", () => {
    const queue = afterFailure(
      [queued()],
      "wkt_1",
      new ApiClientError(0, "NETWORK_ERROR", "Réseau injoignable."),
      NOW_MS,
    );

    expect(queue[0]?.attempts).toBe(1);
    expect(queue[0]?.nextAttemptAt).toBe(NOW_MS + 5_000);
    expect(queue[0]?.lastError).toBe("Réseau injoignable.");
    expect(queue[0]?.blocked).toBe(false);
  });

  it("should block a refusal without ever dropping the workout", () => {
    const queue = afterFailure(
      [queued()],
      "wkt_1",
      new ApiClientError(422, "VALIDATION_FAILED", "Charge invalide."),
      NOW_MS,
    );

    // Une séance réellement faite ne disparaît jamais en silence : elle attend
    // qu'on la regarde.
    expect(queue).toHaveLength(1);
    expect(queue[0]?.blocked).toBe(true);
    expect(dueEntry(queue, NOW_MS + 10 * 60_000)).toBeUndefined();
  });

  it("should leave the other entries alone", () => {
    const queue = afterFailure(
      [queued(), queued({ input: input("wkt_2") })],
      "wkt_1",
      new ApiClientError(0, "NETWORK_ERROR", "Réseau injoignable."),
      NOW_MS,
    );

    expect(queue[1]?.attempts).toBe(0);
  });
});

describe("afterSuccess", () => {
  it("should drop only the workout that went through", () => {
    const queue = afterSuccess([queued(), queued({ input: input("wkt_2") })], "wkt_1");

    expect(queue.map((entry) => entry.input.id)).toEqual(["wkt_2"]);
  });
});

describe("dueEntry et nextWakeUpMs", () => {
  it("should ignore an entry that is still backing off", () => {
    const queue = [queued({ nextAttemptAt: NOW_MS + 5_000 })];

    expect(dueEntry(queue, NOW_MS)).toBeUndefined();
    expect(nextWakeUpMs(queue, NOW_MS)).toBe(5_000);
  });

  it("should ask for no alarm clock when nothing is waiting", () => {
    expect(nextWakeUpMs([], NOW_MS)).toBeNull();
    // Une entrée bloquée n'attend pas l'heure mais un geste : la réveiller
    // ferait tourner l'horloge pour une réponse connue d'avance.
    expect(nextWakeUpMs([queued({ blocked: true })], NOW_MS)).toBeNull();
  });
});

describe("wakeAll", () => {
  it("should bring waiting entries forward when the network is back", () => {
    const queue = wakeAll([queued({ nextAttemptAt: NOW_MS + 15 * 60_000 })], NOW_MS);

    // Au retour du réseau, la cause de l'attente a disparu : attendre la fin
    // d'un backoff de quinze minutes n'aurait plus de sens.
    expect(queue[0]?.nextAttemptAt).toBe(NOW_MS);
  });

  it("should leave a blocked entry blocked", () => {
    const queue = wakeAll([queued({ blocked: true, nextAttemptAt: NOW_MS - 1 })], NOW_MS);

    expect(queue[0]?.blocked).toBe(true);
  });
});

describe("retryNow", () => {
  it("should unblock everything, an explicit gesture deserving an honest answer", () => {
    const queue = retryNow([queued({ blocked: true, nextAttemptAt: NOW_MS + 60_000 })], NOW_MS);

    expect(queue[0]?.blocked).toBe(false);
    expect(dueEntry(queue, NOW_MS)).toBeDefined();
  });
});
