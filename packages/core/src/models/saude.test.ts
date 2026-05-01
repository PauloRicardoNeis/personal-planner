import { describe, expect, it } from 'vitest';
import {
  SaudeEventKindSchema,
  SaudeEventSchema,
  SaudeIntervalUnitSchema,
  SaudeItemArraySchema,
  SaudeItemSchema,
  SaudeItemTypeSchema,
  SaudeScheduleSchema,
} from './saude.js';

const event = {
  id: 'event-1',
  kind: 'completed',
  date: '2026-04-10',
  createdAt: '2026-04-10T10:00:00.000Z',
  notes: 'Tudo certo',
  cost: 120,
};

const item = {
  id: 'saude-1',
  type: 'consulta',
  title: 'Dermatologista',
  specialty: 'Dermato',
  providerName: 'Dra Ana',
  clinicName: 'Clinica',
  location: 'Centro',
  notes: 'Levar exames',
  costEstimate: 200,
  priority: 'medium',
  active: true,
  createdAt: '2026-04-01T10:00:00.000Z',
  schedule: {
    mode: 'calendar_rule',
    recurrence: { type: 'monthly', monthDay: 10 },
  },
  lastCompletedAt: '2026-04-10T10:00:00.000Z',
  events: [event],
};

describe('saude schemas', () => {
  it('accepts enum values and schedule variants', () => {
    expect(SaudeItemTypeSchema.parse('compra_medicacao')).toBe('compra_medicacao');
    expect(SaudeEventKindSchema.parse('purchased')).toBe('purchased');
    expect(SaudeIntervalUnitSchema.parse('months')).toBe('months');
    expect(SaudeScheduleSchema.parse({ mode: 'once', date: '2026-04-10' })).toEqual({
      mode: 'once',
      date: '2026-04-10',
    });
    expect(SaudeScheduleSchema.parse({ mode: 'manual_next_date' })).toEqual({ mode: 'manual_next_date' });
    expect(SaudeScheduleSchema.parse({ mode: 'after_completion_interval', unit: 'weeks', value: 2 })).toEqual({
      mode: 'after_completion_interval',
      unit: 'weeks',
      value: 2,
    });
  });

  it('accepts event and item payloads', () => {
    expect(SaudeEventSchema.parse(event)).toMatchObject({ kind: 'completed', cost: 120 });
    expect(SaudeItemSchema.parse(item)).toMatchObject({ title: 'Dermatologista', events: [expect.any(Object)] });
    expect(SaudeItemArraySchema.parse([item])).toHaveLength(1);
  });

  it('accepts a minimal active item', () => {
    expect(SaudeItemSchema.safeParse({
      id: 'saude-2',
      type: 'exame',
      title: 'Hemograma',
      priority: 'low',
      active: true,
      createdAt: '2026-04-01T10:00:00.000Z',
      schedule: { mode: 'manual_next_date' },
      events: [],
    }).success).toBe(true);
  });

  it('rejects invalid saude fields', () => {
    expect(SaudeScheduleSchema.safeParse({ mode: 'once', date: 'tomorrow' }).success).toBe(false);
    expect(SaudeScheduleSchema.safeParse({ mode: 'after_completion_interval', unit: 'years', value: 1 }).success).toBe(false);
    expect(SaudeScheduleSchema.safeParse({ mode: 'after_completion_interval', unit: 'days', value: 0 }).success).toBe(false);
    expect(SaudeScheduleSchema.safeParse({ mode: 'calendar_rule', recurrence: { type: 'weekly', weekdays: [] } }).success).toBe(false);
    expect(SaudeEventSchema.safeParse({ ...event, kind: 'missed' }).success).toBe(false);
    expect(SaudeEventSchema.safeParse({ ...event, cost: -1 }).success).toBe(false);
    expect(SaudeItemSchema.safeParse({ ...item, type: 'vacina' }).success).toBe(false);
    expect(SaudeItemSchema.safeParse({ ...item, title: '' }).success).toBe(false);
    expect(SaudeItemSchema.safeParse({ ...item, costEstimate: -1 }).success).toBe(false);
    expect(SaudeItemSchema.safeParse({ ...item, priority: 'urgent' }).success).toBe(false);
  });
});
