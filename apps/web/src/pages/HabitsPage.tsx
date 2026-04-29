import { useState } from 'react';
import {
  computeHabitDayProgress,
  normalizeHabitTimesPerDay,
  normalizeHabitValueWeights,
  parseHabitValueWeightsInput,
  todayISODate,
  type Habit,
} from '@planner/core';
import { useHabits } from '../hooks/useHabits.js';
import { HabitList } from '../components/habits/HabitList.js';
import { HabitProgressBar } from '../components/habits/HabitProgressBar.js';

export function HabitsPage() {
  const { state, createHabit, updateHabit, markDone, unmarkDone, archive } = useHabits();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [valueWeights, setValueWeights] = useState('1');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const targetCount = normalizeHabitTimesPerDay(Number(timesPerDay));
    const weights = normalizeHabitValueWeights(targetCount, parseHabitValueWeightsInput(valueWeights));
    const cat = category.trim();

    await createHabit({
      title: title.trim(),
      ...(cat && { category: cat }),
      timesPerDay: targetCount,
      valueWeights: weights,
    });
    setTitle('');
    setCategory('');
    setTimesPerDay('1');
    setValueWeights('1');
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: 0, color: 'var(--text)' }}>Habitos</h1>

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nome do habito"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...inputStyle, maxWidth: 160 }}
          />
          <input
            type="number"
            min={1}
            max={99}
            placeholder="Vezes/dia"
            value={timesPerDay}
            onChange={(e) => setTimesPerDay(e.target.value)}
            style={{ ...inputStyle, maxWidth: 112 }}
          />
          <button type="submit" style={btnStyle}>Criar</button>
        </div>
        <input
          type="text"
          placeholder="Pesos por vez, ex: 5, 2, 1"
          value={valueWeights}
          onChange={(e) => setValueWeights(e.target.value)}
          style={inputStyle}
        />
      </form>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {state.message}</p>}
      {state.status === 'ok' && (
        <>
          <HabitSummary habits={state.habits} />
          <HabitList
            habits={state.habits}
            onUpdate={updateHabit}
            onMarkDone={markDone}
            onUnmarkDone={unmarkDone}
            onArchive={archive}
          />
        </>
      )}
    </div>
  );
}

function HabitSummary({ habits }: { habits: Habit[] }) {
  const progress = computeHabitDayProgress(habits, todayISODate());

  if (progress.totalHabits === 0) {
    return null;
  }

  return (
    <section style={summaryStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>Progresso de hoje</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {progress.doneHabits}/{progress.totalHabits} metas batidas
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {progress.percent}%
        </div>
      </div>
      <HabitProgressBar progress={progress} height={8} />
      {progress.overchargeScore > 0 && (
        <div style={{ marginTop: 7, fontSize: 12, color: '#06b6d4', fontWeight: 700 }}>
          +{formatNumber(progress.overchargeScore)} pontos de overcharge
        </div>
      )}
    </section>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const summaryStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-card)',
};

const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 160, padding: '9px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)', fontSize: 13.5, outline: 'none',
  background: 'var(--bg-input)', color: 'var(--text)',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const btnStyle: React.CSSProperties = {
  padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
  fontSize: 13.5, fontWeight: 600, transition: 'background var(--transition)',
};
