import { z } from "zod";

/**
 * Les variables `NEXT_PUBLIC_*` sont inlinées au build : elles doivent être
 * référencées littéralement, `process.env[nom]` ne fonctionne pas.
 */
const parsed = z
  .object({
    NEXT_PUBLIC_API_URL: z.url("NEXT_PUBLIC_API_URL doit être une URL absolue."),
  })
  .safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  });

if (!parsed.success) {
  throw new Error(
    `Configuration web invalide :\n${parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;
