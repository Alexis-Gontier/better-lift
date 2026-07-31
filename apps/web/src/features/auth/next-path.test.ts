import { describe, expect, it } from "vitest";

import { DEFAULT_AUTHENTICATED_ROUTE, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("should keep an internal path when it starts with a single slash", () => {
    expect(safeNextPath("/routines/42/edit")).toBe("/routines/42/edit");
    expect(safeNextPath("/workouts?vue=calendrier")).toBe("/workouts?vue=calendrier");
  });

  it("should fall back to the dashboard when nothing is requested", () => {
    expect(safeNextPath(null)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    expect(safeNextPath("")).toBe(DEFAULT_AUTHENTICATED_ROUTE);
    expect(safeNextPath(undefined)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
  });

  /**
   * Le cœur du garde. `next` vient de l'URL : sans filtrage, l'écran de
   * connexion deviendrait un tremplin de redirection ouverte, et le domaine
   * d'arrivée hériterait de la confiance visuelle du nôtre.
   */
  it.each([
    ["https://exemple.test/phishing", "URL absolue"],
    ["//exemple.test", "relative au protocole"],
    ["/\\exemple.test", "antislash, interprété comme //"],
    ["javascript:alert(1)", "pseudo-protocole"],
    ["exemple.test", "sans slash initial"],
  ])("should reject %s (%s)", (candidate) => {
    expect(safeNextPath(candidate)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
  });
});
