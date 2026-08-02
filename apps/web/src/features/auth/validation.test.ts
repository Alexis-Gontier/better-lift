import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  validateConfirmation,
  validateEmail,
  validateIfFilled,
  validateName,
  validatePassword,
} from "./validation";

describe("validateEmail", () => {
  it("should accept an ordinary address", () => {
    expect(validateEmail("alex@exemple.test")).toBeNull();
    expect(validateEmail("alex+salle@sous.domaine.exemple.test")).toBeNull();
  });

  it("should trim before judging, so a pasted address with spaces passes", () => {
    expect(validateEmail("  alex@exemple.test  ")).toBeNull();
  });

  it("should ask for an address when the field is empty or blank", () => {
    expect(validateEmail("")).toBe("Indiquez votre adresse e-mail.");
    expect(validateEmail("   ")).toBe("Indiquez votre adresse e-mail.");
  });

  it.each([
    ["alex", "ni arobase ni point"],
    ["alex@exemple", "pas de point après le domaine"],
    ["@exemple.test", "rien avant l'arobase"],
    ["alex exemple@test.fr", "une espace au milieu"],
  ])("should reject %s (%s)", (value) => {
    expect(validateEmail(value)).toBe("Cette adresse ne ressemble pas à une adresse e-mail.");
  });
});

describe("validateName", () => {
  it("should reject a name made only of spaces", () => {
    expect(validateName("   ")).toBe("Indiquez un nom.");
    expect(validateName("Alex")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("should require a value in both modes", () => {
    expect(validatePassword("", "new")).toBe("Indiquez votre mot de passe.");
    expect(validatePassword("", "existing")).toBe("Indiquez votre mot de passe.");
  });

  /**
   * Le cœur de la distinction : à la connexion, annoncer la longueur minimale
   * révélerait la politique de mots de passe et laisserait entendre que
   * l'adresse existe. Le serveur répond « identifiants incorrects », sans
   * distinguer — le client ne doit pas en dire plus que lui.
   */
  it("should not mention the minimum length when signing in", () => {
    expect(validatePassword("court", "existing")).toBeNull();
    expect(validatePassword("court", "new")).toBe(`${MIN_PASSWORD_LENGTH} caractères minimum.`);
  });

  it("should accept a password at exactly the minimum length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH), "new")).toBeNull();
  });

  it("should not trim: spaces are legitimate password characters", () => {
    expect(validatePassword("        ", "new")).toBeNull();
  });
});

describe("validateIfFilled", () => {
  /**
   * Le cas qui a motivé cette fonction : le premier champ porte l'autofocus,
   * donc cliquer sur la bascule de thème le quitte alors qu'il est vide. Sans
   * ce garde, l'écran reproche à quelqu'un qui n'a rien fait de n'avoir rien
   * saisi.
   */
  it("should stay silent on a field left untouched", () => {
    expect(validateIfFilled("", validateEmail)).toBeNull();
    expect(validateIfFilled("   ", validateEmail)).toBeNull();
  });

  it("should validate as usual once something has been typed", () => {
    expect(validateIfFilled("pas-une-adresse", validateEmail)).toBe(
      "Cette adresse ne ressemble pas à une adresse e-mail.",
    );
    expect(validateIfFilled("alex@exemple.test", validateEmail)).toBeNull();
  });

  /**
   * Le garde est réservé au `blur`. À la soumission, les validateurs sont
   * appelés directement — sinon un formulaire entièrement vide passerait.
   */
  it("should not be what guards submission", () => {
    expect(validateEmail("")).not.toBeNull();
  });
});

describe("validateConfirmation", () => {
  it("should require the confirmation before comparing it", () => {
    expect(validateConfirmation("motdepasse", "")).toBe("Confirmez le mot de passe.");
  });

  it("should compare exactly", () => {
    expect(validateConfirmation("motdepasse", "motdepasse")).toBeNull();
    expect(validateConfirmation("motdepasse", "Motdepasse")).toBe(
      "Les deux mots de passe ne correspondent pas.",
    );
  });
});
