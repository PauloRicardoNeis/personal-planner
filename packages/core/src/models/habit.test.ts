import { describe, expect, it } from 'vitest';
import {
  HabitArraySchema,
  HabitSchema,
  normalizeHabitCompletions,
  normalizeHabitTimesPerDay,
  normalizeHabitValueWeights,
  parseHabitValueWeightsInput,
} from './habit.js';

const habit = {
  id: 'habit-1',
  title: 'Anki',
  category: 'estudo',
  active: true,
  createdAt: '2026-04-01T10:00:00.000Z',
  timesPerDay: 3,
  valueWeights: [5, 2, 1],
  completions: {
    '2026-04-10': 2,
  },
};

describe('habit model helpers and schema', () => {
  it('normalizes times per day and weights defensively', () => {
    expect(normalizeHabitTimesPerDay(Number.NaN)).toBe(1);
    expect(normalizeHabitTimesPerDay(0)).toBe(1);
    expect(normalizeHabitTimesPerDay(150)).toBe(99);
    expect(normalizeHabitTimesPerDay(2.8)).toBe(2);
    expect(normalizeHabitValueWeights(3, [5, 'bad', -1, 2])).toEqual([5, 2, 2]);
    expect(parseHabitValueWeightsInput('5, nope; 2 / -1 3')).toEqual([5, 2, 3]);
  });

  it('normalizes completion maps from legacy and invalid values', () => {
    expect(normalizeHabitCompletions({
      '2026-04-10': true,
      '2026-04-11': 2.8,
      '2026-04-12': false,
      '2026-04-13': 'done',
    })).toEqual({
      '2026-04-10': 1,
      '2026-04-11': 2,
    });
  });

  it('accepts and transforms valid habit payloads', () => {
    expect(HabitSchema.parse(habit)).toMatchObject({
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
      completions: { '2026-04-10': 2 },
    });
    expect(HabitArraySchema.parse([habit])).toHaveLength(1);
  });

  it('rejects invalid required fields while catching legacy settings', () => {
    expect(HabitSchema.safeParse({ ...habit, title: '' }).success).toBe(false);
    expect(HabitSchema.safeParse({ ...habit, createdAt: '2026-04-01' }).success).toBe(false);
    expect(HabitSchema.parse({
      ...habit,
      timesPerDay: 0,
      valueWeights: [],
    })).toMatchObject({
      timesPerDay: 1,
      valueWeights: [1],
    });
  });
});
