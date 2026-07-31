const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * Configuration monorepo (doc 09, point à valider en V0).
 *
 * Metro ne surveille par défaut que le dossier du projet : sans `watchFolders`,
 * les packages du workspace ne sont ni suivis ni résolus. `nodeModulesPaths`
 * ajoute le store de la racine, ce qui suffit avec pnpm 11 — on démarre donc
 * **sans** `node-linker=hoisted`, qui annulerait l'isolation de pnpm.
 */
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Avec pnpm, un même paquet peut exister à plusieurs endroits du store :
// la résolution hiérarchique évite d'embarquer deux copies de React.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
