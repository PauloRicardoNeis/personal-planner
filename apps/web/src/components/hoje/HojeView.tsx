import { useNavigate } from 'react-router-dom';
import type { TodaySnapshot, ISODate, HabitId, DeverId } from '@planner/core';

interface Props {
  snapshot: TodaySnapshot;
  onToggleHabit: (id: HabitId, isDone: boolean) => void;
  onToggleDever: (id: DeverId, occurrenceDate: ISODate, isDone: boolean) => void;
}

export function HojeView({ snapshot, onToggleHabit, onToggleDever }: Props) {
  const navigate = useNavigate();
  const hasContent = snapshot.habits.length > 0 || snapshot.deveres.length > 0 || snapshot.nutritionSummary;

  if (!hasContent) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>Nada para hoje.</p>;
  }

  return (
    <div>
      {snapshot.habits.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Habitos
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {snapshot.habits.map(({ habit, isDone, streak }) => (
              <li key={habit.id} style={itemStyle}>
                <button
                  onClick={() => onToggleHabit(habit.id, isDone)}
                  style={checkStyle(isDone)}
                  aria-label={isDone ? 'Desmarcar' : 'Marcar como feito'}
                >
                  {isDone ? '\u2713' : ''}
                </button>
                <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-done)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {habit.title}
                  {habit.category && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{habit.category}</span>}
                  {streak.currentStreak > 0 && (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: streak.atRisk ? 'var(--streak-risk)' : 'var(--streak-fire)',
                      marginLeft: 4,
                    }}>
                      {streak.atRisk ? '\u26A0\uFE0F' : '\uD83D\uDD25'} {streak.currentStreak}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {snapshot.deveres.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Deveres
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {snapshot.deveres.map(({ dever, occurrenceDate, isDone, isOverdue }) => (
              <li key={`${dever.id}-${occurrenceDate}`} style={itemStyle}>
                <button
                  onClick={() => onToggleDever(dever.id, occurrenceDate, isDone)}
                  style={checkStyle(isDone)}
                  aria-label={isDone ? 'Desmarcar' : 'Marcar como feito'}
                >
                  {isDone ? '\u2713' : ''}
                </button>
                <div>
                  <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-done)' : 'var(--text)' }}>
                    {dever.title}
                  </span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                    <PriorityBadge priority={dever.priority} />
                    {isOverdue && (
                      <span style={{ fontSize: 11, color: 'var(--overdue-text)', background: 'var(--overdue-bg)', padding: '1px 6px', borderRadius: 4 }}>
                        atrasado
                      </span>
                    )}
                    {dever.area && (
                      <span style={{ fontSize: 11, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 4 }}>
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

      {/* Nutrition summary card */}
      {snapshot.nutritionSummary && (
        <section
          style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => navigate('/nutricao')}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>
            Nutricao
          </h2>
          <CompactMacro label="Calorias" current={snapshot.nutritionSummary.calories} target={snapshot.nutritionSummary.caloriesTarget} percent={snapshot.nutritionSummary.caloriesPercent} unit="kcal" />
          <CompactMacro label="Proteina" current={snapshot.nutritionSummary.protein} target={snapshot.nutritionSummary.proteinTarget} percent={snapshot.nutritionSummary.proteinPercent} unit="g" />
          <CompactMacro label="Carbs" current={snapshot.nutritionSummary.carbs} target={snapshot.nutritionSummary.carbsTarget} percent={snapshot.nutritionSummary.carbsPercent} unit="g" />
          <CompactMacro label="Gordura" current={snapshot.nutritionSummary.fat} target={snapshot.nutritionSummary.fatTarget} percent={snapshot.nutritionSummary.fatPercent} unit="g" />
        </section>
      )}
    </div>
  );
}

function CompactMacro({ label, current, target, percent, unit }: {
  label: string; current: number; target: number; percent: number; unit: string;
}) {
  const barPercent = Math.min(percent, 100);
  const barColor = percent > 110 ? 'var(--progress-red)' : percent >= 90 ? 'var(--progress-yellow)' : 'var(--progress-green)';

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{Math.round(current)}/{Math.round(target)} {unit} ({percent}%)</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--progress-bg)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPercent}%`, borderRadius: 3, background: barColor, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const vars = {
    high: { bg: 'var(--priority-high-bg)', text: 'var(--priority-high-text)' },
    medium: { bg: 'var(--priority-med-bg)', text: 'var(--priority-med-text)' },
    low: { bg: 'var(--priority-low-bg)', text: 'var(--priority-low-text)' },
  };
  const labels = { high: 'alta', medium: 'media', low: 'baixa' };
  const c = vars[priority];
  return (
    <span style={{ fontSize: 11, color: c.text, background: c.bg, padding: '1px 6px', borderRadius: 4 }}>
      {labels[priority]}
    </span>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
};

function checkStyle(isDone: boolean): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    minWidth: 22,
    borderRadius: 6,
    border: isDone ? '2px solid #22c55e' : '2px solid var(--border-input)',
    background: isDone ? '#22c55e' : 'var(--bg-check)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  };
}
