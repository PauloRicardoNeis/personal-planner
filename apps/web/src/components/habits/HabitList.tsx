import type { Habit, HabitId, HabitInput, ISODate, Result } from '@planner/core';
import { HabitCard } from './HabitCard.js';

interface Props {
  habits: Habit[];
  onUpdate: (id: HabitId, patch: Partial<HabitInput>) => Promise<Result<Habit>>;
  onMarkDone: (id: HabitId, date: ISODate) => void;
  onUnmarkDone: (id: HabitId, date: ISODate) => void;
  onArchive: (id: HabitId) => void;
}

export function HabitList({ habits, onUpdate, onMarkDone, onUnmarkDone, onArchive }: Props) {
  if (habits.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24, fontSize: 14 }}>Nenhum hábito ainda. Crie o primeiro acima.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onUpdate={onUpdate}
          onMarkDone={onMarkDone}
          onUnmarkDone={onUnmarkDone}
          onArchive={onArchive}
        />
      ))}
    </ul>
  );
}
