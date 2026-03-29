import { useMemo, useState } from 'react';
import {
  isOccurrenceOn,
  toISODate,
  type Dever,
  type ISODate,
} from '@planner/core';

export interface DayEntry {
  date: ISODate;
  deveres: Array<{ dever: Dever; isDone: boolean }>;
}

function buildWeeks(year: number, month: number): ISODate[][] {
  const firstOfMonth = new Date(year, month, 1);
  const dow = (firstOfMonth.getDay() + 6) % 7; // Mon=0 … Sun=6
  const cursor = new Date(year, month, 1 - dow);

  const lastOfMonth = new Date(year, month + 1, 0);
  const weeks: ISODate[][] = [];

  while (cursor <= lastOfMonth || weeks.length < 4) {
    const week: ISODate[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(toISODate(new Date(cursor)));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor > lastOfMonth) break;
  }

  return weeks;
}

export function useCalendar(deveres: Dever[]) {
  const today = toISODate(new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  const dayMap = useMemo((): Map<ISODate, DayEntry> => {
    const map = new Map<ISODate, DayEntry>();
    for (const week of weeks) {
      for (const date of week) {
        const matching = deveres.flatMap((dever) => {
          const occurs =
            dever.type === 'once'
              ? dever.fim === date
              : isOccurrenceOn(dever.recurrence, date);
          if (!occurs) return [];
          const isDone = dever.completions.some((c) => c.occurrenceDate === date);
          return [{ dever, isDone }];
        });
        map.set(date, { date, deveres: matching });
      }
    }
    return map;
  }, [weeks, deveres]);

  function goToPrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return {
    weeks,
    dayMap,
    year,
    month,
    today,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  };
}
