import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "_next/**",
    // Generated / untracked local tooling — never source we ship, so keep it
    // out of the repo-wide warning baseline (jc-fjx). Playwright MCP session
    // scratch and any agent worktree checkouts would otherwise inflate the
    // count with warnings that have nothing to do with the site.
    ".playwright-mcp/**",
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
