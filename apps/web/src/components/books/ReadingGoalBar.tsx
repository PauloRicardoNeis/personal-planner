import type { ReadingGoal } from '@planner/core';

interface Props {
  goal: ReadingGoal | undefined;
  booksReadThisYear: number;
  onEditGoal: () => void;
}

export function ReadingGoalBar({ goal, booksReadThisYear, onEditGoal }: Props) {
  if (!goal) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-input)', marginBottom: 24,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Nenhuma meta de leitura definida para este ano.
        </span>
        <button onClick={onEditGoal} style={linkBtnStyle}>Definir meta</button>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((booksReadThisYear / goal.target) * 100));

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          Meta {goal.year}: {booksReadThisYear} / {goal.target} livros
        </span>
        <button onClick={onEditGoal} style={linkBtnStyle}>Editar</button>
      </div>
      <div style={{
        height: 8, borderRadius: 4, background: 'var(--bg-input)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4, width: `${percent}%`,
          background: percent >= 100 ? 'var(--progress-green)' : 'var(--accent)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
        {percent}%
      </div>
    </div>
  );
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
  fontSize: 12, fontWeight: 500, padding: 0,
};
