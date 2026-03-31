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
      gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <button
        onClick={() => isDoneToday ? onUnmarkDone(habit.id, today) : onMarkDone(habit.id, today)}
        style={{
          width: 20, height: 20, minWidth: 20, borderRadius: 'var(--radius-sm)',
          border: isDoneToday ? '2px solid var(--progress-green)' : '2px solid var(--border-input)',
          background: isDoneToday ? 'var(--progress-green)' : 'var(--bg-check)',
          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--transition)',
        }}
        aria-label={isDoneToday ? 'Desmarcar' : 'Marcar como feito'}
      >
        {isDoneToday ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 500, fontSize: 14, lineHeight: 1.4,
          textDecoration: isDoneToday ? 'line-through' : 'none',
          color: isDoneToday ? 'var(--text-done)' : 'var(--text)',
          transition: 'color var(--transition)',
        }}>
          {habit.title}
        </div>
        {habit.category && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{habit.category}</div>
        )}
      </div>

      <button
        onClick={() => { if (confirm(`Arquivar "${habit.title}"?`)) onArchive(habit.id); }}
        style={{
          background: 'none', border: 'none', color: 'var(--border-input)', cursor: 'pointer',
          fontSize: 14, padding: '4px 6px', borderRadius: 'var(--radius-xs)',
          transition: 'color var(--transition)',
        }}
        title="Arquivar hábito"
        aria-label="Arquivar hábito"
      >
        ✕
      </button>
    </li>
  );
}
