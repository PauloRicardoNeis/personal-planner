import { useState, useEffect, useCallback } from 'react';
import { todayISODate, type TodaySnapshot } from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; snapshot: TodaySnapshot }
  | { status: 'error'; message: string };

export function useToday() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const result = await adapter.getTodaySnapshot(todayISODate());
    if (result.ok) {
      setState({ status: 'ok', snapshot: result.data });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { state, reload: load };
}
