import type { Habit, HabitCompletions } from '../models/habit.js';
import {
  normalizeHabitSettings,
  normalizeHabitTimesPerDay,
  normalizeHabitValueWeights,
} from '../models/habit.js';
import type { ISODate } from '../models/shared.js';

export interface HabitProgress {
  date: ISODate;
  count: number;
  targetCount: number;
  score: number;
  targetScore: number;
  baseScore: number;
  overchargeScore: number;
  percent: number;
  basePercent: number;
  overchargePercent: number;
  isDone: boolean;
  remainingCount: number;
  nextWeight: number;
}

export interface HabitDayProgressSummary {
  date: ISODate;
  totalHabits: number;
  doneHabits: number;
  score: number;
  targetScore: number;
  baseScore: number;
  overchargeScore: number;
  percent: number;
  basePercent: number;
  overchargePercent: number;
}

export function getHabitCompletionCount(habit: Pick<Habit, 'completions'>, date: ISODate): number {
  return habit.completions[date] ?? 0;
}

export function computeHabitTargetScore(habit: Pick<Habit, 'timesPerDay' | 'valueWeights'>): number {
  const settings = normalizeHabitSettings(habit);
  return scoreHabitOccurrences(settings.timesPerDay, settings.valueWeights);
}

export function scoreHabitOccurrences(count: number, valueWeights: readonly number[]): number {
  const occurrenceCount = Math.max(0, Math.trunc(count));
  if (occurrenceCount === 0) return 0;

  const weights = normalizeHabitValueWeights(
    Math.max(1, valueWeights.length),
    valueWeights,
  );
  const fallbackWeight = weights[weights.length - 1] ?? 1;

  let score = 0;
  for (let index = 0; index < occurrenceCount; index++) {
    score += weights[index] ?? fallbackWeight;
  }

  return score;
}

export function computeHabitProgress(habit: Habit, date: ISODate): HabitProgress {
  const count = getHabitCompletionCount(habit, date);
  const targetCount = normalizeHabitTimesPerDay(habit.timesPerDay);
  const valueWeights = normalizeHabitValueWeights(targetCount, habit.valueWeights);
  const targetScore = scoreHabitOccurrences(targetCount, valueWeights);
  const score = scoreHabitOccurrences(count, valueWeights);
  const baseScore = Math.min(score, targetScore);
  const overchargeScore = Math.max(0, score - targetScore);
  const nextWeight = valueWeights[Math.min(count, valueWeights.length - 1)] ?? valueWeights[valueWeights.length - 1] ?? 1;

  return {
    date,
    count,
    targetCount,
    score,
    targetScore,
    baseScore,
    overchargeScore,
    percent: targetScore > 0 ? Math.round((score / targetScore) * 100) : 0,
    basePercent: targetScore > 0 ? Math.round((baseScore / targetScore) * 100) : 0,
    overchargePercent: targetScore > 0 ? Math.round((overchargeScore / targetScore) * 100) : 0,
    isDone: score >= targetScore,
    remainingCount: Math.max(0, targetCount - count),
    nextWeight,
  };
}

export function computeHabitDayProgress(habits: Habit[], date: ISODate): HabitDayProgressSummary {
  const activeHabits = habits.filter((habit) => habit.active);
  const progressItems = activeHabits.map((habit) => computeHabitProgress(habit, date));
  const targetScore = progressItems.reduce((sum, item) => sum + item.targetScore, 0);
  const score = progressItems.reduce((sum, item) => sum + item.score, 0);
  const baseScore = progressItems.reduce((sum, item) => sum + item.baseScore, 0);
  const overchargeScore = progressItems.reduce((sum, item) => sum + item.overchargeScore, 0);

  return {
    date,
    totalHabits: activeHabits.length,
    doneHabits: progressItems.filter((item) => item.isDone).length,
    score,
    targetScore,
    baseScore,
    overchargeScore,
    percent: targetScore > 0 ? Math.round((score / targetScore) * 100) : 0,
    basePercent: targetScore > 0 ? Math.round((baseScore / targetScore) * 100) : 0,
    overchargePercent: targetScore > 0 ? Math.round((overchargeScore / targetScore) * 100) : 0,
  };
}

export function computeHabitGoalCompletions(habit: Habit): Record<ISODate, true> {
  const completed: Record<string, true> = {};

  for (const date of Object.keys(habit.completions) as ISODate[]) {
    if (computeHabitProgress(habit, date).isDone) {
      completed[date] = true;
    }
  }

  return completed as Record<ISODate, true>;
}

export function incrementHabitCompletion(completions: HabitCompletions, date: ISODate): HabitCompletions {
  return {
    ...completions,
    [date]: (completions[date] ?? 0) + 1,
  };
}

export function decrementHabitCompletion(completions: HabitCompletions, date: ISODate): HabitCompletions {
  const current = completions[date] ?? 0;
  if (current <= 1) {
    const next = { ...completions };
    delete (next as Record<string, number>)[date];
    return next;
  }

  return {
    ...completions,
    [date]: current - 1,
  };
}
