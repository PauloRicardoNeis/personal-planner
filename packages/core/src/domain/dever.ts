import type { DeverBase, OnceDever } from '../models/dever.js';
import type { ISODate } from '../models/shared.js';

export function getDeverStartDate(
  dever: Pick<DeverBase, 'inicio'>,
): ISODate {
  return dever.inicio.slice(0, 10) as ISODate;
}

export function hasExplicitDeverStart(
  dever: Pick<DeverBase, 'inicio' | 'createdAt'>,
): boolean {
  return dever.inicio !== dever.createdAt;
}

export function getOnceDeverOccurrenceDate(
  dever: Pick<OnceDever, 'fim' | 'inicio'>,
): ISODate {
  return dever.fim ?? getDeverStartDate(dever);
}

export function getOnceDeverCalendarDate(
  dever: Pick<OnceDever, 'fim' | 'inicio' | 'createdAt'>,
): ISODate | null {
  if (dever.fim) return dever.fim;
  return hasExplicitDeverStart(dever) ? getDeverStartDate(dever) : null;
}
