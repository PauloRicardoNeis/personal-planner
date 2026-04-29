import { useNavigate } from 'react-router-dom';
import type { TodaySnapshot, ISODate, HabitId, DeverId } from '@planner/core';
import { HabitProgressBar } from '../habits/HabitProgressBar.js';

interface Props {
  snapshot: TodaySnapshot;
  onMarkHabit: (id: HabitId) => void;
  onUnmarkHabit: (id: HabitId) => void;
  onToggleDever: (id: DeverId, occurrenceDate: ISODate, isDone: boolean) => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 22px',
  boxShadow: 'var(--shadow-card)',
  border: '1px solid var(--border)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: 0,
  marginBottom: 14,
};

export function HojeView({ snapshot, onMarkHabit, onUnmarkHabit, onToggleDever }: Props) {
  const navigate = useNavigate();
  const hasHabits = snapshot.habits.length > 0;
  const hasDeveres = snapshot.deveres.length > 0;
  const hasBoth = hasHabits && hasDeveres;
  const hasContent = hasHabits || hasDeveres || snapshot.nutritionSummary;

  if (!hasContent) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: 40,
        padding: '36px 24px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Nada para hoje. Adicione habitos ou tarefas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(hasHabits || hasDeveres) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasBoth ? '1fr 1fr' : '1fr',
          gap: 16,
        }}>
          {hasHabits && (
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Habitos</h2>
              {snapshot.habitProgress.targetScore > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, marginBottom: 7 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      {snapshot.habitProgress.doneHabits}/{snapshot.habitProgress.totalHabits} metas
                    </span>
                    <span style={{ color: 'var(--text)', fontWeight: 800 }}>
                      {snapshot.habitProgress.percent}%
                    </span>
                  </div>
                  <HabitProgressBar progress={snapshot.habitProgress} height={7} />
                </div>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {snapshot.habits.map(({ habit, progress, streak }) => (
                  <li key={habit.id} style={itemStyle}>
                    <div style={habitCounterStyle}>
                      <button
                        onClick={() => onUnmarkHabit(habit.id)}
                        disabled={progress.count === 0}
                        style={habitStepStyle(progress.count > 0)}
                        aria-label="Remover uma ocorrencia"
                        title="Remover uma ocorrencia"
                      >
                        -
                      </button>
                      <span style={habitCountStyle(progress.isDone)}>{progress.count}</span>
                      <button
                        onClick={() => onMarkHabit(habit.id)}
                        style={habitStepStyle(true)}
                        aria-label="Registrar uma ocorrencia"
                        title="Registrar uma ocorrencia"
                      >
                        +
                      </button>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={habitTitleStyle(progress.isDone)}>
                        {habit.title}
                        {habit.category && (
                          <span style={badgeStyle}>{habit.category}</span>
                        )}
                        {streak.currentStreak > 0 && (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: streak.atRisk ? 'var(--streak-risk)' : 'var(--streak-fire)',
                          }}>
                            {streak.atRisk ? 'risco' : 'serie'} {streak.currentStreak}
                          </span>
                        )}
                      </div>
                      <div style={habitMetaStyle}>
                        <span>{progress.count}/{progress.targetCount} vezes</span>
                        <span>{formatNumber(progress.score)}/{formatNumber(progress.targetScore)} pts</span>
                        {progress.overchargeScore > 0 && (
                          <span style={{ color: '#06b6d4' }}>+{formatNumber(progress.overchargeScore)} over</span>
                        )}
                      </div>
                      <HabitProgressBar progress={progress} height={5} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasDeveres && (
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Deveres</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {snapshot.deveres.map(({ dever, occurrenceDate, isDone, isOverdue }) => (
                  <li key={`${dever.id}-${occurrenceDate}`} style={itemStyle}>
                    <button
                      onClick={() => onToggleDever(dever.id, occurrenceDate, isDone)}
                      style={checkStyle(isDone)}
                      aria-label={isDone ? 'Desmarcar' : 'Marcar como feito'}
                    >
                      {isDone ? '✓' : ''}
                    </button>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? 'var(--text-done)' : 'var(--text)',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}>
                        {dever.title}
                      </span>
                      <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                        <PriorityBadge priority={dever.priority} />
                        {isOverdue && (
                          <span style={{
                            fontSize: 11,
                            color: 'var(--overdue-text)',
                            background: 'var(--overdue-bg)',
                            padding: '1px 7px',
                            borderRadius: 'var(--radius-xs)',
                            fontWeight: 500,
                          }}>
                            atrasado
                          </span>
                        )}
                        {dever.area && (
                          <span style={badgeStyle}>
                            {dever.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {snapshot.nutritionSummary && (
        <section
          style={{ ...cardStyle, cursor: 'pointer', transition: 'box-shadow var(--transition)' }}
          onClick={() => navigate('/nutricao')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}
        >
          <h2 style={sectionTitleStyle}>Nutricao</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
            <CompactMacro label="Calorias" current={snapshot.nutritionSummary.calories} target={snapshot.nutritionSummary.caloriesTarget} percent={snapshot.nutritionSummary.caloriesPercent} unit="kcal" />
            <CompactMacro label="Proteina" current={snapshot.nutritionSummary.protein} target={snapshot.nutritionSummary.proteinTarget} percent={snapshot.nutritionSummary.proteinPercent} unit="g" />
            <CompactMacro label="Carboidratos" current={snapshot.nutritionSummary.carbs} target={snapshot.nutritionSummary.carbsTarget} percent={snapshot.nutritionSummary.carbsPercent} unit="g" />
            <CompactMacro label="Gordura" current={snapshot.nutritionSummary.fat} target={snapshot.nutritionSummary.fatTarget} percent={snapshot.nutritionSummary.fatPercent} unit="g" />
          </div>
        </section>
      )}
    </div>
  );
}

function CompactMacro({ label, current, target, percent, unit }: {
  label: string; current: number; target: number; percent: number; unit: string;
}) {
  const barPercent = Math.min(percent, 100);
  const barColor = percent > 110
    ? 'var(--progress-red)'
    : percent >= 90
      ? 'var(--progress-yellow)'
      : 'var(--progress-green)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {Math.round(current)}{target > 0 ? `/${Math.round(target)}` : ''} {unit}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--progress-bg)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPercent}%`, borderRadius: 2, background: barColor, transition: 'width var(--transition-slow)' }} />
      </div>
      {target > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
          {percent}%
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const vars = {
    high:   { bg: 'var(--priority-high-bg)', text: 'var(--priority-high-text)' },
    medium: { bg: 'var(--priority-med-bg)',  text: 'var(--priority-med-text)'  },
    low:    { bg: 'var(--priority-low-bg)',  text: 'var(--priority-low-text)'  },
  };
  const labels = { high: 'alta', medium: 'media', low: 'baixa' };
  const c = vars[priority];
  return (
    <span style={{
      fontSize: 11,
      color: c.text,
      background: c.bg,
      padding: '1px 7px',
      borderRadius: 'var(--radius-xs)',
      fontWeight: 500,
    }}>
      {labels[priority]}
    </span>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-badge)',
  background: 'var(--bg-badge)',
  padding: '1px 7px',
  borderRadius: 'var(--radius-xs)',
  fontWeight: 500,
};

const habitCounterStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px 30px 22px',
  gap: 3,
  alignItems: 'center',
  flexShrink: 0,
  marginTop: 1,
};

function habitStepStyle(enabled: boolean): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-input)',
    background: enabled ? 'var(--bg-card)' : 'var(--progress-bg)',
    color: enabled ? 'var(--text)' : 'var(--text-muted)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
    opacity: enabled ? 1 : 0.45,
  };
}

function habitCountStyle(isDone: boolean): React.CSSProperties {
  return {
    height: 22,
    minWidth: 30,
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

function habitTitleStyle(isDone: boolean): React.CSSProperties {
  return {
    color: isDone ? 'var(--text-done)' : 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.4,
  };
}

const habitMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  color: 'var(--text-muted)',
  fontSize: 11.5,
  fontWeight: 600,
  marginTop: 5,
  marginBottom: 6,
};

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
