import { describe, expect, it } from 'vitest';
import * as core from './index.js';
import { HabitSchema } from './models/habit.js';
import { DeverSchema } from './models/dever.js';
import { isOccurrenceOn } from './domain/recurrence.js';
import { computeStreaks } from './domain/streaks.js';

describe('public core entrypoint', () => {
  it('re-exports model schemas and domain functions from the package entrypoint', () => {
    expect(core.HabitSchema).toBe(HabitSchema);
    expect(core.DeverSchema).toBe(DeverSchema);
    expect(core.isOccurrenceOn).toBe(isOccurrenceOn);
    expect(core.computeStreaks).toBe(computeStreaks);
  });

  it('exposes representative schemas and constants used by apps', () => {
    expect(core.DEFAULT_HABIT_TIMES_PER_DAY).toBe(1);
    expect(core.BookStatusSchema.parse('reading')).toBe('reading');
    expect(core.GameSchema.safeParse({
      id: 'steam:10',
      source: 'steam',
      steamAppId: 10,
      name: 'Half-Life',
      playtimeMinutes: 0,
      lastImportedAt: '2026-04-01T10:00:00.000Z',
    }).success).toBe(true);
    expect(core.parseOpenLibraryResponse({ docs: [] })).toEqual([]);
  });
});
