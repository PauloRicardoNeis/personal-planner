import type { Dever, DeverBase, DeverId, ISODate, Result } from '@planner/core';
import { DeverCard } from './DeverCard.js';

interface Props {
  deveres: Dever[];
  onUpdate: (
    id: DeverId,
    patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>,
  ) => Promise<Result<Dever>>;
  onMarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onUnmarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onArchive: (id: DeverId) => void;
}

export function DeverList({ deveres, onUpdate, onMarkDone, onUnmarkDone, onArchive }: Props) {
  if (deveres.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24, fontSize: 14 }}>Nenhum dever ainda. Crie o primeiro acima.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {deveres.map((dever) => (
        <DeverCard
          key={dever.id}
          dever={dever}
          onUpdate={onUpdate}
          onMarkDone={onMarkDone}
          onUnmarkDone={onUnmarkDone}
          onArchive={onArchive}
        />
      ))}
    </ul>
  );
}
