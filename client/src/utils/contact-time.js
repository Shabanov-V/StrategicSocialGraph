// Date helpers for the contact log. All dates are ISO calendar dates (YYYY-MM-DD),
// not timestamps. Day math is done in local time so day boundaries match the user.

/** Today's local calendar date as YYYY-MM-DD (not UTC, unlike toISOString). */
export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from `isoDate` up to `today` (both YYYY-MM-DD). */
export function daysSince(isoDate, today) {
  const ms = Date.parse(`${today}T00:00:00`) - Date.parse(`${isoDate}T00:00:00`);
  return Math.round(ms / 86_400_000);
}

/**
 * Human label for a person's most recent contact relative to `today`:
 * "never" when empty, "today" for 0 days, otherwise "<n>d".
 */
export function formatLastContact(dates, today) {
  if (!dates || dates.length === 0) return 'never';
  const latest = [...dates].sort().at(-1);
  const n = daysSince(latest, today);
  return n === 0 ? 'today' : `${n}d`;
}
