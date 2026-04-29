import { useState, useEffect, useCallback } from 'react';
import { todayISODate, type Habit, type HabitInput, type HabitId, type ISODate } from '@planner/core';
import { adapter } from '../adapter.js';
import { normalizeHabitForUi } from '../habitCompatibility.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; habits: Habit[] }
  | { status: 'error'; message: string };

export function useHabits() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getHabits();
    if (result.ok) {
      setState({ status: 'ok', habits: result.data.map(normalizeHabitForUi).filter((h) => h.active) });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createHabit = useCallback(async (input: HabitInput) => {
    await adapter.createHabit(input);
    void load();
  }, [load]);

  const updateHabit = useCallback(async (id: HabitId, patch: Partial<HabitInput & { active: boolean }>) => {
    const result = await adapter.updateHabit(id, patch);
    void load();
    return result;
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

  return { state, createHabit, updateHabit, markDone, unmarkDone, archive };
}
