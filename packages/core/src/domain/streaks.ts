import type { ISODate, ISODateTime } from '../models/shared.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HabitStreakInfo {
  currentStreak: number;
  bestStreak: number;
  atRisk: boolean;
  rate30d: number; // 0-100
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses an ISODate string ("YYYY-MM-DD") into a Date using local time.
 * Same pattern as recurrence.ts — avoids UTC offset issue.
 */
function parseISODate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

function toISODateStr(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as ISODate;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return result;
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

// ── Main function ────────────────────────────────────────────────────────────

export function computeStreaks(
  completions: Record<ISODate, true>,
  today: ISODate,
  createdAt: ISODateTime,
): HabitStreakInfo {
  const todayDate = parseISODate(today);

  // Filter out future dates
  const validDates = Object.keys(completions).filter(
    (d) => d <= today,
  ) as ISODate[];

  // ── currentStreak & atRisk ───────────────────────────────────────────────
  let currentStreak = 0;
  let atRisk = false;

  const todayMarked = completions[today] === true;

  if (todayMarked) {
    // Start counting from today backwards
    currentStreak = 1;
    let cursor = addDays(todayDate, -1);
    while (completions[toISODateStr(cursor)] === true) {
      currentStreak++;
      cursor = addDays(cursor, -1);
    }
  } else {
    // Check if yesterday is marked
    const yesterday = toISODateStr(addDays(todayDate, -1));
    if (completions[yesterday] === true) {
      atRisk = true;
      currentStreak = 1;
      let cursor = addDays(todayDate, -2);
      while (completions[toISODateStr(cursor)] === true) {
        currentStreak++;
        cursor = addDays(cursor, -1);
      }
    }
    // else currentStreak stays 0, atRisk stays false
  }

  // ── bestStreak ───────────────────────────────────────────────────────────
  let bestStreak = 0;

  if (validDates.length > 0) {
    const sorted = validDates.slice().sort();
    let run = 1;
    bestStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = parseISODate(sorted[i - 1]!);
      const curr = parseISODate(sorted[i]!);
      if (diffDays(curr, prev) === 1) {
        run++;
        if (run > bestStreak) bestStreak = run;
      } else {
        run = 1;
      }
    }
  }

  // ── rate30d ──────────────────────────────────────────────────────────────
  // Extract just the date part from createdAt (ISODateTime)
  const createdDate = parseISODate(createdAt.slice(0, 10) as ISODate);
  const daysSinceCreation = diffDays(todayDate, createdDate);
  const denominator = Math.min(30, daysSinceCreation);

  let rate30d = 0;
  if (denominator > 0) {
    let count = 0;
    for (let i = 0; i < denominator; i++) {
      const d = toISODateStr(addDays(todayDate, -i));
      if (completions[d] === true) count++;
    }
    rate30d = Math.round((count / denominator) * 100);
  }

  return { currentStreak, bestStreak, atRisk, rate30d };
}
