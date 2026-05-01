import { describe, expect, it } from 'vitest';
import type { CyclicDever, DeverId, ISODate, ISODateTime, OnceDever } from '@planner/core';
import { getDeverMetaLabels, getDeverOccurrenceDateForList } from './deverPresentation.js';

const did = (value: string) => value as DeverId;
const d = (value: string) => value as ISODate;
const dt = (value: string) => value as ISODateTime;

function makeOnce(overrides: Partial<OnceDever> = {}): OnceDever {
  return {
    id: did('dever-1'),
    type: 'once',
    title: 'Enviar documento',
    priority: 'medium',
    active: true,
    createdAt: dt('2026-04-01T10:00:00.000Z'),
    inicio: dt('2026-04-01T10:00:00.000Z'),
    completions: [],
    ...overrides,
  };
}

function makeCyclic(overrides: Partial<CyclicDever> = {}): CyclicDever {
  return {
    id: did('dever-2'),
    type: 'cyclic',
    title: 'Pagar boleto',
    priority: 'high',
    active: true,
    createdAt: dt('2026-04-01T10:00:00.000Z'),
    inicio: dt('2026-04-01T10:00:00.000Z'),
    recurrence: { type: 'daily' },
    completions: [],
    ...overrides,
  };
}

describe('dever presentation helpers', () => {
  it('uses fim as the occurrence date for once deveres', () => {
    expect(getDeverOccurrenceDateForList(makeOnce({ fim: d('2026-04-10') }), d('2026-04-14'))).toBe('2026-04-10');
  });

  it('uses monthly window occurrence date for cyclic deveres', () => {
    expect(getDeverOccurrenceDateForList(makeCyclic({
      recurrence: { type: 'monthly', monthDay: 10, monthDayEnd: 12 },
    }), d('2026-04-14'))).toBe('2026-04-10');
  });

  it('falls back to today for non-windowed cyclic deveres', () => {
    expect(getDeverOccurrenceDateForList(makeCyclic({
      recurrence: { type: 'weekly', weekdays: ['monday'] },
    }), d('2026-04-14'))).toBe('2026-04-14');
  });

  it('formats once dever labels for deadline, explicit start and no deadline', () => {
    expect(getDeverMetaLabels(makeOnce({ fim: d('2026-04-10') }))[0]).toContain('10/04/2026');

    const explicitStart = getDeverMetaLabels(makeOnce({
      createdAt: dt('2026-04-01T10:00:00.000Z'),
      inicio: dt('2026-04-05T14:30:00.000Z'),
    }));
    expect(explicitStart[0]).toContain('agendado');

    expect(getDeverMetaLabels(makeOnce())).toEqual(['sem prazo']);
  });

  it('formats recurrence labels for daily, weekly and monthly rules', () => {
    expect(getDeverMetaLabels(makeCyclic({ recurrence: { type: 'daily' } }))[0]).toContain('rio');
    expect(getDeverMetaLabels(makeCyclic({
      recurrence: { type: 'weekly', weekdays: ['monday', 'wednesday'] },
    }))[0]).toContain('seg');
    expect(getDeverMetaLabels(makeCyclic({ recurrence: { type: 'monthly', monthDay: 5 } }))).toEqual(['mensal: dia 5']);
    expect(getDeverMetaLabels(makeCyclic({
      recurrence: { type: 'monthly', monthDay: 5, monthDayEnd: 8 },
    }))[0]).toContain('5');
  });
});
