import { describe, expect, it, vi } from 'vitest';
import {
  DailyRecurrenceSchema,
  ISODateSchema,
  ISODateTimeSchema,
  MonthlyRecurrenceSchema,
  RecurrenceConfigSchema,
  WeekdayNameSchema,
  WeeklyRecurrenceSchema,
  nowISODateTime,
  toISODate,
  todayISODate,
} from './shared.js';

describe('shared schemas', () => {
  it('accepts and rejects ISO dates', () => {
    expect(ISODateSchema.parse('2026-04-10')).toBe('2026-04-10');
    expect(ISODateSchema.safeParse('2026-4-10').success).toBe(false);
    expect(ISODateSchema.safeParse('2026-04-10T00:00:00.000Z').success).toBe(false);
  });

  it('accepts and rejects ISO datetimes', () => {
    expect(ISODateTimeSchema.parse('2026-04-10T00:00:00.000Z')).toBe('2026-04-10T00:00:00.000Z');
    expect(ISODateTimeSchema.safeParse('2026-04-10').success).toBe(false);
  });

  it('validates weekdays and recurrence variants', () => {
    expect(WeekdayNameSchema.parse('monday')).toBe('monday');
    expect(WeekdayNameSchema.safeParse('segunda').success).toBe(false);
    expect(DailyRecurrenceSchema.parse({ type: 'daily' })).toEqual({ type: 'daily' });
    expect(WeeklyRecurrenceSchema.parse({ type: 'weekly', weekdays: ['monday'] })).toEqual({
      type: 'weekly',
      weekdays: ['monday'],
    });
    expect(MonthlyRecurrenceSchema.parse({ type: 'monthly', monthDay: 31, monthDayEnd: 31 })).toEqual({
      type: 'monthly',
      monthDay: 31,
      monthDayEnd: 31,
    });
    expect(RecurrenceConfigSchema.safeParse({ type: 'weekly', weekdays: [] }).success).toBe(false);
    expect(RecurrenceConfigSchema.safeParse({ type: 'monthly', monthDay: 0 }).success).toBe(false);
    expect(RecurrenceConfigSchema.safeParse({ type: 'monthly', monthDay: 10, monthDayEnd: 32 }).success).toBe(false);
    expect(RecurrenceConfigSchema.safeParse({ type: 'yearly' }).success).toBe(false);
  });
});

describe('date helpers', () => {
  it('formats Date objects with local date parts', () => {
    expect(toISODate(new Date(2026, 3, 9, 23, 59, 0))).toBe('2026-04-09');
  });

  it('returns today and now in ISO formats', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T15:30:45.000Z'));

    expect(todayISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(nowISODateTime()).toBe('2026-04-10T15:30:45.000Z');

    vi.useRealTimers();
  });
});
