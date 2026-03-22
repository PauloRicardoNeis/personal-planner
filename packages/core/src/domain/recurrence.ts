import type { ISODate, RecurrenceConfig, WeekdayName } from '../models/shared.js';

/**
 * Returns true if a recurrence configuration fires on the given date.
 *
 * Pure function — no side effects, no imports from browser APIs.
 * Uses local date arithmetic (getDay, getDate, etc.) not UTC.
 *
 * Edge cases:
 * - MonthlyRecurrence with monthDay that doesn't exist in the month → returns false (skip silently)
 * - WeeklyRecurrence with empty weekdays → always false (invalid config, but safe)
 */
export function isOccurrenceOn(config: RecurrenceConfig, date: ISODate): boolean {
  const d = parseISODate(date);

  switch (config.type) {
    case 'daily':
      return true;

    case 'weekly': {
      const dayName = weekdayName(d);
      return config.weekdays.includes(dayName);
    }

    case 'monthly': {
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (config.monthDay > daysInMonth) return false;
      return d.getDate() === config.monthDay;
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parses an ISODate string ("YYYY-MM-DD") into a Date using local time.
 * Avoids the UTC offset issue of `new Date("YYYY-MM-DD")` which treats it as UTC.
 */
function parseISODate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

const WEEKDAY_NAMES: WeekdayName[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function weekdayName(date: Date): WeekdayName {
  const name = WEEKDAY_NAMES[date.getDay()];
  if (!name) throw new Error(`Unexpected day index: ${date.getDay()}`);
  return name;
}
