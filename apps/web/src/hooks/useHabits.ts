import { useState, useEffect, useCallback } from 'react';
import { todayISODate, type Habit, type HabitInput, type HabitId, type ISODate } from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; habits: Habit[] }
  | { status: 'error'; message: string };

export function useHabits() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getHabits();
    if (result.ok) {
      setState({ status: 'ok', habits: result.data.filter((h) => h.active) });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createHabit = useCallback(async (input: HabitInput) => {
    await adapter.createHabit(input);
    void load();
  }, [load]);

  const markDone = useCallback(async (id: HabitId, date: ISODate = todayISODate()) => {
    await adapter.markHabitDone(id, date);
    void load();
  }, [load]);

  const unmarkDone = useCallback(async (id: HabitId, date: ISODate = todayISODate()) => {
    await adapter.unmarkHabitDone(id, date);
    void load();
  }, [load]);

  const archive = useCallback(async (id: HabitId) => {
    await adapter.archiveHabit(id);
    void load();
  }, [load]);

  return { state, createHabit, markDone, unmarkDone, archive };
}
