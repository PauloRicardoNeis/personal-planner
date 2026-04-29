import { useState, useEffect, useCallback } from 'react';
import { type Dever, type DeverBase, type DeverInput, type DeverId, type ISODate } from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; deveres: Dever[] }
  | { status: 'error'; message: string };

export function useDeveres() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getDeveres();
    if (result.ok) {
      setState({ status: 'ok', deveres: result.data.filter((d) => d.active) });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createDever = useCallback(async (input: DeverInput) => {
    await adapter.createDever(input);
    void load();
  }, [load]);

  const updateDever = useCallback(async (
    id: DeverId,
    patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>,
  ) => {
    const result = await adapter.updateDever(id, patch);
    void load();
    return result;
  }, [load]);

  const markDone = useCallback(async (id: DeverId, occurrenceDate: ISODate) => {
    await adapter.markDeverDone(id, occurrenceDate);
    void load();
  }, [load]);

  const unmarkDone = useCallback(async (id: DeverId, occurrenceDate: ISODate) => {
    await adapter.unmarkDeverDone(id, occurrenceDate);
    void load();
  }, [load]);

  const archive = useCallback(async (id: DeverId) => {
    await adapter.archiveDever(id);
    void load();
  }, [load]);

  return { state, createDever, updateDever, markDone, unmarkDone, archive };
}
