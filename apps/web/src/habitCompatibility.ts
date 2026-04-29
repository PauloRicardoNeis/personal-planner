import {
  HabitSchema,
  computeHabitDayProgress,
  computeHabitGoalCompletions,
  computeHabitProgress,
  computeStreaks,
  normalizeHabitCompletions,
  normalizeHabitSettings,
  type Habit,
  type HabitDayProgressSummary,
  type HabitProgress,
  type TodaySnapshot,
} from '@planner/core';

export function normalizeHabitForUi(habit: Habit): Habit {
  const parsed = HabitSchema.safeParse(habit);
  if (parsed.success) {
    return parsed.data as unknown as Habit;
  }

  const raw = habit as Habit & {
    timesPerDay?: unknown;
    valueWeights?: unknown[];
    completions?: Record<string, unknown>;
  };
  const settings = normalizeHabitSettings({
    timesPerDay: raw.timesPerDay,
    valueWeights: raw.valueWeights,
  });

  return {
    ...habit,
    ...settings,
    completions: normalizeHabitCompletions(raw.completions ?? {}),
  };
}

export function normalizeTodaySnapshotForUi(snapshot: TodaySnapshot): TodaySnapshot {
  const rawSnapshot = snapshot as TodaySnapshot & {
    habitProgress?: HabitDayProgressSummary;
  };
  const rawHabits = Array.isArray(rawSnapshot.habits) ? rawSnapshot.habits : [];
  const habits: TodaySnapshot['habits'] = rawHabits.map((entry) => {
    const rawEntry = entry as TodaySnapshot['habits'][number] & {
      progress?: HabitProgress;
      streak?: TodaySnapshot['habits'][number]['streak'];
    };
    const habit = normalizeHabitForUi(rawEntry.habit);
    const progress = isHabitProgress(rawEntry.progress)
      ? rawEntry.progress
      : computeHabitProgress(habit, snapshot.date);

    return {
      ...rawEntry,
      habit,
      isDone: progress.isDone,
      progress,
      streak: rawEntry.streak ?? computeStreaks(
        computeHabitGoalCompletions(habit),
        snapshot.date,
        habit.createdAt,
      ),
    };
  });

  return {
    ...snapshot,
    habits,
    deveres: snapshot.deveres ?? [],
    projetos: snapshot.projetos ?? [],
    saude: snapshot.saude ?? [],
    compras: snapshot.compras ?? [],
    habitProgress: isHabitDayProgressSummary(rawSnapshot.habitProgress)
      ? rawSnapshot.habitProgress
      : computeHabitDayProgress(habits.map((entry) => entry.habit), snapshot.date),
  };
}

function isHabitProgress(value: HabitProgress | undefined): value is HabitProgress {
  return Boolean(value)
    && typeof value?.count === 'number'
    && typeof value.targetCount === 'number'
    && typeof value.score === 'number'
    && typeof value.targetScore === 'number'
    && typeof value.basePercent === 'number'
    && typeof value.overchargePercent === 'number'
    && typeof value.isDone === 'boolean';
}

function isHabitDayProgressSummary(value: HabitDayProgressSummary | undefined): value is HabitDayProgressSummary {
  return Boolean(value)
    && typeof value?.totalHabits === 'number'
    && typeof value.doneHabits === 'number'
    && typeof value.score === 'number'
    && typeof value.targetScore === 'number'
    && typeof value.basePercent === 'number'
    && typeof value.overchargePercent === 'number';
}
