import { useState } from 'react';
import type { Book, BookId, BookPatch, BookStatus } from '@planner/core';

interface Props {
  book: Book;
  onUpdate: (id: BookId, patch: BookPatch) => void;
  onArchive: (id: BookId) => void;
}

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: 'Quero ler',
  reading: 'Lendo',
  read: 'Lido',
  abandoned: 'Abandonado',
};

const STATUS_COLORS: Record<BookStatus, string> = {
  want_to_read: 'var(--text-muted)',
  reading: 'var(--accent)',
  read: 'var(--progress-green)',
  abandoned: 'var(--priority-high-text)',
};

export function BookCard({ book, onUpdate, onArchive }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pagesRead, setPagesRead] = useState(String(book.pagesRead));
  const [rating, setRating] = useState(book.rating ?? 0);
  const [notes, setNotes] = useState(book.notes ?? '');

  const progress = book.totalPages ? Math.min(100, Math.round((book.pagesRead / book.totalPages) * 100)) : null;

  function handleStatusChange(status: BookStatus) {
    onUpdate(book.id, { status });
  }

  function handleSaveDetails() {
    const patch: BookPatch = {};
    const newPages = parseInt(pagesRead, 10);
    if (!isNaN(newPages) && newPages !== book.pagesRead) patch.pagesRead = newPages;
    if (rating > 0 && rating !== book.rating) patch.rating = rating;
    if (notes !== (book.notes ?? '')) patch.notes = notes;
    if (Object.keys(patch).length > 0) onUpdate(book.id, patch);
    setExpanded(false);
  }

  return (
    <li style={{
      display: 'flex', gap: 12, padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Cover */}
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          style={{ width: 48, height: 70, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 48, height: 70, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: 'var(--text-muted)',
        }}>
          ▧
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.3,
              }}
            >
              {book.title}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {book.author}
              {book.genre && <> &middot; {book.genre}</>}
            </div>
          </div>
          <button
            onClick={() => { if (confirm(`Arquivar "${book.title}"?`)) onArchive(book.id); }}
            style={{
              background: 'none', border: 'none', color: 'var(--border-input)', cursor: 'pointer',
              fontSize: 14, padding: '4px 6px', borderRadius: 'var(--radius-xs)',
            }}
            title="Arquivar"
          >
            ✕
          </button>
        </div>

        {/* Status + Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: STATUS_COLORS[book.status],
            padding: '2px 8px', borderRadius: 10,
            background: `color-mix(in srgb, ${STATUS_COLORS[book.status]} 12%, transparent)`,
          }}>
            {STATUS_LABELS[book.status]}
          </span>
          {progress !== null && (
            <div style={{ flex: 1, maxWidth: 120, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-input)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, width: `${progress}%`,
                  background: progress >= 100 ? 'var(--progress-green)' : 'var(--accent)',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {book.pagesRead}/{book.totalPages}
              </span>
            </div>
          )}
          {book.rating && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
            </span>
          )}
        </div>

        {/* Expanded edit section */}
        {expanded && (
          <div style={{
            marginTop: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Status buttons */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(Object.keys(STATUS_LABELS) as BookStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500,
                    border: book.status === s ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: book.status === s ? 'var(--accent-soft)' : 'transparent',
                    color: book.status === s ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Pages */}
            {book.totalPages && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>Páginas lidas</label>
                <input
                  type="number"
                  min={0}
                  max={book.totalPages}
                  value={pagesRead}
                  onChange={(e) => setPagesRead(e.target.value)}
                  style={{ ...inputStyle, maxWidth: 80 }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {book.totalPages}</span>
              </div>
            )}

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>Avaliação</label>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px 1px',
                      fontSize: 18, color: star <= rating ? 'var(--accent)' : 'var(--border-input)',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>

            <button onClick={handleSaveDetails} style={saveBtnStyle}>Salvar</button>
          </div>
        )}
      </div>
    </li>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-input)', fontSize: 13,
  background: 'var(--bg-input)', color: 'var(--text)', outline: 'none',
};

const saveBtnStyle: React.CSSProperties = {
  alignSelf: 'flex-end', padding: '6px 16px', borderRadius: 'var(--radius-md)',
  border: 'none', background: 'var(--btn-bg)', color: 'var(--btn-text)',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
};
