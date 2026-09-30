import test from "node:test";
import assert from "node:assert/strict";
import { formatCareerDate, monthIndex } from "../lib/portfolio/dates.mjs";
test("career anniversaries use completed calendar years", () => {
  assert.equal(
    formatCareerDate("2020-01", { career: true, now: new Date(2026, 8, 30) }),
    "6+ years in engineering",
  );
  assert.equal(
    formatCareerDate("2020-01", { career: true, now: new Date(2027, 0, 1) }),
    "7+ years in engineering",
  );
});
test("tenure rolls from months to years without stale build-time copy", () => {
  assert.equal(
    formatCareerDate("2025-10", { now: new Date(2026, 8, 30) }),
    "11 months in this role",
  );
  assert.equal(
    formatCareerDate("2025-10", { now: new Date(2026, 9, 1) }),
    "1 year in this role",
  );
  assert.equal(
    formatCareerDate("2025-10", { end: "2026-11", now: new Date(2030, 0, 1) }),
    "1 year, 1 month in this role",
  );
});
test("invalid and future dates preserve the HTML fallback", () => {
  for (const value of ["bad", "2020-00", "2020-13", "2020-1", undefined])
    assert.equal(monthIndex(value), null);
  assert.equal(
    formatCareerDate("2030-01", { now: new Date(2026, 0, 1) }),
    null,
  );
  assert.equal(formatCareerDate("2020-01", { end: "bad" }), null);
});
