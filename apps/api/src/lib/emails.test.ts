import { describe, expect, it } from "vitest";

import { resetPasswordEmail, verificationEmail } from "./emails.js";

const URL_EXEMPLE = "https://api.better-lift.app/api/auth/verify-email?token=abc";

describe("verificationEmail", () => {
  it("should carry the link in both the html and the text part when built", () => {
    const email = verificationEmail({ url: URL_EXEMPLE, name: "Alex" });

    // Un e-mail sans partie texte est pénalisé par les filtres anti-spam, et
    // le lien y est le seul contenu qui compte vraiment.
    expect(email.html).toContain(URL_EXEMPLE);
    expect(email.text).toContain(URL_EXEMPLE);
  });

  it("should greet without a name when the account has none", () => {
    // Un compte créé par OAuth peut arriver sans nom.
    const email = verificationEmail({ url: URL_EXEMPLE, name: null });

    expect(email.text.startsWith("Bonjour,")).toBe(true);
  });

  it("should not threaten to suspend the account, verification being non-blocking", () => {
    const email = verificationEmail({ url: URL_EXEMPLE, name: "Alex" });

    // D6 : l'accès n'est pas conditionné à la vérification. Un e-mail qui
    // menacerait de suspendre le compte mentirait sur le produit.
    expect(email.text).toContain("déjà actif");
  });
});

describe("resetPasswordEmail", () => {
  it("should state the expiry in minutes when built", () => {
    const email = resetPasswordEmail({ url: URL_EXEMPLE, name: null, expiresInMinutes: 60 });

    // L'expiration silencieuse d'un lien est la première source de confusion
    // de ce parcours : elle doit être écrite.
    expect(email.text).toContain("60 minutes");
    expect(email.html).toContain("60 minutes");
  });
});
