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
        height: 4,
        borderRadius: 2,
        background: 'var(--progress-bg)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: 2,
          background: percent === 100 ? 'var(--progress-green)' : 'var(--accent)',
          transition: 'width var(--transition-slow)',
        }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {completed}/{total}
      </span>
    </div>
  );
}
