import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "api/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
