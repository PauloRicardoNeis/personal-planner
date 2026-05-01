import { describe, expect, it } from 'vitest';
import {
  CyclicDeverSchema,
  DeverArraySchema,
  DeverSchema,
  OnceDeverSchema,
} from './dever.js';

const completion = {
  occurrenceDate: '2026-04-10',
  completedAt: '2026-04-10T12:00:00.000Z',
};

const onceDever = {
  id: 'dever-1',
  title: 'Enviar documento',
  area: 'admin',
  priority: 'high',
  active: true,
  createdAt: '2026-04-01T10:00:00.000Z',
  inicio: '2026-04-01T10:00:00.000Z',
  fim: '2026-04-10',
  deadline: '2026-04-10',
  completions: [completion],
  type: 'once',
};

const cyclicDever = {
  ...onceDever,
  id: 'dever-2',
  type: 'cyclic',
  recurrence: { type: 'weekly', weekdays: ['monday'] },
};

describe('dever schemas', () => {
  it('accepts once, cyclic and array payloads', () => {
    expect(OnceDeverSchema.parse(onceDever)).toMatchObject({ type: 'once', fim: '2026-04-10' });
    expect(CyclicDeverSchema.parse(cyclicDever)).toMatchObject({ type: 'cyclic' });
    expect(DeverSchema.parse(onceDever)).toMatchObject({ id: 'dever-1' });
    expect(DeverSchema.parse(cyclicDever)).toMatchObject({ id: 'dever-2' });
    expect(DeverArraySchema.parse([onceDever, cyclicDever])).toHaveLength(2);
  });

  it('keeps inicio optional for legacy data', () => {
    const { inicio: _inicio, ...legacy } = onceDever;
    expect(OnceDeverSchema.safeParse(legacy).success).toBe(true);
  });

  it('rejects invalid base fields and discriminants', () => {
    expect(DeverSchema.safeParse({ ...onceDever, type: 'todo' }).success).toBe(false);
    expect(DeverSchema.safeParse({ ...onceDever, title: '' }).success).toBe(false);
    expect(DeverSchema.safeParse({ ...onceDever, priority: 'urgent' }).success).toBe(false);
    expect(DeverSchema.safeParse({ ...onceDever, fim: '2026/04/10' }).success).toBe(false);
    expect(DeverSchema.safeParse({ ...onceDever, completions: [{ ...completion, completedAt: 'nope' }] }).success).toBe(false);
    expect(DeverSchema.safeParse({ ...cyclicDever, recurrence: undefined }).success).toBe(false);
    expect(DeverSchema.safeParse({ ...cyclicDever, recurrence: { type: 'weekly', weekdays: [] } }).success).toBe(false);
  });
});
