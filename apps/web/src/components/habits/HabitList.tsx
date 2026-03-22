import type { Habit, HabitId, ISODate } from '@planner/core';
import { HabitCard } from './HabitCard.js';

interface Props {
  habits: Habit[];
  onMarkDone: (id: HabitId, date: ISODate) => void;
  onUnmarkDone: (id: HabitId, date: ISODate) => void;
  onArchive: (id: HabitId) => void;
}

export function HabitList({ habits, onMarkDone, onUnmarkDone, onArchive }: Props) {
  if (habits.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>Nenhum hábito ainda. Crie o primeiro acima.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onMarkDone={onMarkDone}
          onUnmarkDone={onUnmarkDone}
          onArchive={onArchive}
        />
      ))}
    </ul>
  );
}
