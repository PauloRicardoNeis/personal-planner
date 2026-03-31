interface Props {
  completed: number;
  total: number;
  percent: number;
}

export function ProjetoProgressBar({ completed, total, percent }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: 3,
          background: percent === 100 ? '#22c55e' : 'var(--accent)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {completed}/{total}
      </span>
    </div>
  );
}
