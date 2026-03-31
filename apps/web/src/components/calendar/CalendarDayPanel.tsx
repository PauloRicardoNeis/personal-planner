import type { DeverId, ISODate } from '@planner/core';
import type { DayEntry } from '../../hooks/useCalendar.js';

interface Props {
  date: ISODate;
  entry: DayEntry;
  onMarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onUnmarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onClose: () => void;
}

function checkStyle(isDone: boolean): React.CSSProperties {
  return {
    width: 20,
    height: 20,
    minWidth: 20,
    borderRadius: 'var(--radius-sm)',
    border: isDone ? '2px solid var(--progress-green)' : '2px solid var(--border-input)',
    background: isDone ? 'var(--progress-green)' : 'var(--bg-check)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
    transition: 'all var(--transition)',
  };
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const vars = {
    high:   { bg: 'var(--priority-high-bg)', text: 'var(--priority-high-text)' },
    medium: { bg: 'var(--priority-med-bg)',  text: 'var(--priority-med-text)'  },
    low:    { bg: 'var(--priority-low-bg)',  text: 'var(--priority-low-text)'  },
  };
  const labels = { high: 'alta', medium: 'média', low: 'baixa' };
  const c = vars[priority];
  return (
    <span style={{ fontSize: 11, color: c.text, background: c.bg, padding: '1px 6px', borderRadius: 'var(--radius-xs)', fontWeight: 500 }}>
      {labels[priority]}
    </span>
  );
}

export function CalendarDayPanel({ date, entry, onMarkDone, onUnmarkDone, onClose }: Props) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div style={{
      width: 300,
      flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-card)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        gap: 8,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          textTransform: 'capitalize',
          flex: 1,
        }}>
          {formattedDate}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 14,
            padding: '2px 4px',
            borderRadius: 'var(--radius-xs)',
            lineHeight: 1,
            transition: 'color var(--transition)',
          }}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px' }}>
        {entry.deveres.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
            Nenhum dever neste dia.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {entry.deveres.map(({ dever, isDone }) => (
              <li
                key={dever.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() =>
                    isDone ? onUnmarkDone(dever.id, date) : onMarkDone(dever.id, date)
                  }
                  style={checkStyle(isDone)}
                  aria-label={isDone ? 'Desmarcar' : 'Marcar como feito'}
                >
                  {isDone ? '✓' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{
                    textDecoration: isDone ? 'line-through' : 'none',
                    color: isDone ? 'var(--text-done)' : 'var(--text)',
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    transition: 'color var(--transition)',
                  }}>
                    {dever.title}
                  </span>
                  <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                    <PriorityBadge priority={dever.priority} />
                    {dever.area && (
                      <span style={{
                        fontSize: 11,
                        color: 'var(--text-badge)',
                        background: 'var(--bg-badge)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-xs)',
                      }}>
                        {dever.area}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
