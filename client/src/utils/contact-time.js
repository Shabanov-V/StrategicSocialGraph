// Date helpers for the contact log. All dates are ISO calendar dates (YYYY-MM-DD),
// not timestamps. Day math is done in local time so day boundaries match the user.

// The Check-in Day boundary: the logical day flips at 03:00 local, not midnight.
// 00:00–02:59 belongs to the previous day. See "Check-in Day" in CONTEXT.md.
const CHECKIN_DAY_OFFSET_HOURS = 3;

/**
 * The current Check-in Day as a local YYYY-MM-DD date (not UTC).
 * Shifts `now` back 3h before reading the local date, so the day boundary
 * is 03:00. Epoch-subtract then local-read keeps it DST-safe. `now` is
 * injectable for testing.
 */
export function checkinDayISO(now = new Date()) {
  const shifted = new Date(now.getTime() - CHECKIN_DAY_OFFSET_HOURS * 3_600_000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
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
