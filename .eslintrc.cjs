module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
  ],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
      },
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
    },
    {
      files: ["*.json"],
      parser: "jsonc-eslint-parser",
    },
  ],
  ignorePatterns: ["node_modules", "dist", "build", ".turbo", "*.config.js"],
};
