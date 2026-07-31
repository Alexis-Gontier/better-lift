/** @type {import("@commitlint/types").UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Le périmètre correspond au package ou au domaine métier (doc 07).
    "scope-empty": [1, "never"],
    "header-max-length": [2, "always", 100],
  },
};
