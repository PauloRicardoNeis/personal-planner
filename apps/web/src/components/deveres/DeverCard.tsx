import { todayISODate, type Dever, type DeverId, type ISODate } from '@planner/core';
import { getDeverMetaLabels, getDeverOccurrenceDateForList } from '../../deverPresentation.js';

interface Props {
  dever: Dever;
  onMarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onUnmarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onArchive: (id: DeverId) => void;
}

export function DeverCard({ dever, onMarkDone, onUnmarkDone, onArchive }: Props) {
  const today = todayISODate();
  const occurrenceDate: ISODate = getDeverOccurrenceDateForList(dever, today);
  const isDoneToday = dever.completions.some((c) => c.occurrenceDate === occurrenceDate);
  const metaLabels = getDeverMetaLabels(dever);

  return (
    <li style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <button
        onClick={() => isDoneToday ? onUnmarkDone(dever.id, occurrenceDate) : onMarkDone(dever.id, occurrenceDate)}
        style={{
          width: 20, height: 20, minWidth: 20, borderRadius: 'var(--radius-sm)',
          border: isDoneToday ? '2px solid var(--progress-green)' : '2px solid var(--border-input)',
          background: isDoneToday ? 'var(--progress-green)' : 'var(--bg-check)',
          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
          transition: 'all var(--transition)',
        }}
        aria-label={isDoneToday ? 'Desmarcar' : 'Marcar como feito'}
      >
        {isDoneToday ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 500, fontSize: 14, lineHeight: 1.4,
          textDecoration: isDoneToday ? 'line-through' : 'none',
          color: isDoneToday ? 'var(--text-done)' : 'var(--text)',
          transition: 'color var(--transition)',
        }}>
          {dever.title}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
          <PriorityBadge priority={dever.priority} />
          {metaLabels.map((label) => (
            <span
              key={label}
              style={{
                fontSize: 11, color: 'var(--text-badge)', background: 'var(--bg-badge)',
                padding: '1px 7px', borderRadius: 'var(--radius-xs)',
              }}
            >
              {label}
            </span>
          ))}
          {dever.area && (
            <span style={{
              fontSize: 11, color: 'var(--text-badge)', background: 'var(--bg-badge)',
              padding: '1px 7px', borderRadius: 'var(--radius-xs)',
            }}>
              {dever.area}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => { if (confirm(`Arquivar "${dever.title}"?`)) onArchive(dever.id); }}
        style={{
          background: 'none', border: 'none', color: 'var(--border-input)', cursor: 'pointer',
          fontSize: 14, padding: '4px 6px', borderRadius: 'var(--radius-xs)',
          transition: 'color var(--transition)',
        }}
        title="Arquivar dever"
        aria-label="Arquivar dever"
      >
        ✕
      </button>
    </li>
  );
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const vars = {
    high: { bg: 'var(--priority-high-bg)', text: 'var(--priority-high-text)' },
    medium: { bg: 'var(--priority-med-bg)', text: 'var(--priority-med-text)' },
    low: { bg: 'var(--priority-low-bg)', text: 'var(--priority-low-text)' },
  };
  const labels = { high: 'alta', medium: 'média', low: 'baixa' };
  const c = vars[priority];
  return <span style={{ fontSize: 11, color: c.text, background: c.bg, padding: '1px 7px', borderRadius: 'var(--radius-xs)', fontWeight: 500 }}>{labels[priority]}</span>;
}
