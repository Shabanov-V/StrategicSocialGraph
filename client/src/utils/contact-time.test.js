import { describe, it, expect } from 'vitest';
import { checkinDayISO, daysSince, formatLastContact } from './contact-time';

describe('checkinDayISO', () => {
  it('returns the previous calendar date before the 03:00 boundary', () => {
    expect(checkinDayISO(new Date(2026, 5, 23, 2, 59))).toBe('2026-06-22');
  });

  it('flips to the new date at exactly 03:00', () => {
    expect(checkinDayISO(new Date(2026, 5, 23, 3, 0))).toBe('2026-06-23');
  });

  it('returns the same date during the day', () => {
    expect(checkinDayISO(new Date(2026, 5, 23, 12, 0))).toBe('2026-06-23');
  });

  it('counts just-past-midnight as the previous day', () => {
    expect(checkinDayISO(new Date(2026, 5, 23, 0, 10))).toBe('2026-06-22');
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
