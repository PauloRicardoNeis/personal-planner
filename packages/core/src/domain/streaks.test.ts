import { describe, it, expect } from 'vitest';
import { computeStreaks } from './streaks.js';
import type { ISODate, ISODateTime } from '../models/shared.js';

const d = (s: string) => s as ISODate;
const dt = (s: string) => s as ISODateTime;

function makeCompletions(dates: string[]): Record<ISODate, true> {
  const c: Record<string, true> = {};
  for (const date of dates) c[date] = true;
  return c as Record<ISODate, true>;
}

// ── currentStreak ──────────────────────────────────────────────────────────

describe('computeStreaks — currentStreak', () => {
  it('counts consecutive days including today', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(4);
    expect(result.atRisk).toBe(false);
  });

  it('counts from yesterday when today is not marked (atRisk)', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-11', '2026-03-12', '2026-03-13']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(3);
    expect(result.atRisk).toBe(true);
  });

  it('resets streak at gap (days 11,12,14 with today=14)', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-11', '2026-03-12', '2026-03-14']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(1);
    expect(result.atRisk).toBe(false);
  });

  it('returns 0 when neither today nor yesterday is marked', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-11', '2026-03-12']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(0);
    expect(result.atRisk).toBe(false);
  });

  it('returns 0 with no completions', () => {
    const result = computeStreaks({}, d('2026-03-14'), dt('2026-03-01T00:00:00.000Z'));
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(0);
    expect(result.atRisk).toBe(false);
    expect(result.rate30d).toBe(0);
  });

  it('returns 1 when only today is marked', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-14']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
  });

  it('long streak: 200 consecutive days', () => {
    const dates: string[] = [];
    for (let i = 0; i < 200; i++) {
      const date = new Date(2026, 2, 14 - i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    const result = computeStreaks(
      makeCompletions(dates),
      d('2026-03-14'),
      dt('2025-08-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(200);
    expect(result.bestStreak).toBe(200);
    expect(result.rate30d).toBe(100);
  });

  it('created today, marked today → streak=1, rate=100%', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-14']),
      d('2026-03-14'),
      dt('2026-03-14T10:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
    expect(result.atRisk).toBe(false);
    // created today → daysSinceCreation=0, denominator capped so rate30d handles this edge
  });

  it('created today, not marked → streak=0, rate=0%', () => {
    const result = computeStreaks(
      {},
      d('2026-03-14'),
      dt('2026-03-14T10:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(0);
    expect(result.atRisk).toBe(false);
    expect(result.rate30d).toBe(0);
  });

  it('ignores future dates in all calculations', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-14', '2026-03-15', '2026-03-16', '2026-03-17']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1); // future dates excluded
  });
});

// ── bestStreak ─────────────────────────────────────────────────────────────

describe('computeStreaks — bestStreak', () => {
  it('finds the longest consecutive run (8 days in second segment)', () => {
    const dates: string[] = [];
    // Run 1: days 1-5 (5 days)
    for (let i = 1; i <= 5; i++) dates.push(`2026-03-${String(i).padStart(2, '0')}`);
    // Run 2: days 10-17 (8 days)
    for (let i = 10; i <= 17; i++) dates.push(`2026-03-${String(i).padStart(2, '0')}`);
    // Run 3: days 20-22 (3 days)
    for (let i = 20; i <= 22; i++) dates.push(`2026-03-${String(i).padStart(2, '0')}`);

    const result = computeStreaks(
      makeCompletions(dates),
      d('2026-03-22'),
      dt('2026-02-01T00:00:00.000Z'),
    );
    expect(result.bestStreak).toBe(8);
    expect(result.currentStreak).toBe(3); // 20-22
  });

  it('bestStreak equals currentStreak when current is the best', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-12', '2026-03-13', '2026-03-14']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.bestStreak).toBe(3);
    expect(result.currentStreak).toBe(3);
  });

  it('single completion → bestStreak=1', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-10']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.bestStreak).toBe(1);
    expect(result.currentStreak).toBe(0); // today/yesterday not marked
  });

  it('streak crossing month boundary', () => {
    const result = computeStreaks(
      makeCompletions(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']),
      d('2026-03-02'),
      dt('2026-01-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(4);
  });

  it('streak crossing year boundary', () => {
    const result = computeStreaks(
      makeCompletions(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']),
      d('2026-01-02'),
      dt('2025-12-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(4);
  });

  it('streak through Feb 28→29 in leap year', () => {
    const result = computeStreaks(
      makeCompletions(['2028-02-28', '2028-02-29', '2028-03-01']),
      d('2028-03-01'),
      dt('2028-01-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });
});

// ── rate30d ────────────────────────────────────────────────────────────────

describe('computeStreaks — rate30d', () => {
  it('50% when 15 of 30 days marked (every other day)', () => {
    const dates: string[] = [];
    for (let i = 0; i < 30; i += 2) {
      const date = new Date(2026, 2, 14 - i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    const result = computeStreaks(
      makeCompletions(dates),
      d('2026-03-14'),
      dt('2026-01-01T00:00:00.000Z'),
    );
    expect(result.rate30d).toBe(50);
  });

  it('uses daysSinceCreation as denominator when < 30', () => {
    const dates: string[] = [];
    // Created 10 days ago, mark 7 of 10
    for (let i = 0; i < 7; i++) {
      const date = new Date(2026, 2, 14 - i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    const result = computeStreaks(
      makeCompletions(dates),
      d('2026-03-14'),
      dt('2026-03-04T00:00:00.000Z'),
    );
    expect(result.rate30d).toBe(70);
  });

  it('returns 0 when no completions', () => {
    const result = computeStreaks({}, d('2026-03-14'), dt('2026-03-01T00:00:00.000Z'));
    expect(result.rate30d).toBe(0);
  });

  it('100% when all 30 days marked', () => {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, 2, 14 - i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    const result = computeStreaks(
      makeCompletions(dates),
      d('2026-03-14'),
      dt('2026-01-01T00:00:00.000Z'),
    );
    expect(result.rate30d).toBe(100);
  });

  it('does not count completions older than 30 days', () => {
    // Only old completions, none in last 30 days
    const result = computeStreaks(
      makeCompletions(['2026-01-01', '2026-01-02', '2026-01-03']),
      d('2026-03-14'),
      dt('2025-12-01T00:00:00.000Z'),
    );
    expect(result.rate30d).toBe(0);
  });
});

// ── atRisk edge cases ─────────────────────────────────────────────────────

describe('computeStreaks — atRisk edge cases', () => {
  it('streak=0 → atRisk=false (nothing to lose)', () => {
    const result = computeStreaks({}, d('2026-03-14'), dt('2026-03-01T00:00:00.000Z'));
    expect(result.atRisk).toBe(false);
  });

  it('today marked → atRisk=false regardless of history', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-14']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.atRisk).toBe(false);
  });

  it('yesterday marked but not today → atRisk=true', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-13']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(1);
    expect(result.atRisk).toBe(true);
  });

  it('two days ago marked but not yesterday → atRisk=false, streak=0', () => {
    const result = computeStreaks(
      makeCompletions(['2026-03-12']),
      d('2026-03-14'),
      dt('2026-03-01T00:00:00.000Z'),
    );
    expect(result.currentStreak).toBe(0);
    expect(result.atRisk).toBe(false);
  });
});
