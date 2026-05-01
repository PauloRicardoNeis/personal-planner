import { describe, it, expect } from 'vitest';
import { getMonthlyWindowInfo, isOccurrenceOn } from './recurrence.js';
import type { ISODate } from '../models/shared.js';

const d = (s: string) => s as ISODate;

describe('isOccurrenceOn — daily', () => {
  it('fires on any date', () => {
    expect(isOccurrenceOn({ type: 'daily' }, d('2026-03-10'))).toBe(true);
    expect(isOccurrenceOn({ type: 'daily' }, d('2026-01-01'))).toBe(true);
    expect(isOccurrenceOn({ type: 'daily' }, d('2026-12-31'))).toBe(true);
  });
});

describe('isOccurrenceOn — weekly', () => {
  // 2026-03-09 is a Monday
  it('fires on the configured weekday', () => {
    expect(isOccurrenceOn({ type: 'weekly', weekdays: ['monday'] }, d('2026-03-09'))).toBe(true);
  });

  it('does not fire on other weekdays', () => {
    expect(isOccurrenceOn({ type: 'weekly', weekdays: ['monday'] }, d('2026-03-10'))).toBe(false); // Tuesday
    expect(isOccurrenceOn({ type: 'weekly', weekdays: ['monday'] }, d('2026-03-11'))).toBe(false); // Wednesday
  });

  it('fires on any of multiple configured weekdays', () => {
    const config = { type: 'weekly' as const, weekdays: ['monday', 'wednesday'] as ['monday', 'wednesday'] };
    expect(isOccurrenceOn(config, d('2026-03-09'))).toBe(true);  // Monday
    expect(isOccurrenceOn(config, d('2026-03-11'))).toBe(true);  // Wednesday
    expect(isOccurrenceOn(config, d('2026-03-10'))).toBe(false); // Tuesday
  });

  it('fires on saturday and sunday', () => {
    expect(isOccurrenceOn({ type: 'weekly', weekdays: ['saturday'] }, d('2026-03-14'))).toBe(true);
    expect(isOccurrenceOn({ type: 'weekly', weekdays: ['sunday'] }, d('2026-03-15'))).toBe(true);
  });
});

describe('isOccurrenceOn — monthly', () => {
  it('fires on the configured day of month', () => {
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 10 }, d('2026-03-10'))).toBe(true);
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 1 }, d('2026-01-01'))).toBe(true);
  });

  it('does not fire on other days', () => {
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 10 }, d('2026-03-11'))).toBe(false);
  });

  it('skips silently when monthDay does not exist in the month (Feb 28 days)', () => {
    // 2026 is not a leap year — February has 28 days
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 29 }, d('2026-02-01'))).toBe(false);
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 30 }, d('2026-02-01'))).toBe(false);
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 31 }, d('2026-02-01'))).toBe(false);
  });

  it('skips silently when monthDay 31 in a 30-day month', () => {
    // April has 30 days
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 31 }, d('2026-04-01'))).toBe(false);
  });

  it('fires on day 29 in a leap year February', () => {
    // 2028 is a leap year
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 29 }, d('2028-02-29'))).toBe(true);
  });

  it('fires on day 31 in a 31-day month', () => {
    expect(isOccurrenceOn({ type: 'monthly', monthDay: 31 }, d('2026-03-31'))).toBe(true);
  });

  it('fires throughout a configured monthly window', () => {
    const config = { type: 'monthly' as const, monthDay: 10, monthDayEnd: 12 };

    expect(isOccurrenceOn(config, d('2026-03-09'))).toBe(false);
    expect(isOccurrenceOn(config, d('2026-03-10'))).toBe(true);
    expect(isOccurrenceOn(config, d('2026-03-11'))).toBe(true);
    expect(isOccurrenceOn(config, d('2026-03-12'))).toBe(true);
    expect(isOccurrenceOn(config, d('2026-03-13'))).toBe(false);
  });

  it('clamps a monthly window end to the number of days in the month', () => {
    const config = { type: 'monthly' as const, monthDay: 28, monthDayEnd: 31 };

    expect(isOccurrenceOn(config, d('2026-02-28'))).toBe(true);
    expect(isOccurrenceOn(config, d('2026-03-31'))).toBe(true);
  });
});

describe('getMonthlyWindowInfo', () => {
  it('returns null for non-monthly and non-windowed configs', () => {
    expect(getMonthlyWindowInfo({ type: 'daily' }, d('2026-03-10'))).toBeNull();
    expect(getMonthlyWindowInfo({ type: 'weekly', weekdays: ['monday'] }, d('2026-03-10'))).toBeNull();
    expect(getMonthlyWindowInfo({ type: 'monthly', monthDay: 10 }, d('2026-03-10'))).toBeNull();
  });

  it('returns active status inside the current monthly window', () => {
    expect(getMonthlyWindowInfo(
      { type: 'monthly', monthDay: 10, monthDayEnd: 12 },
      d('2026-03-11'),
    )).toEqual({
      status: 'active',
      occurrenceDate: d('2026-03-10'),
    });
  });

  it('returns overdue status after the current monthly window', () => {
    expect(getMonthlyWindowInfo(
      { type: 'monthly', monthDay: 10, monthDayEnd: 12 },
      d('2026-03-20'),
    )).toEqual({
      status: 'overdue',
      occurrenceDate: d('2026-03-10'),
    });
  });

  it('returns the previous month occurrence before this month window starts', () => {
    expect(getMonthlyWindowInfo(
      { type: 'monthly', monthDay: 10, monthDayEnd: 12 },
      d('2026-03-05'),
    )).toEqual({
      status: 'overdue',
      occurrenceDate: d('2026-02-10'),
    });
  });

  it('returns null when current or previous month cannot contain the start day', () => {
    expect(getMonthlyWindowInfo(
      { type: 'monthly', monthDay: 31, monthDayEnd: 31 },
      d('2026-04-15'),
    )).toBeNull();
    expect(getMonthlyWindowInfo(
      { type: 'monthly', monthDay: 31, monthDayEnd: 31 },
      d('2026-03-05'),
    )).toBeNull();
  });

  it('uses local date parts across year boundaries', () => {
    expect(getMonthlyWindowInfo(
      { type: 'monthly', monthDay: 31, monthDayEnd: 31 },
      d('2027-01-05'),
    )).toEqual({
      status: 'overdue',
      occurrenceDate: d('2026-12-31'),
    });
  });
});
