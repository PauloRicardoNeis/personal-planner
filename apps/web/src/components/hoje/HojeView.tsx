import { useNavigate } from 'react-router-dom';
import type { TodaySnapshot, ISODate, HabitId, DeverId } from '@planner/core';

interface Props {
  snapshot: TodaySnapshot;
  onToggleHabit: (id: HabitId, isDone: boolean) => void;
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
        marginTop: 40,
        padding: '36px 24px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Nada para hoje. Adicione hábitos ou tarefas!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Habits + Deveres side by side */}
      {(hasHabits || hasDeveres) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasBoth ? '1fr 1fr' : '1fr',
          gap: 16,
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
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}>
                      {habit.title}
                      {habit.category && (
                        <span style={{
                          color: 'var(--text-badge)',
                          background: 'var(--bg-badge)',
                          fontSize: 11,
                          padding: '1px 7px',
                          borderRadius: 'var(--radius-xs)',
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
                          <span style={{
                            fontSize: 11,
                            color: 'var(--text-badge)',
                            background: 'var(--bg-badge)',
                            padding: '1px 7px',
                            borderRadius: 'var(--radius-xs)',
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

      {/* Nutrition */}
      {snapshot.nutritionSummary && (
        <section
          style={{ ...cardStyle, cursor: 'pointer', transition: 'box-shadow var(--transition)' }}
          onClick={() => navigate('/nutricao')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}
        >
          <h2 style={sectionTitleStyle}>Nutrição</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
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
  const labels = { high: 'alta', medium: 'média', low: 'baixa' };
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

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
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
