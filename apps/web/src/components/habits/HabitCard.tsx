import { useState } from 'react';
import {
  computeHabitProgress,
  normalizeHabitTimesPerDay,
  normalizeHabitValueWeights,
  parseHabitValueWeightsInput,
  todayISODate,
  type Habit,
  type HabitId,
  type HabitInput,
  type ISODate,
  type Result,
} from '@planner/core';
import { HabitProgressBar } from './HabitProgressBar.js';

interface Props {
  habit: Habit;
  onUpdate: (id: HabitId, patch: Partial<HabitInput>) => Promise<Result<Habit>>;
  onMarkDone: (id: HabitId, date: ISODate) => void;
  onUnmarkDone: (id: HabitId, date: ISODate) => void;
  onArchive: (id: HabitId) => void;
}

export function HabitCard({ habit, onUpdate, onMarkDone, onUnmarkDone, onArchive }: Props) {
  const today = todayISODate();
  const progress = computeHabitProgress(habit, today);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(habit.title);
  const [draftCategory, setDraftCategory] = useState(habit.category ?? '');
  const [draftTimesPerDay, setDraftTimesPerDay] = useState(String(habit.timesPerDay));
  const [draftValueWeights, setDraftValueWeights] = useState(habit.valueWeights.join(', '));
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setDraftTitle(habit.title);
    setDraftCategory(habit.category ?? '');
    setDraftTimesPerDay(String(habit.timesPerDay));
    setDraftValueWeights(habit.valueWeights.join(', '));
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftTitle(habit.title);
    setDraftCategory(habit.category ?? '');
    setDraftTimesPerDay(String(habit.timesPerDay));
    setDraftValueWeights(habit.valueWeights.join(', '));
    setIsEditing(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = draftTitle.trim();
    const timesPerDay = normalizeHabitTimesPerDay(Number(draftTimesPerDay));

    if (!title) {
      return;
    }

    setIsSaving(true);
    const result = await onUpdate(habit.id, {
      title,
      category: draftCategory.trim(),
      timesPerDay,
      valueWeights: normalizeHabitValueWeights(timesPerDay, parseHabitValueWeightsInput(draftValueWeights)),
    });
    setIsSaving(false);

    if (result.ok) {
      setIsEditing(false);
    }
  }

  return (
    <li style={cardStyle}>
      <div style={counterStyle}>
        <button
          type="button"
          onClick={() => onUnmarkDone(habit.id, today)}
          disabled={progress.count === 0}
          style={stepButtonStyle(progress.count > 0)}
          title="Remover uma ocorrencia"
          aria-label="Remover uma ocorrencia"
        >
          -
        </button>
        <div style={countBadgeStyle(progress.isDone)}>
          {progress.count}
        </div>
        <button
          type="button"
          onClick={() => onMarkDone(habit.id, today)}
          style={stepButtonStyle(true)}
          title="Registrar uma ocorrencia"
          aria-label="Registrar uma ocorrencia"
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <form onSubmit={handleSubmit} style={editFormStyle}>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Nome do habito"
              required
              style={{ ...editInputStyle, fontWeight: 500 }}
            />
            <div style={editGridStyle}>
              <input
                type="text"
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                placeholder="Categoria"
                style={editInputStyle}
              />
              <input
                type="number"
                min={1}
                max={99}
                value={draftTimesPerDay}
                onChange={(e) => setDraftTimesPerDay(e.target.value)}
                placeholder="Vezes/dia"
                style={editInputStyle}
              />
            </div>
            <input
              type="text"
              value={draftValueWeights}
              onChange={(e) => setDraftValueWeights(e.target.value)}
              placeholder="Pesos por vez, ex: 5, 2, 1"
              style={editInputStyle}
            />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={titleRowStyle}>
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                lineHeight: 1.35,
                color: progress.isDone ? 'var(--text-done)' : 'var(--text)',
                transition: 'color var(--transition)',
              }}>
                {habit.title}
              </div>
              {habit.category && (
                <span style={tagStyle}>{habit.category}</span>
              )}
            </div>
            <div style={metaStyle}>
              <span>{progress.count}/{progress.targetCount} vezes</span>
              <span>{formatNumber(progress.score)}/{formatNumber(progress.targetScore)} pts</span>
              {progress.overchargeScore > 0 && (
                <span style={{ color: '#06b6d4', fontWeight: 700 }}>
                  +{formatNumber(progress.overchargeScore)} over
                </span>
              )}
            </div>
            <HabitProgressBar progress={progress} />
          </div>
        )}
      </div>

      <div style={cardActionsStyle}>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            style={textActionStyle}
            title="Editar habito"
          >
            Editar
          </button>
        )}
        <button
          onClick={() => { if (confirm(`Arquivar "${habit.title}"?`)) onArchive(habit.id); }}
          style={archiveActionStyle}
          title="Arquivar habito"
          aria-label="Arquivar habito"
        >
          x
        </button>
      </div>
    </li>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid var(--border)',
};

const counterStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '24px 32px 24px',
  gap: 4,
  alignItems: 'center',
  flexShrink: 0,
};

function stepButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-input)',
    background: enabled ? 'var(--bg-card)' : 'var(--progress-bg)',
    color: enabled ? 'var(--text)' : 'var(--text-muted)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1,
    opacity: enabled ? 1 : 0.45,
  };
}

function countBadgeStyle(isDone: boolean): React.CSSProperties {
  return {
    height: 24,
    minWidth: 32,
    borderRadius: 'var(--radius-sm)',
    background: isDone ? 'var(--progress-green)' : 'var(--accent-soft)',
    color: isDone ? '#fff' : 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  };
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 9,
  flexWrap: 'wrap',
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 600,
};

const tagStyle: React.CSSProperties = {
  color: 'var(--text-badge)',
  background: 'var(--bg-badge)',
  fontSize: 11,
  padding: '1px 7px',
  borderRadius: 'var(--radius-xs)',
  fontWeight: 500,
};

const editFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const editGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(140px, 1fr) 110px',
  gap: 8,
};

const editInputStyle: React.CSSProperties = {
  width: '100%',
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
