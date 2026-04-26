import type { ISODate } from '../models/shared.js';
import type { CompraReminder, ListaCompra, CompraIntervalUnit } from '../models/compra.js';

export interface ListaCompraDueInfo {
  dueDate: ISODate;
  isOverdue: boolean;
}

export function getListaCompraDueInfo(lista: ListaCompra, date: ISODate): ListaCompraDueInfo | null {
  const lastCompletedDate = lista.lastCompletedAt?.slice(0, 10) as ISODate | undefined;
  const candidates: ISODate[] = [];

  if (
    lista.plannedFor &&
    lista.plannedFor <= date &&
    (lastCompletedDate === undefined || lastCompletedDate < lista.plannedFor)
  ) {
    candidates.push(lista.plannedFor);
  }

  const reminderDueDate = getReminderDueDate(lista.reminder, lastCompletedDate);
  if (
    reminderDueDate &&
    reminderDueDate <= date &&
    (lastCompletedDate === undefined || lastCompletedDate < reminderDueDate)
  ) {
    candidates.push(reminderDueDate);
  }

  if (candidates.length === 0) return null;
  const dueDate = candidates.sort()[0] as ISODate;
  return { dueDate, isOverdue: dueDate < date };
}

function getReminderDueDate(reminder: CompraReminder, lastCompletedDate?: ISODate): ISODate | null {
  switch (reminder.mode) {
    case 'none':
      return null;
    case 'manual_next_date':
      return reminder.nextDate ?? null;
    case 'after_completion_interval': {
      const anchor = lastCompletedDate ?? reminder.anchorDate;
      return anchor ? addInterval(anchor, reminder.unit, reminder.value) : null;
    }
  }
}

function addInterval(date: ISODate, unit: CompraIntervalUnit, value: number): ISODate {
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
  const [year, month, day] = date.split('-').map(Number);
  const targetMonthIndex = (year! * 12 + (month! - 1)) + amount;
  const nextYear = Math.floor(targetMonthIndex / 12);
  const nextMonth = (targetMonthIndex % 12) + 1;
  const nextDay = Math.min(day!, new Date(nextYear, nextMonth, 0).getDate());
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}` as ISODate;
}

function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` as ISODate;
}
