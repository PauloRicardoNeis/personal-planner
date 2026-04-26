import { useState } from 'react';
import { useBookSearch } from '../../hooks/useBookSearch.js';
import type { BookInput, OpenLibrarySearchResult } from '@planner/core';

interface Props {
  onAdd: (input: BookInput) => void;
  onClose: () => void;
}

export function BookSearchModal({ onAdd, onClose }: Props) {
  const { query, setQuery, results, isSearching } = useBookSearch();
  const [manualMode, setManualMode] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [totalPages, setTotalPages] = useState('');

  function handleSelectResult(r: OpenLibrarySearchResult) {
    onAdd({
      title: r.title,
      author: r.author,
      ...(r.coverUrl && { coverUrl: r.coverUrl }),
      ...(r.openLibraryKey && { openLibraryKey: r.openLibraryKey }),
      ...(r.totalPages && { totalPages: r.totalPages }),
    });
    onClose();
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    const pages = parseInt(totalPages, 10);
    onAdd({
      title: title.trim(),
      author: author.trim(),
      ...(genre.trim() && { genre: genre.trim() }),
      ...(pages > 0 && { totalPages: pages }),
    });
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh',
          borderRadius: 'var(--radius-md)', background: 'var(--sidebar-bg)',
          border: '1px solid var(--border)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Adicionar livro</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18,
          }}>✕</button>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setManualMode(false)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: !manualMode ? 'var(--accent-soft)' : 'transparent',
              color: !manualMode ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: !manualMode ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            Buscar
          </button>
          <button
            onClick={() => setManualMode(true)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: manualMode ? 'var(--accent-soft)' : 'transparent',
              color: manualMode ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: manualMode ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            Manual
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {!manualMode ? (
            <>
              <input
                type="text"
                placeholder="Buscar por título ou autor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
              />
              {isSearching && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Buscando...</p>}
              {!isSearching && results.length === 0 && query.trim().length >= 2 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum resultado encontrado.</p>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {results.map((r) => (
                  <li key={r.openLibraryKey}>
                    <button
                      onClick={() => handleSelectResult(r)}
                      style={{
                        width: '100%', display: 'flex', gap: 10, padding: '10px 8px',
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderBottom: '1px solid var(--border)', borderRadius: 0,
                      }}
                    >
                      {r.coverUrl ? (
                        <img src={r.coverUrl} alt="" style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 3 }} />
                      ) : (
                        <div style={{ width: 36, height: 52, background: 'var(--bg-input)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-muted)' }}>▧</div>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.author}</div>
                        {r.totalPages && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.totalPages} páginas</div>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Título *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Autor *"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Gênero (opcional)"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Total de páginas (opcional)"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                min={1}
                style={inputStyle}
              />
              <button type="submit" style={btnStyle}>Adicionar</button>
            </form>
          )}
        </div>
      </div>
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
  fontSize: 13.5, fontWeight: 600, alignSelf: 'flex-end',
};
