/** Month-precision career labels. Fallback HTML never depends on build time. */
export function monthIndex(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || "")) return null;
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}
export function formatCareerDate(
  start,
  { career = false, end, now = new Date() } = {},
) {
  const from = monthIndex(start);
  const to = end ? monthIndex(end) : now.getFullYear() * 12 + now.getMonth();
  if (from === null || to === null || to < from) return null;
  const elapsed = to - from,
    years = Math.floor(elapsed / 12),
    months = elapsed % 12;
  if (career && years) return `${years}+ years in engineering`;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return `${parts.join(", ") || "Less than a month"} ${career ? "in engineering" : "in this role"}`;
}
