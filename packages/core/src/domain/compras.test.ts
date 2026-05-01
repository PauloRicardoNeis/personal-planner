import { describe, expect, it } from 'vitest';
import { getListaCompraDueInfo } from './compras.js';
import type { ListaCompra } from '../models/compra.js';
import type { ISODate, ISODateTime, ListaCompraId } from '../models/shared.js';

const lid = (value: string) => value as ListaCompraId;
const dt = (value: string) => value as ISODateTime;
const d = (value: string) => value as ISODate;

function makeLista(overrides: Partial<ListaCompra>): ListaCompra {
  return {
    id: lid('lista-1'),
    title: 'Compras',
    active: true,
    createdAt: dt('2026-01-01T00:00:00.000Z'),
    reminder: { mode: 'none' },
    items: [],
    ...overrides,
  };
}

describe('getListaCompraDueInfo', () => {
  it('returns plannedFor when the list is due', () => {
    const info = getListaCompraDueInfo(makeLista({ plannedFor: d('2026-04-14') }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-14'), isOverdue: false });
  });

  it('marks plannedFor lists as overdue when the date passed', () => {
    const info = getListaCompraDueInfo(makeLista({ plannedFor: d('2026-04-10') }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-10'), isOverdue: true });
  });

  it('hides a planned list after completion', () => {
    const info = getListaCompraDueInfo(makeLista({
      plannedFor: d('2026-04-10'),
      lastCompletedAt: dt('2026-04-10T18:00:00.000Z'),
    }), d('2026-04-14'));
    expect(info).toBeNull();
  });

  it('uses manual next date reminders', () => {
    const info = getListaCompraDueInfo(makeLista({
      reminder: { mode: 'manual_next_date', nextDate: d('2026-04-14') },
    }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-14'), isOverdue: false });
  });

  it('calculates interval reminders from the last completion', () => {
    const info = getListaCompraDueInfo(makeLista({
      reminder: { mode: 'after_completion_interval', unit: 'days', value: 7 },
      lastCompletedAt: dt('2026-04-07T10:00:00.000Z'),
    }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-14'), isOverdue: false });
  });

  it('returns null when there is no due date', () => {
    const info = getListaCompraDueInfo(makeLista({
      reminder: { mode: 'manual_next_date' },
    }), d('2026-04-14'));
    expect(info).toBeNull();
  });

  it('chooses the earliest due candidate between planned date and reminder', () => {
    const info = getListaCompraDueInfo(makeLista({
      plannedFor: d('2026-04-12'),
      reminder: { mode: 'manual_next_date', nextDate: d('2026-04-10') },
    }), d('2026-04-14'));

    expect(info).toEqual({ dueDate: d('2026-04-10'), isOverdue: true });
  });

  it('ignores future planned dates and future reminders', () => {
    const info = getListaCompraDueInfo(makeLista({
      plannedFor: d('2026-04-20'),
      reminder: { mode: 'manual_next_date', nextDate: d('2026-04-21') },
    }), d('2026-04-14'));

    expect(info).toBeNull();
  });

  it('ignores reminder dates already covered by last completion', () => {
    const info = getListaCompraDueInfo(makeLista({
      reminder: { mode: 'manual_next_date', nextDate: d('2026-04-10') },
      lastCompletedAt: dt('2026-04-10T10:00:00.000Z'),
    }), d('2026-04-14'));

    expect(info).toBeNull();
  });

  it('calculates interval reminders from anchors in weeks and months', () => {
    expect(getListaCompraDueInfo(makeLista({
      reminder: { mode: 'after_completion_interval', unit: 'weeks', value: 2, anchorDate: d('2026-04-01') },
    }), d('2026-04-15'))).toEqual({ dueDate: d('2026-04-15'), isOverdue: false });

    expect(getListaCompraDueInfo(makeLista({
      reminder: { mode: 'after_completion_interval', unit: 'months', value: 1, anchorDate: d('2026-01-31') },
    }), d('2026-02-28'))).toEqual({ dueDate: d('2026-02-28'), isOverdue: false });
  });

  it('returns null for interval reminders without completion or anchor date', () => {
    const info = getListaCompraDueInfo(makeLista({
      reminder: { mode: 'after_completion_interval', unit: 'months', value: 1 },
    }), d('2026-04-14'));

    expect(info).toBeNull();
  });
});
