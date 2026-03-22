import type { Habit, HabitInput } from '../models/habit.js';
import type { Dever, DeverBase, DeverInput } from '../models/dever.js';
import type { HabitId, DeverId, ISODate, FoodId, DiaryEntryId } from '../models/shared.js';
import type { Food, FoodInput, DiaryEntry, DiaryEntryInput, NutritionProfile, DailyNutritionSummary } from '../models/nutrition.js';
import type { HabitStreakInfo } from '../domain/streaks.js';

// ── Result type ───────────────────────────────────────────────────────────────

/**
 * All adapter methods return Result<T> instead of throwing.
 * Callers handle errors explicitly without try/catch at the boundary.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ── Today view ────────────────────────────────────────────────────────────────

export interface TodaySnapshot {
  date: ISODate;
  /** All active habits with their completion status for this date */
  habits: Array<{
    habit: Habit;
    isDone: boolean;
    streak: HabitStreakInfo;
  }>;
  /**
   * All deveres due today (recurrence fires today) + overdue once-deveres.
   * Ordering: overdue first, then due-today; within each group: high → medium → low.
   */
  deveres: Array<{
    dever: Dever;
    /** For once-deveres: the deadline. For cyclic: the date the recurrence fires. */
    occurrenceDate: ISODate;
    isDone: boolean;
    /** true when occurrenceDate < date — only possible for OnceDever */
    isOverdue: boolean;
  }>;
  nutritionSummary?: {
    calories: number;
    caloriesTarget: number;
    caloriesPercent: number;
    protein: number;
    proteinTarget: number;
    proteinPercent: number;
    carbs: number;
    carbsTarget: number;
    carbsPercent: number;
    fat: number;
    fatTarget: number;
    fatPercent: number;
  };
}

// ── The contract ──────────────────────────────────────────────────────────────

/**
 * DataAdapter — the single interface the frontend depends on for all data access.
 *
 * The concrete implementation (LocalStorageAdapter, RestApiAdapter) is selected
 * in ONE place: apps/web/src/adapter.ts.
 *
 * Rules:
 * - Never import a concrete adapter class outside of apps/web/src/adapter.ts
 * - All methods return Promise<Result<T>> — never throw across this boundary
 * - updateDever cannot change `type` or `recurrence` — archive and recreate instead
 */
export interface DataAdapter {
  // ── Habits ──────────────────────────────────────────────────────────────────

  /** Returns all habits, including archived ones */
  getHabits(): Promise<Result<Habit[]>>;

  /** Creates a new habit. ID and createdAt are assigned by the adapter. */
  createHabit(input: HabitInput): Promise<Result<Habit>>;

  /** Updates mutable habit fields. Does not affect completions. */
  updateHabit(
    id: HabitId,
    patch: Partial<HabitInput & { active: boolean }>,
  ): Promise<Result<Habit>>;

  /**
   * Records that a habit was completed on the given date.
   * Idempotent: marking an already-completed date is a no-op.
   */
  markHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>>;

  /** Removes the completion for the given date. Idempotent. */
  unmarkHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>>;

  /** Soft-deletes a habit (sets active: false). */
  archiveHabit(id: HabitId): Promise<Result<void>>;

  // ── Deveres ─────────────────────────────────────────────────────────────────

  /** Returns all deveres, including archived ones */
  getDeveres(): Promise<Result<Dever[]>>;

  /** Creates a new dever. ID and createdAt are assigned by the adapter. */
  createDever(input: DeverInput): Promise<Result<Dever>>;

  /**
   * Updates mutable dever fields.
   * Cannot change `type` or `recurrence` — archive and recreate for that.
   */
  updateDever(
    id: DeverId,
    patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>,
  ): Promise<Result<Dever>>;

  /**
   * Records completion of a specific occurrence.
   * occurrenceDate: the scheduled date of the occurrence being completed.
   * Idempotent: completing an already-completed occurrence is a no-op.
   */
  markDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>>;

  /** Removes a completion record for an occurrence. Idempotent. */
  unmarkDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>>;

  /** Soft-deletes a dever (sets active: false). */
  archiveDever(id: DeverId): Promise<Result<void>>;

  // ── Foods ───────────────────────────────────────────────────────────────────

  getFoods(): Promise<Result<Food[]>>;
  createFood(input: FoodInput): Promise<Result<Food>>;
  updateFood(id: FoodId, patch: Partial<FoodInput & { active: boolean }>): Promise<Result<Food>>;
  archiveFood(id: FoodId): Promise<Result<void>>;

  // ── Diary ───────────────────────────────────────────────────────────────────

  getDiaryEntries(date: ISODate): Promise<Result<DiaryEntry[]>>;
  createDiaryEntry(input: DiaryEntryInput & { date: ISODate }): Promise<Result<DiaryEntry>>;
  updateDiaryEntry(id: DiaryEntryId, patch: { grams?: number; meal?: string }): Promise<Result<DiaryEntry>>;
  deleteDiaryEntry(id: DiaryEntryId): Promise<Result<void>>;

  // ── Nutrition Profile ───────────────────────────────────────────────────────

  getNutritionProfile(): Promise<Result<NutritionProfile | null>>;
  saveNutritionProfile(profile: NutritionProfile): Promise<Result<NutritionProfile>>;

  // ── Nutrition Summary ───────────────────────────────────────────────────────

  getNutritionSummary(date: ISODate): Promise<Result<DailyNutritionSummary>>;

  // ── Today ────────────────────────────────────────────────────────────────────

  /**
   * Returns a pre-assembled snapshot for the given date.
   * The adapter is responsible for:
   * - determining which cyclic deveres fire on this date (via isOccurrenceOn)
   * - including overdue once-deveres (deadline < date, not completed)
   * - computing isDone and isOverdue for each item
   * - applying the ordering rules
   *
   * This keeps scheduling logic testable in isolation, out of React components.
   */
  getTodaySnapshot(date: ISODate): Promise<Result<TodaySnapshot>>;
}
