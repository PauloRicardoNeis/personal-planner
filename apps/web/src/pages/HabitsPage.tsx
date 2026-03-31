import { useState } from 'react';
import { useHabits } from '../hooks/useHabits.js';
import { HabitList } from '../components/habits/HabitList.js';

export function HabitsPage() {
  const { state, createHabit, markDone, unmarkDone, archive } = useHabits();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const cat = category.trim();
    await createHabit({ title: title.trim(), ...(cat && { category: cat }) });
    setTitle('');
    setCategory('');
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px', color: 'var(--text)' }}>Hábitos</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Nome do hábito"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Categoria (opcional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ ...inputStyle, maxWidth: 160 }}
        />
        <button type="submit" style={btnStyle}>Criar</button>
      </form>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {state.message}</p>}
      {state.status === 'ok' && (
        <HabitList
          habits={state.habits}
          onMarkDone={markDone}
          onUnmarkDone={unmarkDone}
          onArchive={archive}
        />
      )}
    </div>
  );
}

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
