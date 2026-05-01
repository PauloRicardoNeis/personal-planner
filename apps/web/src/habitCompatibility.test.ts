import { describe, expect, it } from 'vitest';
import type { Habit, HabitId, ISODate, ISODateTime, TodaySnapshot } from '@planner/core';
import { normalizeHabitForUi, normalizeTodaySnapshotForUi } from './habitCompatibility.js';

const hid = (value: string) => value as HabitId;
const d = (value: string) => value as ISODate;
const dt = (value: string) => value as ISODateTime;

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: hid('habit-1'),
    title: 'Anki',
    active: true,
    createdAt: dt('2026-04-01T00:00:00.000Z'),
    timesPerDay: 1,
    valueWeights: [1],
    completions: {},
    ...overrides,
  };
}

describe('habit compatibility helpers', () => {
  it('returns schema-normalized habits when persisted data is valid', () => {
    expect(normalizeHabitForUi(makeHabit({
      timesPerDay: 2,
      valueWeights: [3, 1],
      completions: { [d('2026-04-10')]: 2 },
    }))).toMatchObject({
      timesPerDay: 2,
      valueWeights: [3, 1],
      completions: { '2026-04-10': 2 },
    });
  });

  it('repairs legacy habit settings and completion counts when schema parsing fails', () => {
    const repaired = normalizeHabitForUi({
      ...makeHabit(),
      timesPerDay: Number.NaN,
      valueWeights: [0, 2],
      completions: {
        '2026-04-10': true,
        '2026-04-11': -1,
      },
    } as unknown as Habit);

    expect(repaired).toMatchObject({
      timesPerDay: 1,
      valueWeights: [2],
      completions: { '2026-04-10': 1 },
    });
  });

  it('fills missing today snapshot collections and computes progress/streak data', () => {
    const habit = makeHabit({
      timesPerDay: 2,
      valueWeights: [2, 1],
      completions: { [d('2026-04-10')]: 2 },
    });
    const snapshot = {
      date: d('2026-04-10'),
      habits: [{ habit }],
    } as unknown as TodaySnapshot;

    const normalized = normalizeTodaySnapshotForUi(snapshot);

    expect(normalized.habits[0]).toMatchObject({
      isDone: true,
      progress: {
        count: 2,
        targetScore: 3,
        isDone: true,
      },
      streak: {
        currentStreak: 1,
      },
    });
    expect(normalized.deveres).toEqual([]);
    expect(normalized.projetos).toEqual([]);
    expect(normalized.saude).toEqual([]);
    expect(normalized.compras).toEqual([]);
    expect(normalized.habitProgress).toMatchObject({
      totalHabits: 1,
      doneHabits: 1,
    });
  });

  it('preserves valid progress and summary data already returned by an adapter', () => {
    const habit = makeHabit();
    const progress = {
      date: d('2026-04-10'),
      count: 0,
      targetCount: 1,
      score: 0,
      targetScore: 1,
      baseScore: 0,
      overchargeScore: 0,
      percent: 0,
      basePercent: 0,
      overchargePercent: 0,
      isDone: false,
      remainingCount: 1,
      nextWeight: 1,
    };
    const habitProgress = {
      date: d('2026-04-10'),
      totalHabits: 1,
      doneHabits: 0,
      score: 0,
      targetScore: 1,
      baseScore: 0,
      overchargeScore: 0,
      percent: 0,
      basePercent: 0,
      overchargePercent: 0,
    };
    const streak = {
      currentStreak: 0,
      bestStreak: 0,
      atRisk: false,
      rate30d: 0,
    };

    const normalized = normalizeTodaySnapshotForUi({
      date: d('2026-04-10'),
      habits: [{ habit, isDone: false, progress, streak }],
      habitProgress,
      deveres: [],
      projetos: [],
      saude: [],
      compras: [],
    });

    expect(normalized.habits[0]?.progress).toBe(progress);
    expect(normalized.habits[0]?.streak).toBe(streak);
    expect(normalized.habitProgress).toBe(habitProgress);
  });
});
