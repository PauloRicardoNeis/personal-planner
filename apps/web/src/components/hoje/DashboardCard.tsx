import { useNavigate } from 'react-router-dom';

export interface DashboardCardProps {
  label: string;
  value: string;
  icon?: string;
  /** 0-1. Values above 1 show a full base bar and keep the percent label above 100%. */
  progress?: number;
  /** Extra 0-1 overlay rendered after the base target is reached. */
  overchargeProgress?: number;
  /** Route to navigate when the card is clicked. */
  link?: string;
}

export function DashboardCard({ label, value, icon, progress, overchargeProgress, link }: DashboardCardProps) {
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
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'var(--shadow-card)';
        el.style.transform = 'translateY(0)';
      }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 20px 18px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border)',
        cursor: link ? 'pointer' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        transition: 'box-shadow var(--transition), transform var(--transition)',
      }}
    >
      {icon && (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          marginBottom: 10,
        }}>
          {icon}
        </div>
      )}

      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>

      <div style={{
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text)',
        letterSpacing: 0,
        lineHeight: 1.25,
      }}>
        {value}
      </div>

      {progress !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            position: 'relative',
            height: 4,
            borderRadius: 2,
            background: 'var(--progress-bg)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              width: `${Math.min(progress, 1) * 100}%`,
              height: '100%',
              borderRadius: 2,
              background: barColor,
              transition: 'width var(--transition-slow)',
            }} />
            {overchargeProgress !== undefined && overchargeProgress > 0 && (
              <div style={{
                position: 'absolute',
                inset: 0,
                width: `${Math.min(overchargeProgress, 1) * 100}%`,
                height: '100%',
                borderRadius: 2,
                background: 'linear-gradient(90deg, #10b981, #06b6d4, #f59e0b, #ef4444)',
                transition: 'width var(--transition-slow)',
              }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
