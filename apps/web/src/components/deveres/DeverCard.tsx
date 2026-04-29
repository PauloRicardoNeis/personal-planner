import { useState } from 'react';
import { todayISODate, type Dever, type DeverBase, type DeverId, type ISODate, type Result } from '@planner/core';
import { getDeverMetaLabels, getDeverOccurrenceDateForList } from '../../deverPresentation.js';

interface Props {
  dever: Dever;
  onUpdate: (
    id: DeverId,
    patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>,
  ) => Promise<Result<Dever>>;
  onMarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onUnmarkDone: (id: DeverId, occurrenceDate: ISODate) => void;
  onArchive: (id: DeverId) => void;
}

export function DeverCard({ dever, onUpdate, onMarkDone, onUnmarkDone, onArchive }: Props) {
  const today = todayISODate();
  const occurrenceDate: ISODate = getDeverOccurrenceDateForList(dever, today);
  const isDoneToday = dever.completions.some((c) => c.occurrenceDate === occurrenceDate);
  const metaLabels = getDeverMetaLabels(dever);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(dever.title);
  const [draftArea, setDraftArea] = useState(dever.area ?? '');
  const [draftPriority, setDraftPriority] = useState<'low' | 'medium' | 'high'>(dever.priority);
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setDraftTitle(dever.title);
    setDraftArea(dever.area ?? '');
    setDraftPriority(dever.priority);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftTitle(dever.title);
    setDraftArea(dever.area ?? '');
    setDraftPriority(dever.priority);
    setIsEditing(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = draftTitle.trim();

    if (!title) {
      return;
    }

    setIsSaving(true);
    const result = await onUpdate(dever.id, {
      title,
      area: draftArea.trim(),
      priority: draftPriority,
    });
    setIsSaving(false);

    if (result.ok) {
      setIsEditing(false);
    }
  }

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

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <form onSubmit={handleSubmit} style={editFormStyle}>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Nome do dever"
              required
              style={{ ...editInputStyle, fontWeight: 500 }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={draftArea}
                onChange={(e) => setDraftArea(e.target.value)}
                placeholder="Área (opcional)"
                style={{ ...editInputStyle, flex: 1, minWidth: 140 }}
              />
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as 'low' | 'medium' | 'high')}
                style={{ ...editInputStyle, flex: 1, minWidth: 140, cursor: 'pointer' }}
              >
                <option value="high">Prioridade: Alta</option>
                <option value="medium">Prioridade: Média</option>
                <option value="low">Prioridade: Baixa</option>
              </select>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Tipo e recorrência permanecem os mesmos nesta edição.
            </div>
            <div style={editActionsStyle}>
              <button type="submit" disabled={isSaving} style={primaryActionStyle}>
                Salvar
              </button>
              <button type="button" onClick={cancelEditing} disabled={isSaving} style={secondaryActionStyle}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div style={cardActionsStyle}>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            style={textActionStyle}
            title="Editar dever"
          >
            Editar
          </button>
        )}
        <button
          onClick={() => { if (confirm(`Arquivar "${dever.title}"?`)) onArchive(dever.id); }}
          style={archiveActionStyle}
          title="Arquivar dever"
          aria-label="Arquivar dever"
        >
          ✕
        </button>
      </div>
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

const editFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const editInputStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-input)',
  fontSize: 13,
  background: 'var(--bg-input)',
  color: 'var(--text)',
  outline: 'none',
};

const editActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const cardActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  alignItems: 'flex-start',
};

const textActionStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 0',
};

const archiveActionStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--border-input)',
  cursor: 'pointer',
  fontSize: 14,
  padding: '4px 6px',
  borderRadius: 'var(--radius-xs)',
  transition: 'color var(--transition)',
};

const primaryActionStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const secondaryActionStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};
