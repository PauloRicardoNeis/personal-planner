import { useNavigate } from 'react-router-dom';
import { todayISODate, type HabitId, type DeverId, type ISODate } from '@planner/core';
import { adapter } from '../adapter.js';
import { useToday } from '../hooks/useToday.js';
import { HojeView } from '../components/hoje/HojeView.js';
import { DashboardCard, type DashboardCardProps } from '../components/hoje/DashboardCard.js';

export function HojePage() {
  const { state, reload } = useToday();
  const today = todayISODate();
  const navigate = useNavigate();

  async function handleToggleHabit(id: HabitId, isDone: boolean) {
    if (isDone) {
      await adapter.unmarkHabitDone(id, today);
    } else {
      await adapter.markHabitDone(id, today);
    }
    void reload();
  }

  async function handleToggleDever(id: DeverId, occurrenceDate: ISODate, isDone: boolean) {
    if (isDone) {
      await adapter.unmarkDeverDone(id, occurrenceDate);
    } else {
      await adapter.markDeverDone(id, occurrenceDate);
    }
    void reload();
  }

  if (state.status === 'loading') {
    return <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>;
  }

  if (state.status === 'error') {
    return <p style={{ color: 'var(--priority-high-text)' }}>Erro: {state.message}</p>;
  }

  const { snapshot } = state;
  const habitsDone = snapshot.habits.filter((h) => h.isDone).length;
  const habitsTotal = snapshot.habits.length;
  const deveresPending = snapshot.deveres.filter((d) => !d.isDone).length;
  const ns = snapshot.nutritionSummary;

  // ── Summary cards ────────────────────────────────────────────────────────
  // To add a new section: push a new object to this array.
  const summaryCards: DashboardCardProps[] = [
    {
      label: 'Hábitos',
      value: `${habitsDone} / ${habitsTotal}`,
      ...(habitsTotal > 0 ? { progress: habitsDone / habitsTotal } : {}),
      link: '/habitos',
    },
    {
      label: 'Deveres',
      value: deveresPending === 0 ? 'Em dia' : `${deveresPending} pendente${deveresPending > 1 ? 's' : ''}`,
      link: '/deveres',
    },
    ...(ns
      ? [{
          label: 'Calorias',
          value: ns.caloriesTarget > 0
            ? `${Math.round(ns.calories)} / ${ns.caloriesTarget} kcal`
            : `${Math.round(ns.calories)} kcal`,
          ...(ns.caloriesTarget > 0 ? { progress: ns.caloriesPercent / 100 } : {}),
          link: '/nutricao',
        }]
      : []),
  ];

  // ── Quick actions ─────────────────────────────────────────────────────────
  // To add a new action: push a new object to this array.
  const quickActions = [
    { label: '+ Hábito', to: '/habitos' },
    { label: '+ Tarefa', to: '/deveres' },
    { label: '+ Refeição', to: '/nutricao' },
  ];

  return (
    <div>
      {/* Dashboard header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontWeight: 700, fontSize: 20, margin: '0 0 2px' }}>{greeting()}</p>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 20px' }}>
          {formatDate(snapshot.date)}
        </p>

        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
          {summaryCards.map((card) => (
            <DashboardCard key={card.label} {...card} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-input)',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <HojeView
        snapshot={snapshot}
        onToggleHabit={handleToggleHabit}
        onToggleDever={handleToggleDever}
      />
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const s = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
