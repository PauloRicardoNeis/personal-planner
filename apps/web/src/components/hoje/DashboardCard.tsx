import { useNavigate } from 'react-router-dom';

export interface DashboardCardProps {
  label: string;
  value: string;
  icon?: string;
  /** 0–1 — when provided, renders a progress bar */
  progress?: number;
  /** route to navigate when the card is clicked */
  link?: string;
}

export function DashboardCard({ label, value, icon, progress, link }: DashboardCardProps) {
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
      onMouseEnter={e => {
        if (!link) return;
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'var(--shadow-hover)';
        el.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'var(--shadow-card)';
        el.style.transform = 'translateY(0)';
      }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 24px 20px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border)',
        cursor: link ? 'pointer' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'box-shadow var(--transition), transform var(--transition)',
      }}
    >
      {/* Icon */}
      {icon && (
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          marginBottom: 12,
        }}>
          {icon}
        </div>
      )}

      {/* Label */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--text)',
        letterSpacing: '-0.5px',
        lineHeight: 1.2,
      }}>
        {value}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            height: 5,
            borderRadius: 3,
            background: 'var(--progress-bg)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(progress, 1) * 100}%`,
              height: '100%',
              borderRadius: 3,
              background: barColor,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
