import { describe, expect, it } from "vitest";
import { messageAuth } from "./messages";

describe("messageAuth", () => {
  it("dit le serveur injoignable, et la limite de tentatives", () => {
    expect(messageAuth("connexion", undefined, 0)).toContain("injoignable");
    expect(messageAuth("inscription", undefined, 429)).toContain("Trop de tentatives");
  });

  it("ne dit jamais lequel des deux est faux à la connexion", () => {
    expect(messageAuth("connexion", "INVALID_EMAIL_OR_PASSWORD", 401)).toBe(
      "E-mail ou mot de passe incorrect.",
    );
  });

  it("distingue à l'inscription un compte existant d'une adresse non invitée", () => {
    expect(messageAuth("inscription", "USER_ALREADY_EXISTS", 422)).toBe(
      "Un compte existe déjà avec cette adresse.",
    );
    expect(messageAuth("inscription", "FORBIDDEN", 403)).toBe(
      "Cette adresse n'est pas invitée. Demandez l'accès à l'administrateur.",
    );
  });
});
