import { describe, it, expect } from 'vitest';
import {
  computeProjetoProgress,
  computeProjetoEffort,
  getBlockedEtapas,
  getNextEtapas,
  canTransitionEtapa,
  wouldCreateCycle,
} from './projeto.js';
import type { Projeto, Etapa } from '../models/projeto.js';
import type { EtapaId, ProjetoId, ISODateTime, ISODate } from '../models/shared.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const eid = (s: string) => s as EtapaId;
const pid = (s: string) => s as ProjetoId;
const dt = (s: string) => s as ISODateTime;
const d = (s: string) => s as ISODate;

function makeEtapa(overrides: Partial<Etapa> & { id: EtapaId }): Etapa {
  return {
    title: 'Etapa',
    status: 'pending',
    order: 0,
    createdAt: dt('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeProjeto(etapas: Etapa[], overrides?: Partial<Projeto>): Projeto {
  return {
    id: pid('proj-1'),
    title: 'Test Project',
    priority: 'medium',
    status: 'active',
    createdAt: dt('2026-01-01T00:00:00.000Z'),
    etapas,
    ...overrides,
  };
}

// ── computeProjetoProgress ───────────────────────────────────────────────────

describe('computeProjetoProgress', () => {
  it('returns 0/0/0 for empty etapas', () => {
    const p = makeProjeto([]);
    expect(computeProjetoProgress(p)).toEqual({ completed: 0, total: 0, percent: 0 });
  });

  it('counts done etapas', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done' }),
      makeEtapa({ id: eid('2'), status: 'pending' }),
      makeEtapa({ id: eid('3'), status: 'done' }),
      makeEtapa({ id: eid('4'), status: 'in_progress' }),
    ]);
    expect(computeProjetoProgress(p)).toEqual({ completed: 2, total: 4, percent: 50 });
  });

  it('returns 100% when all done', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done' }),
      makeEtapa({ id: eid('2'), status: 'done' }),
    ]);
    expect(computeProjetoProgress(p)).toEqual({ completed: 2, total: 2, percent: 100 });
  });

  it('rounds percentage', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done' }),
      makeEtapa({ id: eid('2'), status: 'pending' }),
      makeEtapa({ id: eid('3'), status: 'pending' }),
    ]);
    expect(computeProjetoProgress(p).percent).toBe(33);
  });
});

// ── computeProjetoEffort ─────────────────────────────────────────────────────

describe('computeProjetoEffort', () => {
  it('returns null when no etapa has effortHours', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1') }),
      makeEtapa({ id: eid('2') }),
    ]);
    expect(computeProjetoEffort(p)).toBeNull();
  });

  it('sums effortHours correctly', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done', effortHours: 4 }),
      makeEtapa({ id: eid('2'), status: 'pending', effortHours: 6 }),
      makeEtapa({ id: eid('3'), status: 'done', effortHours: 2 }),
    ]);
    expect(computeProjetoEffort(p)).toEqual({ completedHours: 6, totalHours: 12, percent: 50 });
  });

  it('ignores etapas without effortHours', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done', effortHours: 3 }),
      makeEtapa({ id: eid('2'), status: 'pending' }), // no effort
    ]);
    expect(computeProjetoEffort(p)).toEqual({ completedHours: 3, totalHours: 3, percent: 100 });
  });

  it('returns zero percent when effort hours sum to zero', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done', effortHours: 0 }),
    ]);
    expect(computeProjetoEffort(p)).toEqual({ completedHours: 0, totalHours: 0, percent: 0 });
  });
});

// ── getBlockedEtapas ─────────────────────────────────────────────────────────

describe('getBlockedEtapas', () => {
  it('returns empty for etapas without dependencies', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1') }),
      makeEtapa({ id: eid('2') }),
    ]);
    expect(getBlockedEtapas(p)).toEqual([]);
  });

  it('returns etapas whose deps are not done', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'pending' }),
      makeEtapa({ id: eid('2'), status: 'blocked', dependsOn: [eid('1')] }),
    ]);
    const blocked = getBlockedEtapas(p);
    expect(blocked).toHaveLength(1);
    expect(blocked[0]!.id).toBe('2');
  });

  it('does not include etapa if all deps are done', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done' }),
      makeEtapa({ id: eid('2'), status: 'pending', dependsOn: [eid('1')] }),
    ]);
    expect(getBlockedEtapas(p)).toEqual([]);
  });

  it('handles multiple dependencies', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done' }),
      makeEtapa({ id: eid('2'), status: 'pending' }),
      makeEtapa({ id: eid('3'), dependsOn: [eid('1'), eid('2')] }),
    ]);
    expect(getBlockedEtapas(p)).toHaveLength(1);
    expect(getBlockedEtapas(p)[0]!.id).toBe('3');
  });
});

// ── getNextEtapas ────────────────────────────────────────────────────────────

describe('getNextEtapas', () => {
  it('returns all non-done etapas when no dependencies', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'pending', order: 1 }),
      makeEtapa({ id: eid('2'), status: 'done', order: 0 }),
      makeEtapa({ id: eid('3'), status: 'in_progress', order: 2 }),
    ]);
    const next = getNextEtapas(p);
    expect(next).toHaveLength(2);
    expect(next[0]!.id).toBe('1');
    expect(next[1]!.id).toBe('3');
  });

  it('excludes etapas with unsatisfied dependencies', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'pending', order: 0 }),
      makeEtapa({ id: eid('2'), status: 'pending', order: 1, dependsOn: [eid('1')] }),
    ]);
    const next = getNextEtapas(p);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe('1');
  });

  it('includes etapa when deps are done', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done', order: 0 }),
      makeEtapa({ id: eid('2'), status: 'pending', order: 1, dependsOn: [eid('1')] }),
    ]);
    const next = getNextEtapas(p);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe('2');
  });

  it('sorts by order', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('b'), status: 'pending', order: 5 }),
      makeEtapa({ id: eid('a'), status: 'pending', order: 1 }),
      makeEtapa({ id: eid('c'), status: 'pending', order: 3 }),
    ]);
    const next = getNextEtapas(p);
    expect(next.map((e) => e.id)).toEqual(['a', 'c', 'b']);
  });
});

// ── canTransitionEtapa ───────────────────────────────────────────────────────

describe('canTransitionEtapa', () => {
  it('allows transition to pending always', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'pending' }),
      makeEtapa({ id: eid('2'), status: 'blocked', dependsOn: [eid('1')] }),
    ]);
    expect(canTransitionEtapa(p, eid('2'), 'pending')).toBe(true);
  });

  it('allows transition to blocked always', () => {
    const p = makeProjeto([makeEtapa({ id: eid('1') })]);
    expect(canTransitionEtapa(p, eid('1'), 'blocked')).toBe(true);
  });

  it('blocks transition to done when deps not met', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'pending' }),
      makeEtapa({ id: eid('2'), status: 'pending', dependsOn: [eid('1')] }),
    ]);
    expect(canTransitionEtapa(p, eid('2'), 'done')).toBe(false);
  });

  it('blocks transition to in_progress when deps not met', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'pending' }),
      makeEtapa({ id: eid('2'), status: 'pending', dependsOn: [eid('1')] }),
    ]);
    expect(canTransitionEtapa(p, eid('2'), 'in_progress')).toBe(false);
  });

  it('allows transition to done when deps are met', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), status: 'done' }),
      makeEtapa({ id: eid('2'), status: 'in_progress', dependsOn: [eid('1')] }),
    ]);
    expect(canTransitionEtapa(p, eid('2'), 'done')).toBe(true);
  });

  it('allows transition when no dependencies', () => {
    const p = makeProjeto([makeEtapa({ id: eid('1'), status: 'pending' })]);
    expect(canTransitionEtapa(p, eid('1'), 'done')).toBe(true);
    expect(canTransitionEtapa(p, eid('1'), 'in_progress')).toBe(true);
  });

  it('returns false for unknown etapa', () => {
    const p = makeProjeto([makeEtapa({ id: eid('1') })]);
    expect(canTransitionEtapa(p, eid('unknown'), 'done')).toBe(false);
  });
});

// ── wouldCreateCycle ─────────────────────────────────────────────────────────

describe('wouldCreateCycle', () => {
  it('no cycle with simple dependency', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1') }),
      makeEtapa({ id: eid('2') }),
    ]);
    expect(wouldCreateCycle(p, eid('2'), [eid('1')])).toBe(false);
  });

  it('detects direct cycle', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1'), dependsOn: [eid('2')] }),
      makeEtapa({ id: eid('2') }),
    ]);
    expect(wouldCreateCycle(p, eid('2'), [eid('1')])).toBe(true);
  });

  it('detects indirect cycle', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1') }),
      makeEtapa({ id: eid('2'), dependsOn: [eid('1')] }),
      makeEtapa({ id: eid('3'), dependsOn: [eid('2')] }),
    ]);
    // Adding dep 1 → 3 would create: 1 → 2 → 3 → 1
    expect(wouldCreateCycle(p, eid('1'), [eid('3')])).toBe(true);
  });

  it('no cycle with independent chains', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1') }),
      makeEtapa({ id: eid('2'), dependsOn: [eid('1')] }),
      makeEtapa({ id: eid('3') }),
    ]);
    expect(wouldCreateCycle(p, eid('3'), [eid('2')])).toBe(false);
  });

  it('skips already visited dependency nodes without reporting a cycle', () => {
    const p = makeProjeto([
      makeEtapa({ id: eid('1') }),
      makeEtapa({ id: eid('2'), dependsOn: [eid('1')] }),
      makeEtapa({ id: eid('3'), dependsOn: [eid('1')] }),
      makeEtapa({ id: eid('4') }),
    ]);
    expect(wouldCreateCycle(p, eid('4'), [eid('2'), eid('3')])).toBe(false);
  });

  it('self-dependency is a cycle', () => {
    const p = makeProjeto([makeEtapa({ id: eid('1') })]);
    expect(wouldCreateCycle(p, eid('1'), [eid('1')])).toBe(true);
  });
});
