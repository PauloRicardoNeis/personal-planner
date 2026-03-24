import { useNavigate } from 'react-router-dom';

export interface DashboardCardProps {
  label: string;
  value: string;
  /** 0–1 — when provided, renders a progress bar */
  progress?: number;
  /** route to navigate when the row is clicked */
  link?: string;
}

export function DashboardCard({ label, value, progress, link }: DashboardCardProps) {
  const navigate = useNavigate();

  const barColor =
    progress === undefined
      ? undefined
      : progress >= 0.8
        ? 'var(--progress-green)'
        : progress >= 0.4
          ? 'var(--progress-yellow)'
          : 'var(--progress-red)';

  return (
    <div
      onClick={link ? () => navigate(link) : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        cursor: link ? 'pointer' : undefined,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>

      {progress !== undefined && (
        <div
          style={{
            width: 80,
            height: 6,
            borderRadius: 3,
            background: 'var(--progress-bg)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 1) * 100}%`,
              height: '100%',
              borderRadius: 3,
              background: barColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      <span style={{ color: 'var(--text-muted)', fontSize: 14, whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}
