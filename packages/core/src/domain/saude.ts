import { isOccurrenceOn } from './recurrence.js';
import type { ISODate, RecurrenceConfig } from '../models/shared.js';
import type { SaudeItem, SaudeSchedule, SaudeIntervalUnit } from '../models/saude.js';

export interface SaudeDueInfo {
  dueDate: ISODate;
  isOverdue: boolean;
}

export function getSaudeDueInfo(item: SaudeItem, date: ISODate): SaudeDueInfo | null {
  const lastCompletedDate = item.lastCompletedAt?.slice(0, 10) as ISODate | undefined;
  const dueDate = getSaudeScheduleDueDate(item.schedule, date, lastCompletedDate);

  if (!dueDate) return null;
  if (dueDate > date) return null;
  if (lastCompletedDate !== undefined && lastCompletedDate >= dueDate) return null;

  return {
    dueDate,
    isOverdue: dueDate < date,
  };
}

function getSaudeScheduleDueDate(
  schedule: SaudeSchedule,
  date: ISODate,
  lastCompletedDate?: ISODate,
): ISODate | null {
  switch (schedule.mode) {
    case 'once':
      return schedule.date;
    case 'manual_next_date':
      return schedule.nextDate ?? null;
    case 'after_completion_interval': {
      const anchor = lastCompletedDate ?? schedule.anchorDate;
      return anchor ? addInterval(anchor, schedule.unit, schedule.value) : null;
    }
    case 'calendar_rule':
      return getLatestOccurrenceOnOrBefore(schedule.recurrence, date);
  }
}

function getLatestOccurrenceOnOrBefore(recurrence: RecurrenceConfig, date: ISODate): ISODate | null {
  if (recurrence.type === 'daily') {
    return date;
  }

  if (recurrence.type === 'weekly') {
    let current = date;
    for (let i = 0; i < 7; i++) {
      if (isOccurrenceOn(recurrence, current)) return current;
      current = addDays(current, -1);
    }
    return null;
  }

  const [year, month, day] = parseISODate(date);
  const dayInMonth = recurrence.monthDay;
  const currentMonthDays = daysInMonth(year, month);

  if (day >= dayInMonth && dayInMonth <= currentMonthDays) {
    return formatISODate(year, month, dayInMonth);
  }

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const prevMonthDays = daysInMonth(prevYear, prevMonth);
  if (dayInMonth > prevMonthDays) return null;
  return formatISODate(prevYear, prevMonth, dayInMonth);
}

function addInterval(date: ISODate, unit: SaudeIntervalUnit, value: number): ISODate {
  if (unit === 'days') return addDays(date, value);
  if (unit === 'weeks') return addDays(date, value * 7);
  return addMonths(date, value);
}

function addDays(date: ISODate, amount: number): ISODate {
  const jsDate = new Date(`${date}T00:00:00`);
  jsDate.setDate(jsDate.getDate() + amount);
  return toISODate(jsDate);
}

function addMonths(date: ISODate, amount: number): ISODate {
  const [year, month, day] = parseISODate(date);
  const targetMonthIndex = (year * 12 + (month - 1)) + amount;
  const nextYear = Math.floor(targetMonthIndex / 12);
  const nextMonth = (targetMonthIndex % 12) + 1;
  const nextDay = Math.min(day, daysInMonth(nextYear, nextMonth));
  return formatISODate(nextYear, nextMonth, nextDay);
}

function parseISODate(date: ISODate): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number);
  return [year!, month!, day!];
}

function formatISODate(year: number, month: number, day: number): ISODate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as ISODate;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` as ISODate;
}
