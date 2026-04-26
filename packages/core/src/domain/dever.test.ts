import { describe, expect, it } from 'vitest';
import {
  getDeverStartDate,
  getOnceDeverCalendarDate,
  getOnceDeverOccurrenceDate,
  hasExplicitDeverStart,
} from './dever.js';
import type { ISODate, ISODateTime } from '../models/shared.js';

const dt = (value: string) => value as ISODateTime;
const d = (value: string) => value as ISODate;

describe('getDeverStartDate', () => {
  it('extracts the occurrence date from inicio', () => {
    expect(getDeverStartDate({ inicio: dt('2026-04-28T09:40:00.000Z') })).toBe('2026-04-28');
  });
});

describe('hasExplicitDeverStart', () => {
  it('returns true when inicio differs from createdAt', () => {
    expect(hasExplicitDeverStart({
      inicio: dt('2026-04-28T09:40:00.000Z'),
      createdAt: dt('2026-04-25T12:00:00.000Z'),
    })).toBe(true);
  });

  it('returns false when inicio matches createdAt', () => {
    expect(hasExplicitDeverStart({
      inicio: dt('2026-04-25T12:00:00.000Z'),
      createdAt: dt('2026-04-25T12:00:00.000Z'),
    })).toBe(false);
  });
});

describe('getOnceDeverOccurrenceDate', () => {
  it('uses fim when a deadline exists', () => {
    expect(getOnceDeverOccurrenceDate({
      inicio: dt('2026-04-28T09:40:00.000Z'),
      fim: d('2026-04-30'),
    })).toBe('2026-04-30');
  });

  it('falls back to inicio date when fim is absent', () => {
    expect(getOnceDeverOccurrenceDate({
      inicio: dt('2026-04-28T09:40:00.000Z'),
    })).toBe('2026-04-28');
  });
});

describe('getOnceDeverCalendarDate', () => {
  it('shows the deadline when fim exists', () => {
    expect(getOnceDeverCalendarDate({
      inicio: dt('2026-04-28T09:40:00.000Z'),
      createdAt: dt('2026-04-25T12:00:00.000Z'),
      fim: d('2026-04-30'),
    })).toBe('2026-04-30');
  });

  it('shows the start date when there is an explicit schedule without fim', () => {
    expect(getOnceDeverCalendarDate({
      inicio: dt('2026-04-28T09:40:00.000Z'),
      createdAt: dt('2026-04-25T12:00:00.000Z'),
    })).toBe('2026-04-28');
  });

  it('does not create a calendar entry for unscheduled once deveres', () => {
    expect(getOnceDeverCalendarDate({
      inicio: dt('2026-04-25T12:00:00.000Z'),
      createdAt: dt('2026-04-25T12:00:00.000Z'),
    })).toBeNull();
  });
});
