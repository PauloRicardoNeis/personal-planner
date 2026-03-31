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
    return (
      <div style={{ padding: '36px 44px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={{ padding: '36px 44px' }}>
        <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {state.message}</p>
      </div>
    );
  }

  const { snapshot } = state;
  const habitsDone = snapshot.habits.filter((h) => h.isDone).length;
  const habitsTotal = snapshot.habits.length;
  const deveresPending = snapshot.deveres.filter((d) => !d.isDone).length;
  const ns = snapshot.nutritionSummary;

  // ── Summary cards ─────────────────────────────────────────────────────────
  const summaryCards: (DashboardCardProps & { icon: string })[] = [
    {
      icon: '🌿',
      label: 'Hábitos',
      value: habitsTotal > 0 ? `${habitsDone} / ${habitsTotal}` : 'Nenhum',
      ...(habitsTotal > 0 ? { progress: habitsDone / habitsTotal } : {}),
      link: '/habitos',
    },
    {
      icon: '📌',
      label: 'Deveres',
      value: deveresPending === 0 ? 'Em dia ✓' : `${deveresPending} pendente${deveresPending > 1 ? 's' : ''}`,
      link: '/deveres',
    },
    ...(snapshot.projetos.length > 0
      ? [{
          icon: '📂',
          label: 'Projetos',
          value: `${snapshot.projetos.length} ativo${snapshot.projetos.length > 1 ? 's' : ''}`,
          link: '/projetos',
        }]
      : []),
    ...(ns
      ? [{
          icon: '🔥',
          label: 'Calorias',
          value: ns.caloriesTarget > 0
            ? `${Math.round(ns.calories)} / ${ns.caloriesTarget} kcal`
            : `${Math.round(ns.calories)} kcal`,
          ...(ns.caloriesTarget > 0 ? { progress: ns.caloriesPercent / 100 } : {}),
          link: '/nutricao',
        }]
      : []),
  ];

  // ── Quick actions ──────────────────────────────────────────────────────────
  const quickActions = [
    { label: '+ Hábito',  to: '/habitos'  },
    { label: '+ Tarefa',  to: '/deveres'  },
    { label: '+ Projeto', to: '/projetos' },
    { label: '+ Refeição',to: '/nutricao' },
  ];

  return (
    <div style={{ padding: '36px 44px', maxWidth: 960 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontWeight: 700,
          fontSize: 30,
          margin: '0 0 6px',
          letterSpacing: '-0.5px',
          color: 'var(--text)',
          lineHeight: 1.2,
        }}>
          {greeting()}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14, fontWeight: 400, lineHeight: 1.5 }}>
          {formatDate(snapshot.date)}
        </p>
      </div>

      {/* ── Summary cards grid ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 32,
      }}>
        {summaryCards.map((card) => (
          <DashboardCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
        {quickActions.map((action) => (
          <button
            key={action.to}
            onClick={() => navigate(action.to)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
            }}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all var(--transition)',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* ── Detailed view ─────────────────────────────────────────────────── */}
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
  if (h < 12) return 'Bom dia 👋';
  if (h < 18) return 'Boa tarde 👋';
  return 'Boa noite 👋';
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
