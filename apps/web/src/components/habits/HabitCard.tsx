import { todayISODate, type Habit, type HabitId, type ISODate } from '@planner/core';

interface Props {
  habit: Habit;
  onMarkDone: (id: HabitId, date: ISODate) => void;
  onUnmarkDone: (id: HabitId, date: ISODate) => void;
  onArchive: (id: HabitId) => void;
}

export function HabitCard({ habit, onMarkDone, onUnmarkDone, onArchive }: Props) {
  const today = todayISODate();
  const isDoneToday = habit.completions[today] === true;

  return (
    <li style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <button
        onClick={() => isDoneToday ? onUnmarkDone(habit.id, today) : onMarkDone(habit.id, today)}
        style={{
          width: 22, height: 22, minWidth: 22, borderRadius: 6,
          border: isDoneToday ? '2px solid #22c55e' : '2px solid var(--border-input)',
          background: isDoneToday ? '#22c55e' : 'var(--bg-check)',
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label={isDoneToday ? 'Desmarcar' : 'Marcar como feito'}
      >
        {isDoneToday ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, textDecoration: isDoneToday ? 'line-through' : 'none', color: isDoneToday ? 'var(--text-done)' : 'var(--text)' }}>
          {habit.title}
        </div>
        {habit.category && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{habit.category}</div>}
      </div>

      <button
        onClick={() => { if (confirm(`Arquivar "${habit.title}"?`)) onArchive(habit.id); }}
        style={{ background: 'none', border: 'none', color: 'var(--border-input)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
        title="Arquivar hábito"
        aria-label="Arquivar hábito"
      >
        ✕
      </button>
    </li>
  );
}
