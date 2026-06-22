import { describe, it, expect } from 'vitest';
import { todayISO, daysSince, formatLastContact } from './contact-time';

describe('todayISO', () => {
  it('returns the local date as YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('daysSince', () => {
  it('counts whole days between two ISO dates', () => {
    expect(daysSince('2026-06-20', '2026-06-22')).toBe(2);
  });

  it('is 0 for the same day', () => {
    expect(daysSince('2026-06-22', '2026-06-22')).toBe(0);
  });
});

describe('formatLastContact', () => {
  it('returns "never" when there are no dates', () => {
    expect(formatLastContact([], '2026-06-22')).toBe('never');
  });

  it('returns "today" when the most recent date is today', () => {
    expect(formatLastContact(['2026-06-20', '2026-06-22'], '2026-06-22')).toBe('today');
  });

  it('returns "<n>d" using the most recent date', () => {
    expect(formatLastContact(['2026-06-10', '2026-06-19'], '2026-06-22')).toBe('3d');
  });
});
