#!/usr/bin/env node
/**
 * check-identity-leak.mjs
 *
 * Guards the single canonical jake.os identity. After the brand uplift the ONE
 * positioning is BRAND.role = "DevSecOps Engineer" (see
 * components/desktop/config/brand.ts). This script greps the repo for the stale
 * positioning strings from the old "Software Engineer" metadata and the marketing
 * taglines, and exits non-zero if any of them leak back in.
 *
 * Real job titles (e.g. "DevSecOps Software Engineer" in data/resume.ts /
 * data/projects.ts) are legitimate work history and are NOT matched — the
 * patterns below target only the dead *positioning* strings, never the bare
 * words "Software Engineer".
 *
 * Usage: node scripts/check-identity-leak.mjs
 * The orchestrator runs this after the brand batch lands; it is NOT a gate that
 * any single agent runs mid-batch (identity edits arrive in parallel).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// Stale positioning strings that must not reappear anywhere in live source.
// Each is matched case-insensitively as a fixed string (rg -F / -i).
const DEAD_STRINGS = [
    "| Software Engineer", // old <title> / og:title positioning
    "innovation specialist",
    "Full-stack engineer", // old tagline ("Full-stack engineer specialized in ...")
    "constructing digital reality",
    "high-performance web applications",
];

// Directories/files excluded from the scan. data/resume.ts is excluded because
// it carries real, dated work-history titles. Build output (.next, out, _next)
// and planning/audit docs that quote the old strings as the thing-being-removed
// are not live source and are excluded too.
const EXCLUDES = [
    "node_modules",
    ".next",
    "_next",
    "out",
    "scripts/audit/out",
    ".git",
    "docs",
    "data/resume.ts",
    "scripts/check-identity-leak.mjs",
];

function buildGlobArgs() {
    return EXCLUDES.flatMap((path) => ["--glob", `!${path}`, "--glob", `!${path}/**`]);
}

function hasRipgrep() {
    const probe = spawnSync("rg", ["--version"], { encoding: "utf8" });
    return probe.status === 0;
}

function searchWithRipgrep() {
    const findings = [];
    for (const needle of DEAD_STRINGS) {
        const result = spawnSync(
            "rg",
            ["--no-heading", "--line-number", "--color", "never", "-F", "-i", ...buildGlobArgs(), needle, "."],
            { encoding: "utf8" }
        );
        // rg exit codes: 0 = matches, 1 = no matches, 2 = error.
        if (result.status === 2) {
            console.error(`check-identity-leak: ripgrep error scanning for "${needle}":`);
            console.error(result.stderr.trim());
            process.exit(2);
        }
        if (result.status === 0 && result.stdout.trim()) {
            findings.push({ needle, hits: result.stdout.trim() });
        }
    }
    return findings;
}

function main() {
    if (!hasRipgrep()) {
        console.error("check-identity-leak: ripgrep (rg) is required but was not found on PATH.");
        process.exit(2);
    }

    // Sanity: the canonical identity source must exist.
    if (!existsSync("components/desktop/config/brand.ts")) {
        console.error("check-identity-leak: components/desktop/config/brand.ts not found — run from repo root.");
        process.exit(2);
    }

    const findings = searchWithRipgrep();

    if (findings.length > 0) {
        console.error("\n✖ Identity leak detected — stale positioning strings found:\n");
        for (const { needle, hits } of findings) {
            console.error(`  Dead string "${needle}":`);
            for (const line of hits.split("\n")) {
                console.error(`    ${line}`);
            }
            console.error("");
        }
        console.error("The canonical identity is BRAND.role in components/desktop/config/brand.ts.");
        console.error("Remove the stale strings (real work-history titles belong in data/resume.ts).\n");
        process.exit(1);
    }

    console.log("✓ check-identity-leak: no stale positioning strings found. Identity is single-sourced.");
    process.exit(0);
}

main();
