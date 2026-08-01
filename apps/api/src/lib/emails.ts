/**
 * Gabarits des e-mails transactionnels.
 *
 * Volontairement en HTML écrit à la main plutôt qu'avec React Email : deux
 * e-mails d'une dizaine de lignes ne justifient pas une étape de rendu
 * supplémentaire dans le build de l'API. Le jour où il y en aura une dizaine,
 * ce fichier sera le bon endroit pour changer d'avis.
 *
 * Contraintes propres à l'e-mail, qui expliquent le style du HTML ci-dessous :
 * les clients de messagerie ignorent les feuilles de style externes et une
 * bonne partie de la mise en page moderne. D'où le `style=` en ligne et le
 * tableau de largeur fixe.
 */

/** Un e-mail prêt à partir. Le `text` n'est pas décoratif : sans lui, les filtres anti-spam pénalisent. */
export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

const BRAND = "better-lift";

/**
 * Enveloppe commune. `preheader` est le texte d'aperçu affiché par les clients
 * mail à côté de l'objet : laissé vide, ils y mettent le début du HTML, ce qui
 * donne souvent une ligne de balises.
 */
function layout({ preheader, body }: { preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#0b0b0d;color:#e8e8ea;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    <span style="display:none;font-size:1px;color:#0b0b0d;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#141417;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:18px;font-weight:600;">${BRAND}</p>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Bouton d'action. Doublé d'un lien en clair plus bas : certains clients n'affichent pas les boutons. */
function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#c7f04a;color:#0b0b0d;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${label}</a>`;
}

/**
 * Vérification d'adresse. Le ton est délibérément bas : la vérification est
 * **non bloquante** (doc 09 D6), l'utilisateur a déjà accès à l'application.
 * Un e-mail qui menacerait de suspendre le compte serait faux.
 */
export function verificationEmail({
  url,
  name,
}: {
  url: string;
  name?: string | null;
}): EmailContent {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";

  return {
    subject: "Confirmez votre adresse e-mail",
    html: layout({
      preheader: "Un clic pour confirmer votre adresse. Votre compte est déjà actif.",
      body: `
        <p style="margin:0 0 16px;line-height:1.6;">${greeting}</p>
        <p style="margin:0 0 24px;line-height:1.6;">
          Votre compte est déjà actif — cette confirmation sert à pouvoir vous
          redonner la main si vous perdez votre mot de passe.
        </p>
        <p style="margin:0 0 24px;">${button(url, "Confirmer mon adresse")}</p>
        <p style="margin:0 0 8px;line-height:1.6;color:#9a9aa2;font-size:13px;">
          Si le bouton ne fonctionne pas, copiez ce lien :
        </p>
        <p style="margin:0 0 24px;word-break:break-all;font-size:13px;color:#9a9aa2;">${url}</p>
        <p style="margin:0;line-height:1.6;color:#9a9aa2;font-size:13px;">
          Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet e-mail.
        </p>`,
    }),
    text: `${greeting}

Votre compte better-lift est déjà actif — cette confirmation sert à pouvoir vous redonner la main si vous perdez votre mot de passe.

Confirmez votre adresse : ${url}

Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet e-mail.`,
  };
}

/**
 * Réinitialisation de mot de passe. `expiresInMinutes` est affiché parce que
 * l'expiration silencieuse d'un lien est une des sources de confusion les plus
 * courantes de ce parcours.
 */
export function resetPasswordEmail({
  url,
  name,
  expiresInMinutes,
}: {
  url: string;
  name?: string | null;
  expiresInMinutes: number;
}): EmailContent {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";

  return {
    subject: "Réinitialisez votre mot de passe",
    html: layout({
      preheader: `Lien valable ${expiresInMinutes} minutes.`,
      body: `
        <p style="margin:0 0 16px;line-height:1.6;">${greeting}</p>
        <p style="margin:0 0 24px;line-height:1.6;">
          Vous avez demandé à réinitialiser votre mot de passe. Ce lien est
          valable <strong>${expiresInMinutes} minutes</strong>.
        </p>
        <p style="margin:0 0 24px;">${button(url, "Choisir un nouveau mot de passe")}</p>
        <p style="margin:0 0 8px;line-height:1.6;color:#9a9aa2;font-size:13px;">
          Si le bouton ne fonctionne pas, copiez ce lien :
        </p>
        <p style="margin:0 0 24px;word-break:break-all;font-size:13px;color:#9a9aa2;">${url}</p>
        <p style="margin:0;line-height:1.6;color:#9a9aa2;font-size:13px;">
          Vous n'avez rien demandé ? Ignorez cet e-mail, votre mot de passe reste inchangé.
        </p>`,
    }),
    text: `${greeting}

Vous avez demandé à réinitialiser votre mot de passe better-lift. Ce lien est valable ${expiresInMinutes} minutes.

Choisir un nouveau mot de passe : ${url}

Vous n'avez rien demandé ? Ignorez cet e-mail, votre mot de passe reste inchangé.`,
  };
}
