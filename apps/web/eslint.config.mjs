import next from "eslint-config-next";

const config = [
  {
    ignores: ["e2e/**", "playwright.config.ts", ".next/**"],
  },
  ...(Array.isArray(next) ? next : [next]),
];

export default config;
