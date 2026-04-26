import { z } from 'zod';

// ── Date types ────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" — represents a calendar day, no time component */
export type ISODate = string & { readonly __brand: 'ISODate' };

/** ISO 8601 full timestamp — "2026-03-10T14:30:00.000Z" */
export type ISODateTime = string & { readonly __brand: 'ISODateTime' };

/** Branded ID types — prevents mixing IDs at compile time */
export type HabitId = string & { readonly __brand: 'HabitId' };
export type DeverId = string & { readonly __brand: 'DeverId' };
export type ProjetoId = string & { readonly __brand: 'ProjetoId' };
export type EtapaId = string & { readonly __brand: 'EtapaId' };
export type FoodId = string & { readonly __brand: 'FoodId' };
export type DiaryEntryId = string & { readonly __brand: 'DiaryEntryId' };
export type GameId = string & { readonly __brand: 'GameId' };
export type BookId = string & { readonly __brand: 'BookId' };
export type MovieId = string & { readonly __brand: 'MovieId' };
export type SaudeItemId = string & { readonly __brand: 'SaudeItemId' };
export type SaudeEventId = string & { readonly __brand: 'SaudeEventId' };
export type ListaCompraId = string & { readonly __brand: 'ListaCompraId' };
export type CompraItemId = string & { readonly __brand: 'CompraItemId' };

// ── Recurrence ────────────────────────────────────────────────────────────────

export type WeekdayName =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DailyRecurrence = { type: 'daily' };

export type WeeklyRecurrence = {
  type: 'weekly';
  /** At least one weekday required */
  weekdays: [WeekdayName, ...WeekdayName[]];
};

export type MonthlyRecurrence = {
  type: 'monthly';
  /** Day of month 1–31. If the month doesn't have this day, occurrence is skipped silently. */
  monthDay: number;
  /** Optional end day of the active window. When set, the dever is active from monthDay to monthDayEnd. */
  monthDayEnd?: number;
};

export type RecurrenceConfig =
  | DailyRecurrence
  | WeeklyRecurrence
  | MonthlyRecurrence;

// ── Zod schemas ───────────────────────────────────────────────────────────────
// Note: Zod infers plain `string` for z.string(), not branded types.
// The adapter casts parsed results to branded types with `as unknown as T`.
// This is the standard pattern for branded types + Zod.

export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const ISODateTimeSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO datetime string' });

export const WeekdayNameSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const DailyRecurrenceSchema = z.object({
  type: z.literal('daily'),
});

export const WeeklyRecurrenceSchema = z.object({
  type: z.literal('weekly'),
  weekdays: z.array(WeekdayNameSchema).min(1),
});

export const MonthlyRecurrenceSchema = z.object({
  type: z.literal('monthly'),
  monthDay: z.number().int().min(1).max(31),
  monthDayEnd: z.number().int().min(1).max(31).optional(),
});

export const RecurrenceConfigSchema = z.discriminatedUnion('type', [
  DailyRecurrenceSchema,
  WeeklyRecurrenceSchema,
  MonthlyRecurrenceSchema,
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Creates a type-safe ISODate from a Date object using local date parts */
export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as ISODate;
}

export function todayISODate(): ISODate {
  return toISODate(new Date());
}

export function nowISODateTime(): ISODateTime {
  return new Date().toISOString() as ISODateTime;
}
