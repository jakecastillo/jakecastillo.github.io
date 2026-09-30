import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: ["components/portfolio/*.tsx"],
    rules: {
      // Ordinary img/picture elements intentionally target a static host; responsive sources are explicit.
      "@next/next/no-img-element": "off",
    },
  },
]);
