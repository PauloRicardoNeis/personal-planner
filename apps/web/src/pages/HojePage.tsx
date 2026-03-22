import { todayISODate, type HabitId, type DeverId, type ISODate } from '@planner/core';
import { adapter } from '../adapter.js';
import { useToday } from '../hooks/useToday.js';
import { HojeView } from '../components/hoje/HojeView.js';

export function HojePage() {
  const { state, reload } = useToday();
  const today = todayISODate();

  async function handleToggleHabit(id: HabitId, isDone: boolean) {
    if (isDone) {
      await adapter.unmarkHabitDone(id, today);
    } else {
      await adapter.markHabitDone(id, today);
    }
    void reload();
  }

  async function handleToggleDever(id: DeverId, occurrenceDate: ISODate, isDone: boolean) {
    if (isDone) {
      await adapter.unmarkDeverDone(id, occurrenceDate);
    } else {
      await adapter.markDeverDone(id, occurrenceDate);
    }
    void reload();
  }

  if (state.status === 'loading') {
    return <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>;
  }

  if (state.status === 'error') {
    return <p style={{ color: 'var(--priority-high-text)' }}>Erro: {state.message}</p>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Hoje — {formatDate(state.snapshot.date)}
      </h1>
      <HojeView
        snapshot={state.snapshot}
        onToggleHabit={handleToggleHabit}
        onToggleDever={handleToggleDever}
      />
    </div>
  );
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
