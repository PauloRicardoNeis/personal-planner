import { describe, expect, it } from 'vitest';
import { getSaudeDueInfo } from './saude.js';
import type { SaudeItem } from '../models/saude.js';
import type { ISODate, ISODateTime, SaudeItemId } from '../models/shared.js';

const sid = (value: string) => value as SaudeItemId;
const dt = (value: string) => value as ISODateTime;
const d = (value: string) => value as ISODate;

function makeItem(overrides: Partial<SaudeItem>): SaudeItem {
  return {
    id: sid('saude-1'),
    type: 'consulta',
    title: 'Consulta',
    priority: 'medium',
    active: true,
    createdAt: dt('2026-01-01T00:00:00.000Z'),
    schedule: { mode: 'once', date: d('2026-01-10') },
    events: [],
    ...overrides,
  };
}

describe('getSaudeDueInfo', () => {
  it('returns due info for a once item on its day', () => {
    const info = getSaudeDueInfo(makeItem({ schedule: { mode: 'once', date: d('2026-04-14') } }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-14'), isOverdue: false });
  });

  it('returns overdue for an incomplete once item in the past', () => {
    const info = getSaudeDueInfo(makeItem({ schedule: { mode: 'once', date: d('2026-04-10') } }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-10'), isOverdue: true });
  });

  it('hides a once item after completion', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'once', date: d('2026-04-10') },
      lastCompletedAt: dt('2026-04-10T12:00:00.000Z'),
    }), d('2026-04-14'));
    expect(info).toBeNull();
  });

  it('uses the latest matching occurrence for calendar rules', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'weekly', weekdays: ['monday'] } },
    }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-13'), isOverdue: true });
  });

  it('calculates interval-based due dates from last completion', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'after_completion_interval', unit: 'days', value: 30 },
      lastCompletedAt: dt('2026-03-15T08:00:00.000Z'),
    }), d('2026-04-14'));
    expect(info).toEqual({ dueDate: d('2026-04-14'), isOverdue: false });
  });

  it('uses anchorDate for interval items without completion history', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'after_completion_interval', unit: 'weeks', value: 2, anchorDate: d('2026-04-01') },
    }), d('2026-04-14'));
    expect(info).toBeNull();
  });

  it('returns null for manual items without nextDate', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'manual_next_date' },
    }), d('2026-04-14'));
    expect(info).toBeNull();
  });

  it('returns null before a due date and after a later completion', () => {
    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'once', date: d('2026-04-20') },
    }), d('2026-04-14'))).toBeNull();

    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'once', date: d('2026-04-10') },
      lastCompletedAt: dt('2026-04-12T12:00:00.000Z'),
    }), d('2026-04-14'))).toBeNull();
  });

  it('uses manual next date reminders when provided', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'manual_next_date', nextDate: d('2026-04-13') },
    }), d('2026-04-14'));

    expect(info).toEqual({ dueDate: d('2026-04-13'), isOverdue: true });
  });

  it('calculates interval due dates in weeks and months', () => {
    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'after_completion_interval', unit: 'weeks', value: 2 },
      lastCompletedAt: dt('2026-04-01T08:00:00.000Z'),
    }), d('2026-04-15'))).toEqual({ dueDate: d('2026-04-15'), isOverdue: false });

    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'after_completion_interval', unit: 'months', value: 1 },
      lastCompletedAt: dt('2026-01-31T08:00:00.000Z'),
    }), d('2026-02-28'))).toEqual({ dueDate: d('2026-02-28'), isOverdue: false });
  });

  it('returns null for interval items without completion or anchor date', () => {
    const info = getSaudeDueInfo(makeItem({
      schedule: { mode: 'after_completion_interval', unit: 'days', value: 7 },
    }), d('2026-04-14'));

    expect(info).toBeNull();
  });

  it('handles daily calendar rules and weekly rules without a recent match', () => {
    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'daily' } },
    }), d('2026-04-14'))).toEqual({ dueDate: d('2026-04-14'), isOverdue: false });

    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'weekly', weekdays: [] as never } },
    }), d('2026-04-14'))).toBeNull();
  });

  it('handles monthly calendar rules in current and previous month', () => {
    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'monthly', monthDay: 10 } },
    }), d('2026-04-14'))).toEqual({ dueDate: d('2026-04-10'), isOverdue: true });

    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'monthly', monthDay: 31 } },
    }), d('2026-04-01'))).toEqual({ dueDate: d('2026-03-31'), isOverdue: true });

    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'monthly', monthDay: 31 } },
    }), d('2026-03-01'))).toBeNull();
  });

  it('uses the previous year for monthly calendar rules before a January occurrence', () => {
    expect(getSaudeDueInfo(makeItem({
      schedule: { mode: 'calendar_rule', recurrence: { type: 'monthly', monthDay: 31 } },
    }), d('2026-01-10'))).toEqual({ dueDate: d('2025-12-31'), isOverdue: true });
  });
});
