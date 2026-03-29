import { useNavigate } from 'react-router-dom';
import type { TodaySnapshot, ISODate, HabitId, DeverId } from '@planner/core';

interface Props {
  snapshot: TodaySnapshot;
  onToggleHabit: (id: HabitId, isDone: boolean) => void;
  onToggleDever: (id: DeverId, occurrenceDate: ISODate, isDone: boolean) => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  padding: '24px',
  boxShadow: 'var(--shadow-card)',
  border: '1px solid var(--border)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginTop: 0,
  marginBottom: 16,
};

export function HojeView({ snapshot, onToggleHabit, onToggleDever }: Props) {
  const navigate = useNavigate();
  const hasHabits = snapshot.habits.length > 0;
  const hasDeveres = snapshot.deveres.length > 0;
  const hasBoth = hasHabits && hasDeveres;
  const hasContent = hasHabits || hasDeveres || snapshot.nutritionSummary;

  if (!hasContent) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: 48,
        padding: '40px 24px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
          Nada para hoje. Adicione hábitos ou tarefas!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Habits + Deveres side by side ────────────────────────────────── */}
      {(hasHabits || hasDeveres) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasBoth ? '1fr 1fr' : '1fr',
          gap: 20,
        }}>

          {hasHabits && (
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Hábitos</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {snapshot.habits.map(({ habit, isDone, streak }) => (
                  <li key={habit.id} style={itemStyle}>
                    <button
                      onClick={() => onToggleHabit(habit.id, isDone)}
                      style={checkStyle(isDone)}
                      aria-label={isDone ? 'Desmarcar' : 'Marcar como feito'}
                    >
                      {isDone ? '✓' : ''}
                    </button>
                    <span style={{
                      textDecoration: isDone ? 'line-through' : 'none',
                      color: isDone ? 'var(--text-done)' : 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      flex: 1,
                      fontWeight: 450,
                    }}>
                      {habit.title}
                      {habit.category && (
                        <span style={{
                          color: 'var(--text-badge)',
                          background: 'var(--bg-badge)',
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 500,
                        }}>{habit.category}</span>
                      )}
                      {streak.currentStreak > 0 && (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: streak.atRisk ? 'var(--streak-risk)' : 'var(--streak-fire)',
                        }}>
                          {streak.atRisk ? '⚠️' : '🔥'} {streak.currentStreak}
                        </span>
                      )}
                    </span>
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
                        fontWeight: 450,
                      }}>
                        {dever.title}
                      </span>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <PriorityBadge priority={dever.priority} />
                        {isOverdue && (
                          <span style={{
                            fontSize: 11,
                            color: 'var(--overdue-text)',
                            background: 'var(--overdue-bg)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 500,
                          }}>
                            atrasado
                          </span>
                        )}
                        {dever.area && (
                          <span style={{
                            fontSize: 11,
                            color: 'var(--text-badge)',
                            background: 'var(--bg-badge)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 500,
                          }}>
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

      {/* ── Nutrition ─────────────────────────────────────────────────────── */}
      {snapshot.nutritionSummary && (
        <section
          style={{ ...cardStyle, cursor: 'pointer', transition: 'box-shadow var(--transition)' }}
          onClick={() => navigate('/nutricao')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}
        >
          <h2 style={sectionTitleStyle}>Nutrição</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <CompactMacro label="Calorias" current={snapshot.nutritionSummary.calories} target={snapshot.nutritionSummary.caloriesTarget} percent={snapshot.nutritionSummary.caloriesPercent} unit="kcal" />
            <CompactMacro label="Proteína" current={snapshot.nutritionSummary.protein} target={snapshot.nutritionSummary.proteinTarget} percent={snapshot.nutritionSummary.proteinPercent} unit="g" />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {Math.round(current)}{target > 0 ? `/${Math.round(target)}` : ''} {unit}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'var(--progress-bg)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPercent}%`, borderRadius: 3, background: barColor, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>
      {target > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, textAlign: 'right' }}>
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
  const labels = { high: 'alta', medium: 'média', low: 'baixa' };
  const c = vars[priority];
  return (
    <span style={{
      fontSize: 11,
      color: c.text,
      background: c.bg,
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontWeight: 500,
    }}>
      {labels[priority]}
    </span>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid var(--border)',
};

function checkStyle(isDone: boolean): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    minWidth: 22,
    borderRadius: 'var(--radius-sm)',
    border: isDone ? '2px solid var(--progress-green)' : '2px solid var(--border-input)',
    background: isDone ? 'var(--progress-green)' : 'var(--bg-check)',
    color: '#fff',
    fontSize: 13,
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
