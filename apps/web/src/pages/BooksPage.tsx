import { useState } from 'react';
import { useBooks } from '../hooks/useBooks.js';
import { BookList } from '../components/books/BookList.js';
import { BookSearchModal } from '../components/books/BookSearchModal.js';
import { ReadingGoalBar } from '../components/books/ReadingGoalBar.js';
import type { BookStatus } from '@planner/core';

type Filter = BookStatus | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'reading', label: 'Lendo' },
  { value: 'want_to_read', label: 'Quero ler' },
  { value: 'read', label: 'Lidos' },
  { value: 'abandoned', label: 'Abandonados' },
];

export function BooksPage() {
  const { state, createBook, updateBook, archiveBook, setReadingGoal } = useBooks();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalTarget, setGoalTarget] = useState('');

  if (state.status === 'loading') {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>;
  }
  if (state.status === 'error') {
    return <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {state.message}</p>;
  }

  const { books, readingGoals } = state;
  const currentYear = new Date().getFullYear();
  const currentGoal = readingGoals.find((g) => g.year === currentYear);
  const booksReadThisYear = books.filter((b) => b.status === 'read' && b.finishedAt?.startsWith(String(currentYear))).length;

  const filtered = filter === 'all' ? books : books.filter((b) => b.status === filter);

  function handleEditGoal() {
    if (editingGoal) {
      const target = parseInt(goalTarget, 10);
      if (target > 0) {
        void setReadingGoal(currentYear, target);
      }
      setEditingGoal(false);
    } else {
      setGoalTarget(String(currentGoal?.target ?? 12));
      setEditingGoal(true);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px', color: 'var(--text)' }}>
        Livros
      </h1>

      {/* Reading Goal */}
      {editingGoal ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Meta {currentYear}:</label>
          <input
            type="number"
            min={1}
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            autoFocus
            style={{ ...inputStyle, maxWidth: 80 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>livros</span>
          <button onClick={handleEditGoal} style={btnStyle}>Salvar</button>
          <button onClick={() => setEditingGoal(false)} style={{ ...btnStyle, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancelar</button>
        </div>
      ) : (
        <ReadingGoalBar goal={currentGoal} booksReadThisYear={booksReadThisYear} onEditGoal={handleEditGoal} />
      )}

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500,
                border: filter === f.value ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: filter === f.value ? 'var(--accent-soft)' : 'transparent',
                color: filter === f.value ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all var(--transition)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} style={btnStyle}>+ Adicionar livro</button>
      </div>

      {/* Book list */}
      <BookList books={filtered} onUpdate={updateBook} onArchive={archiveBook} />

      {/* Search modal */}
      {showModal && (
        <BookSearchModal
          onAdd={createBook}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)', fontSize: 13.5, outline: 'none',
  background: 'var(--bg-input)', color: 'var(--text)',
};

const btnStyle: React.CSSProperties = {
  padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
  fontSize: 13.5, fontWeight: 600, transition: 'background var(--transition)',
};
