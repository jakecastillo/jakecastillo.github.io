import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Public portfolio copy belongs in page components. Private source documents,
// planning records, credentials and generated bundles never belong in Git.
const forbiddenPath =
  /(^|\/)(\.env[^/]*|\.beads|\.codex|\.agents|private|confidential|_next|out|node_modules)(\/|$)|(^|\/)(?:resume|cv|curriculum[-_ ]?vitae)(?:[_. -]|$)|\.(?:pdf|docx?|odt|rtf|pem|key|map)$/i;
const secrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /AKIA[0-9A-Z]{16}/,
  /\btel:/i,
];
const failures = [];
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
for (const path of new Set(files)) {
  if (!existsSync(path)) continue; // Deletions from the former application are expected.
  if (forbiddenPath.test(path) || /^docs\/techfolio-concepts\//.test(path)) {
    failures.push(path);
    continue;
  }
  if (
    /\.(?:ts|tsx|js|mjs|json|md|yml|html|css)$/.test(path) &&
    !path.startsWith("tooling/") &&
    !path.startsWith("tests/")
  ) {
    if (secrets.some((pattern) => pattern.test(readFileSync(path, "utf8"))))
      failures.push(path);
  }
}
function scanExport(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scanExport(path);
    else if (
      /(?:resume|curriculum|\.pdf$|\.docx?$|\.map$|\.env)/i.test(entry.name)
    )
      failures.push(path);
  }
}
if (existsSync("out")) scanExport("out");
if (failures.length) {
  console.error(
    "Release privacy check failed (file paths only):\n" +
      [...new Set(failures)].join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "Privacy checks passed: no private document paths, recognized secrets, or source maps in the release inputs/export.",
  );
