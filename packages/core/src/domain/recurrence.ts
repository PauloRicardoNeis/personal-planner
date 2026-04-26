import type { ISODate, MonthlyRecurrence, RecurrenceConfig, WeekdayName } from '../models/shared.js';
import { toISODate } from '../models/shared.js';

/**
 * Returns true if a recurrence configuration fires on the given date.
 *
 * For monthly recurrences with a `monthDayEnd` window, returns true for any
 * day within [monthDay, monthDayEnd] inclusive.
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

      const day = d.getDate();
      if (config.monthDayEnd != null) {
        const end = Math.min(config.monthDayEnd, daysInMonth);
        return day >= config.monthDay && day <= end;
      }
      return day === config.monthDay;
    }
  }
}

/**
 * For a monthly recurrence with a window (monthDayEnd), returns:
 * - `'active'`  if the date falls within the window [monthDay, monthDayEnd]
 * - `'overdue'` if the date is past monthDayEnd but before next monthDay (and no completion expected yet)
 * - `'none'`    if monthly but no window, or not a monthly recurrence at all
 *
 * Also returns the canonical `occurrenceDate` (the monthDay of the relevant month) for completion tracking.
 * Returns null for non-monthly or non-windowed configs.
 */
export function getMonthlyWindowInfo(
  config: RecurrenceConfig,
  date: ISODate,
): { status: 'active' | 'overdue'; occurrenceDate: ISODate } | null {
  if (config.type !== 'monthly' || config.monthDayEnd == null) return null;

  const d = parseISODate(date);
  const day = d.getDate();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  if (config.monthDay > daysInMonth) return null; // month doesn't have start day

  const end = Math.min(config.monthDayEnd, daysInMonth);
  const occurrenceDate = toISODate(new Date(d.getFullYear(), d.getMonth(), config.monthDay));

  if (day >= config.monthDay && day <= end) {
    return { status: 'active', occurrenceDate };
  }

  if (day > end) {
    // Past the window in the same month — overdue for this cycle
    return { status: 'overdue', occurrenceDate };
  }

  // day < monthDay — before the window starts this month.
  // Check if there's an overdue cycle from the PREVIOUS month.
  const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
  if (config.monthDay > daysInPrevMonth) return null; // prev month didn't have start day
  const prevOccurrence = toISODate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), config.monthDay));
  return { status: 'overdue', occurrenceDate: prevOccurrence };
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
