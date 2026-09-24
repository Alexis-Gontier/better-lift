// @ts-check
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

/**
 * Les paquets du dépôt (`packages/*`) sont du TypeScript source, importé avec
 * l'extension `.js` — la convention ESM que `tsc` exige (`./routines.js` pour
 * `routines.ts`). Metro, lui, cherche littéralement `routines.js` et échoue :
 * « Unable to resolve module ./allowlist.js ».
 *
 * Pour un import RELATIF en `.js` venu d'un paquet du dépôt, on essaie donc
 * d'abord la variante `.ts`. Tout le reste — dépendances de node_modules
 * comprises — suit la résolution par défaut, inchangée.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const depuisUnPaquet = /[\\/]packages[\\/]/.test(context.originModulePath);
  if (depuisUnPaquet && moduleName.startsWith(".") && moduleName.endsWith(".js")) {
    try {
      return context.resolveRequest(context, moduleName.replace(/\.js$/, ".ts"), platform);
    } catch {
      // Pas de variante .ts : c'était bien un .js, la résolution par défaut s'en charge.
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
