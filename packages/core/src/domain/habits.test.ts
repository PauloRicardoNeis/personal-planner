import { describe, expect, it } from 'vitest';
import type { Habit } from '../models/habit.js';
import {
  HabitSchema,
  normalizeHabitSettings,
  normalizeHabitValueWeights,
  parseHabitValueWeightsInput,
} from '../models/habit.js';
import type { HabitId, ISODate, ISODateTime } from '../models/shared.js';
import {
  computeHabitDayProgress,
  computeHabitGoalCompletions,
  computeHabitTargetScore,
  computeHabitProgress,
  decrementHabitCompletion,
  getHabitCompletionCount,
  incrementHabitCompletion,
  scoreHabitOccurrences,
} from './habits.js';

const d = (value: string) => value as ISODate;
const dt = (value: string) => value as ISODateTime;
const id = (value: string) => value as HabitId;

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: id('habit-1'),
    title: 'Escovar os dentes',
    active: true,
    createdAt: dt('2026-04-01T00:00:00.000Z'),
    timesPerDay: 1,
    valueWeights: [1],
    completions: {},
    ...overrides,
  };
}

describe('normalizeHabitSettings', () => {
  it('defaults new habits to one occurrence worth one point', () => {
    expect(normalizeHabitSettings({})).toEqual({
      timesPerDay: 1,
      valueWeights: [1],
    });
  });

  it('fills missing weights with the final configured weight', () => {
    expect(normalizeHabitValueWeights(3, [5])).toEqual([5, 5, 5]);
  });

  it('truncates weights beyond timesPerDay', () => {
    expect(normalizeHabitValueWeights(2, [5, 2, 1])).toEqual([5, 2]);
  });

  it('preserves explicit creation settings above one', () => {
    expect(normalizeHabitSettings({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
    })).toEqual({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
    });
  });

  it('repeats one configured point value for every daily occurrence', () => {
    expect(normalizeHabitSettings({
      timesPerDay: 4,
      valueWeights: [2],
    })).toEqual({
      timesPerDay: 4,
      valueWeights: [2, 2, 2, 2],
    });
  });

  it('parses common separators from the weights field', () => {
    expect(parseHabitValueWeightsInput('5, 2; 1 / 3')).toEqual([5, 2, 1, 3]);
  });
});

describe('HabitSchema migration', () => {
  it('normalizes legacy boolean completions and missing weighted settings', () => {
    const parsed = HabitSchema.parse({
      id: 'habit-legacy',
      title: 'Anki',
      active: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      completions: {
        '2026-04-28': true,
      },
    });

    expect(parsed).toMatchObject({
      timesPerDay: 1,
      valueWeights: [1],
      completions: {
        '2026-04-28': 1,
      },
    });
  });

  it('preserves new weighted settings when parsing persisted habits', () => {
    const parsed = HabitSchema.parse({
      id: 'habit-weighted',
      title: 'Escovar os dentes',
      active: true,
      createdAt: '2026-04-01T00:00:00.000Z',
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: {
        '2026-04-28': 2,
      },
    });

    expect(parsed).toMatchObject({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: {
        '2026-04-28': 2,
      },
    });
  });
});

describe('computeHabitProgress', () => {
  it('scores partial progress with weighted occurrences', () => {
    const habit = makeHabit({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: { [d('2026-04-28')]: 2 },
    });

    expect(computeHabitProgress(habit, d('2026-04-28'))).toMatchObject({
      count: 2,
      targetCount: 3,
      score: 7,
      targetScore: 8,
      basePercent: 88,
      overchargeScore: 0,
      isDone: false,
      remainingCount: 1,
      nextWeight: 1,
    });
  });

  it('marks the habit done when the weighted target is reached', () => {
    const habit = makeHabit({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: { [d('2026-04-28')]: 3 },
    });

    expect(computeHabitProgress(habit, d('2026-04-28'))).toMatchObject({
      score: 8,
      targetScore: 8,
      basePercent: 100,
      overchargePercent: 0,
      isDone: true,
    });
  });

  it('keeps scoring overcharge with the final configured weight', () => {
    const habit = makeHabit({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: { [d('2026-04-28')]: 4 },
    });

    expect(computeHabitProgress(habit, d('2026-04-28'))).toMatchObject({
      score: 9,
      targetScore: 8,
      baseScore: 8,
      overchargeScore: 1,
      percent: 113,
      basePercent: 100,
      overchargePercent: 13,
      isDone: true,
    });
  });

  it('uses zero progress when there is no count for the date', () => {
    const habit = makeHabit({
      timesPerDay: 2,
      valueWeights: [3, 1],
    });

    expect(computeHabitProgress(habit, d('2026-04-28'))).toMatchObject({
      count: 0,
      score: 0,
      targetScore: 4,
      basePercent: 0,
      isDone: false,
      nextWeight: 3,
    });
  });
});

describe('daily habit progress summary', () => {
  it('sums active habit scores and separates overcharge from base progress', () => {
    const habits = [
      makeHabit({
        id: id('habit-1'),
        timesPerDay: 3,
        valueWeights: [5, 2, 1],
        completions: { [d('2026-04-28')]: 4 },
      }),
      makeHabit({
        id: id('habit-2'),
        timesPerDay: 2,
        valueWeights: [1, 1],
        completions: { [d('2026-04-28')]: 1 },
      }),
      makeHabit({
        id: id('habit-3'),
        active: false,
        completions: { [d('2026-04-28')]: 1 },
      }),
    ];

    expect(computeHabitDayProgress(habits, d('2026-04-28'))).toEqual({
      date: d('2026-04-28'),
      totalHabits: 2,
      doneHabits: 1,
      score: 10,
      targetScore: 10,
      baseScore: 9,
      overchargeScore: 1,
      percent: 100,
      basePercent: 90,
      overchargePercent: 10,
    });
  });

  it('returns a zeroed summary when there are no active habits', () => {
    expect(computeHabitDayProgress([], d('2026-04-28'))).toEqual({
      date: d('2026-04-28'),
      totalHabits: 0,
      doneHabits: 0,
      score: 0,
      targetScore: 0,
      baseScore: 0,
      overchargeScore: 0,
      percent: 0,
      basePercent: 0,
      overchargePercent: 0,
    });
  });
});

describe('habit completion counters', () => {
  it('increments and decrements a daily count one occurrence at a time', () => {
    const first = incrementHabitCompletion({}, d('2026-04-28'));
    const second = incrementHabitCompletion(first, d('2026-04-28'));
    const backToOne = decrementHabitCompletion(second, d('2026-04-28'));
    const cleared = decrementHabitCompletion(backToOne, d('2026-04-28'));

    expect(first[d('2026-04-28')]).toBe(1);
    expect(second[d('2026-04-28')]).toBe(2);
    expect(backToOne[d('2026-04-28')]).toBe(1);
    expect(cleared[d('2026-04-28')]).toBeUndefined();
  });

  it('treats goal completions as days that reached the weighted target', () => {
    const habit = makeHabit({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: {
        [d('2026-04-27')]: 2,
        [d('2026-04-28')]: 3,
      },
    });

    expect(computeHabitGoalCompletions(habit)).toEqual({
      [d('2026-04-28')]: true,
    });
  });
});

describe('scoreHabitOccurrences', () => {
  it('repeats the final weight for occurrences beyond the configured weights', () => {
    expect(scoreHabitOccurrences(4, [5, 2, 1])).toBe(9);
  });

  it('returns zero for non-positive occurrence counts', () => {
    expect(scoreHabitOccurrences(0, [5])).toBe(0);
    expect(scoreHabitOccurrences(-2, [5])).toBe(0);
  });
});

describe('habit target helpers', () => {
  it('gets a completion count with a zero default', () => {
    const habit = makeHabit({ completions: { [d('2026-04-28')]: 2 } });

    expect(getHabitCompletionCount(habit, d('2026-04-28'))).toBe(2);
    expect(getHabitCompletionCount(habit, d('2026-04-29'))).toBe(0);
  });

  it('computes target score from normalized settings', () => {
    expect(computeHabitTargetScore(makeHabit({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
    }))).toBe(8);
    expect(computeHabitTargetScore(makeHabit({
      timesPerDay: Number.NaN,
      valueWeights: [],
    }))).toBe(1);
  });
});
