/**
 * L'appareil d'une session, lu dans son agent : « Chrome sur Windows », « Application mobile
 * (Android) ». Pas de ville : il faudrait géolocaliser l'IP.
 */
export function appareilDe(ua: string | null | undefined): { label: string; mobile: boolean } {
  const agent = ua ?? "";
  if (/Expo|okhttp|better-lift/i.test(agent))
    return {
      label: `Application mobile${/Android/.test(agent) ? " (Android)" : ""}`,
      mobile: true,
    };
  const navigateur = /Firefox/.test(agent)
    ? "Firefox"
    : /Edg/.test(agent)
      ? "Edge"
      : /Chrome/.test(agent)
        ? "Chrome"
        : /Safari/.test(agent)
          ? "Safari"
          : "Navigateur";
  const systeme = /Windows/.test(agent)
    ? "Windows"
    : /Android/.test(agent)
      ? "Android"
      : /iPhone|iPad/.test(agent)
        ? "iOS"
        : /Mac/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "";
  return { label: systeme ? `${navigateur} sur ${systeme}` : navigateur, mobile: false };
}
