import type { Etapa, EtapaStatus, Projeto } from '../models/projeto.js';
import type { EtapaId } from '../models/shared.js';

// ── Progress ─────────────────────────────────────────────────────────────────

export interface ProjetoProgress {
  completed: number;
  total: number;
  percent: number;
}

export function computeProjetoProgress(projeto: Projeto): ProjetoProgress {
  const total = projeto.etapas.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = projeto.etapas.filter((e) => e.status === 'done').length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

// ── Effort ───────────────────────────────────────────────────────────────────

export interface ProjetoEffort {
  completedHours: number;
  totalHours: number;
  percent: number;
}

/**
 * Sums effortHours across etapas.
 * Returns null if no etapa has effortHours set.
 */
export function computeProjetoEffort(projeto: Projeto): ProjetoEffort | null {
  const withEffort = projeto.etapas.filter((e) => e.effortHours !== undefined);
  if (withEffort.length === 0) return null;
  const totalHours = withEffort.reduce((s, e) => s + e.effortHours!, 0);
  const completedHours = withEffort
    .filter((e) => e.status === 'done')
    .reduce((s, e) => s + e.effortHours!, 0);
  return {
    completedHours,
    totalHours,
    percent: totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0,
  };
}

// ── Dependency helpers ───────────────────────────────────────────────────────

/** Build a lookup: etapaId → Etapa */
function etapaMap(projeto: Projeto): Map<string, Etapa> {
  return new Map(projeto.etapas.map((e) => [e.id, e]));
}

/** Returns true if all etapas in `ids` have status === 'done' */
function allDone(ids: EtapaId[], lookup: Map<string, Etapa>): boolean {
  return ids.every((id) => {
    const dep = lookup.get(id);
    return dep !== undefined && dep.status === 'done';
  });
}

/** Returns etapas whose dependsOn list contains at least one non-done etapa. */
export function getBlockedEtapas(projeto: Projeto): Etapa[] {
  const lookup = etapaMap(projeto);
  return projeto.etapas.filter(
    (e) => e.dependsOn !== undefined && e.dependsOn.length > 0 && !allDone(e.dependsOn, lookup),
  );
}

/**
 * Returns etapas that are actionable:
 * - status is not 'done'
 * - all dependencies are satisfied (done)
 */
export function getNextEtapas(projeto: Projeto): Etapa[] {
  const lookup = etapaMap(projeto);
  return projeto.etapas
    .filter((e) => e.status !== 'done')
    .filter((e) => !e.dependsOn || e.dependsOn.length === 0 || allDone(e.dependsOn, lookup))
    .sort((a, b) => a.order - b.order);
}

/**
 * Validates whether transitioning an etapa to targetStatus is legal.
 * Rules:
 * - Cannot move to 'in_progress' or 'done' if dependencies are not all done.
 * - Can always move to 'pending' or 'blocked'.
 */
export function canTransitionEtapa(
  projeto: Projeto,
  etapaId: EtapaId,
  targetStatus: EtapaStatus,
): boolean {
  const lookup = etapaMap(projeto);
  const etapa = lookup.get(etapaId);
  if (!etapa) return false;

  if (targetStatus === 'pending' || targetStatus === 'blocked') return true;

  // 'in_progress' and 'done' require all dependencies satisfied
  if (etapa.dependsOn && etapa.dependsOn.length > 0) {
    return allDone(etapa.dependsOn, lookup);
  }

  return true;
}

/**
 * Checks for cycles in the dependency graph.
 * Returns true if adding `newDeps` to `etapaId` would create a cycle.
 */
export function wouldCreateCycle(
  projeto: Projeto,
  etapaId: EtapaId,
  newDeps: EtapaId[],
): boolean {
  // Build adjacency list using current deps, but override etapaId's deps with newDeps
  const adj = new Map<string, EtapaId[]>();
  for (const e of projeto.etapas) {
    adj.set(e.id, e.id === etapaId ? [...newDeps] : [...(e.dependsOn ?? [])]);
  }

  // DFS from etapaId following dependsOn edges — if we reach etapaId again, cycle
  const visited = new Set<string>();
  const stack: EtapaId[] = [...newDeps];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === etapaId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const deps = adj.get(current);
    if (deps) stack.push(...deps);
  }
  return false;
}
