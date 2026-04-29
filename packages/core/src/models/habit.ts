import { z } from 'zod';
import { ISODateSchema, ISODateTimeSchema, type HabitId, type ISODate, type ISODateTime } from './shared.js';

export const DEFAULT_HABIT_TIMES_PER_DAY = 1;
export const DEFAULT_HABIT_VALUE_WEIGHT = 1;
export const MAX_HABIT_TIMES_PER_DAY = 99;

export type HabitCompletions = Record<ISODate, number>;

export interface Habit {
  id: HabitId;
  title: string;
  category?: string;
  active: boolean;
  createdAt: ISODateTime;
  /** How many times this habit should be done in a normal day. */
  timesPerDay: number;
  /**
   * Point value for each target occurrence.
   * Extra occurrences beyond the target repeat the final configured weight.
   */
  valueWeights: number[];
  /**
   * Sparse map of daily occurrence counts.
   * habit.completions["2026-03-10"] === 2 -> done twice that day
   * habit.completions["2026-03-10"] === undefined -> not done that day
   */
  completions: HabitCompletions;
}

export type HabitInput = {
  title: string;
  category?: string;
  timesPerDay?: number;
  valueWeights?: number[];
};

export type HabitSettings = Pick<Habit, 'timesPerDay' | 'valueWeights'>;

export function normalizeHabitTimesPerDay(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_HABIT_TIMES_PER_DAY;
  }

  return Math.max(
    1,
    Math.min(MAX_HABIT_TIMES_PER_DAY, Math.trunc(value)),
  );
}

export function normalizeHabitValueWeights(
  timesPerDay: number,
  valueWeights: readonly unknown[] | undefined,
): number[] {
  const targetCount = normalizeHabitTimesPerDay(timesPerDay);
  const validWeights = (valueWeights ?? [])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const fallback = validWeights[validWeights.length - 1] ?? DEFAULT_HABIT_VALUE_WEIGHT;

  return Array.from({ length: targetCount }, (_, index) => validWeights[index] ?? fallback);
}

export function parseHabitValueWeightsInput(value: string): number[] {
  return value
    .split(/[,\s;/]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part > 0);
}

export function normalizeHabitSettings(input: {
  timesPerDay?: unknown;
  valueWeights?: readonly unknown[];
}): HabitSettings {
  const timesPerDay = normalizeHabitTimesPerDay(input.timesPerDay);
  return {
    timesPerDay,
    valueWeights: normalizeHabitValueWeights(timesPerDay, input.valueWeights),
  };
}

export function normalizeHabitCompletions(input: Record<string, unknown>): HabitCompletions {
  const completions: Record<string, number> = {};

  for (const [date, rawCount] of Object.entries(input)) {
    const count = rawCount === true
      ? 1
      : typeof rawCount === 'number' && Number.isFinite(rawCount)
        ? Math.trunc(rawCount)
        : 0;

    if (count > 0) {
      completions[date] = count;
    }
  }

  return completions as HabitCompletions;
}

const HabitCompletionCountSchema = z
  .union([z.literal(true), z.number().int().min(1)])
  .transform((value) => value === true ? 1 : value);

export const HabitSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  category: z.string().optional(),
  active: z.boolean(),
  createdAt: ISODateTimeSchema,
  timesPerDay: z.number().int().min(1).max(MAX_HABIT_TIMES_PER_DAY).catch(DEFAULT_HABIT_TIMES_PER_DAY),
  valueWeights: z.array(z.number().positive()).min(1).catch([DEFAULT_HABIT_VALUE_WEIGHT]),
  completions: z.record(ISODateSchema, HabitCompletionCountSchema),
}).transform((habit) => {
  const settings = normalizeHabitSettings(habit);
  return {
    ...habit,
    ...settings,
    completions: normalizeHabitCompletions(habit.completions),
  };
});

export const HabitArraySchema = z.array(HabitSchema);

export type HabitRaw = z.output<typeof HabitSchema>;
