// ── Models ────────────────────────────────────────────────────────────────────
export type {
  ISODate,
  ISODateTime,
  HabitId,
  DeverId,
  FoodId,
  DiaryEntryId,
  WeekdayName,
  DailyRecurrence,
  WeeklyRecurrence,
  MonthlyRecurrence,
  RecurrenceConfig,
} from './models/shared.js';

export {
  ISODateSchema,
  ISODateTimeSchema,
  WeekdayNameSchema,
  DailyRecurrenceSchema,
  WeeklyRecurrenceSchema,
  MonthlyRecurrenceSchema,
  RecurrenceConfigSchema,
  toISODate,
  todayISODate,
  nowISODateTime,
} from './models/shared.js';

export type { Habit, HabitInput } from './models/habit.js';
export { HabitSchema, HabitArraySchema } from './models/habit.js';

export type {
  DeverCompletion,
  DeverBase,
  OnceDever,
  CyclicDever,
  Dever,
  DeverInput,
} from './models/dever.js';
export { OnceDeverSchema, CyclicDeverSchema, DeverSchema, DeverArraySchema } from './models/dever.js';

export type {
  NutrientsPer100g,
  Food,
  FoodInput,
  FoodDiaryEntry,
  QuickDiaryEntry,
  DiaryEntry,
  DiaryEntryInput,
  NutritionProfile,
  DailyTargets,
  DailyNutritionSummary,
} from './models/nutrition.js';

export {
  NutrientsPer100gSchema,
  FoodSchema,
  FoodArraySchema,
  FoodDiaryEntrySchema,
  QuickDiaryEntrySchema,
  DiaryEntrySchema,
  DiaryEntryArraySchema,
  NutritionProfileSchema,
} from './models/nutrition.js';

// ── Contracts ─────────────────────────────────────────────────────────────────
export type { Result, TodaySnapshot, DataAdapter } from './contracts/DataAdapter.js';

// ── Domain ────────────────────────────────────────────────────────────────────
export { isOccurrenceOn } from './domain/recurrence.js';

export type { HabitStreakInfo } from './domain/streaks.js';
export { computeStreaks } from './domain/streaks.js';

export {
  computePortionNutrients,
  computeDailyTotals,
  computeDailyTargets,
  computePercentages,
} from './domain/nutrition.js';
